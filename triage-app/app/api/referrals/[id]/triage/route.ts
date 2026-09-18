import { NextResponse } from "next/server";
import { getReferralById } from "@/lib/referrals";
import { runTriagePipeline } from "@/lib/triage";

// Gated by proxy.ts's demo-passcode check like every other route in the app.
// Runs extraction, applies the deterministic rules, and persists an
// immutable triage_run — see lib/triage.ts for the full pipeline. Each call
// creates a new run rather than overwriting the last one, so this endpoint
// doubles as both the initial "Run Triage" and "Re-run Triage" action.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const referral = await getReferralById(id);
  if (!referral) {
    return NextResponse.json({ error: "Referral not found." }, { status: 404 });
  }

  const outcome = await runTriagePipeline(referral);
  return NextResponse.json(outcome);
}
