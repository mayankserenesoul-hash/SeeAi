import { useState, useRef, useEffect } from "react";
import useCamera from "../hooks/useCamera";
import { validateImageFile, readFileAsDataUrl } from "../utils/imageValidation";
import { detectLiveFrame } from "../services/geminiService";
import { getVideoContentRect, boxToPixelStyle } from "../utils/videoGeometry";

const LIVE_MODE_INTERVAL_MS = 3000; // adjust up if you hit rate limits, down for snappier detection
const MIN_VISIBLE_BOX_FRACTION = 0.01; // ignore near-zero boxes as "not really detected"

function VisualStage({ currentImage, onImageChange, onNewImage, onLiveDescription, activeMode }) {
  const { videoRef, status, errorMessage, startCamera, stopCamera, captureFrame } =
    useCamera();

  const [uploadError, setUploadError] = useState("");
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveDetection, setLiveDetection] = useState(null); // { sceneDescription, handItem }
  const [, forceRerender] = useState(0);

  const fileInputRef = useRef(null);
  const liveIntervalRef = useRef(null);
  const isLiveBusyRef = useRef(false);

  const handleCapture = () => {
    const dataUrl = captureFrame();
    if (dataUrl) {
      setUploadError("");
      setLiveDetection(null);
      onImageChange(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setLiveDetection(null);
    onNewImage();
    setUploadError("");
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.message);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setUploadError("");
      if (status === "running") stopCamera();
      onImageChange(dataUrl);
    } catch (readErrorMessage) {
      setUploadError(readErrorMessage);
    }
  };

  const toggleLiveMode = () => {
    setIsLiveMode((prev) => !prev);
    setLiveDetection(null);
  };

  // Runs the live detection loop: captures a frame, sends it for structured
  // detection, and stores the result for the chat log + box overlay to use.
  useEffect(() => {
    const isCameraRunning = status === "running";
    if (!isLiveMode || !isCameraRunning) return;

    const runTick = async () => {
      if (isLiveBusyRef.current) return;
      const dataUrl = captureFrame({ maxWidth: 480, format: "image/jpeg", quality: 0.7 });
      if (!dataUrl) return;

      isLiveBusyRef.current = true;
      try {
        const result = await detectLiveFrame({ image: dataUrl, mode: activeMode });
        setLiveDetection(result);

        const description = result.handItem?.present
          ? `${result.sceneDescription} They appear to be holding: ${result.handItem.label || "an object"}.`
          : result.sceneDescription || "Nothing distinct detected in this frame.";

        onLiveDescription(description);
      } catch (err) {
        console.warn("Live detection tick failed:", err.message);
        setLiveDetection(null);
      } finally {
        isLiveBusyRef.current = false;
      }
    };

    liveIntervalRef.current = setInterval(runTick, LIVE_MODE_INTERVAL_MS);

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLiveMode, status, activeMode, captureFrame, onLiveDescription]);

  // Turn Live Mode off automatically if the camera stops for any reason.
  useEffect(() => {
    if (status !== "running" && isLiveMode) {
      setIsLiveMode(false);
      setLiveDetection(null);
    }
  }, [status, isLiveMode]);

  // Keep the box aligned if the window/panel is resized.
  useEffect(() => {
    const handleResize = () => forceRerender((n) => n + 1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isCameraRunning = status === "running";
  const hasCapturedImage = Boolean(currentImage);
  const showLiveVideo = isCameraRunning && !hasCapturedImage;

  const handItem = liveDetection?.handItem;
  const hasValidBox =
    showLiveVideo &&
    handItem?.present &&
    handItem.box.width > MIN_VISIBLE_BOX_FRACTION &&
    handItem.box.height > MIN_VISIBLE_BOX_FRACTION;

  const contentRect = showLiveVideo ? getVideoContentRect(videoRef.current) : null;
  const boxStyle = hasValidBox ? boxToPixelStyle(handItem.box, contentRect) : null;

  return (
    <div className="visual-stage">
      <div className="visual-frame" aria-live="polite">
        {!showLiveVideo && !hasCapturedImage && (
          <>
            <div className="visual-frame-corner corner-tl" />
            <div className="visual-frame-corner corner-tr" />
            <div className="visual-frame-corner corner-bl" />
            <div className="visual-frame-corner corner-br" />
          </>
        )}

        <video
          ref={videoRef}
          className="visual-video"
          style={{ display: showLiveVideo ? "block" : "none" }}
          playsInline
          muted
        />

        {isLiveMode && showLiveVideo && (
          <span className="live-badge">
            <span className="live-dot" /> LIVE
          </span>
        )}

        {boxStyle && (
          <div className="hand-item-box fade-in" style={boxStyle}>
            <span className="hand-item-label">{handItem.label || "Object"}</span>
          </div>
        )}

        {hasCapturedImage && (
          <img
            src={currentImage}
            alt="Selected for analysis"
            className="visual-captured-image fade-in"
          />
        )}

        {!showLiveVideo && !hasCapturedImage && status === "idle" && !uploadError && (
          <div className="visual-empty-state fade-in">
            <svg className="visual-empty-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p className="visual-empty-title">No image yet</p>
            <p className="visual-empty-subtitle">
              Start your camera or upload a photo to begin.
            </p>
          </div>
        )}

        {status === "starting" && (
          <div className="visual-empty-state">
            <p className="visual-empty-title">Starting camera…</p>
          </div>
        )}

        {(status === "denied" || status === "unavailable" || status === "error") && (
          <div className="visual-empty-state">
            <p className="visual-empty-title">Camera unavailable</p>
            <p className="visual-empty-subtitle visual-error-text">{errorMessage}</p>
          </div>
        )}

        {uploadError && !hasCapturedImage && status === "idle" && (
          <div className="visual-empty-state">
            <p className="visual-empty-title">Upload failed</p>
            <p className="visual-empty-subtitle visual-error-text">{uploadError}</p>
          </div>
        )}
      </div>

      <div className="visual-controls">
        {!isCameraRunning && !hasCapturedImage && (
          <button className="btn-primary" onClick={startCamera}>
            Start Camera
          </button>
        )}

        {isCameraRunning && !hasCapturedImage && (
          <>
            <button className="btn-primary" onClick={handleCapture} disabled={isLiveMode}>
              Capture
            </button>
            <button
              className={`btn-secondary ${isLiveMode ? "btn-live-active" : ""}`}
              onClick={toggleLiveMode}
            >
              {isLiveMode ? "Stop Live Mode" : "Live Mode"}
            </button>
            <button className="btn-ghost" onClick={stopCamera}>
              Stop Camera
            </button>
          </>
        )}

        <button className="btn-secondary" onClick={handleUploadClick}>
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="visually-hidden-input"
          aria-label="Upload an image"
        />

        <button className="btn-ghost" onClick={handleRetake} disabled={!hasCapturedImage}>
          Retake
        </button>
      </div>

      <p className="visual-status-note">
        {isLiveMode
          ? handItem?.present
            ? `Live Mode is on — tracking "${handItem.label}" in your hand.`
            : "Live Mode is on — hold something up to the camera."
          : hasCapturedImage
          ? "Image ready. Ask a question on the right."
          : "Camera and upload both work now."}
      </p>

      <p className="privacy-inline-note">
        Your camera is only accessed after you grant permission. Captured or
        uploaded images are sent to Google's Gemini API to generate answers.
      </p>
    </div>
  );
}

export default VisualStage;