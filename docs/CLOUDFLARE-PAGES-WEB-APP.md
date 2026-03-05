# Deploy the **web app** (Lovable UI) to Cloudflare Pages

The site **https://2b193b65.tuponesyocomo.pages.dev/** is currently serving the **Expo web** build (React Native for web). To serve the **new** app (the Lovable-style UI in the `web/` folder with Supabase, OCR, dictation, Ollama), change your Cloudflare Pages build settings as below.

## Option 1: Use `web/` as the project root (recommended)

In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → your project → **Settings** → **Builds & deployments** → **Build configuration**:

| Setting | Value |
|--------|--------|
| **Root directory** | `web` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

Then set **Environment variables** (same page or **Settings** → **Environment variables**), and enable **Available during build** for:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_API_URL` | Backend API URL (e.g. `https://api.tuponesyocomo.uk`) |

Save and trigger a **Retry deployment** (or push a new commit). The next deployment will build the **web/** Vite app and the preview/production URL will show the new version.

## Option 2: Keep repo root and build from root

If you prefer not to set Root directory to `web`:

| Setting | Value |
|--------|--------|
| **Root directory** | *(leave empty – repo root)* |
| **Build command** | `npm run pages:build:webapp` |
| **Build output directory** | `web/dist` |

Use the same environment variables as above. This uses the root-level script that runs `npm install` and `npm run build` inside `web/`.

---

After switching, the same URL (e.g. `https://2b193b65.tuponesyocomo.pages.dev/` or your custom domain) will serve the **new** web app: hero, search, My Fridge, Recommend Me, Recipe Book, Add Recipe (with OCR, dictation, AI), and Recent Recipes from Supabase.
