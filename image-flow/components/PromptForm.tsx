"use client";

import { FormEvent } from "react";
import { GenerationFormValues, aspectRatioOptions, modelOptions } from "@/types/generation";

type PromptFormProps = {
  value: GenerationFormValues;
  onChange: (value: GenerationFormValues) => void;
  onSubmit: (value: GenerationFormValues) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
};

export function PromptForm({ value, onChange, onSubmit, isSubmitting, error }: PromptFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(value);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {value.sourceGenerationId ? (
        <div className="rounded-2xl border border-[var(--accent-soft)] bg-white/70 p-4 text-sm text-[var(--muted)]">
          This run will tweak a previous generation. Adjust the prompt or settings, then rerun.
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="prompt">
          Prompt
        </label>
        <textarea
          id="prompt"
          className="input min-h-32 resize-y"
          placeholder="Cinematic monsoon street in Mumbai, neon reflections, documentary realism..."
          value={value.prompt}
          onChange={(event) => onChange({ ...value, prompt: event.target.value })}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="negativePrompt">
          Negative prompt
        </label>
        <input
          id="negativePrompt"
          className="input"
          placeholder="blurry, extra fingers, warped architecture"
          value={value.negativePrompt}
          onChange={(event) => onChange({ ...value, negativePrompt: event.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="aspectRatio">
            Aspect ratio
          </label>
          <select
            id="aspectRatio"
            className="input"
            value={value.aspectRatio}
            onChange={(event) => onChange({ ...value, aspectRatio: event.target.value as GenerationFormValues["aspectRatio"] })}
          >
            {aspectRatioOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="model">
            Model
          </label>
          <select
            id="model"
            className="input"
            value={value.model}
            onChange={(event) => onChange({ ...value, model: event.target.value })}
          >
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="shadow-accent inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#ef5b2d] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Generating..." : "Generate image"}
        </button>

        {value.sourceGenerationId ? (
          <button
            type="button"
            onClick={() => onChange({ ...value, sourceGenerationId: null })}
            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-white/70 px-4 py-3 font-medium text-[var(--foreground)] transition hover:bg-white"
          >
            Clear tweak source
          </button>
        ) : null}
      </div>
    </form>
  );
}
