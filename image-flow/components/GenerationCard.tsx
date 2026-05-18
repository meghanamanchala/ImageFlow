"use client";

import Link from "next/link";
import { AlertCircle, LoaderCircle, Pencil, Sparkles } from "lucide-react";
import { Generation } from "@/types/generation";

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
  const statusDotClass =
    generation.status === "succeeded"
      ? "bg-emerald-400"
      : generation.status === "failed"
        ? "bg-red-400"
        : "bg-amber-400";

  return (
    <article
      className={`group overflow-hidden rounded-[1.6rem] border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        isSelected
          ? "border-black shadow-lg"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        <div className="relative aspect-[0.82] overflow-hidden bg-neutral-100">
          <div className="absolute left-3 top-3 z-10">
            <span className={`block size-2.5 rounded-full ${statusDotClass}`} />
          </div>

          {generation.status === "failed" ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-neutral-50 px-5 text-center text-sm text-neutral-600">
              <AlertCircle className="size-5 text-red-500" />
              <p className="max-w-[12rem] leading-6">
                {generation.errorMessage ?? "Generation failed."}
              </p>
            </div>
          ) : generation.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generation.imageUrl}
              alt={generation.prompt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[linear-gradient(180deg,#c76549,#7a3d2d)] p-6 text-center text-sm text-white/92">
              <LoaderCircle className="size-5 animate-spin" />
              <p>Generating image...</p>
            </div>
          )}
        </div>
      </button>

      <div className="space-y-4 p-4">
        <div>
          <p className="line-clamp-2 text-sm font-medium leading-6 text-neutral-900">
            {generation.prompt}
          </p>

          <div className="mt-2 flex items-center gap-2 overflow-hidden text-xs text-neutral-500">
            <Sparkles size={12} />
            <span className="truncate">{generation.model}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/canvas/${generation.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            Canvas
          </Link>

          <button
            type="button"
            onClick={onTweak}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <Pencil className="size-3.5 shrink-0 stroke-[2.4]" />
            Remix
          </button>
        </div>
      </div>
    </article>
  );
}
