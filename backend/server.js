/**
 * Backend API Server for TuPonesYoComo
 * Proxies requests to Ollama LLM server
 * 
 * This server runs in a container with VPN access to Ollama
 */

const express = require('express');
const cors = require('cors');
// Node.js 18+ has built-in fetch, no need for node-fetch

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://192.168.200.45:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ollama_url: OLLAMA_BASE_URL, model: OLLAMA_MODEL });
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

