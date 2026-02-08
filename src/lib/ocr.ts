/**
 * OCR (Optical Character Recognition) using Tesseract.js backend
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.tuponesyocomo.uk';

export interface OCRResult {
  text: string;
  language: string;
  confidence?: number;
  words?: Array<{ text: string; confidence: number }>;
}

export interface OCRPreprocessingOptions {
  contrast?: number; // -100 to 100, default 0
  brightness?: number; // -100 to 100, default 0
}

export interface OCRBatchResult {
  results: OCRResult[];
  totalImages: number;
  successful: number;
  failed: number;
}

export async function extractTextFromImage(
  imageUri: string,
  language: string = 'spa',
  preprocessing?: OCRPreprocessingOptions
): Promise<OCRResult> {
  try {
    // Create FormData to send image file
    const formData = new FormData();
    
    // Check if it's a data URI (base64) from web picker
    if (imageUri.startsWith('data:image/')) {
      // Convert data URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Determine MIME type from data URI
      const mimeMatch = imageUri.match(/data:image\/(\w+);/);
      const mimeType = mimeMatch ? `image/${mimeMatch[1]}` : 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      
      formData.append('image', blob, `image.${extension}`);
    } else {
      // Native file URI
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
    }
    
    // Add language parameter
    formData.append('language', language);
    
    // Add preprocessing options if provided
    if (preprocessing) {
      formData.append('preprocessing', JSON.stringify(preprocessing));
    }

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

/**
 * Process multiple images in batch
 */
export async function extractTextFromImages(
  imageUris: string[],
  language: string = 'spa',
  preprocessing?: OCRPreprocessingOptions
): Promise<OCRBatchResult> {
  const results: OCRResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const imageUri of imageUris) {
    try {
      const result = await extractTextFromImage(imageUri, language, preprocessing);
      results.push(result);
      successful++;
    } catch (error) {
      console.error(`Error processing image ${imageUri}:`, error);
      failed++;
    }
  }

  return {
    results,
    totalImages: imageUris.length,
    successful,
    failed,
  };
}