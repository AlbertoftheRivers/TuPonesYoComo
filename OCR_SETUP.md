# OCR Setup Guide

This guide explains how to set up and use the OCR (Optical Character Recognition) feature in TuPonesYoComo.

## Overview

The OCR feature allows you to:
- Take a photo of a recipe
- Select an image from your gallery
- Automatically extract text from the image
- Insert the extracted text into the recipe text field

## Backend Setup

### 1. Install Tesseract.js

The backend uses Tesseract.js for OCR processing. Install it in the backend directory:

```bash
cd backend
npm install tesseract.js
```

### 2. Verify Backend is Running

Make sure your backend API server is running and accessible:

```bash
curl http://localhost:3000/health
```

You should see `ocr_enabled: true` in the response.

## Frontend Setup

### 1. Install expo-image-picker

The frontend uses `expo-image-picker` for camera and gallery access:

```bash
npm install expo-image-picker
```

### 2. Permissions

The app will automatically request:
- **Camera permissions**: For taking photos of recipes
- **Gallery permissions**: For selecting images from your device

## Usage

### In AddRecipeScreen

1. Tap the **📷** button next to "Texto de la Receta"
2. Choose:
   - **Tomar Foto**: Take a new photo with your camera
   - **Seleccionar de Galería**: Choose an existing image
3. Wait for OCR processing (usually 5-15 seconds)
4. The extracted text will be automatically inserted into the text field

### In EditRecipeScreen

Same process as AddRecipeScreen - tap the 📷 button to scan a recipe image.

## How It Works

1. **Image Capture/Selection**: User takes photo or selects image
2. **Image Upload**: Image is sent to backend API at `/api/ocr`
3. **OCR Processing**: Backend uses Tesseract.js to extract text (Spanish by default)
4. **Text Return**: Extracted text is returned to the app
5. **Text Insertion**: Text is appended to the recipe text field

## Supported Languages

Currently configured for **Spanish** (`spa`). To change the language:

1. Edit `src/lib/ocr.ts`:
   ```typescript
   const result = await extractTextFromImage(imageUri, 'eng'); // English
   ```

2. Edit `backend/server.js`:
   ```javascript
   const language = req.body.language || 'eng'; // Change default
   ```

## Troubleshooting

### "No text could be extracted"
- Image may be too blurry or unclear
- Text may be too small or low contrast
- Try taking a clearer photo with better lighting

### "Error al extraer texto de la imagen"
- Check backend server is running
- Verify Tesseract.js is installed: `npm list tesseract.js` in backend directory
- Check network connection to backend API

### Camera/Gallery not working
- Check app permissions in device settings
- Restart the app after granting permissions

## Technical Details

- **OCR Engine**: Tesseract.js v5.0.4
- **Image Format**: JPEG, PNG, GIF, WebP, BMP, TIFF
- **Max File Size**: 20MB
- **Processing Time**: 5-15 seconds depending on image size and complexity
- **Language Model**: Spanish (spa) by default

## Future Improvements

- Support for multiple languages
- Image preprocessing (contrast, brightness adjustment)
- Batch processing for multiple images
- Confidence scores for extracted text

