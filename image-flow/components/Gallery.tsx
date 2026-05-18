"use client";

import { GalleryHorizontal } from "lucide-react";
import { Generation } from "@/types/generation";
import { GenerationCard } from "@/components/GenerationCard";

type GalleryProps = {
  generations: Generation[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTweak: (generation: Generation) => void;
};

export function Gallery({
  generations,
  isLoading,
  selectedId,
  onSelect,
  onTweak,
}: GalleryProps) {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GalleryHorizontal size={18} />
            <h2 className="text-xl font-semibold">Gallery</h2>
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            Your previous generations
          </p>
        </div>

        <div className="rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-500">
          {generations.length} items
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-3xl bg-neutral-100"
            />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-16 text-center text-neutral-500">
          No generations yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              isSelected={generation.id === selectedId}
              onSelect={() => onSelect(generation.id)}
              onTweak={() => onTweak(generation)}
            />
          ))}
        </div>
      )}
    </section>
  );
}