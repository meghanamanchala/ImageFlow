import Link from "next/link";
import { notFound } from "next/navigation";
import { CanvasPreview } from "@/components/CanvasPreview";
import { getGenerationById } from "@/lib/generation-store";

type CanvasPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { id } = await params;
  const generation = await getGenerationById(id);

  if (!generation) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.26em] text-neutral-500">
              Canvas Editor
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Edit one generation in a focused workspace.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              Add overlay text, export the edited image, or jump back to the main studio to remix
              this generation.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Back to studio
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-[1.8rem] border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Generation details</h2>
            <div className="mt-5 space-y-4 text-sm text-neutral-600">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Prompt
                </p>
                <p className="mt-2 leading-6 text-neutral-800">{generation.prompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                    Model
                  </p>
                  <p className="mt-2 text-neutral-800">{generation.model}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                    Aspect
                  </p>
                  <p className="mt-2 text-neutral-800">{generation.aspectRatio}</p>
                </div>
              </div>

              {generation.negativePrompt ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                    Negative prompt
                  </p>
                  <p className="mt-2 leading-6 text-neutral-800">{generation.negativePrompt}</p>
                </div>
              ) : null}
            </div>
          </aside>

          <CanvasPreview
            generation={generation}
            isBusy={false}
            remixHref={`/?remix=${generation.id}`}
            heading="Canvas editor"
            subheading="Adjust overlay text, save the image, or remix it back in the main studio."
          />
        </div>
      </div>
    </main>
  );
}
