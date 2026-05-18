import { NextResponse } from "next/server";
import { usingLocalFallback } from "@/lib/generation-store";

export async function GET() {
  return NextResponse.json({ usingLocalFallback: Boolean(usingLocalFallback) });
}
