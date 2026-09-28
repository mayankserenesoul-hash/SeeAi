import { useState, useEffect, useRef } from "react";
import useSpeechSynthesis from "../hooks/useSpeechSynthesis";

const SUGGESTED_QUESTIONS = {
  explore: "What am I looking at?",
  read: "What does the text say?",
  learn: "Can you explain this simply?",
  analyze: "Give me a detailed analysis of this.",
  assist: "What should I do with this?",
};

function ConversationPanel({
  hasImage,
  messages,
  isAsking,
  askError,
  activeMode,
  onAskQuestion,
  onClearConversation,
}) {
  const [draft, setDraft] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const { isSupported: speechSupported, speak, stop } = useSpeechSynthesis();
  const lastSpokenIndexRef = useRef(-1);

  // Automatically read the newest AI answer aloud as soon as it arrives,
  // as long as auto-speak is on and we haven't already spoken this one.
  useEffect(() => {
    if (!autoSpeak || !speechSupported || messages.length === 0) return;
    const latestIndex = messages.length - 1;
    if (latestIndex === lastSpokenIndexRef.current) return;

    lastSpokenIndexRef.current = latestIndex;
    speak(messages[latestIndex].answer);
  }, [messages, autoSpeak, speechSupported, speak]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim() || isAsking) return;
    onAskQuestion(draft.trim());
    setDraft("");
  };

  const handleSuggestedClick = () => {
    const suggestion = SUGGESTED_QUESTIONS[activeMode] || SUGGESTED_QUESTIONS.explore;
    onAskQuestion(suggestion);
  };

  const toggleAutoSpeak = () => {
    if (autoSpeak) stop();
    setAutoSpeak((prev) => !prev);
  };

  return (
    <div className="conversation-panel">
      <div className="conversation-toolbar">
        <span className="conversation-toolbar-label">
          {messages.length > 0
            ? `${messages.length} question${messages.length > 1 ? "s" : ""} asked`
            : "Conversation"}
        </span>
        <div className="conversation-toolbar-actions">
          {speechSupported && (
            <button
              className={`btn-ghost btn-small ${autoSpeak ? "btn-speak-active" : ""}`}
              onClick={toggleAutoSpeak}
              title={autoSpeak ? "Voice replies are on" : "Voice replies are off"}
            >
              {autoSpeak ? "🔊 Voice on" : "🔇 Voice off"}
            </button>
          )}
          <button
            className="btn-ghost btn-small"
            onClick={onClearConversation}
            disabled={messages.length === 0}
          >
            Clear conversation
          </button>
        </div>
      </div>

      <div className="conversation-history">
        {!hasImage && messages.length === 0 && (
          <div className="conversation-empty-state">
            <p className="conversation-empty-title">Nothing to ask yet</p>
            <p className="conversation-empty-subtitle">
              Capture or upload an image on the left, then ask SeeAI anything
              about it.
            </p>
          </div>
        )}

        {hasImage && messages.length === 0 && (
          <div className="conversation-empty-state">
            <p className="conversation-empty-title">Ready when you are</p>
            <p className="conversation-empty-subtitle">
              Try a question in <strong>{activeMode}</strong> mode.
            </p>
            <button className="suggested-chip" onClick={handleSuggestedClick} disabled={isAsking}>
              {SUGGESTED_QUESTIONS[activeMode] || SUGGESTED_QUESTIONS.explore}
            </button>
          </div>
        )}

        {messages.map((turn, index) => (
          <div className="message-pair" key={index}>
            <div className="message message-user">{turn.question}</div>
            <div className="message message-ai">
              <span className="message-mode-tag">{turn.mode}</span>
              {turn.answer}
              {speechSupported && (
                <button
                  className="message-speak-btn"
                  onClick={() => speak(turn.answer)}
                  aria-label="Read this answer aloud"
                  title="Read aloud"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}

        {isAsking && (
          <div className="message-pair fade-in">
            <div className="message message-ai message-loading">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-label">SeeAI is looking...</span>
            </div>
          </div>
        )}

        {askError && (
          <div className="conversation-error">
            <p>{askError}</p>
          </div>
        )}
      </div>

      <form className="conversation-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          className="conversation-input"
          placeholder={hasImage ? "Ask about the image..." : "Capture or upload an image first"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!hasImage || isAsking}
          aria-label="Ask a question about the image"
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!hasImage || isAsking || !draft.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ConversationPanel;
