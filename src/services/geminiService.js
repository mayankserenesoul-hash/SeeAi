const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const REQUEST_TIMEOUT_MS = 30000;
const LIVE_TIMEOUT_MS = 20000;

/**
 * Sends an image + question (+ optional mode and conversation history)
 * to our backend, which forwards it to Gemini.
 */
export async function askAboutImage({ image, question, mode, history = [] }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, question, mode, history }),
      signal: controller.signal,
    });
  } catch (networkError) {
    if (networkError.name === "AbortError") {
      throw new Error("SeeAI took too long to respond. Please try again.");
    }
    throw new Error(
      "Couldn't reach the SeeAI server. Make sure the backend is running and try again."
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  if (!response.ok) {
    throw new Error(data.message || "The AI couldn't answer that. Please try again.");
  }

  return data.answer;
}

/**
 * Sends a single live-camera frame to the backend for structured detection:
 * a short scene description plus the bounding box of anything held in-hand.
 *
 * @returns {Promise<{ sceneDescription: string, handItem: { present: boolean, label: string, box: {x:number,y:number,width:number,height:number} } }>}
 */
export async function detectLiveFrame({ image, mode }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/detect-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, mode }),
      signal: controller.signal,
    });
  } catch (networkError) {
    throw new Error(
      networkError.name === "AbortError"
        ? "Live detection timed out for this frame."
        : "Couldn't reach the SeeAI server for live detection."
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Live detection returned an unexpected response.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Live detection failed for this frame.");
  }

  return data;
}