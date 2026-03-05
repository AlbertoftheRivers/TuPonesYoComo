/**
 * Backend API base URL (OCR, transcribe, Ollama suggest, analyze-recipe).
 * Same server as the Expo app uses.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";
