"use client";

import { Sparkles, Pencil } from "lucide-react";
import { Generation, statusMeta } from "@/types/generation";

type GenerationCardProps = {
  generation: Generation;
  isSelected: boolean;
  onSelect: () => void;
  onTweak: () => void;
};

export function GenerationCard({
  generation,
  isSelected,
  onSelect,
  onTweak,
}: GenerationCardProps) {
  const meta = statusMeta[generation.status];

  return (
    <article
      className={`group overflow-hidden rounded-3xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isSelected
          ? "border-black shadow-xl"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          {generation.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generation.imageUrl}
              alt={generation.prompt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-500">
              {generation.errorMessage || "Generating image..."}
            </div>
          )}

          <div className="absolute left-4 top-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${meta.className}`}
            >
              {meta.label}
            </span>
          </div>
        </div>
      </button>

      <div className="space-y-4 p-5">
        <div>
          <p className="line-clamp-2 text-sm font-medium leading-6 text-neutral-900">
            {generation.prompt}
          </p>

          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            <Sparkles size={12} />
            <span>{generation.model}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onTweak}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Pencil size={14} />
          Remix Prompt
        </button>
      </div>
    </article>
  );
}