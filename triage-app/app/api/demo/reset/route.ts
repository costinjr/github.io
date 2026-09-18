import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { resetDemoData } from "@/lib/demo-reset";

// Gated by proxy.ts's demo-passcode check like every other route in the app.
export async function POST() {
  const result = await resetDemoData(getPool());
  return NextResponse.json(result);
}
