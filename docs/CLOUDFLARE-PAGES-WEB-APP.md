# Deploy the web app to Cloudflare Pages

The app is a **Vite + React** SPA (no Expo). It uses your existing backend at `https://api.tuponesyocomo.uk` for OCR, Dictate, and Ollama, and Supabase for recipes.

---

## 1. Cloudflare Pages setup

### Create or use a Pages project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select your repo (e.g. **AlbertoftheRivers/TuPonesYoComo**).
3. Configure the build:

| Setting | Value |
|--------|--------|
| **Production branch** | `main` (or your default branch) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | *(leave empty – repo root)* |

4. Click **Save and Deploy**.

### Environment variables (required at build time)

In **Settings** → **Builds & deployments** → **Environment variables**, add:

| Variable | Value | Notes |
|----------|--------|--------|
| `VITE_SUPABASE_URL` | `https://peaekzpuogufcktugjrd.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | *(your anon key)* | From Supabase → Project Settings → API |
| `VITE_API_BASE_URL` | `https://api.tuponesyocomo.uk` | Backend API (no trailing slash) |

- Set them for **Production** (and **Preview** if you use branch previews).
- Enable **“Encrypt”** if you want.
- **Important:** Vite only injects `VITE_*` variables at **build time**. After adding or changing them, run **Retry deployment** for the current branch.

### Custom domain

1. In the Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter your domain (e.g. `tuponesyocomo.uk` or `www.tuponesyocomo.uk`).
3. Follow Cloudflare’s instructions to add the CNAME record (usually already set if the domain is on Cloudflare).

### SPA routing (404 → index.html)

The repo includes `public/_redirects` so that all routes are served by `index.html` (React Router). Cloudflare Pages reads this from the **build output** (`dist`). The file is:

```
/*    /index.html   200
```

So no extra Cloudflare config is needed for client-side routes.

---

## 2. Backend (API) – what you need

The web app calls:

- `https://api.tuponesyocomo.uk/api/ocr` (image → text)
- `https://api.tuponesyocomo.uk/api/transcribe` (audio → text)
- `https://api.tuponesyocomo.uk/api/analyze-recipe` (Ollama)
- `https://api.tuponesyocomo.uk/api/suggest-recipe-from-ingredients`
- `https://api.tuponesyocomo.uk/api/suggest-recipe-from-description`

### You don’t need to change the backend code

- **CORS:** The backend uses `app.use(cors())` with no origin restriction, so the browser can call it from your Cloudflare Pages domain.
- **Endpoints:** Same as before; the web app uses the same API.

### What you do need

1. **Backend running and reachable**  
   Same as now: backend running on your Proxmox server, with `api.tuponesyocomo.uk` pointing to it (reverse proxy, e.g. Nginx/Caddy).

2. **Env on the server**  
   Backend still needs:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (optional, for RAG)
   - `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, etc.
   - No new env vars for “web app”; the app only needs to know `VITE_API_BASE_URL` in Cloudflare.

3. **Deploy backend as you do today**  
   Keep using your existing flow (e.g. GitHub Action + `scripts/deploy-on-server.sh`). No change required for the new frontend.

### Optional: restrict CORS to your domain

If you want to allow only your Cloudflare domain:

```javascript
const allowedOrigins = [
  'https://tuponesyocomo.uk',
  'https://www.tuponesyocomo.uk',
  'http://localhost:8080'
];
app.use(cors({ origin: allowedOrigins }));
```

If you don’t add this, the current `cors()` (allow all) is enough for the web app to work.

---

## 3. Checklist

**Cloudflare Pages**

- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] Env vars set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`
- [ ] Retry deployment after changing env vars
- [ ] Custom domain added and DNS correct

**Backend**

- [ ] API reachable at `https://api.tuponesyocomo.uk` (e.g. `curl https://api.tuponesyocomo.uk/health`)
- [ ] Deploy process unchanged (e.g. push to `main` → auto-deploy to Proxmox)

**Test**

- [ ] Open your Pages URL (or custom domain).
- [ ] Search, Recent Recipes, Recipe Book load (Supabase).
- [ ] Add Recipe → Scan / Dictate / Analyze with AI (backend + Ollama).
- [ ] My Fridge → add ingredients → matching recipes (Supabase).
