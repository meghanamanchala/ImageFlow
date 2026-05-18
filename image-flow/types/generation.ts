import { z } from "zod";

export const aspectRatioSchema = z.enum(["1:1", "4:3", "3:4", "16:9", "9:16"]);

export const generationStatusSchema = z.enum(["processing", "succeeded", "failed"]);

export const createGenerationInputSchema = z.object({
  prompt: z.string().trim().min(4, "Prompt must be at least 4 characters."),
  negativePrompt: z.string().trim().optional(),
  aspectRatio: aspectRatioSchema,
  model: z.string().trim().min(2),
  sourceGenerationId: z.string().uuid().optional(),
});

export type AspectRatio = z.infer<typeof aspectRatioSchema>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type CreateGenerationInput = z.infer<typeof createGenerationInputSchema>;

export type Generation = {
  id: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  provider: "huggingface";
  model: string;
  status: GenerationStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  sourceGenerationId: string | null;
  errorMessage: string | null;
};

export type CreateGenerationRecord = Omit<Generation, "id" | "createdAt" | "updatedAt">;
export type UpdateGenerationRecord = Partial<
  Omit<Generation, "id" | "createdAt" | "provider" | "prompt" | "negativePrompt" | "aspectRatio" | "model">
>;

export type GenerationFormValues = {
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  model: string;
  sourceGenerationId: string | null;
};

export const emptyGenerationForm: GenerationFormValues = {
  prompt: "",
  negativePrompt: "",
  aspectRatio: "1:1",
  model: "black-forest-labs/FLUX.1-schnell",
  sourceGenerationId: null,
};

export const aspectRatioOptions: Array<{ value: AspectRatio; label: string }> = [
  { value: "1:1", label: "Square 1:1" },
  { value: "4:3", label: "Landscape 4:3" },
  { value: "3:4", label: "Portrait 3:4" },
  { value: "16:9", label: "Wide 16:9" },
  { value: "9:16", label: "Tall 9:16" },
];

export const aspectRatioLabels: Record<AspectRatio, string> = {
  "1:1": "1:1",
  "4:3": "4:3",
  "3:4": "3:4",
  "16:9": "16:9",
  "9:16": "9:16",
};

export const modelOptions = [
  { value: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell" },
  { value: "stabilityai/stable-diffusion-xl-base-1.0", label: "SDXL Base 1.0" },
];

export const statusMeta: Record<GenerationStatus, { label: string; className: string }> = {
  processing: {
    label: "Generating",
    className: "bg-amber-100 text-amber-800",
  },
  succeeded: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-800",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800",
  },
};
