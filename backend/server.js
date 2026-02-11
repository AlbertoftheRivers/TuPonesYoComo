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
const { createClient } = require('@supabase/supabase-js');

const execAsync = promisify(exec);

// Initialize Supabase client (optional - only if credentials are provided)
let supabase = null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service key for backend access

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✅ Supabase client initialized for RAG');
} else {
  console.log('⚠️  Supabase not configured - RAG will use example recipes only');
}

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

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}${req.query && Object.keys(req.query).length > 0 ? '?' + new URLSearchParams(req.query).toString() : ''}`);
  if (req.body && Object.keys(req.body).length > 0 && !req.path.includes('/api/ocr') && !req.path.includes('/api/transcribe')) {
    console.log(`[${timestamp}] Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

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

/**
 * Find similar recipes from database or examples
 * Uses RAG (Retrieval Augmented Generation) to improve prompts
 */
async function findSimilarRecipes(rawText, mainProtein, limit = 3) {
  const examples = [];
  
  // Load example recipes
  try {
    const exampleRecipesPath = path.join(__dirname, 'example-recipes.json');
    const exampleData = await fs.readFile(exampleRecipesPath, 'utf-8');
    const exampleRecipes = JSON.parse(exampleData);
    
    // Filter by main protein if possible
    const filtered = exampleRecipes.filter(r => {
      const text = (r.raw_text || '').toLowerCase();
      return text.includes(mainProtein.toLowerCase()) || mainProtein === 'vegetables';
    });
    
    examples.push(...filtered.slice(0, limit));
  } catch (error) {
    console.warn('Could not load example recipes:', error.message);
  }
  
  // Try to get similar recipes from Supabase if available
  if (supabase && mainProtein) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('raw_text, ingredients, steps, gadgets, total_time_minutes, servings')
        .eq('main_protein', mainProtein)
        .limit(limit)
        .order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) {
        // Convert Supabase recipes to example format
        const dbExamples = data.map(recipe => ({
          raw_text: recipe.raw_text,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          gadgets: recipe.gadgets,
          total_time_minutes: recipe.total_time_minutes,
          servings: recipe.servings
        }));
        
        // Combine with examples, prioritizing database recipes
        examples.unshift(...dbExamples.slice(0, limit));
        console.log(`📚 Found ${dbExamples.length} similar recipes from database`);
      }
    } catch (error) {
      console.warn('Error fetching similar recipes from Supabase:', error.message);
    }
  }
  
  return examples.slice(0, limit); // Return max limit examples
}

/**
 * Build enhanced prompt with RAG examples
 */
function buildEnhancedPrompt(rawText, mainProtein, examples) {
  let examplesText = '';
  
  if (examples.length > 0) {
    examplesText = '\n\nEXAMPLES OF SIMILAR RECIPES (use these as reference for format and structure):\n\n';
    
    examples.forEach((example, idx) => {
      examplesText += `Example ${idx + 1}:\n`;
      examplesText += `Raw text: ${(example.raw_text || '').substring(0, 200)}...\n`;
      examplesText += `Extracted JSON:\n${JSON.stringify({
        ingredients: example.ingredients || [],
        steps: example.steps || [],
        gadgets: example.gadgets || [],
        total_time_minutes: example.total_time_minutes || null,
        oven_time_minutes: example.oven_time_minutes || null
      }, null, 2)}\n\n`;
    });
  }
  
  return `Analyze this recipe for ${mainProtein}:

${rawText}
${examplesText}
Extract the ingredients, steps, gadgets, and time estimates. Return the result as JSON matching the schema above.`;
}

// Recipe analysis endpoint
app.post('/api/analyze-recipe', async (req, res) => {
  const { rawText, mainProtein } = req.body;

  if (!rawText || !mainProtein) {
    return res.status(400).json({ 
      error: 'Missing required fields: rawText and mainProtein are required' 
    });
  }

  // Find similar recipes for RAG
  const similarRecipes = await findSimilarRecipes(rawText, mainProtein, 3);
  console.log(`📚 Using ${similarRecipes.length} similar recipes for RAG enhancement`);

  const systemPrompt = `You are an expert recipe analysis assistant specialized in multilingual recipes (Spanish, Portuguese, Catalan, French). Your task is to extract structured information from raw recipe text and return it as valid JSON.

VOCABULARY AND TERMINOLOGY:
- Ingredients: Know common cooking ingredients in Spanish, Portuguese, Catalan, and French
- Techniques: saltear, hervir, asar, hornear, marinar, rehogar, sofreír, freír, cocer, guisar, etc.
- Utensils: sartén, olla, horno, batidora, cuchillo, tabla de cortar, espátula, colador, etc.
- Units: gramos, kilogramos, mililitros, litros, tazas, cucharadas, cucharaditas, unidades, etc.

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
- Extract ALL ingredients with their quantities and units if mentioned
- Break down the recipe into clear, ordered steps (each step should be a complete instruction)
- List ALL kitchen tools/gadgets needed (e.g., "horno", "sartén", "batidora", "cuchillo", "tabla de cortar")
- ALWAYS estimate total_time_minutes - it is REQUIRED and must be a number (never null)
- Estimate based on: preparation time (5-15 min), cooking time (from steps), and resting time if mentioned
- If no time is mentioned in the recipe, estimate based on the number of steps and complexity:
  * Simple recipes (1-3 steps): 15-30 minutes
  * Medium recipes (4-6 steps): 30-60 minutes
  * Complex recipes (7+ steps): 60-120 minutes
  * Recipes with oven: add 20-40 minutes for baking/roasting
- Only set oven_time_minutes if the recipe uses an oven; otherwise set to null
- Return ONLY valid JSON, no additional text or markdown formatting
- If information is missing, use reasonable defaults (empty arrays, but ALWAYS provide total_time_minutes as a number)
- Pay attention to cooking techniques and translate them correctly
- Recognize common ingredient names in multiple languages`;

  const userPrompt = buildEnhancedPrompt(rawText, mainProtein, similarRecipes);

  try {
    // Retry logic for Ollama (max 2 retries)
    let lastError = null;
    let response = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for LLM

        if (attempt > 0) {
          console.log(`Retrying Ollama request (attempt ${attempt + 1}/${maxRetries + 1})...`);
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
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
          // Try to get error details from Ollama
          let errorDetails = '';
          try {
            const errorData = await response.text();
            errorDetails = errorData ? ` - ${errorData.substring(0, 200)}` : '';
          } catch (e) {
            // Ignore if we can't read the error
          }
          
          // If it's a 500 error and we have retries left, retry
          if (response.status === 500 && attempt < maxRetries) {
            lastError = new Error(`Ollama API error: ${response.status} ${response.statusText}${errorDetails}`);
            console.warn(`Ollama returned 500 error, will retry. Attempt ${attempt + 1}/${maxRetries + 1}`);
            continue; // Retry
          }
          
          // Otherwise, throw the error
          console.error(`Ollama API error ${response.status} ${response.statusText}${errorDetails}`);
          throw new Error(`Ollama API error: ${response.status} ${response.statusText}${errorDetails}`);
        }
        
        // Success - break out of retry loop
        break;
      } catch (error) {
        lastError = error;
        
        // If it's an abort error or network error and we have retries left, retry
        if ((error.name === 'AbortError' || error.message.includes('fetch')) && attempt < maxRetries) {
          console.warn(`Request failed, will retry. Attempt ${attempt + 1}/${maxRetries + 1}`);
          continue; // Retry
        }
        
        // If we're on the last attempt or it's not a retryable error, throw
        if (attempt === maxRetries || !error.message.includes('500')) {
          throw error;
        }
      }
    }
    
    // If we exhausted retries, throw the last error
    if (!response || !response.ok) {
      throw lastError || new Error('Failed to get response from Ollama after retries');
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
    const steps = Array.isArray(parsed.steps) 
      ? parsed.steps.map((s) => String(s))
      : [];
    
    // Estimate time if not provided or invalid
    let estimatedTime = null;
    if (typeof parsed.total_time_minutes === 'number' && parsed.total_time_minutes > 0) {
      estimatedTime = parsed.total_time_minutes;
    } else {
      // Fallback estimation based on steps and complexity
      const stepCount = steps.length;
      if (stepCount <= 3) {
        estimatedTime = 25; // Simple recipe: ~25 minutes
      } else if (stepCount <= 6) {
        estimatedTime = 45; // Medium recipe: ~45 minutes
      } else {
        estimatedTime = 75; // Complex recipe: ~75 minutes
      }
      
      // Add time if oven is mentioned
      const hasOven = parsed.gadgets && Array.isArray(parsed.gadgets) && 
                     parsed.gadgets.some(g => String(g).toLowerCase().includes('oven'));
      if (hasOven) {
        estimatedTime += 30; // Add 30 minutes for oven cooking
      }
    }

    const result = {
      ingredients: Array.isArray(parsed.ingredients) 
        ? parsed.ingredients.map((ing) => ({
            name: ing.name || String(ing),
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          }))
        : [],
      steps: steps,
      gadgets: Array.isArray(parsed.gadgets) 
        ? parsed.gadgets.map((g) => String(g))
        : [],
      total_time_minutes: estimatedTime,
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

