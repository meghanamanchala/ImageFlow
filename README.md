# ImageFlow Studio

Minimal generative media web app for The Bombay AI Company FDE Assignment B.

## What ships

- Prompt-to-image generation through a Hugging Face API seam.
- Durable gallery records with prompt, settings, timestamps, status, and tweak lineage.
- Tweak flow that reuses a past generation as the starting point for a rerun.
- Slow/failure UX: optimistic pending cards, persisted failed jobs, and a safe mock fallback when API keys are missing.
- Bonus: a lightweight client-side text overlay canvas for quick edit exploration.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- Hugging Face Inference API
- Supabase SSR helpers plus a local JSON fallback for quick setup

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local`.

3. Optional: add a real Hugging Face token:

```env
HF_API_TOKEN=...
HF_MODEL_ID=black-forest-labs/FLUX.1-schnell
```

4. Optional: add Supabase credentials for persistent database-backed storage:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

5. Start the app:

```bash
npm run dev
```

If `HF_API_TOKEN` is missing, the app still works end to end using a mocked generated image. This keeps the integration contract intact while removing cost/setup friction.

## Supabase table

```sql
create table if not exists generations (
  id uuid primary key,
  prompt text not null,
  negative_prompt text not null default '',
  aspect_ratio text not null,
  provider text not null,
  model text not null,
  status text not null,
  image_url text,
  source_generation_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Product choices

- The gallery is modeled as a first-class history, not just cached image URLs. Each generation keeps enough metadata to rerun, debug, and later extend into video, variants, or collaborative history.
- The `POST /api/generate` route first records a `processing` item, then updates it to `succeeded` or `failed`. That means slow jobs and failures become visible state instead of disappearing into transient client memory.
- The data layer uses one interface with two backends:
  - Supabase when env vars are present
  - `data/generations.json` for zero-setup local development

## Bonus: LoRA serving plan

If I were taking the custom style system further, I would:

1. Collect a small style dataset per user and store image references plus metadata in Supabase Storage.
2. Launch offline LoRA fine-tunes through Fal.ai or a dedicated training job, keyed by `user_id` and `style_id`.
3. Store LoRA metadata in Postgres: base model, trigger phrase, storage URL, training status, sample outputs, and cost.
4. At generation time, resolve the selected style to a model + LoRA adapter pair and pass both into the inference provider.
5. Cache hot LoRAs, expire cold ones, and preserve training lineage so users can version or roll back styles.

## Suggested demo flow

1. Generate an image with no API key and show the mocked fallback still creating a gallery item.
2. Add a real `HF_API_TOKEN` and rerun to show the same UI against a live model.
3. Click `Tweak` on a prior card, adjust the prompt, and regenerate.
4. Open the canvas panel and add text overlay copy to the latest image.
