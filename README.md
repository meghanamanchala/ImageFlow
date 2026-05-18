# ImageFlow Studio

Minimal generative media web app for The Bombay AI Company FDE assignment.

## What it does

- Generate images from a prompt with the Hugging Face Inference API
- Persist generations with prompt, model, aspect ratio, timestamps, status, and remix lineage
- Show a gallery of previous generations
- Remix any previous generation into a new run
- Open any generation in a dedicated canvas editor page
- Add a simple text overlay and save the edited image
- Fall back to local JSON storage if Supabase is unavailable
- Fall back to a mocked generated image if `HF_API_TOKEN` is missing

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- Hugging Face Inference API
- Supabase SSR helpers
- Local JSON fallback storage for quick local development

## Routes

- `/`  
  Main studio page for prompt, gallery, remix, and opening canvas

- `/canvas/[id]`  
  Dedicated canvas editor for a specific generation

- `/api/generate`  
  Creates a generation record, calls Hugging Face, then updates the record to `succeeded` or `failed`

- `/api/generations`  
  Returns all saved generations

- `/api/status`  
  Returns whether the app is using local fallback storage

## Environment variables

Create `.env.local`:

```env
HF_API_TOKEN=
HF_MODEL_ID=black-forest-labs/FLUX.1-schnell
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- If `HF_API_TOKEN` is missing, the app still works end to end using a mock image.
- If Supabase is not configured or the schema does not match, the app falls back to `data/generations.json`.

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## How generation works

1. The client posts prompt/settings to `/api/generate`
2. The server creates a `processing` generation record
3. The server calls Hugging Face
4. The generation is updated to:
   - `succeeded` with an image
   - `failed` with a saved error message
5. The gallery shows the persisted result either way

## Hugging Face behavior

The app uses Hugging Face in [lib/huggingface.ts](./lib/huggingface.ts).

- Primary model comes from `HF_MODEL_ID` or the selected model
- If no token is present, it returns a mock image
- If Hugging Face returns `404`, the app tries one fallback model once
- Other Hugging Face errors are saved and shown as failed generations

## Storage behavior

The app uses one storage interface in [lib/generation-store.ts](./lib/generation-store.ts).

- Preferred backend: Supabase
- Fallback backend: `data/generations.json`

This keeps the product working locally even if Supabase is not ready.

## Supabase table

Suggested schema:

```sql
create table if not exists generations (
  id uuid primary key,
  prompt text not null,
  negative_prompt text not null default '',
  aspect_ratio text,
  provider text,
  model text not null,
  status text not null,
  image_url text,
  source_generation_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Test flow

1. Start the app with `npm run dev`
2. Generate an image without `HF_API_TOKEN`
3. Confirm a mock image appears in the gallery
4. Click `Remix` on an existing card
5. Change the prompt and generate again
6. Click `Canvas` on any card
7. Add overlay text and save the image

## How to test a failed Hugging Face run

1. Put an invalid token in `.env.local`

```env
HF_API_TOKEN=wrong-token
```

2. Restart the dev server
3. Generate a new image
4. Confirm the new card shows a failed state
5. Restore the real token after testing

## Notes

- Old gallery records can still show historic provider-specific error text if they were created before the current Hugging Face-only flow.
- The canvas editor is not limited to the newest generation; it works for any selected generation.
- Downloaded canvas files are named `imageflow-studio-<id>.png`.
