import { NextResponse } from "next/server";
import { listGenerations } from "@/lib/generation-store";

export async function GET() {
  const generations = await listGenerations();
  return NextResponse.json(generations);
}
