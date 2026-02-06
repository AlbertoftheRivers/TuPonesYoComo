/**
 * Backend API Server for TuPonesYoComo
 * Proxies requests to Ollama LLM server
 * 
 * This server runs in a container with VPN access to Ollama
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://192.168.200.45:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'base'; // base is better for systems with < 4GB RAM
const WHISPER_VENV_PATH = process.env.WHISPER_VENV_PATH || path.join(__dirname, 'whisper_venv');

// Configure multer for file uploads
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit (for images and audio)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files for transcription
    const allowedAudioMimes = [
      'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a',
      'audio/wav', 'audio/webm', 'audio/ogg', 'audio/aac'
    ];
    // Accept image files for OCR
    const allowedImageMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'image/webp', 'image/bmp', 'image/tiff'
    ];
    
    const allowedMimes = [...allowedAudioMimes, ...allowedImageMimes];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio or image files are allowed.'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ollama_url: OLLAMA_BASE_URL, 
    model: OLLAMA_MODEL,
    whisper_model: WHISPER_MODEL,
    whisper_venv: WHISPER_VENV_PATH,
    ocr_enabled: true,
    ocr_engine: 'tesseract.js'
  });
});

// OCR endpoint for image text extraction
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      error: 'No image file provided. Please upload an image file.' 
    });
  }

  const imagePath = req.file.path;
  const language = req.body.language || 'spa'; // Spanish by default
  
  // Parse preprocessing options
  let preprocessing = null;
  if (req.body.preprocessing) {
    try {
      preprocessing = typeof req.body.preprocessing === 'string' 
        ? JSON.parse(req.body.preprocessing) 
        : req.body.preprocessing;
    } catch (e) {
      console.warn('Invalid preprocessing options, ignoring:', e);
    }
  }

  let processedImagePath = imagePath;

  try {
    // Apply image preprocessing if requested
    if (preprocessing && (preprocessing.contrast !== undefined || preprocessing.brightness !== undefined)) {
      const sharp = require('sharp');
      const processedPath = path.join(os.tmpdir(), `processed_${Date.now()}_${path.basename(imagePath)}`);
      
      let image = sharp(imagePath);
      
      // Apply contrast adjustment (-100 to 100, mapped to sharp's modulate)
      if (preprocessing.contrast !== undefined && preprocessing.contrast !== 0) {
        // Sharp uses brightness/saturation/hue modulation
        // Contrast is achieved by adjusting brightness and saturation
        const contrastFactor = 1 + (preprocessing.contrast / 100);
        image = image.modulate({
          brightness: 1 + (preprocessing.brightness || 0) / 100,
          saturation: contrastFactor,
        });
      } else if (preprocessing.brightness !== undefined && preprocessing.brightness !== 0) {
        // Just brightness adjustment
        image = image.modulate({
          brightness: 1 + (preprocessing.brightness / 100),
        });
      }
      
      await image.toFile(processedPath);
      processedImagePath = processedPath;
      console.log(`🖼️ Image preprocessed (contrast: ${preprocessing.contrast || 0}, brightness: ${preprocessing.brightness || 0})`);
    }

    // Import Tesseract dynamically
    const { createWorker } = require('tesseract.js');
    
    console.log(`📸 Extracting text from image (language: ${language})...`);
    
    // Create Tesseract worker
    const worker = await createWorker(language);

    // Perform OCR with detailed output for confidence scores
    const { data } = await worker.recognize(processedImagePath);
    const text = data.text;
    const words = data.words || [];
    
    // Calculate average confidence
    const confidences = words.map(w => w.confidence).filter(c => c !== undefined && c > 0);
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : null;

    // Terminate worker
    await worker.terminate();

    // Clean up temporary files
    try {
      await fs.unlink(imagePath);
      if (processedImagePath !== imagePath) {
        await fs.unlink(processedImagePath);
      }
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up temporary image file:', cleanupError);
    }

    if (!text || !text.trim()) {
      return res.status(500).json({ 
        error: 'No text could be extracted from the image. The image may be unclear or contain no text.' 
      });
    }

    console.log(`✅ OCR successful (${text.length} characters extracted, confidence: ${avgConfidence ? avgConfidence.toFixed(1) : 'N/A'}%)`);
    
    res.json({ 
      text: text.trim(),
      language: language,
      confidence: avgConfidence,
      words: words.map(w => ({
        text: w.text,
        confidence: w.confidence
      }))
    });

  } catch (error) {
    console.error('Error performing OCR:', error);

    // Clean up on error
    try {
      await fs.unlink(imagePath).catch(() => {});
      if (processedImagePath !== imagePath) {
        await fs.unlink(processedImagePath).catch(() => {});
      }
    } catch {}

    res.status(500).json({ 
      error: error.message || 'Failed to extract text from image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Speech-to-text transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      error: 'No audio file provided. Please upload an audio file.' 
    });
  }

  const audioFilePath = req.file.path;
  const language = req.body.language || 'es'; // Default to Spanish

  try {
    // Check if Whisper is available
    const whisperPath = path.join(WHISPER_VENV_PATH, 'bin', 'whisper');
    
    // Check if whisper executable exists
    try {
      await fs.access(whisperPath);
    } catch {
      // Try system-wide whisper if venv doesn't have it
      const systemWhisper = 'whisper';
      try {
        await execAsync(`which ${systemWhisper}`);
        // Use system whisper
        const whisperCmd = systemWhisper;
      } catch {
        return res.status(500).json({ 
          error: 'Whisper is not installed. Please install Whisper first.',
          hint: 'See INSTALL_WHISPER.md for installation instructions'
        });
      }
    }

    // Determine which whisper to use
    let whisperCmd;
    try {
      await fs.access(whisperPath);
      whisperCmd = whisperPath;
    } catch {
      whisperCmd = 'whisper'; // Fallback to system-wide
    }

    // Create output directory for transcription
    const outputDir = path.join(os.tmpdir(), `whisper_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    // Run Whisper transcription
    // --language es: Spanish
    // --model base: Use base model (good balance for limited RAM)
    // --output_dir: Where to save output
    // --output_format txt: Get plain text
    // --fp16 False: Disable FP16 (better compatibility)
    const whisperCommand = `${whisperCmd} "${audioFilePath}" --language ${language} --model ${WHISPER_MODEL} --output_dir "${outputDir}" --output_format txt --fp16 False`;

    console.log(`🎤 Transcribing audio with Whisper (model: ${WHISPER_MODEL}, language: ${language})...`);
    
    const { stdout, stderr } = await execAsync(whisperCommand, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 300000, // 5 minute timeout
    });

    // Read the transcribed text file
    const baseName = path.basename(audioFilePath, path.extname(audioFilePath));
    const txtFilePath = path.join(outputDir, `${baseName}.txt`);

    let transcribedText = '';
    try {
      transcribedText = await fs.readFile(txtFilePath, 'utf-8');
      transcribedText = transcribedText.trim();
    } catch (readError) {
      console.error('Error reading transcription file:', readError);
      // Try to find any .txt file in output directory
      const files = await fs.readdir(outputDir);
      const txtFile = files.find(f => f.endsWith('.txt'));
      if (txtFile) {
        transcribedText = await fs.readFile(path.join(outputDir, txtFile), 'utf-8');
        transcribedText = transcribedText.trim();
      } else {
        throw new Error('Transcription file not found. Whisper may have failed.');
      }
    }

    // Clean up temporary files
    try {
      await fs.unlink(audioFilePath);
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up temporary files:', cleanupError);
    }

    if (!transcribedText) {
      return res.status(500).json({ 
        error: 'Transcription returned empty result. The audio may be too short or unclear.' 
      });
    }

    console.log(`✅ Transcription successful (${transcribedText.length} characters)`);
    
    res.json({ 
      text: transcribedText,
      language: language,
      model: WHISPER_MODEL
    });

  } catch (error) {
    console.error('Error transcribing audio:', error);

    // Clean up on error
    try {
      await fs.unlink(audioFilePath).catch(() => {});
    } catch {}

    // Provide helpful error messages
    if (error.code === 'ENOENT') {
      return res.status(500).json({ 
        error: 'Whisper executable not found. Please install Whisper.',
        hint: 'See INSTALL_WHISPER.md for installation instructions'
      });
    }

    if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
      return res.status(504).json({ 
        error: 'Transcription timed out. The audio file may be too long or the server is overloaded.' 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Failed to transcribe audio',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Recipe analysis endpoint
app.post('/api/analyze-recipe', async (req, res) => {
  const { rawText, mainProtein } = req.body;

  if (!rawText || !mainProtein) {
    return res.status(400).json({ 
      error: 'Missing required fields: rawText and mainProtein are required' 
    });
  }

  const systemPrompt = `You are a recipe analysis assistant. Your task is to extract structured information from raw recipe text and return it as valid JSON.

The JSON schema you must return is:
{
  "ingredients": [
    {
      "name": "string (required)",
      "quantity": "number or string (optional)",
      "unit": "string (optional)",
      "notes": "string (optional)"
    }
  ],
  "steps": ["string (ordered list of cooking instructions)"],
  "gadgets": ["string (list of kitchen tools/equipment needed)"],
  "total_time_minutes": number or null (approximate total recipe time),
  "oven_time_minutes": number or null (approximate oven time if relevant, otherwise null)
}

Rules:
- Extract all ingredients with their quantities and units if mentioned
- Break down the recipe into clear, ordered steps
- List all kitchen tools/gadgets needed (e.g., "oven", "pan", "blender", "knife")
- Estimate total_time_minutes as the approximate time for the entire recipe
- Only set oven_time_minutes if the recipe uses an oven; otherwise set to null
- Return ONLY valid JSON, no additional text or markdown formatting
- If information is missing, use reasonable defaults (empty arrays, null for times)`;

  const userPrompt = `Analyze this recipe for ${mainProtein}:

${rawText}

Extract the ingredients, steps, gadgets, and time estimates. Return the result as JSON matching the schema above.`;

  try {
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for LLM

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        format: 'json',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.message || !data.message.content) {
      throw new Error('Invalid response from Ollama: missing message content');
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(data.message.content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks if present
      const content = data.message.content.trim();
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from Ollama response');
      }
    }

    // Validate and normalize the response
    const result = {
      ingredients: Array.isArray(parsed.ingredients) 
        ? parsed.ingredients.map((ing) => ({
            name: ing.name || String(ing),
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          }))
        : [],
      steps: Array.isArray(parsed.steps) 
        ? parsed.steps.map((s) => String(s))
        : [],
      gadgets: Array.isArray(parsed.gadgets) 
        ? parsed.gadgets.map((g) => String(g))
        : [],
      total_time_minutes: typeof parsed.total_time_minutes === 'number' 
        ? parsed.total_time_minutes 
        : null,
      oven_time_minutes: typeof parsed.oven_time_minutes === 'number' 
        ? parsed.oven_time_minutes 
        : null,
    };

    res.json(result);
  } catch (error) {
    console.error('Error analyzing recipe:', error);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ 
        error: 'Request timed out. The Ollama server may be slow or unreachable.' 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Failed to analyze recipe',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend API server running on port ${PORT}`);
  console.log(`📡 Ollama URL: ${OLLAMA_BASE_URL}`);
  console.log(`🤖 Model: ${OLLAMA_MODEL}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

