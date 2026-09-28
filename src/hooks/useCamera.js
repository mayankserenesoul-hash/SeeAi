import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Manages camera permission, the live video stream, and frame capture.
 *
 * Returns:
 * - videoRef: attach to a <video> element to show the live preview
 * - status: "idle" | "starting" | "running" | "denied" | "unavailable" | "error"
 * - errorMessage: human-readable explanation when status is denied/unavailable/error
 * - startCamera(): requests permission and starts the stream
 * - stopCamera(): stops the stream and releases the camera
 * - captureFrame(): returns a data URL (PNG) of the current video frame, or null
 */
function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const startCamera = useCallback(async () => {
    setErrorMessage("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("unavailable");
      setErrorMessage(
        "This browser does not support camera access. Please use the upload option instead."
      );
      return;
    }

    setStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("running");
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("denied");
        setErrorMessage(
          "Camera access was denied. Please allow camera permission in your browser, or upload an image instead."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setStatus("unavailable");
        setErrorMessage(
          "No camera was found on this device. Please upload an image instead."
        );
      } else {
        setStatus("error");
        setErrorMessage(
          "Something went wrong while starting the camera. Please try again or upload an image."
        );
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, []);

  const captureFrame = useCallback((options = {}) => {
    const video = videoRef.current;
    if (!video || status !== "running") return null;

    const { maxWidth, format = "image/png", quality } = options;

    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;

    // Downscale only when a maxWidth is explicitly requested (used by Live Mode) —
    // the normal Capture button keeps full resolution by calling this with no args.
    if (maxWidth && targetWidth > maxWidth) {
      const scale = maxWidth / targetWidth;
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL(format, quality);
  }, [status]);

  // Always release the camera if the component unmounts (e.g. user navigates away)
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    status,
    errorMessage,
    startCamera,
    stopCamera,
    captureFrame,
  };
}

export default useCamera;
