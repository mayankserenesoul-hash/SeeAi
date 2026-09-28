/**
 * Given a <video> element that is rendered with object-fit: contain,
 * returns the pixel rectangle (within the element's own box) where the
 * actual video content is visible — excluding any letterbox bars.
 *
 * Returns null if the video has no dimensions yet (not loaded/playing).
 */
export function getVideoContentRect(video) {
  if (!video || !video.videoWidth || !video.videoHeight) return null;

  const elementWidth = video.clientWidth;
  const elementHeight = video.clientHeight;
  if (!elementWidth || !elementHeight) return null;

  const videoRatio = video.videoWidth / video.videoHeight;
  const elementRatio = elementWidth / elementHeight;

  let renderedWidth, renderedHeight, offsetX, offsetY;

  if (videoRatio > elementRatio) {
    // Video is relatively wider than its box -> letterboxed top/bottom
    renderedWidth = elementWidth;
    renderedHeight = elementWidth / videoRatio;
    offsetX = 0;
    offsetY = (elementHeight - renderedHeight) / 2;
  } else {
    // Video is relatively taller than its box -> letterboxed left/right
    renderedHeight = elementHeight;
    renderedWidth = elementHeight * videoRatio;
    offsetY = 0;
    offsetX = (elementWidth - renderedWidth) / 2;
  }

  return { offsetX, offsetY, renderedWidth, renderedHeight };
}

/**
 * Converts a normalized (0-1) bounding box into a pixel-position style
 * object, given the video's content rect from getVideoContentRect.
 */
export function boxToPixelStyle(box, contentRect) {
  if (!box || !contentRect) return null;

  return {
    left: `${contentRect.offsetX + box.x * contentRect.renderedWidth}px`,
    top: `${contentRect.offsetY + box.y * contentRect.renderedHeight}px`,
    width: `${box.width * contentRect.renderedWidth}px`,
    height: `${box.height * contentRect.renderedHeight}px`,
  };
}