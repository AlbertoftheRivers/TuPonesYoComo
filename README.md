# TuPonesYoComo

A personal mobile app for managing recipes with AI-powered recipe parsing. Built with Expo, React Native, TypeScript, Supabase, and Ollama.

## Features

- **Recipe Management**: Create, read, update, and delete recipes
- **Multiple Input Methods**: Add recipes using plain text, voice dictation (Whisper), or OCR image scanning (Tesseract.js)
- **AI-Powered Parsing**: Automatically extract structured data (ingredients, steps, gadgets, timing) from free-form recipe text using Ollama LLM
- **Protein Categories**: Organize recipes by main protein type with custom category support
- **Multi-Cuisine Support**: Assign multiple cuisines to each recipe with flag indicators
- **Adjustable Servings**: Change serving sizes and automatically recalculate ingredient quantities
- **Search Functionality**: Search recipes by name, cuisine, or ingredients within categories
- **Push Notifications**: Receive notifications when new recipes are added
- **User Guide**: Built-in help guide accessible from the home screen
- **Simple UI**: Clean, intuitive interface optimized for mobile use with bourbon and egg yolk color scheme

## Architecture

```
Mobile App (Phone) → Cloudflare Tunnel → Backend API (Proxmox Container) → Ollama Server (192.168.200.45:11434)
                    ↓                                                      ↓
                 Supabase (PostgreSQL)                              Whisper (Speech-to-Text)
                                                                     Tesseract.js (OCR)
```

- **Mobile App**: React Native app running on your phone (no VPN needed)
- **Cloudflare Tunnel**: Secure tunnel exposing backend API publicly via `https://api.tuponesyocomo.uk`
- **Backend API**: Node.js/Express server running in Proxmox container (has VPN access to Ollama)
- **Ollama Server**: LLM server accessible via VPN at `192.168.200.45:11434` for recipe analysis
- **Whisper**: Speech-to-text model for voice dictation
- **Tesseract.js**: OCR engine for extracting text from recipe images
- **Supabase**: Cloud database for recipe storage (public access, no authentication)

## Tech Stack

- **Frontend**: Expo + React Native + TypeScript
- **Backend API**: Node.js + Express (runs in Proxmox container)
- **Database**: Supabase (PostgreSQL)
- **AI/ML Services**:
  - **Ollama**: Self-hosted LLM server for recipe analysis (accessed via VPN)
  - **Whisper**: Speech-to-text for voice dictation
  - **Tesseract.js**: OCR for image text extraction
- **Infrastructure**: Cloudflare Tunnel for public API access

## Web App (Lovable UI)

A standalone web app in `web/` replicates the [Lovable Fridge-to-Fork](https://fridge-to-fork-26.lovable.app/) design and uses the same backend and Supabase. See `web/README.md` for setup and `npm run dev` in `web/`.

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
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
```

**Important**: 
- `EXPO_PUBLIC_API_BASE_URL` defaults to `https://api.tuponesyocomo.uk` (Cloudflare Tunnel)
- For local development, you can override with `http://localhost:3000` or your local IP
- Expo requires the `EXPO_PUBLIC_` prefix for environment variables to be accessible in the app
- The `.env` file is gitignored - never commit it to version control

### 5. Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Display a QR code in your terminal
- Open the Expo DevTools in your browser

### 6. Run on Your Device

**Option A: Expo Go (Development)**
1. Install Expo Go app on your mobile device
2. Scan the QR code displayed in the terminal or browser
3. The app will load on your device

**Option B: Standalone APK (Production)**
1. Build APK using EAS Build:
   ```bash
   npm install -g eas-cli
   eas login
   eas build --profile preview --platform android
   ```
2. Download and install the APK on your Android device
3. The app will work independently without Expo Go

## Project Structure

```
.
├── App.tsx                 # Main app entry point with navigation and notifications
├── app.json                # Expo configuration
├── assets/
│   └── icon.png           # App icon (1024x1024px)
├── backend/
│   ├── server.js          # Backend API server (Node.js/Express)
│   ├── docker-compose.yml # Docker configuration
│   └── Dockerfile         # Docker image definition
├── src/
│   ├── api/
│   │   └── recipes.ts      # Supabase API functions (CRUD operations)
│   ├── lib/
│   │   ├── constants.ts    # Design constants (colors, spacing, proteins, cuisines)
│   │   ├── ollama.ts       # Ollama LLM integration for recipe analysis
│   │   ├── transcribe.ts   # Whisper integration for voice dictation
│   │   ├── ocr.ts          # Tesseract.js integration for OCR
│   │   ├── supabase.ts     # Supabase client initialization
│   │   ├── notifications.ts # Push notifications service
│   │   ├── customCategories.ts # Custom categories and cuisines storage
│   │   └── emojiMapper.ts  # Emoji suggestions for categories
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Main screen with protein categories grid
│   │   ├── RecipeListScreen.tsx     # List of recipes by protein with search
│   │   ├── RecipeDetailScreen.tsx   # Recipe details view with servings adjustment
│   │   ├── AddRecipeScreen.tsx       # Add new recipe (text/dictation/OCR)
│   │   ├── EditRecipeScreen.tsx      # Edit existing recipe
│   │   └── UserGuideScreen.tsx       # User guide and help
│   └── types/
│       └── recipe.ts       # TypeScript type definitions
├── supabase-migration.sql  # SQL to create the recipes table
└── package.json
```

## Usage

### Adding a Recipe

You can add recipes using three different methods:

**Method 1: Plain Text**
1. Tap the "➕ Añadir Receta" button on the home screen
2. Enter a title, select the main protein category, and set number of servings
3. Select cuisines (optional, multiple allowed)
4. Paste or type your recipe in free-form text
5. Tap "Analizar con IA" to extract structured data
6. Review the analysis preview
7. Tap "Guardar Receta" to store it in Supabase

**Method 2: Voice Dictation 🎤**
1. Follow steps 1-3 above
2. Tap the microphone button 🎤 in the recipe text field
3. Speak your recipe clearly
4. The audio will be transcribed automatically using Whisper
5. Continue with steps 5-7 above

**Method 3: OCR Image Scanning 📷**
1. Follow steps 1-3 above
2. Tap the camera button 📷 in the recipe text field
3. Take a photo or select an image from your gallery
4. Select the language of the recipe (default: Spanish)
5. The text will be extracted automatically using Tesseract.js
6. Continue with steps 5-7 above

### Browsing Recipes

1. Tap a protein category on the home screen
2. View the list of recipes for that category (sorted alphabetically)
3. Use the search bar to filter by name, cuisine, or ingredients
4. Tap a recipe to see full details
5. Each recipe card shows: name, total time, and cuisine flags

### Editing a Recipe

1. Open a recipe's detail screen
2. Tap "Editar"
3. Modify any fields (title, ingredients, steps, servings, etc.)
4. When changing servings, ingredient quantities are automatically recalculated
5. Optionally tap "Re-analizar con IA" to re-analyze the raw text
6. Tap "Guardar Cambios"

### Deleting a Recipe

1. Open a recipe's detail screen
2. Tap "Eliminar"
3. Confirm the deletion

### User Guide

1. Tap the ❓ button in the top-right corner of the home screen
2. View comprehensive instructions on how to use all features
3. Learn about adding recipes, editing, categories, and more

## Database Schema

The `recipes` table has the following structure:

- `id` (BIGSERIAL): Primary key
- `title` (TEXT): Recipe title
- `main_protein` (TEXT): Main protein category (chicken, fish, pork, seafood, beef, vegetables, beans_legumes, other, or custom)
- `cuisines` (JSONB): Array of cuisine strings (e.g., ["Española", "Italiana"])
- `raw_text` (TEXT): Original free-form recipe text
- `ingredients` (JSONB): Array of ingredient objects with `{name, quantity, unit, notes}`
- `steps` (JSONB): Array of step instructions (strings)
- `gadgets` (JSONB): Array of kitchen tools/equipment (strings)
- `total_time_minutes` (INTEGER): Approximate total recipe time
- `oven_time_minutes` (INTEGER): Approximate oven time (null if not applicable)
- `servings` (INTEGER): Default number of servings (default: 2)
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Indexes:**
- `idx_recipes_main_protein` on `main_protein` for faster filtering
- `idx_recipes_title` on `title` for faster sorting

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
- Verify RLS (Row Level Security) is disabled for anonymous access

### Backend API Connection Issues

- Verify the backend API is running: `curl https://api.tuponesyocomo.uk/health`
- Check Cloudflare Tunnel status on the server
- Ensure the backend service is running in the Proxmox container
- Check backend logs: `docker-compose logs` in the `backend/` directory

### Ollama Connection Issues

- The backend API connects to Ollama via VPN - verify VPN connectivity
- Check that Ollama is running at `192.168.200.45:11434`
- Verify the model name matches a model installed on your Ollama server
- Test the Ollama API from the backend container

### Voice Dictation Issues

- Ensure microphone permissions are granted
- Check that Whisper is installed in the backend container
- Verify the backend API `/api/transcribe` endpoint is accessible
- Check backend logs for Whisper errors

### OCR Issues

- Ensure camera/gallery permissions are granted
- Verify Tesseract.js is installed in the backend container
- Check that the OCR language matches the recipe language
- Verify the backend API `/api/ocr` endpoint is accessible

### AI Analysis Errors

- If JSON parsing fails, the app will show an error message
- Try re-running the analysis with clearer recipe text
- Check the Ollama server logs for errors
- Ensure the model supports JSON format output
- Verify the backend API `/api/analyze-recipe` endpoint is working

### Notification Issues

- Ensure notification permissions are granted on first launch
- Check that `expo-notifications` is installed: `npm install`
- Verify notification permissions in device settings
- On Android, check notification channel settings

## Development

### TypeScript

The project uses strict TypeScript. All types are defined in `src/types/recipe.ts`.

### Navigation

Navigation is handled by React Navigation with a native stack navigator. The navigation structure is:

```
Home → RecipeList → RecipeDetail
Home → AddRecipe → RecipeDetail
Home → UserGuide
RecipeDetail → EditRecipe
```

### Styling

Design constants (colors, spacing, border radius) are centralized in `src/lib/constants.ts` for easy theming. The app uses a bourbon (#D2691E) and egg yolk yellow color scheme.

### Building for Production

**Android APK:**
```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

**iOS (requires Apple Developer account):**
```bash
eas build --profile preview --platform ios
```

### Updating the App

**Frontend changes** (UI, screens, features):
- Require creating a new APK
- Users need to install the updated APK

**Backend changes** (API, server logic):
- Only require updating the server
- No new APK needed
- Changes are immediately available to all users

### Deployment

**Backend API:**
- Deployed in Proxmox container
- Accessible via Cloudflare Tunnel at `https://api.tuponesyocomo.uk`
- Update process: see **[SSH and one-command deploy](docs/SSH-AND-DEPLOY.md)** — use SSH from Windows (no PuTTY) and run `.\scripts\deploy-remote.ps1` to pull and restart automatically.

**Mobile App:**
- Built with EAS Build
- Distributed as APK (Android) or IPA (iOS)
- Users install directly (no app store required)

## Additional Features

### Custom Categories
- Add custom protein categories beyond the default set
- Emoji suggestions are automatically provided
- Categories are stored locally and synced across the app

### Multi-Cuisine Support
- Assign multiple cuisines to each recipe
- Cuisines are displayed as flag emojis
- Add custom cuisines with custom flags

### Adjustable Servings
- Set default servings when creating a recipe
- Adjust servings when viewing a recipe
- Ingredient quantities are automatically recalculated

### Search Functionality
- Search recipes by name within a category
- Filter by cuisine
- Search by ingredients (e.g., "chicken recipes with carrots")

### Push Notifications
- Receive notifications when new recipes are added
- Notifications work in foreground and background
- Configured for both Android and iOS

## License

Personal use only.



A personal mobile app for managing recipes with AI-powered recipe parsing. Built with Expo, React Native, TypeScript, Supabase, and Ollama.

## Features

- **Recipe Management**: Create, read, update, and delete recipes
- **Multiple Input Methods**: Add recipes using plain text, voice dictation (Whisper), or OCR image scanning (Tesseract.js)
- **AI-Powered Parsing**: Automatically extract structured data (ingredients, steps, gadgets, timing) from free-form recipe text using Ollama LLM
- **Protein Categories**: Organize recipes by main protein type with custom category support
- **Multi-Cuisine Support**: Assign multiple cuisines to each recipe with flag indicators
- **Adjustable Servings**: Change serving sizes and automatically recalculate ingredient quantities
- **Search Functionality**: Search recipes by name, cuisine, or ingredients within categories
- **Push Notifications**: Receive notifications when new recipes are added
- **User Guide**: Built-in help guide accessible from the home screen
- **Simple UI**: Clean, intuitive interface optimized for mobile use with bourbon and egg yolk color scheme

## Architecture

```
Mobile App (Phone) → Cloudflare Tunnel → Backend API (Proxmox Container) → Ollama Server (192.168.200.45:11434)
                    ↓                                                      ↓
                 Supabase (PostgreSQL)                              Whisper (Speech-to-Text)
                                                                     Tesseract.js (OCR)
```

- **Mobile App**: React Native app running on your phone (no VPN needed)
- **Cloudflare Tunnel**: Secure tunnel exposing backend API publicly via `https://api.tuponesyocomo.uk`
- **Backend API**: Node.js/Express server running in Proxmox container (has VPN access to Ollama)
- **Ollama Server**: LLM server accessible via VPN at `192.168.200.45:11434` for recipe analysis
- **Whisper**: Speech-to-text model for voice dictation
- **Tesseract.js**: OCR engine for extracting text from recipe images
- **Supabase**: Cloud database for recipe storage (public access, no authentication)

## Tech Stack

- **Frontend**: Expo + React Native + TypeScript
- **Backend API**: Node.js + Express (runs in Proxmox container)
- **Database**: Supabase (PostgreSQL)
- **AI/ML Services**:
  - **Ollama**: Self-hosted LLM server for recipe analysis (accessed via VPN)
  - **Whisper**: Speech-to-text for voice dictation
  - **Tesseract.js**: OCR for image text extraction
- **Infrastructure**: Cloudflare Tunnel for public API access

## Web App (Lovable UI)

A standalone web app in `web/` replicates the [Lovable Fridge-to-Fork](https://fridge-to-fork-26.lovable.app/) design and uses the same backend and Supabase. See `web/README.md` for setup and `npm run dev` in `web/`.

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
EXPO_PUBLIC_API_BASE_URL=https://api.tuponesyocomo.uk
```

**Important**: 
- `EXPO_PUBLIC_API_BASE_URL` defaults to `https://api.tuponesyocomo.uk` (Cloudflare Tunnel)
- For local development, you can override with `http://localhost:3000` or your local IP
- Expo requires the `EXPO_PUBLIC_` prefix for environment variables to be accessible in the app
- The `.env` file is gitignored - never commit it to version control

### 5. Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Display a QR code in your terminal
- Open the Expo DevTools in your browser

### 6. Run on Your Device

**Option A: Expo Go (Development)**
1. Install Expo Go app on your mobile device
2. Scan the QR code displayed in the terminal or browser
3. The app will load on your device

**Option B: Standalone APK (Production)**
1. Build APK using EAS Build:
   ```bash
   npm install -g eas-cli
   eas login
   eas build --profile preview --platform android
   ```
2. Download and install the APK on your Android device
3. The app will work independently without Expo Go

## Project Structure

```
.
├── App.tsx                 # Main app entry point with navigation and notifications
├── app.json                # Expo configuration
├── assets/
│   └── icon.png           # App icon (1024x1024px)
├── backend/
│   ├── server.js          # Backend API server (Node.js/Express)
│   ├── docker-compose.yml # Docker configuration
│   └── Dockerfile         # Docker image definition
├── src/
│   ├── api/
│   │   └── recipes.ts      # Supabase API functions (CRUD operations)
│   ├── lib/
│   │   ├── constants.ts    # Design constants (colors, spacing, proteins, cuisines)
│   │   ├── ollama.ts       # Ollama LLM integration for recipe analysis
│   │   ├── transcribe.ts   # Whisper integration for voice dictation
│   │   ├── ocr.ts          # Tesseract.js integration for OCR
│   │   ├── supabase.ts     # Supabase client initialization
│   │   ├── notifications.ts # Push notifications service
│   │   ├── customCategories.ts # Custom categories and cuisines storage
│   │   └── emojiMapper.ts  # Emoji suggestions for categories
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Main screen with protein categories grid
│   │   ├── RecipeListScreen.tsx     # List of recipes by protein with search
│   │   ├── RecipeDetailScreen.tsx   # Recipe details view with servings adjustment
│   │   ├── AddRecipeScreen.tsx       # Add new recipe (text/dictation/OCR)
│   │   ├── EditRecipeScreen.tsx      # Edit existing recipe
│   │   └── UserGuideScreen.tsx       # User guide and help
│   └── types/
│       └── recipe.ts       # TypeScript type definitions
├── supabase-migration.sql  # SQL to create the recipes table
└── package.json
```

## Usage

### Adding a Recipe

You can add recipes using three different methods:

**Method 1: Plain Text**
1. Tap the "➕ Añadir Receta" button on the home screen
2. Enter a title, select the main protein category, and set number of servings
3. Select cuisines (optional, multiple allowed)
4. Paste or type your recipe in free-form text
5. Tap "Analizar con IA" to extract structured data
6. Review the analysis preview
7. Tap "Guardar Receta" to store it in Supabase

**Method 2: Voice Dictation 🎤**
1. Follow steps 1-3 above
2. Tap the microphone button 🎤 in the recipe text field
3. Speak your recipe clearly
4. The audio will be transcribed automatically using Whisper
5. Continue with steps 5-7 above

**Method 3: OCR Image Scanning 📷**
1. Follow steps 1-3 above
2. Tap the camera button 📷 in the recipe text field
3. Take a photo or select an image from your gallery
4. Select the language of the recipe (default: Spanish)
5. The text will be extracted automatically using Tesseract.js
6. Continue with steps 5-7 above

### Browsing Recipes

1. Tap a protein category on the home screen
2. View the list of recipes for that category (sorted alphabetically)
3. Use the search bar to filter by name, cuisine, or ingredients
4. Tap a recipe to see full details
5. Each recipe card shows: name, total time, and cuisine flags

### Editing a Recipe

1. Open a recipe's detail screen
2. Tap "Editar"
3. Modify any fields (title, ingredients, steps, servings, etc.)
4. When changing servings, ingredient quantities are automatically recalculated
5. Optionally tap "Re-analizar con IA" to re-analyze the raw text
6. Tap "Guardar Cambios"

### Deleting a Recipe

1. Open a recipe's detail screen
2. Tap "Eliminar"
3. Confirm the deletion

### User Guide

1. Tap the ❓ button in the top-right corner of the home screen
2. View comprehensive instructions on how to use all features
3. Learn about adding recipes, editing, categories, and more

## Database Schema

The `recipes` table has the following structure:

- `id` (BIGSERIAL): Primary key
- `title` (TEXT): Recipe title
- `main_protein` (TEXT): Main protein category (chicken, fish, pork, seafood, beef, vegetables, beans_legumes, other, or custom)
- `cuisines` (JSONB): Array of cuisine strings (e.g., ["Española", "Italiana"])
- `raw_text` (TEXT): Original free-form recipe text
- `ingredients` (JSONB): Array of ingredient objects with `{name, quantity, unit, notes}`
- `steps` (JSONB): Array of step instructions (strings)
- `gadgets` (JSONB): Array of kitchen tools/equipment (strings)
- `total_time_minutes` (INTEGER): Approximate total recipe time
- `oven_time_minutes` (INTEGER): Approximate oven time (null if not applicable)
- `servings` (INTEGER): Default number of servings (default: 2)
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Indexes:**
- `idx_recipes_main_protein` on `main_protein` for faster filtering
- `idx_recipes_title` on `title` for faster sorting

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
- Verify RLS (Row Level Security) is disabled for anonymous access

### Backend API Connection Issues

- Verify the backend API is running: `curl https://api.tuponesyocomo.uk/health`
- Check Cloudflare Tunnel status on the server
- Ensure the backend service is running in the Proxmox container
- Check backend logs: `docker-compose logs` in the `backend/` directory

### Ollama Connection Issues

- The backend API connects to Ollama via VPN - verify VPN connectivity
- Check that Ollama is running at `192.168.200.45:11434`
- Verify the model name matches a model installed on your Ollama server
- Test the Ollama API from the backend container

### Voice Dictation Issues

- Ensure microphone permissions are granted
- Check that Whisper is installed in the backend container
- Verify the backend API `/api/transcribe` endpoint is accessible
- Check backend logs for Whisper errors

### OCR Issues

- Ensure camera/gallery permissions are granted
- Verify Tesseract.js is installed in the backend container
- Check that the OCR language matches the recipe language
- Verify the backend API `/api/ocr` endpoint is accessible

### AI Analysis Errors

- If JSON parsing fails, the app will show an error message
- Try re-running the analysis with clearer recipe text
- Check the Ollama server logs for errors
- Ensure the model supports JSON format output
- Verify the backend API `/api/analyze-recipe` endpoint is working

### Notification Issues

- Ensure notification permissions are granted on first launch
- Check that `expo-notifications` is installed: `npm install`
- Verify notification permissions in device settings
- On Android, check notification channel settings

## Development

### TypeScript

The project uses strict TypeScript. All types are defined in `src/types/recipe.ts`.

### Navigation

Navigation is handled by React Navigation with a native stack navigator. The navigation structure is:

```
Home → RecipeList → RecipeDetail
Home → AddRecipe → RecipeDetail
Home → UserGuide
RecipeDetail → EditRecipe
```

### Styling

Design constants (colors, spacing, border radius) are centralized in `src/lib/constants.ts` for easy theming. The app uses a bourbon (#D2691E) and egg yolk yellow color scheme.

### Building for Production

**Android APK:**
```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

**iOS (requires Apple Developer account):**
```bash
eas build --profile preview --platform ios
```

### Updating the App

**Frontend changes** (UI, screens, features):
- Require creating a new APK
- Users need to install the updated APK

**Backend changes** (API, server logic):
- Only require updating the server
- No new APK needed
- Changes are immediately available to all users

### Deployment

**Backend API:**
- Deployed in Proxmox container
- Accessible via Cloudflare Tunnel at `https://api.tuponesyocomo.uk`
- Update process: see **[SSH and one-command deploy](docs/SSH-AND-DEPLOY.md)** — use SSH from Windows (no PuTTY) and run `.\scripts\deploy-remote.ps1` to pull and restart automatically.

**Mobile App:**
- Built with EAS Build
- Distributed as APK (Android) or IPA (iOS)
- Users install directly (no app store required)

## Additional Features

### Custom Categories
- Add custom protein categories beyond the default set
- Emoji suggestions are automatically provided
- Categories are stored locally and synced across the app

### Multi-Cuisine Support
- Assign multiple cuisines to each recipe
- Cuisines are displayed as flag emojis
- Add custom cuisines with custom flags

### Adjustable Servings
- Set default servings when creating a recipe
- Adjust servings when viewing a recipe
- Ingredient quantities are automatically recalculated

### Search Functionality
- Search recipes by name within a category
- Filter by cuisine
- Search by ingredients (e.g., "chicken recipes with carrots")

### Push Notifications
- Receive notifications when new recipes are added
- Notifications work in foreground and background
- Configured for both Android and iOS

## License

Personal use only.


