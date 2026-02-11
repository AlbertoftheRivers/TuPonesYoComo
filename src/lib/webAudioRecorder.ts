/**
 * Web Audio Recording for Whisper transcription
 * Uses MediaRecorder API to record audio and send to Whisper backend
 * This matches the Android APK behavior (expo-av + Whisper)
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.tuponesyocomo.uk';

export interface WebAudioRecorder {
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  cancel: () => void;
  isRecording: () => boolean;
}

/**
 * Create a new audio recorder instance
 */
export function createWebAudioRecorder(): WebAudioRecorder | null {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return null;
  }

  let mediaRecorder: MediaRecorder | null = null;
  let audioStream: MediaStream | null = null;
  let audioChunks: Blob[] = [];
  let isRecording = false;
  let savedMimeType: string = 'audio/webm'; // Default mimeType

  return {
    async start() {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        
        audioStream = stream;
        audioChunks = [];
        isRecording = true;

        // Create MediaRecorder with m4a format (compatible with Whisper)
        const options: MediaRecorderOptions = {
          mimeType: 'audio/webm;codecs=opus', // Fallback to webm if m4a not available
        };

        // Try to use m4a if available
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options.mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/m4a')) {
          options.mimeType = 'audio/m4a';
        }

        savedMimeType = options.mimeType || 'audio/webm';
        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          isRecording = false;
        };

        mediaRecorder.onstop = () => {
          isRecording = false;
        };

        mediaRecorder.start(1000); // Collect data every second
      } catch (error) {
        console.error('Error starting audio recording:', error);
        isRecording = false;
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          audioStream = null;
        }
        throw error;
      }
    },

    async stop(): Promise<Blob | null> {
      if (!mediaRecorder || !isRecording) {
        return null;
      }

      return new Promise((resolve) => {
        if (!mediaRecorder) {
          resolve(null);
          return;
        }

        // Save mimeType before stopping (since mediaRecorder will be null in onstop)
        const mimeType = savedMimeType;
        const currentStream = audioStream;

        mediaRecorder.onstop = () => {
          isRecording = false;
          
          // Stop all tracks
          if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            audioStream = null;
          }

          // Create blob from chunks using saved mimeType
          if (audioChunks.length > 0) {
            const blob = new Blob(audioChunks, { type: mimeType });
            audioChunks = [];
            resolve(blob);
          } else {
            resolve(null);
          }
          
          // Clean up mediaRecorder reference after handler completes
          mediaRecorder = null;
        };

        mediaRecorder.stop();
      });
    },

    cancel() {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder = null;
      }
      
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }
      
      audioChunks = [];
      isRecording = false;
    },

    isRecording() {
      return isRecording;
    },
  };
}

/**
 * Transcribe audio blob using Whisper backend (same as Android)
 */
export async function transcribeWebAudio(blob: Blob, language: string = 'es'): Promise<{ text: string; language: string; model: string }> {
  try {
    const formData = new FormData();
    
    // Convert blob to file-like object
    const fileName = `recording.${blob.type.includes('mp4') || blob.type.includes('m4a') ? 'm4a' : 'webm'}`;
    const fileType = blob.type || (fileName.endsWith('.m4a') ? 'audio/m4a' : 'audio/webm');
    
    formData.append('audio', blob, fileName);
    formData.append('language', language);

    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error transcribing web audio:', error);
    throw error;
  }
}

/**
 * Check if web audio recording is available
 */
export function isWebAudioRecordingAvailable(): boolean {
  return typeof navigator !== 'undefined' && 
         !!navigator.mediaDevices && 
         !!navigator.mediaDevices.getUserMedia &&
         typeof MediaRecorder !== 'undefined';
}

