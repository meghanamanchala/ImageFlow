"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Pencil, Wand2 } from "lucide-react";
import { Generation } from "@/types/generation";

type CanvasPreviewProps = {
  generation: Generation | null;
  isBusy: boolean;
  remixHref?: string | null;
  heading?: string;
  subheading?: string;
};

export function CanvasPreview({
  generation,
  isBusy,
  remixHref = null,
  heading = "Canvas Preview",
  subheading = "Refine the selected image with overlay text.",
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
    image.crossOrigin = "anonymous";

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.clearRect(0, 0, canvas.width, canvas.height);

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
  }, [generation?.imageUrl, overlayText]);

  function handleSave() {
    if (!canvasRef.current || !generation) {
      return;
    }

    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `imageflow-studio-${generation.id.slice(0, 8)}.png`;
    link.click();
  }

  return (
    <aside className="rounded-[1.8rem] border border-neutral-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wand2 size={18} />
            <h3 className="text-lg font-semibold">{heading}</h3>
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            {subheading}
          </p>
        </div>
      </div>

      <input
        value={overlayText}
        onChange={(e) => setOverlayText(e.target.value)}
        placeholder="Add a title, caption, or short tagline"
        className="mb-4 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black"
      />

      {generation?.prompt ? (
        <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm italic text-neutral-700">
          &ldquo;{generation.prompt}&rdquo;
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100">
        {generation?.imageUrl ? (
          <canvas
            ref={canvasRef}
            className="h-auto w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[0.95] items-center justify-center px-6 text-center text-sm text-neutral-500">
            {isBusy
              ? "Generating preview..."
              : "Select a generation to preview it here."}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!generation?.imageUrl}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={15} />
          Save
        </button>

        {remixHref ? (
          <Link
            href={remixHref}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              generation
                ? "bg-black text-white hover:bg-neutral-800"
                : "pointer-events-none bg-neutral-200 text-neutral-400"
            }`}
          >
            <Pencil className="size-5 shrink-0 stroke-[2.4]" />
            Remix
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-200 px-4 py-3 text-sm font-medium text-neutral-400"
          >
            <Pencil className="size-5 shrink-0 stroke-[2.4]" />
            Remix
          </button>
        )}
      </div>
    </aside>
  );
}
