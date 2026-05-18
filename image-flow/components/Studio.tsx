"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasPreview } from "@/components/CanvasPreview";
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

export function Studio() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [formValues, setFormValues] = useState<GenerationFormValues>(emptyGenerationForm);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [selectedForCanvas, setSelectedForCanvas] = useState<string | null>(null);

  useEffect(() => {
    async function loadGenerations() {
      try {
        const response = await fetch("/api/generations", { cache: "no-store" });
        const data = (await response.json()) as Generation[];
        setGenerations(data);
        setSelectedForCanvas(data[0]?.id ?? null);
      } finally {
        setIsLoadingGallery(false);
      }
    }

    void loadGenerations();
  }, []);

  const canvasGeneration = useMemo(
    () => generations.find((g) => g.id === selectedForCanvas) ?? null,
    [generations, selectedForCanvas],
  );

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

      const data = (await response.json()) as Generation;

      setGenerations((current) =>
        current.map((g) => (g.id === optimistic.id ? data : g)),
      );

      setSelectedForCanvas(data.id);
    } catch {
      setSubmissionError("Generation failed.");
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
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
            Generative Media Studio
          </p>
          <h1 className="text-5xl font-semibold tracking-tight">
            Create images from prompts.
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Generate, revisit, and tweak your AI creations.
          </p>
        </header>

        <section className="mx-auto mt-10 max-w-4xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <PromptForm
            value={formValues}
            onChange={setFormValues}
            onSubmit={handleGenerate}
            isSubmitting={isSubmitting}
            error={submissionError}
          />
        </section>

        <section className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <Gallery
            generations={generations}
            isLoading={isLoadingGallery}
            selectedId={selectedForCanvas}
            onSelect={setSelectedForCanvas}
            onTweak={handleTweak}
          />

          <CanvasPreview
            generation={canvasGeneration}
            isBusy={isSubmitting}
            onSelectLatest={() => {
              if (generations.length > 0) {
                setSelectedForCanvas(generations[0].id);
              }
            }}
          />
        </section>
      </div>
    </main>
  );
}