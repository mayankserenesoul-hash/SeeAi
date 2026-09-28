# SeeAI — AI That Understands What You See

SeeAI turns your camera or any photo into a conversation. Point it at something, ask a question, and get a clear, spoken-and-written answer — powered by Google Gemini.

**Live demo:** https://see-ai-six.vercel.app

## What it does

- Capture from your camera or upload an image
- Ask natural-language questions about what's in it
- Follow-up questions stay in context for the same image
- Five vision modes (Explore, Read, Learn, Analyze, Assist) change how the AI interprets the scene
- **Live Mode**: point your camera at your hand — SeeAI continuously identifies what you're holding and draws a live bounding box around it
- Answers are read aloud automatically, alongside the text
- Conversations persist across page refreshes

## Tech stack

- React + Vite (frontend), deployed on Vercel
- Node.js + Express (backend API layer, keeps the Gemini key server-side), deployed on Render
- Google Gemini (`gemini-flash-lite-latest`) for multimodal vision + structured JSON detection
- Browser MediaDevices, SpeechSynthesis, and localStorage APIs

## Running locally

**Backend:**


**Frontend:**

Open `http://localhost:5173`.

## Project structure

`src/` — components, pages, hooks, services, utils, styles
`server/` — Express API layer that talks to Gemini

## Testing

See `TESTING.md` for the full manual test checklist.

## Privacy

Camera access requires explicit permission. Captured/uploaded images are sent to Google's Gemini API to generate answers — nothing is stored server-side beyond the request lifecycle.