"use client";

import { useEffect, useRef, useState } from "react";
import { Generation } from "@/types/generation";

type CanvasPreviewProps = {
  generation: Generation | null;
  isBusy: boolean;
  onSelectLatest: () => void;
};

export function CanvasPreview({ generation, isBusy, onSelectLatest }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [overlayText, setOverlayText] = useState("Bombay rains, but make it cinema.");

  useEffect(() => {
    if (!generation?.imageUrl || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      const fontSize = Math.max(24, Math.round(canvas.width / 18));
      context.font = `700 ${fontSize}px Arial`;
      context.fillStyle = "rgba(0, 0, 0, 0.45)";
      context.fillRect(0, canvas.height - fontSize * 2.15, canvas.width, fontSize * 2.2);
      context.fillStyle = "#fffdf8";
      context.fillText(overlayText, 24, canvas.height - fontSize * 0.8);
    };
    image.src = generation.imageUrl;
  }, [generation?.imageUrl, overlayText]);

  return (
    <aside className="card flex h-full flex-col rounded-[2rem] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="pill bg-white/80 text-[var(--muted)]">Bonus</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Quick text overlay canvas</h2>
        </div>
        <button
          type="button"
          onClick={onSelectLatest}
          className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-medium"
        >
          Use latest
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        Lightweight client-side edit surface: pick any generated image, add copy, and preview an exportable
        direction without leaving the gallery flow.
      </p>

      <label className="label mt-5" htmlFor="overlayText">
        Overlay text
      </label>
      <input
        id="overlayText"
        className="input"
        value={overlayText}
        onChange={(event) => setOverlayText(event.target.value)}
      />

      <div className="mt-5 flex min-h-[22rem] items-center justify-center overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-white/55 p-3">
        {generation?.imageUrl ? (
          <canvas ref={canvasRef} className="h-auto max-h-[26rem] w-full rounded-[1.2rem] object-contain" />
        ) : (
          <div className="max-w-sm text-center text-sm leading-6 text-[var(--muted)]">
            {isBusy
              ? "A new generation is in flight. The canvas will update as soon as the image lands."
              : "Generate or select an image from the gallery to preview a quick text overlay edit."}
          </div>
        )}
      </div>
    </aside>
  );
}
