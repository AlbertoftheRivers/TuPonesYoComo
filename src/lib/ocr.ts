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
  console.log('📷 [OCR API] extractTextFromImage called');
  console.log('📷 [OCR API] imageUri type:', typeof imageUri);
  console.log('📷 [OCR API] imageUri starts with data:', imageUri?.startsWith('data:image/'));
  console.log('📷 [OCR API] language:', language);
  console.log('📷 [OCR API] API_BASE_URL:', API_BASE_URL);
  
  try {
    // Create FormData to send image file
    const formData = new FormData();
    
    // Check if it's a data URI (base64) from web picker
    if (imageUri.startsWith('data:image/')) {
      console.log('📷 [OCR API] Processing data URI (web image)');
      // Convert data URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      console.log('📷 [OCR API] Blob created, size:', blob.size, 'bytes');
      
      // Determine MIME type from data URI
      const mimeMatch = imageUri.match(/data:image\/(\w+);/);
      const mimeType = mimeMatch ? `image/${mimeMatch[1]}` : 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      console.log('📷 [OCR API] MIME type:', mimeType, 'Extension:', extension);
      
      formData.append('image', blob, `image.${extension}`);
    } else {
      console.log('📷 [OCR API] Processing native file URI');
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
    console.log('📷 [OCR API] Language added to formData:', language);
    
    // Add preprocessing options if provided
    if (preprocessing) {
      formData.append('preprocessing', JSON.stringify(preprocessing));
      console.log('📷 [OCR API] Preprocessing options added');
    }

    const ocrUrl = `${API_BASE_URL}/api/ocr`;
    console.log('📷 [OCR API] Sending request to:', ocrUrl);
    console.log('📷 [OCR API] Request method: POST');
    
    // Send request to backend
    const response = await fetch(ocrUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // Don't set Content-Type, let the browser set it with boundary for multipart/form-data
      },
    });

    console.log('📷 [OCR API] Response received, status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('📷 [OCR API] Error response:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: OCRResult = await response.json();
    console.log('📷 [OCR API] Success! Text extracted, length:', data.text?.length);
    console.log('📷 [OCR API] Confidence:', data.confidence);
    return data;
  } catch (error) {
    console.error('📷 [OCR API] Error extracting text from image:', error);
    console.error('📷 [OCR API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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