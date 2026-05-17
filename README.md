
# Image Flow — Minimal Demo

A concise demo for the assignment: prompt → image generation, a gallery of past generations, and a tweak flow that re-runs a past prompt. Below are quick-start steps, the API shape, the data model, and the submission checklist.

## Quick start

1. Create `.env.local` (optional):

- `HUGGINGFACE_API_KEY` — optional (if omitted, the app uses a mocked image)
- `SUPABASE_URL` and `SUPABASE_KEY` — optional (recommended for persistence)

2. Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## What this demo includes

- Prompt form that calls `POST /api/generate`.
- A gallery fetched from `GET /api/generations` showing prompt, settings, image, and status.
- Tweak flow: load a past generation into the form and re-run it (saved as a new generation).
- Simple text-overlay preview on gallery cards (view-only edit).

## API + async behavior

- POST `/api/generate`: accepts `{ prompt, settings }`. Server creates a `generations` record with `status: pending`, calls the model (Hugging Face or mock), then updates the record to `succeeded` or `failed` with `image_url` or `error`.
- GET `/api/generations`: returns all generations ordered newest first.

The frontend shows loading and error states while the generation runs. For production you could convert this to an asynchronous job queue and poll or use websockets for progress updates.

## Data model (recommended)

Table: `generations`
- `id` UUID, `prompt` TEXT, `settings` JSON, `image_url` TEXT, `status` TEXT, `error` TEXT NULL, `created_at` TIMESTAMP

## Mocking model calls

If `HUGGINGFACE_API_KEY` is not set the API returns a placeholder image. Switching to a real provider is isolated to the model client (e.g., `lib/huggingface.ts`).

## Submission checklist

- Repo or folder link
- Short Loom (1–3 minutes) showing: generate → gallery → tweak (note mock if used)
- This `README.md` with setup and decisions

---

