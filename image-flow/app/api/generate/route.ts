import { NextResponse } from "next/server";
import { createGeneration, updateGeneration } from "@/lib/generation-store";
import { generateImage } from "@/lib/huggingface";
import { createGenerationInputSchema } from "@/types/generation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createGenerationInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid prompt and settings." },
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
      imageUrl: null,
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
      const failed = await updateGeneration(draft.id, {
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "The model request failed unexpectedly.",
      });

      return NextResponse.json(failed, { status: 502 });
    }
  } catch {
    return NextResponse.json(
      { error: "The request body could not be parsed." },
      { status: 400 },
    );
  }
}
