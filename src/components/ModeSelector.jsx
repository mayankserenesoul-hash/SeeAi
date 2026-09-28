const MODES = [
  { id: "explore", label: "Explore" },
  { id: "read", label: "Read" },
  { id: "learn", label: "Learn" },
  { id: "analyze", label: "Analyze" },
  { id: "assist", label: "Assist" },
];

function ModeSelector({ activeMode, onSelectMode }) {
  return (
    <div className="mode-selector" role="tablist" aria-label="Vision mode">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          role="tab"
          aria-selected={activeMode === mode.id}
          className={`mode-btn ${activeMode === mode.id ? "mode-btn-active" : ""}`}
          onClick={() => onSelectMode(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

export default ModeSelector;
