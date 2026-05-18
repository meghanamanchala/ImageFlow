"use client";

import { Generation } from "@/types/generation";
import { GenerationCard } from "@/components/GenerationCard";

type GalleryProps = {
  generations: Generation[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTweak: (generation: Generation) => void;
};

export function Gallery({ generations, isLoading, selectedId, onSelect, onTweak }: GalleryProps) {
  return (
    <section className="card rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="pill bg-white/80 text-[var(--muted)]">Gallery</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Past generations stay editable.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Each card keeps the original prompt, settings, and tweak lineage. That makes reruns and
            future edits straightforward instead of turning the gallery into a dead archive.
          </p>
        </div>
        <div className="text-sm text-[var(--muted)]">{generations.length} recorded runs</div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse-soft h-[26rem] rounded-[1.6rem] border border-[var(--border)] bg-white/60"
            />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--border)] bg-white/55 p-10 text-center text-[var(--muted)]">
          No generations yet. Start with a prompt above and the result will land here with its settings.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
