# SeeAI — Demo Script (under 2 minutes)

## Before judges arrive
- [ ] Open the live Vercel URL, let Render's backend wake up (~1 min cold start)
- [ ] Do one warm-up question yourself to confirm everything's responding
- [ ] Turn OFF Live Mode if it was left on from testing

## The demo (talk while you do this)

1. **Land** — "This is SeeAI — it turns your camera into a conversation." Show the landing page for 2 seconds.
2. **Enter** — Click "Try SeeAI."
3. **Camera** — Click "Start Camera," allow permission.
4. **Capture** — Point at something on the table, click "Capture."
5. **Ask** — Type or say: "What am I looking at?" → let the answer appear and read itself aloud.
6. **Follow-up** — Ask a second, more specific question about the same object — show it remembers context.
7. **Switch mode** — Click "Read" or "Analyze" mode, ask the suggested chip question — show the answer's tone visibly change.
8. **Live Mode finale** — Retake, Start Camera again, click "Live Mode," hold an object up — show the live bounding box locking onto it in real time, with the description streaming into chat automatically.
9. **Close** — "All of this runs on Gemini, with the API key kept server-side for security."

## If something breaks live
- Camera denied? Fall back to Upload Image with a photo already on your phone/laptop.
- Backend slow to wake? That's Render's free-tier cold start — mention it's a hosting limitation, not the app.
- Rate limited? Wait 10-15 seconds and retry.

## One-liner for judges
"SeeAI is a visual AI assistant — show it anything, ask it anything, and it answers back in plain language, live, in real time."