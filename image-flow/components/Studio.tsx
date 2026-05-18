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
          setSelectedForCanvas((current) => current ?? data[0]?.id ?? null);
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
    () => generations.find((generation) => generation.id === selectedForCanvas) ?? null,
    [generations, selectedForCanvas],
  );

  async function handleGenerate(values: GenerationFormValues) {
    setIsSubmitting(true);
    setSubmissionError(null);

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
            current.map((generation) =>
              generation.id === optimistic.id ? failedGeneration : generation,
            ),
          );
          setSelectedForCanvas((current) =>
            current === optimistic.id ? failedGeneration.id : current,
          );
          setSubmissionError(failedGeneration.errorMessage ?? "Generation failed.");
          return;
        }

        const message = "error" in data ? data.error : "Generation failed.";
        throw new Error(message);
      }

      setGenerations((current) =>
        current.map((generation) =>
          generation.id === optimistic.id ? (data as Generation) : generation,
        ),
      );
      setSelectedForCanvas((current) => (current === optimistic.id ? (data as Generation).id : current));
      setFormValues({
        ...emptyGenerationForm,
        prompt: values.prompt,
        negativePrompt: values.negativePrompt,
        aspectRatio: values.aspectRatio,
        model: values.model,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";
      setGenerations((current) =>
        current.map((generation) =>
          generation.id === optimistic.id
            ? {
                ...generation,
                status: "failed",
                errorMessage: message,
                updatedAt: new Date().toISOString(),
              }
            : generation,
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
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card rounded-[2rem] p-6 sm:p-8">
          <p className="pill bg-[var(--accent-soft)] text-[var(--accent-deep)]">Assignment Slice B</p>
          <div className="mt-5 max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Prompt, rerun, and refine without losing the thread.
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">
              ImageFlow is a minimal generative media studio focused on the hard parts the assignment
              asks for: waiting states, a durable gallery model, tweak lineage, and graceful fallback
              when the model or network does not cooperate.
            </p>
          </div>

          <div className="mt-8">
            <PromptForm
              value={formValues}
              onChange={setFormValues}
              onSubmit={handleGenerate}
              isSubmitting={isSubmitting}
              error={submissionError}
            />
          </div>
        </div>

        <CanvasPreview
          generation={canvasGeneration}
          isBusy={Boolean(isSubmitting && selectedForCanvas?.startsWith("pending-"))}
          onSelectLatest={() => {
            if (generations.length > 0) {
              setSelectedForCanvas(generations[0].id);
            }
          }}
        />
      </section>

      <Gallery
        generations={generations}
        isLoading={isLoadingGallery}
        selectedId={selectedForCanvas}
        onSelect={setSelectedForCanvas}
        onTweak={handleTweak}
      />
    </main>
  );
}
