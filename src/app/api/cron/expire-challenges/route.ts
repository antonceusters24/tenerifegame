import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getTable } from "@/lib/tables";
import { GAME_DATES } from "@/lib/game";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Get current date in Canary Islands timezone (Atlantic/Canary)
  const now = new Date();
  const canaryDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Atlantic/Canary" })
  );
  const canaryDateStr = `${canaryDate.getFullYear()}-${String(canaryDate.getMonth() + 1).padStart(2, "0")}-${String(canaryDate.getDate()).padStart(2, "0")}`;

  // Find which days have passed (their date is before today in Canary time)
  const expiredDays: number[] = [];
  for (let i = 0; i < GAME_DATES.length; i++) {
    if (GAME_DATES[i] < canaryDateStr) {
      expiredDays.push(i + 1); // days are 1-indexed
    }
  }

  if (expiredDays.length === 0) {
    return NextResponse.json({ message: "No expired days yet", expiredDays: [] });
  }

  // Find all active assignments for expired days and mark them as skipped
  // Do NOT expire "pending" assignments (they were submitted, awaiting approval)
  const { data: expired, error } = await supabase
    .from(getTable("assignments"))
    .update({ status: "skipped", completed_at: new Date().toISOString() })
    .eq("status", "active")
    .in("day", expiredDays)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Expired ${expired?.length ?? 0} active assignments`,
    expiredDays,
    expiredCount: expired?.length ?? 0,
  });
}
