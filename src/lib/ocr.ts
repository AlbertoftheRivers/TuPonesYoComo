/**
 * OCR (Optical Character Recognition) using Tesseract.js backend
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface OCRResult {
  text: string;
  language: string;
}

export async function extractTextFromImage(
  imageUri: string,
  language: string = 'spa'
): Promise<OCRResult> {
  try {
    // Create FormData to send image file
    const formData = new FormData();
    
    // Get file name from URI
    const fileName = imageUri.split('/').pop() || 'image.jpg';
    
    // Determine MIME type from file extension
    let mimeType = 'image/jpeg';
    if (fileName.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (fileName.endsWith('.gif')) {
      mimeType = 'image/gif';
    } else if (fileName.endsWith('.webp')) {
      mimeType = 'image/webp';
    }
    
    // Add image file to form data
    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: fileName,
    } as any);
    
    // Add language parameter
    formData.append('language', language);

    // Send request to backend
    const response = await fetch(`${API_BASE_URL}/api/ocr`, {
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

    const data: OCRResult = await response.json();
    return data;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

