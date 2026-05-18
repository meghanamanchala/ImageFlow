import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { CreateGenerationRecord, Generation, UpdateGenerationRecord } from "@/types/generation";

// Indicates whether the server has fallen back to local JSON storage because Supabase
// is unavailable or its schema does not match the expected columns. Exported so
// the app can surface a non-intrusive banner in the UI.
export let usingLocalFallback = false;

const dataFilePath = path.join(process.cwd(), "data", "generations.json");

async function ensureDataFile() {
  await mkdir(path.dirname(dataFilePath), { recursive: true });

  try {
    await readFile(dataFilePath, "utf8");
  } catch {
    await writeFile(dataFilePath, "[]", "utf8");
  }
}

async function listLocalGenerations() {
  await ensureDataFile();
  const file = await readFile(dataFilePath, "utf8");
  return JSON.parse(file) as Generation[];
}

async function writeLocalGenerations(generations: Generation[]) {
  await writeFile(dataFilePath, JSON.stringify(generations, null, 2), "utf8");
}

function sortGenerations(generations: Generation[]) {
  return [...generations].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function listGenerations() {
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data.map(mapSupabaseGeneration);
    } catch (e) {
      // If Supabase is misconfigured or the schema differs, fall back to local file storage.
      if (!usingLocalFallback) {
        console.error("Supabase list error, falling back to local storage:", e);
      }
      usingLocalFallback = true;
    }
  }

  return sortGenerations(await listLocalGenerations());
}

export async function createGeneration(input: CreateGenerationRecord) {
  const timestamp = new Date().toISOString();
  const record: Generation = {
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const data = await insertAdaptive(supabase, mapGenerationToSupabase(record));
      return mapSupabaseGeneration(data);
    } catch (e) {
      if (!usingLocalFallback) {
        console.error("Supabase insert error, falling back to local storage:", e);
      }
      usingLocalFallback = true;
    }
  }

  const generations = await listLocalGenerations();
  await writeLocalGenerations(sortGenerations([record, ...generations]));
  return record;
}

export async function updateGeneration(id: string, input: UpdateGenerationRecord) {
  const supabase = getSupabaseAdminClient();
  const updatedAt = new Date().toISOString();

  if (supabase) {
    try {
      const data = await updateAdaptive(
        supabase,
        id,
        mapGenerationToSupabase({ ...input, updatedAt }),
      );
      return mapSupabaseGeneration(data);
    } catch (e) {
      if (!usingLocalFallback) {
        console.error("Supabase update error, falling back to local storage:", e);
      }
      usingLocalFallback = true;
    }
  }

  const generations = await listLocalGenerations();
  const next = generations.map((generation) =>
    generation.id === id ? { ...generation, ...input, updatedAt } : generation,
  );
  const updated = next.find((generation) => generation.id === id);

  if (!updated) {
    throw new Error("Generation not found.");
  }

  await writeLocalGenerations(sortGenerations(next));
  return updated;
}

function mapSupabaseGeneration(row: Record<string, unknown>): Generation {
  return {
    id: String(row.id),
    prompt: String(row.prompt ?? ""),
    negativePrompt: String(row.negative_prompt ?? ""),
    aspectRatio: String(row.aspect_ratio ?? "1:1") as Generation["aspectRatio"],
    provider: "huggingface",
    model: String(row.model ?? ""),
    status: String(row.status ?? "processing") as Generation["status"],
    imageUrl: row.image_url ? String(row.image_url) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    sourceGenerationId: row.source_generation_id ? String(row.source_generation_id) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
  };
}

function mapGenerationToSupabase(
  row: Partial<Generation> & {
    updatedAt?: string;
  },
) {
  const out: Record<string, unknown> = {};
  if (row.id !== undefined) out.id = row.id;
  if (row.prompt !== undefined) out.prompt = row.prompt;
  if (row.negativePrompt !== undefined) out.negative_prompt = row.negativePrompt;
  if (row.aspectRatio !== undefined) out.aspect_ratio = row.aspectRatio;
  if (row.provider !== undefined) out.provider = row.provider;
  if (row.model !== undefined) out.model = row.model;
  if (row.status !== undefined) out.status = row.status;
  // Only include image_url when it's not null/undefined to avoid NOT NULL constraint errors on some schemas
  if (row.imageUrl !== undefined && row.imageUrl !== null) out.image_url = row.imageUrl;
  if (row.createdAt !== undefined) out.created_at = row.createdAt;
  if (row.updatedAt !== undefined) out.updated_at = row.updatedAt;
  if (row.sourceGenerationId !== undefined && row.sourceGenerationId !== null)
    out.source_generation_id = row.sourceGenerationId;
  if (row.errorMessage !== undefined && row.errorMessage !== null) out.error_message = row.errorMessage;

  return out;
}

function parseMissingColumn(errorMessage: string) {
  const match = /Could not find the '([^']+)' column/.exec(errorMessage);
  return match?.[1] ?? null;
}

async function insertAdaptive(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  payload: Record<string, unknown>,
) {
  const candidate = { ...payload };

  for (let i = 0; i < 12; i += 1) {
    const { data, error } = await supabase.from("generations").insert(candidate).select().single();
    if (!error) {
      return data;
    }

    const missing = parseMissingColumn(error.message);
    if (missing && Object.prototype.hasOwnProperty.call(candidate, missing)) {
      delete candidate[missing];
      continue;
    }

    throw new Error(error.message);
  }

  throw new Error("Supabase insert failed after adaptive retries.");
}

async function updateAdaptive(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  id: string,
  payload: Record<string, unknown>,
) {
  const candidate = { ...payload };

  for (let i = 0; i < 12; i += 1) {
    const { data, error } = await supabase
      .from("generations")
      .update(candidate)
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      return data;
    }

    const missing = parseMissingColumn(error.message);
    if (missing && Object.prototype.hasOwnProperty.call(candidate, missing)) {
      delete candidate[missing];
      continue;
    }

    throw new Error(error.message);
  }

  throw new Error("Supabase update failed after adaptive retries.");
}
