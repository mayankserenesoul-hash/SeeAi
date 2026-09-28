const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates a File object selected via <input type="file">.
 * Returns { valid: true } or { valid: false, message: "..." }.
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, message: "No file was selected." };
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: "Unsupported file type. Please upload a JPG, PNG, or WEBP image.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      message: "That image is too large. Please upload a file under 10 MB.",
    };
  }

  return { valid: true };
}

/**
 * Reads a File object and resolves with a data URL, or rejects with
 * a human-readable error message if the file can't be read.
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject("The image could not be read. Please try a different file.");

    reader.readAsDataURL(file);
  });
}
