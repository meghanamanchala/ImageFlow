"use client";

import { FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { GenerationFormValues } from "@/types/generation";

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
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <textarea
          value={value.prompt}
          onChange={(event) =>
            onChange({ ...value, prompt: event.target.value })
          }
          placeholder="Describe the image you want to create..."
          rows={5}
          className="w-full resize-none border-0 bg-transparent p-6 text-lg outline-none placeholder:text-neutral-400"
        />

        <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4">
          <div className="text-sm text-neutral-400">
            {value.sourceGenerationId
              ? "Remixing previous generation"
              : "AI image generation"}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  prompt: "",
                  sourceGenerationId: null,
                })
              }
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
            >
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
      </div>

      {error ? (
        <div className="mt-3 text-sm text-red-500">{error}</div>
      ) : null}
    </form>
  );
}