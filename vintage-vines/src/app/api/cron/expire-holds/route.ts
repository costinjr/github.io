import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { sweepExpiredHolds } from "@/lib/claims/expire-holds";
import { logError } from "@/lib/log-error";

export async function GET(request: NextRequest) {
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await sweepExpiredHolds();
    return NextResponse.json(result);
  } catch (error) {
    logError("cron/expire-holds", error);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
