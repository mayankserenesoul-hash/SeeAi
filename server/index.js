import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      "https://YOUR-VERCEL-URL.vercel.app",
      "http://localhost:5173",
    ],
  })
);
app.use(express.json({ limit: "12mb" }));

// ---------- Gemini setup ----------
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL_NAME = "gemini-flash-lite-latest";

const MODE_INSTRUCTIONS = {
  explore: "Describe the overall scene: what's visible, what's happening, and the general context.",
  read: "Focus on any visible text in the image. Read it out and explain what it says.",
  learn: "Explain what's visible in simple, beginner-friendly language, as if teaching someone new to the topic.",
  analyze: "Give a deeper, more technical analysis of what's visible, including details a casual glance would miss.",
  assist: "Give practical, actionable help based on what's visible, as if helping the user complete a task.",
};

// Shared error classification so both routes below report failures the same way
function classifyGeminiError(err) {
  console.error("Gemini error:", err);
  const message = err?.message || "";

  if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
    return { status: 500, body: { error: "INVALID_API_KEY", message: "The Gemini API key is invalid. Please check server/.env." } };
  }
  if (message.includes("quota") || message.includes("RESOURCE_EXHAUSTED") || err?.status === 429) {
    return { status: 429, body: { error: "RATE_LIMITED", message: "Gemini rate limit reached. Please wait a moment and try again." } };
  }
  return { status: 502, body: { error: "AI_REQUEST_FAILED", message: "The AI couldn't process this image right now. Please try again." } };
}

function parseImageDataUrl(image) {
  const match = typeof image === "string" && image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64Data: match[2] };
}

// ---------- Health check ----------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SeeAI backend is running.",
    geminiConfigured: Boolean(apiKey) && apiKey !== "placeholder_will_add_in_phase_7",
  });
});

// ---------- Vision analysis (conversational Q&A) ----------
app.post("/api/analyze", async (req, res) => {
  const { image, question, mode, history } = req.body;

  if (!image) {
    return res.status(400).json({ error: "MISSING_IMAGE", message: "No image was provided." });
  }
  if (!question || !question.trim()) {
    return res.status(400).json({ error: "MISSING_QUESTION", message: "No question was provided." });
  }
  if (!ai) {
    return res.status(500).json({
      error: "MISSING_API_KEY",
      message: "The server is missing a Gemini API key. Add GEMINI_API_KEY to server/.env.",
    });
  }

  const parsedImage = parseImageDataUrl(image);
  if (!parsedImage) {
    return res.status(400).json({
      error: "INVALID_IMAGE",
      message: "The image format wasn't recognized. Please try capturing or uploading again.",
    });
  }
  const { mimeType, base64Data } = parsedImage;

  const modeInstruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.explore;

  const historyText =
    Array.isArray(history) && history.length > 0
      ? history.map((turn) => `Q: ${turn.question}\nA: ${turn.answer}`).join("\n\n")
      : "";

  const prompt = `You are SeeAI, a visual assistant that answers questions about an image.
Mode instruction: ${modeInstruction}

${historyText ? `Earlier conversation about this same image:\n${historyText}\n\n` : ""}Current question: ${question}

Answer conversationally and clearly. If you are not certain about something, say so instead of guessing.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } },
      ],
    });

    res.json({ answer: response.text });
  } catch (err) {
    const { status, body } = classifyGeminiError(err);
    res.status(status).json(body);
  }
});

// ---------- Live detection: scene + person/background + held-object bounding box ----------
app.post("/api/detect-live", async (req, res) => {
  const { image, mode } = req.body;

  if (!image) {
    return res.status(400).json({ error: "MISSING_IMAGE", message: "No image was provided." });
  }
  if (!ai) {
    return res.status(500).json({
      error: "MISSING_API_KEY",
      message: "The server is missing a Gemini API key. Add GEMINI_API_KEY to server/.env.",
    });
  }

  const parsedImage = parseImageDataUrl(image);
  if (!parsedImage) {
    return res.status(400).json({
      error: "INVALID_IMAGE",
      message: "The image format wasn't recognized.",
    });
  }
  const { mimeType, base64Data } = parsedImage;

  const flavor = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.explore;

  const prompt = `You are a live vision system looking at a webcam frame.

Step 1: Briefly notice the person in frame (if any) and the background.
Step 2: Then specifically look for an object the person is holding in their hand. There may be no such object.
Tone guidance for the description: ${flavor}

Respond with ONLY strict JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "sceneDescription": "one short sentence about the person and background",
  "handItem": {
    "present": true or false,
    "label": "short name of the held object, or an empty string if none",
    "box": { "x": number, "y": number, "width": number, "height": number }
  }
}

Box fields are normalized between 0 and 1 relative to the full image: x/y is the top-left corner of a tight bounding box around the held object, width/height are its size as a fraction of the image. If no object is held, set present to false and all box values to 0.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } },
      ],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 150,
        temperature: 0,
      },
    });

    let parsed;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      // Model didn't return valid JSON — fail soft with a description-only fallback
      // instead of breaking the live loop.
      return res.json({
        sceneDescription: (response.text || "Couldn't analyze this frame.").slice(0, 300),
        handItem: { present: false, label: "", box: { x: 0, y: 0, width: 0, height: 0 } },
      });
    }

    // Defensive normalization: never trust the model to give us clean numbers.
    const clamp01 = (n) => Math.min(1, Math.max(0, typeof n === "number" && !Number.isNaN(n) ? n : 0));
    const rawHandItem = parsed.handItem || {};
    const rawBox = rawHandItem.box || {};

    res.json({
      sceneDescription: typeof parsed.sceneDescription === "string" ? parsed.sceneDescription : "",
      handItem: {
        present: Boolean(rawHandItem.present),
        label: typeof rawHandItem.label === "string" ? rawHandItem.label.slice(0, 60) : "",
        box: {
          x: clamp01(rawBox.x),
          y: clamp01(rawBox.y),
          width: clamp01(rawBox.width),
          height: clamp01(rawBox.height),
        },
      },
    });
  } catch (err) {
    const { status, body } = classifyGeminiError(err);
    res.status(status).json(body);
  }
});

// ---------- 404 fallback ----------
app.use("/api", (req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Unknown API route." });
});

// ---------- Central error handler ----------
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "SERVER_ERROR", message: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`SeeAI backend listening on http://localhost:${PORT}`);
});