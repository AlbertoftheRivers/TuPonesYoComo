# TuPonesYoComo

A personal mobile web app for managing recipes with AI-powered recipe parsing. Built with Expo, React Native, TypeScript, Supabase, and Ollama.

## Features

- **Recipe Management**: Create, read, update, and delete recipes
- **Protein Categories**: Organize recipes by main protein type (chicken, fish, pork, seafood, beef, vegetables, beans & legumes, other)
- **AI-Powered Parsing**: Automatically extract structured data (ingredients, steps, gadgets, timing) from free-form recipe text using Ollama LLM
- **Simple UI**: Clean, intuitive interface optimized for mobile use

## Architecture

```
Mobile App (Phone) → Backend API (Container with VPN) → Ollama Server (192.168.200.45:11434)
                    ↓
                 Supabase (PostgreSQL)
```

- **Mobile App**: React Native app running on your phone (no VPN needed)
- **Backend API**: Node.js/Express server in Docker container (has VPN access to Ollama)
- **Ollama Server**: LLM server accessible via VPN at `192.168.200.45:11434`
- **Supabase**: Cloud database for recipe storage

## Tech Stack

- **Frontend**: Expo (Expo Go) + React Native + TypeScript
- **Backend API**: Node.js + Express (runs in Docker container)
- **Database**: Supabase (PostgreSQL)
- **AI**: Self-hosted Ollama LLM server (accessed via VPN)

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Docker and Docker Compose (for backend API)
- Expo Go app installed on your mobile device
- Supabase account and project
- Ollama server accessible via VPN at `192.168.200.45:11434`

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to your project's SQL Editor
3. Run the SQL from `supabase-migration.sql` to create the `recipes` table
4. Go to Project Settings > API
5. Copy your Project URL and anon/public key

### 3. Setup Backend API (Container)

The backend API runs in a Docker container and has VPN access to Ollama.

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create `.env` file:**
   ```env
   PORT=3000
   OLLAMA_BASE_URL=http://192.168.200.45:11434
   OLLAMA_MODEL=llama3.2:3b
   NODE_ENV=production
   ```

3. **Build and start the container:**
   ```bash
   docker-compose up -d
   ```

4. **Verify it's running:**
   ```bash
   curl http://localhost:3000/health
   ```

   You should see:
   ```json
   {"status":"ok","ollama_url":"http://192.168.200.45:11434","model":"llama3.2:3b"}
   ```

5. **Note the API URL** - you'll need this for the mobile app configuration:
   - If running locally: `http://localhost:3000` or `http://<your-computer-ip>:3000`
   - If deployed: `http://<container-host>:3000`

See `backend/README.md` for detailed deployment instructions.

### 4. Configure Mobile App Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_BASE_URL=http://your-backend-api-url:3000
```

**Important**: 
- `EXPO_PUBLIC_API_BASE_URL` should point to your backend API container
- If testing locally, use your computer's IP: `http://192.168.1.2:3000` (replace with your actual IP)
- If deployed, use the container's public URL
- Expo requires the `EXPO_PUBLIC_` prefix for environment variables to be accessible in the app

### 5. Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Display a QR code in your terminal
- Open the Expo DevTools in your browser

### 6. Run on Your Device

1. Open the Expo Go app on your mobile device
2. Scan the QR code displayed in the terminal or browser
3. The app will load on your device

## Project Structure

```
.
├── App.tsx                 # Main app entry point with navigation
├── src/
│   ├── api/
│   │   └── recipes.ts      # Supabase API functions
│   ├── lib/
│   │   ├── constants.ts    # Design constants (colors, spacing)
│   │   ├── ollama.ts       # Ollama LLM integration
│   │   └── supabase.ts     # Supabase client initialization
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Main screen with protein categories
│   │   ├── RecipeListScreen.tsx     # List of recipes by protein
│   │   ├── RecipeDetailScreen.tsx   # Recipe details view
│   │   ├── AddRecipeScreen.tsx       # Add new recipe with AI analysis
│   │   └── EditRecipeScreen.tsx      # Edit existing recipe
│   └── types/
│       └── recipe.ts       # TypeScript type definitions
├── supabase-migration.sql  # SQL to create the recipes table
└── package.json
```

## Usage

### Adding a Recipe

1. Tap the "Add recipe" button on the home screen
2. Enter a title and select the main protein type
3. Paste or type your recipe in free-form text
4. Tap "Analyze with AI" to extract structured data
5. Review the analysis preview
6. Tap "Save Recipe" to store it in Supabase

### Browsing Recipes

1. Tap a protein category on the home screen
2. View the list of recipes for that category
3. Tap a recipe to see full details

### Editing a Recipe

1. Open a recipe's detail screen
2. Tap "Edit"
3. Modify any fields
4. Optionally tap "Re-run AI on raw text" to re-analyze
5. Tap "Save Changes"

### Deleting a Recipe

1. Open a recipe's detail screen
2. Tap "Delete"
3. Confirm the deletion

## Database Schema

The `recipes` table has the following structure:

- `id` (BIGSERIAL): Primary key
- `title` (TEXT): Recipe title
- `main_protein` (TEXT): One of: chicken, fish, pork, seafood, beef, vegetables, beans_legumes, other
- `raw_text` (TEXT): Original free-form recipe text
- `ingredients` (JSONB): Array of ingredient objects with name, quantity, unit, notes
- `steps` (JSONB): Array of step instructions (strings)
- `gadgets` (JSONB): Array of kitchen tools/equipment (strings)
- `total_time_minutes` (INTEGER): Approximate total recipe time
- `oven_time_minutes` (INTEGER): Approximate oven time (null if not applicable)
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

## Security Notes

⚠️ **This app is designed for personal use only.**

- No authentication is implemented
- All data is accessible to anyone with the Supabase credentials
- RLS (Row Level Security) is disabled
- Do not use this for sensitive data or in production environments

## Troubleshooting

### Supabase Connection Issues

- Verify your `.env` file has the correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart the Expo server after changing environment variables
- Check that the Supabase table was created correctly using the migration SQL

### Ollama Connection Issues

- Ensure your Ollama server is running and accessible from your device's network
- Verify the IP address and port in `src/lib/ollama.ts`
- Check that the model name matches a model installed on your Ollama server
- Test the Ollama API directly: `curl http://192.168.200.45:11345/api/chat -d '{"model":"llama3.1","messages":[{"role":"user","content":"test"}]}'`

### AI Analysis Errors

- If JSON parsing fails, the app will show an error message
- Try re-running the analysis with clearer recipe text
- Check the Ollama server logs for errors
- Ensure the model supports JSON format output

## Development

### TypeScript

The project uses strict TypeScript. All types are defined in `src/types/recipe.ts`.

### Navigation

Navigation is handled by React Navigation with a native stack navigator. The navigation structure is:

```
Home → RecipeList → RecipeDetail
Home → AddRecipe → RecipeDetail
RecipeDetail → EditRecipe
```

### Styling

Design constants (colors, spacing, border radius) are centralized in `src/lib/constants.ts` for easy theming.

## License

Personal use only.


