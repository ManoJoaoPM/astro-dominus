import { NextResponse } from "next/server";
import { BLOCK_TEMPLATES } from "@/constants/marketing/blocks";

export async function GET() {
  return NextResponse.json({ data: BLOCK_TEMPLATES });
}
