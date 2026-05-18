"use client";

import { FormEvent } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import {
  aspectRatioOptions,
  emptyGenerationForm,
  GenerationFormValues,
  modelOptions,
} from "@/types/generation";

type PromptFormProps = {
  value: GenerationFormValues;
  onChange: (value: GenerationFormValues) => void;
  onSubmit: (value: GenerationFormValues) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
};

export function PromptForm({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: PromptFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit}>
      {value.sourceGenerationId ? (
        <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Remix mode is active. Update the prompt or settings and generate a new variation.
        </div>
      ) : null}

        <textarea
          value={value.prompt}
          onChange={(event) =>
            onChange({ ...value, prompt: event.target.value })
          }
          placeholder="A rain-soaked Mumbai street at blue hour, cinematic lighting, reflective pavement"
          rows={4}
          className="w-full resize-none border-0 bg-transparent p-6 text-[1.15rem] leading-8 outline-none placeholder:text-neutral-400"
        />

        <div className="flex flex-col gap-4 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={value.model}
                onChange={(event) => onChange({ ...value, model: event.target.value })}
                className="appearance-none rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-9 text-sm font-medium text-neutral-700 outline-none transition focus:border-neutral-300"
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Sparkles className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
            </div>

            <select
              value={value.aspectRatio}
              onChange={(event) =>
                onChange({
                  ...value,
                  aspectRatio: event.target.value as GenerationFormValues["aspectRatio"],
                })
              }
              className="appearance-none rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 outline-none transition focus:border-neutral-300"
            >
              {aspectRatioOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onChange(emptyGenerationForm)}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
            >
              <RotateCcw size={15} />
              Reset
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              <Sparkles size={16} />
              {isSubmitting ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

      {error ? (
        <div className="mt-3 text-sm text-red-500">{error}</div>
      ) : null}
    </form>
  );
}
