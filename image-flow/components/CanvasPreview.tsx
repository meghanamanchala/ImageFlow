"use client";

import { useEffect, useRef, useState } from "react";
import { Wand2 } from "lucide-react";
import { Generation } from "@/types/generation";

type CanvasPreviewProps = {
  generation: Generation | null;
  isBusy: boolean;
  onSelectLatest: () => void;
};

export function CanvasPreview({
  generation,
  isBusy,
  onSelectLatest,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [overlayText, setOverlayText] = useState(
    "Bombay rains, but make it cinema."
  );

  useEffect(() => {
    if (!generation?.imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    const image = new Image();

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;

      context.drawImage(image, 0, 0);

      const fontSize = Math.max(24, canvas.width / 18);

      context.font = `700 ${fontSize}px Arial`;
      context.fillStyle = "rgba(0,0,0,0.5)";
      context.fillRect(
        0,
        canvas.height - fontSize * 2,
        canvas.width,
        fontSize * 2
      );

      context.fillStyle = "white";
      context.fillText(
        overlayText,
        30,
        canvas.height - fontSize * 0.7
      );
    };

    image.src = generation.imageUrl;
  }, [generation, overlayText]);

  return (
    <aside className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wand2 size={18} />
            <h3 className="text-lg font-semibold">Canvas Preview</h3>
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            Simple overlay editor
          </p>
        </div>

        <button
          onClick={onSelectLatest}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm transition hover:bg-neutral-100"
        >
          Latest
        </button>
      </div>

      <input
        value={overlayText}
        onChange={(e) => setOverlayText(e.target.value)}
        className="mb-4 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black"
      />

      <div className="overflow-hidden rounded-3xl bg-neutral-100">
        {generation?.imageUrl ? (
          <canvas
            ref={canvasRef}
            className="h-auto w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm text-neutral-500">
            {isBusy
              ? "Generating preview..."
              : "Select a generation"}
          </div>
        )}
      </div>
    </aside>
  );
}