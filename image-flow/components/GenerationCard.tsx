"use client";

import { Generation, aspectRatioLabels, statusMeta } from "@/types/generation";

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
      className={`overflow-hidden rounded-[1.6rem] border bg-white/75 transition ${
        isSelected ? "border-[var(--accent)] shadow-accent" : "border-[var(--border)]"
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="relative aspect-[4/3] bg-[#efe7da]">
          {generation.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generation.imageUrl}
              alt={generation.prompt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f9dcc6,#efe7da)] px-6 text-center text-sm text-[var(--muted)]">
              {generation.status === "failed"
                ? generation.errorMessage ?? "Generation failed."
                : "Waiting for the model response..."}
            </div>
          )}

          <span className={`pill absolute left-3 top-3 ${meta.className}`}>{meta.label}</span>
        </div>
      </button>

      <div className="space-y-4 p-4">
        <div>
          <p className="line-clamp-3 text-sm leading-6 text-[var(--foreground)]">{generation.prompt}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {generation.model} · {aspectRatioLabels[generation.aspectRatio]}
          </p>
        </div>

        {generation.sourceGenerationId ? (
          <div className="rounded-2xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium text-[var(--accent-deep)]">
            Tweaked from {generation.sourceGenerationId.slice(0, 8)}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span>{new Date(generation.createdAt).toLocaleString()}</span>
          <button
            type="button"
            onClick={onTweak}
            className="rounded-full border border-[var(--border)] px-3 py-2 font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
          >
            Tweak
          </button>
        </div>
      </div>
    </article>
  );
}
