# Deploy the web app to Cloudflare Pages

The app has **one codebase**: the Expo project in this repo (`src/`). The Lovable-style UI (hero, search, My Fridge, Recommend Me, Recipe Book, Add Recipe with OCR/dictation/Ollama, Recent Recipes) lives in `src/screens/HomeScreen.tsx` and related screens.

To deploy the **web** version to Cloudflare Pages:

1. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → your project → **Settings** → **Builds & deployments** → **Build configuration**:
   - **Root directory**: *(leave empty – repo root)*
   - **Build command**: `npm run pages:build` or `npm run build:web`
   - **Build output directory**: `dist` (Expo exports to `dist/` by default for web)

2. Set **Environment variables** (enable “Available during build”):
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_API_BASE_URL` (e.g. `https://api.tuponesyocomo.uk`)

3. Save and run **Retry deployment**.

The same URL will serve the Expo web build: the Lovable-style app from `src/` with Supabase, OCR, dictation, and Ollama.
