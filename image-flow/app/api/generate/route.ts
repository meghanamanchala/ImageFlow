import { NextResponse } from "next/server";
import { createGeneration, updateGeneration } from "@/lib/generation-store";
import { generateImage } from "@/lib/huggingface";
import { createGenerationInputSchema } from "@/types/generation";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return NextResponse.json({ error: `Invalid JSON body: ${String(e)}. Raw body: ${raw}` }, { status: 400 });
    }

    const parsed = createGenerationInputSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const draft = await createGeneration({
      prompt: input.prompt,
      negativePrompt: input.negativePrompt ?? "",
      aspectRatio: input.aspectRatio,
      provider: "huggingface",
      model: input.model,
      status: "processing",
      imageUrl: "",
      sourceGenerationId: input.sourceGenerationId ?? null,
      errorMessage: null,
    });

    try {
      const imageUrl = await generateImage({
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        aspectRatio: input.aspectRatio,
        model: input.model,
      });

      const completed = await updateGeneration(draft.id, {
        imageUrl,
        status: "succeeded",
        errorMessage: null,
      });

      return NextResponse.json(completed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The model request failed unexpectedly.";
      const failed = await updateGeneration(draft.id, {
        status: "failed",
        errorMessage: message,
      });

      // Return the failed generation record (200) so the frontend can render persisted failure state
      // instead of treating it as a network/server error.
      return NextResponse.json(failed);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
