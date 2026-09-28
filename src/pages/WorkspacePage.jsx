import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ModeSelector from "../components/ModeSelector";
import VisualStage from "../components/VisualStage";
import ConversationPanel from "../components/ConversationPanel";
import { askAboutImage } from "../services/geminiService";
import "../styles/WorkspacePage.css";

const SESSION_KEY = "seeai:session";

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, currentImage: null }));
    } catch {
      // Persistence is a nice-to-have, not core functionality — fail silently.
    }
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

function WorkspacePage() {
  const restored = useRef(loadSession());

  const [activeMode, setActiveMode] = useState(restored.current?.activeMode || "explore");
  const [currentImage, setCurrentImage] = useState(restored.current?.currentImage || null);
  const [messages, setMessages] = useState(restored.current?.messages || []);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState("");

  useEffect(() => {
    saveSession({ activeMode, currentImage, messages });
  }, [activeMode, currentImage, messages]);

  const handleImageChange = (dataUrlOrNull) => {
    setCurrentImage(dataUrlOrNull);
    setMessages([]);
    setAskError("");
    if (!dataUrlOrNull) clearSession();
  };

  const handleNewImage = () => handleImageChange(null);

  const handleClearConversation = () => {
    setMessages([]);
    setAskError("");
  };

  const handleAskQuestion = async (question) => {
    if (!currentImage || !question.trim()) return;

    setIsAsking(true);
    setAskError("");

    try {
      const answer = await askAboutImage({
        image: currentImage,
        question,
        mode: activeMode,
        history: messages,
      });
      setMessages((prev) => [...prev, { question, answer, mode: activeMode }]);
    } catch (err) {
      setAskError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  // Called by VisualStage with a ready-made description string once it has
  // finished a live-detection tick. VisualStage owns the actual API call now
  // since it also needs the raw bounding box for the on-screen overlay.
  const handleLiveDescription = (description) => {
    if (!description) return;
    setMessages((prev) => [
      ...prev.slice(-19), // cap the log so it doesn't grow forever
      { question: "(Live) What do you see?", answer: description, mode: `${activeMode} · live` },
    ]);
  };

  return (
    <div className="workspace">
      <header className="workspace-topbar">
        <Link to="/" className="brand-mark">
          SeeAI
        </Link>
        <ModeSelector activeMode={activeMode} onSelectMode={setActiveMode} />
      </header>

      <main className="workspace-grid">
        <VisualStage
          currentImage={currentImage}
          onImageChange={handleImageChange}
          onNewImage={handleNewImage}
          onLiveDescription={handleLiveDescription}
          activeMode={activeMode}
        />
        <ConversationPanel
          hasImage={Boolean(currentImage)}
          messages={messages}
          isAsking={isAsking}
          askError={askError}
          activeMode={activeMode}
          onAskQuestion={handleAskQuestion}
          onClearConversation={handleClearConversation}
        />
      </main>
    </div>
  );
}

export default WorkspacePage;