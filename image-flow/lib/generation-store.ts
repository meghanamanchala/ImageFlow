import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { CreateGenerationRecord, Generation, UpdateGenerationRecord } from "@/types/generation";

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
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data.map(mapSupabaseGeneration);
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
    const { data, error } = await supabase
      .from("generations")
      .insert(mapGenerationToSupabase(record))
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapSupabaseGeneration(data);
  }

  const generations = await listLocalGenerations();
  await writeLocalGenerations(sortGenerations([record, ...generations]));
  return record;
}

export async function updateGeneration(id: string, input: UpdateGenerationRecord) {
  const supabase = getSupabaseAdminClient();
  const updatedAt = new Date().toISOString();

  if (supabase) {
    const { data, error } = await supabase
      .from("generations")
      .update(mapGenerationToSupabase({ ...input, updatedAt }))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapSupabaseGeneration(data);
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
  return {
    id: row.id,
    prompt: row.prompt,
    negative_prompt: row.negativePrompt,
    aspect_ratio: row.aspectRatio,
    provider: row.provider,
    model: row.model,
    status: row.status,
    image_url: row.imageUrl,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    source_generation_id: row.sourceGenerationId,
    error_message: row.errorMessage,
  };
}
