import { Buffer } from "node:buffer";
import { AspectRatio } from "@/types/generation";

type GenerateImageParams = {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  model: string;
};

const modelDimensions: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1152, height: 896 },
  "3:4": { width: 896, height: 1152 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
};

export async function generateImage({
  prompt,
  negativePrompt,
  aspectRatio,
  model,
}: GenerateImageParams) {
  const token = process.env.HF_API_TOKEN;
  const modelId = process.env.HF_MODEL_ID || model;

  if (!token) {
    await sleep(1200);
    return buildMockImage({ prompt, aspectRatio, model: modelId });
  }

  const { width, height } = modelDimensions[aspectRatio];
  async function callModel(mId: string) {
    try {
      return await fetch(`https://api-inference.huggingface.co/models/${mId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: negativePrompt,
            width,
            height,
          },
        }),
        cache: "no-store",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to reach Hugging Face for ${mId}: ${message}`);
    }
  }
  let response: Response;

  try {
    response = await callModel(modelId);
  } catch (error) {
    console.warn(error instanceof Error ? error.message : String(error));
    return buildMockImage({ prompt, aspectRatio, model: modelId });
  }


  if (!response.ok) {
    const errorText = await response.text();
    // If the model was not found (404) try a safe fallback model (if different) before mocking.
    if (response.status === 404) {
      const fallback = process.env.HF_MODEL_ID && process.env.HF_MODEL_ID !== modelId
        ? process.env.HF_MODEL_ID
        : "stabilityai/stable-diffusion-xl-base-1.0";

      if (fallback && fallback !== modelId) {
        // try fallback model once
        const tryResp = await callModel(fallback);
        if (tryResp.ok) {
          response = tryResp;
        } else {
          // if fallback fails, log and return mock
          const tryText = await tryResp.text();
          console.warn(`Hugging Face primary model 404 and fallback failed: ${tryResp.status} ${tryText}`);
          return buildMockImage({ prompt, aspectRatio, model: fallback });
        }
      } else {
        return buildMockImage({ prompt, aspectRatio, model: modelId });
      }
    } else {
      throw new Error(
        `Hugging Face returned ${response.status}. ${errorText || "No additional error details."}`,
      );
    }
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const bytes = await response.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

function buildMockImage({
  prompt,
  aspectRatio,
  model,
}: {
  prompt: string;
  aspectRatio: AspectRatio;
  model: string;
}) {
  const previewPrompt = prompt.slice(0, 92);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#20130f" />
          <stop offset="50%" stop-color="#a43f2f" />
          <stop offset="100%" stop-color="#f0c18d" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" rx="40" />
      <circle cx="250" cy="180" r="110" fill="rgba(255,255,255,0.1)" />
      <circle cx="975" cy="220" r="180" fill="rgba(255,255,255,0.08)" />
      <rect x="70" y="620" width="1060" height="200" rx="32" fill="rgba(12,9,8,0.38)" />
      <text x="90" y="690" fill="#fff7ef" font-family="Arial" font-size="40" font-weight="700">
        Mock generation
      </text>
      <text x="90" y="745" fill="#fff7ef" font-family="Arial" font-size="28">
        ${escapeXml(previewPrompt)}
      </text>
      <text x="90" y="790" fill="#ffd7b0" font-family="Arial" font-size="22">
        ${escapeXml(`${model} · ${aspectRatio} · Set HF_API_TOKEN for live inference`)}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
