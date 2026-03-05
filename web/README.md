# TuPonesYoComo – Web App (Lovable design)

Same UI as [fridge-to-fork-26](https://fridge-to-fork-26.lovable.app/), with **Supabase** for recipes and the **TuPonesYoComo backend** for:

- **OCR** – extract recipe text from images (Add Recipe → 📷)
- **Dictation** – record voice → transcription (Add Recipe → 🎤)
- **Ollama** – “Suggest with AI” from fridge ingredients; “Parse with AI” for recipe text

## Setup

1. **Copy env and set credentials**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same as the main Expo app). Set `VITE_API_URL` to your backend URL (e.g. `http://localhost:3000` in dev).

2. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:8080

3. **Backend**
   Run the main project’s backend (OCR, transcribe, Ollama) so the web app can call it. See repo root `backend/` and `README.md`.

## Build

```bash
npm run build
npm run preview
```

## Tech

- Vite + React + TypeScript
- Tailwind CSS + shadcn (Radix)
- Supabase (recipes, same schema as Expo app)
- Backend: OCR (Tesseract), Whisper (dictation), Ollama (suggest + analyze)
