# AI Media Studio — Minimal Generative Media Web App

A small, focused slice of a generative-media web studio: prompt → image generation, a gallery of past generations, and the ability to tweak a previous generation and re-run it. Built to demonstrate async handling, a simple data model, and a clean integration shape with model APIs (Hugging Face / Fal.ai).

## What this repo contains

- A minimal Next.js + TypeScript + Tailwind UI (suggested)
- API route shape for `POST /api/generate` and `GET /api/generations`
- Data model: `generations` table (UUID, prompt, settings, image_url, created_at)
- UX: prompt form, loading / error states, gallery, tweak flow (load previous prompt into form)
- A simple CSS text-overlay bonus for quick edits

## Features implemented (small slice)

- Generate from prompt: user enters a prompt and a model API is called to return an image URL (or a mocked image if no key).
- Gallery: lists all past generations with prompt, settings and timestamp.
- Tweak: load a past generation into the prompt form, change text or settings, and regenerate (saved as a new generation).
- Async handling: generation endpoint returns a status while awaiting the remote model; frontend shows a loading state and handles errors gracefully.

## Tech / Integrations

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: Next.js API routes (serverless-friendly)
- Storage: Supabase / Postgres recommended (schema below). Can use a local JSON file for quick mock.
- Model API: Hugging Face Inference API or Fal.ai. Mock responses when keys are unavailable.

## Minimal database schema

generations
- `id` UUID PRIMARY KEY
- `prompt` TEXT
- `settings` JSON (model, cfg, size, etc.)
- `image_url` TEXT
- `status` TEXT (pending|succeeded|failed)
- `error` TEXT NULLABLE
- `created_at` TIMESTAMP DEFAULT now()

## Environment

Create a `.env.local` with these variables (or set in your host):

- `HUGGINGFACE_API_KEY` — optional, for real model calls
- `SUPABASE_URL` and `SUPABASE_KEY` — optional, for persistent storage

If you do not provide `HUGGINGFACE_API_KEY`, the app falls back to a mocked image response for safe local development.

## Run (local development)

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API shape

- POST `/api/generate` — body: `{ prompt: string, settings?: object }`.
  - Creates a `generations` record with `status: pending`.
  - Calls the model API (Hugging Face or mock). On success updates record with `image_url` and `status: succeeded`; on failure sets `status: failed` and `error`.

- GET `/api/generations` — returns all generations ordered by `created_at desc`.

Notes on async handling: the endpoint waits for the external call but the frontend treats this as a long-running job: it shows a spinner and protects against timeouts and errors. For a production flow you could implement an asynchronous job queue (e.g., server posts job to queue and client polls the record until status becomes `succeeded` or `failed`).

## Mocking the model API

If you want to avoid API costs while developing, the `generate` API route returns a static placeholder image when no `HUGGINGFACE_API_KEY` is present. The code is structured so switching from mock → real is a single function change in `lib/huggingface.ts`.

## Tweak flow

1. Click a generation card in the gallery.
2. Press `Tweak` to load its `prompt` and `settings` into the prompt form.
3. Edit the prompt or settings and hit `Generate` — this creates a new record and generates a new image.

UX details: the UI disables the Generate button while a generation is pending and surfaces errors inline. The gallery shows `pending` or `failed` badges for transparency.

## Bonus: quick text-overlay edit

The UI supports a simple CSS-based overlay: type overlay text and the gallery preview shows it positioned over the image. This is a view-layer edit (no re-generation) to showcase a light-weight canvas-like affordance.

## Data model & future work (short notes)

- To support fast re-styling and consistent brand LoRAs: store `style_id` referencing uploaded LoRA models; keep embeddings for prompt similarity; serve LoRA weights from object storage and orchestrate model fine-tuning in a separate service.
- For video: use a separate `generations` type or table with frames and jobs; store job progress and streaming previews.

## What to include when you submit

- Repo link (or folder)
- A short Loom (1–3 minutes) that shows: generate → gallery → tweak. Mention mocking if used.
- A README (this file) explaining setup and decisions.

## Time spent

Rough, focused implementation target: ~6–8 hours to scaffold and implement the slice described above. For a very minimal demo you can ship within 2–3 hours by mocking model calls and persisting to a JSON file.

---

