# SeeAI — Testing Checklist

Run through this before every demo. Check off each item as you go.

## Setup
- [ ] Backend running: `cd server && npm run dev` → shows "SeeAI backend listening on http://localhost:3001"
- [ ] Frontend running: `npm run dev` → shows "Local: http://localhost:5173/"
- [ ] `http://localhost:3001/api/health` shows `"geminiConfigured": true`

## Happy path (core demo flow)
- [ ] Landing page loads, "Try SeeAI" navigates to `/workspace`
- [ ] Start Camera → permission prompt → live video appears
- [ ] Capture → still image appears, camera turns off
- [ ] Ask "What am I looking at?" → real answer appears within a few seconds, and is read aloud
- [ ] Ask a follow-up question → answer reflects earlier context
- [ ] Switch mode (e.g. Explore → Read) → next answer's style changes accordingly, suggested chip updates
- [ ] Retake → returns to empty state cleanly
- [ ] Upload Image (instead of camera) → works identically to capture
- [ ] Live Mode → camera running, toggle Live Mode on → automatic descriptions appear every ~8s
- [ ] Refresh the page mid-conversation → image, messages, and mode are all restored

## Error conditions
- [ ] **Camera permission denied**: Start Camera → click Block → clear "Camera unavailable" message shown, Upload Image still works
- [ ] **Camera unavailable**: (if possible) disable/unplug webcam → Start Camera → "No camera was found" message, no crash
- [ ] **Invalid image**: try uploading a non-image file → "Unsupported file type" message
- [ ] **Image too large**: upload a file >10MB → "too large" message, no hang
- [ ] **API failure**: stop the backend, ask a question → red error bubble, not a silent freeze. Restart backend after.
- [ ] **Missing API key**: temporarily rename `GEMINI_API_KEY` in `server/.env`, restart backend, ask a question → clean `MISSING_API_KEY` error. Restore key and restart after.
- [ ] **Network failure**: turn off Wi-Fi briefly while asking a question → "Couldn't reach the SeeAI server" message
- [ ] **Empty question**: Send button is disabled when input is empty or image is missing
- [ ] **AI timeout**: temporarily set `REQUEST_TIMEOUT_MS = 1` in `geminiService.js` → timeout error shows. Revert after.

## Cross-browser check
- [ ] Chrome — full flow works
- [ ] Edge — full flow works
- [ ] Firefox — camera/capture works; voice-read may sound different (uses OS voices)

## Responsive check
- [ ] Desktop width — camera/chat side by side
- [ ] ~768px (tablet) — stacks cleanly
- [ ] ~390px (phone, via DevTools) — mode buttons scroll instead of wrapping badly, no zoom-on-input-focus

## Accessibility spot-check
- [ ] Tab through the whole workspace with keyboard only — every interactive element shows a visible focus ring
- [ ] All buttons have clear, readable labels

## Known non-issues (don't debug these, they're expected)
- `http://localhost:3001/` alone shows "Cannot GET /" — normal, there's no route for that path, only `/api/...` routes exist
- Camera requires `localhost` or HTTPS
- Free-tier Gemini has a daily/per-minute request limit — if you hit `RATE_LIMITED` during heavy testing (especially with Live Mode on), wait a minute and retry
