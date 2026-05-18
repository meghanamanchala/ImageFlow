"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import { Gallery } from "@/components/Gallery";
import { PromptForm } from "@/components/PromptForm";
import {
  CreateGenerationInput,
  Generation,
  GenerationFormValues,
  emptyGenerationForm,
} from "@/types/generation";

function buildOptimisticGeneration(values: GenerationFormValues): Generation {
  return {
    id: `pending-${crypto.randomUUID()}`,
    prompt: values.prompt,
    negativePrompt: values.negativePrompt,
    aspectRatio: values.aspectRatio,
    provider: "huggingface",
    model: values.model,
    status: "processing",
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceGenerationId: values.sourceGenerationId ?? null,
    errorMessage: null,
  };
}

type StudioProps = {
  initialRemixId?: string | null;
};

export function Studio({ initialRemixId = null }: StudioProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [formValues, setFormValues] = useState<GenerationFormValues>(emptyGenerationForm);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [selectedForCanvas, setSelectedForCanvas] = useState<string | null>(null);
  const [hasAppliedInitialRemix, setHasAppliedInitialRemix] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadGenerations() {
      try {
        const response = await fetch("/api/generations", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Gallery data could not be loaded.");
        }

        const data = (await response.json()) as Generation[];
        if (isActive) {
          setGenerations(data);
        }
      } catch (error) {
        if (isActive) {
          setSubmissionError(
            error instanceof Error ? error.message : "Gallery data could not be loaded.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingGallery(false);
        }
      }
    }

    void loadGenerations();

    return () => {
      isActive = false;
    };
  }, []);

  const canvasGeneration = useMemo(
    () => generations.find((g) => g.id === selectedForCanvas) ?? null,
    [generations, selectedForCanvas],
  );

  useEffect(() => {
    if (!initialRemixId || generations.length === 0 || hasAppliedInitialRemix) {
      return;
    }

    const source = generations.find((generation) => generation.id === initialRemixId);
    if (!source) {
      return;
    }

    setFormValues({
      prompt: source.prompt,
      negativePrompt: source.negativePrompt,
      aspectRatio: source.aspectRatio,
      model: source.model,
      sourceGenerationId: source.id,
    });
    setSelectedForCanvas(source.id);
    setHasAppliedInitialRemix(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [hasAppliedInitialRemix, initialRemixId, generations]);

  async function handleGenerate(values: GenerationFormValues) {
    if (values.prompt.trim().length < 4) {
      setSubmissionError("Prompt must be at least 4 characters.");
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    const optimistic = buildOptimisticGeneration(values);
    setGenerations((current) => [optimistic, ...current]);
    setSelectedForCanvas(optimistic.id);

    const payload: CreateGenerationInput = {
      prompt: values.prompt,
      negativePrompt: values.negativePrompt || undefined,
      aspectRatio: values.aspectRatio,
      model: values.model,
      sourceGenerationId: values.sourceGenerationId || undefined,
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as Generation | { error: string };

      if (!response.ok) {
        if ("id" in data) {
          const failedGeneration = data as Generation;
          setGenerations((current) =>
            current.map((g) => (g.id === optimistic.id ? failedGeneration : g)),
          );
          setSelectedForCanvas(failedGeneration.id);
          setSubmissionError(failedGeneration.errorMessage ?? "Generation failed.");
          return;
        }

        throw new Error("error" in data ? data.error : "Generation failed.");
      }

      setGenerations((current) =>
        current.map((g) => (g.id === optimistic.id ? (data as Generation) : g)),
      );

      const completed = data as Generation;
      setSelectedForCanvas(completed.id);
      setFormValues({
        ...emptyGenerationForm,
        prompt: completed.prompt,
        negativePrompt: completed.negativePrompt,
        aspectRatio: completed.aspectRatio,
        model: completed.model,
        sourceGenerationId: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";

      setGenerations((current) =>
        current.map((g) =>
          g.id === optimistic.id
            ? {
                ...g,
                status: "failed",
                errorMessage: message,
                updatedAt: new Date().toISOString(),
              }
            : g,
        ),
      );
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTweak(source: Generation) {
    setFormValues({
      prompt: source.prompt,
      negativePrompt: source.negativePrompt,
      aspectRatio: source.aspectRatio,
      model: source.model,
      sourceGenerationId: source.id,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.26em] text-neutral-500">
            Generative Media Studio
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Create images from prompts.
          </h1>
          <p className="mt-3 text-base text-neutral-600 sm:text-lg">
            Generate, revisit, and tweak your AI creations.
          </p>
        </header>

        <section className="mx-auto mt-10 max-w-4xl rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
          <PromptForm
            value={formValues}
            onChange={setFormValues}
            onSubmit={handleGenerate}
            isSubmitting={isSubmitting}
            error={submissionError}
          />
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_22rem] lg:items-start">
          <Gallery
            generations={generations}
            isLoading={isLoadingGallery}
            selectedId={selectedForCanvas}
            onSelect={setSelectedForCanvas}
            onTweak={handleTweak}
          />

          <aside className="rounded-[1.8rem] border border-neutral-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="mb-5 flex items-center gap-2">
              <ImageIcon size={18} />
              <div>
                <h3 className="text-lg font-semibold">Canvas Editor</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Open the selected generation in a dedicated editing page.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.6rem] border border-neutral-200 bg-neutral-100">
              {canvasGeneration?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={canvasGeneration.imageUrl}
                  alt={canvasGeneration.prompt}
                  className="aspect-[0.95] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[0.95] items-center justify-center px-6 text-center text-sm text-neutral-500">
                  {isSubmitting
                    ? "The selected image is still generating."
                    : "Select any gallery item to preview and open it in the canvas editor."}
                </div>
              )}
            </div>

            {canvasGeneration?.prompt ? (
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
                {canvasGeneration.prompt}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={canvasGeneration ? `/canvas/${canvasGeneration.id}` : "/"}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  canvasGeneration
                    ? "bg-black text-white hover:bg-neutral-800"
                    : "cursor-not-allowed bg-neutral-200 text-neutral-400 pointer-events-none"
                }`}
              >
                <ArrowUpRight size={15} />
                Open canvas page
              </Link>

              {canvasGeneration ? (
                <button
                  type="button"
                  onClick={() => handleTweak(canvasGeneration)}
                  className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Remix selected image
                </button>
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
