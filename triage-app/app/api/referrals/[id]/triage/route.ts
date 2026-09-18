import { NextResponse } from "next/server";
import { runExtraction } from "@/lib/extraction";
import { getReferralById } from "@/lib/referrals";

// Gated by proxy.ts's demo-passcode check like every other route in the app.
// Runs extraction only — assigning priority, owner, and due time from
// rules, and persisting a triage_run, is wired in a later session.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const referral = await getReferralById(id);
  if (!referral) {
    return NextResponse.json({ error: "Referral not found." }, { status: 404 });
  }

  const outcome = await runExtraction(referral.rawText);
  return NextResponse.json(outcome);
}
