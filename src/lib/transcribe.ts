/**
 * Speech-to-text transcription using Whisper backend
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.tuponesyocomo.uk';

export interface TranscribeResult {
  text: string;
  language: string;
  model: string;
}

export async function transcribeAudio(
  audioUri: string,
  language: string = 'es'
): Promise<TranscribeResult> {
  try {
    // Create FormData to send audio file
    const formData = new FormData();
    
    // Get file name from URI
    const fileName = audioUri.split('/').pop() || 'recording.m4a';
    const fileType = fileName.endsWith('.m4a') ? 'audio/m4a' : 'audio/mp4';
    
    // Add audio file to form data
    formData.append('audio', {
      uri: audioUri,
      type: fileType,
      name: fileName,
    } as any);
    
    // Add language parameter
    formData.append('language', language);

    // Send request to backend
    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // Don't set Content-Type, let the browser set it with boundary for multipart/form-data
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: TranscribeResult = await response.json();
    return data;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

