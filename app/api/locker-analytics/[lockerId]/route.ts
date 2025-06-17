import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { subDays, format } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { lockerId: string } }
) {
  const { lockerId } = params;

  const { data: analytics, error } = await supabase
    .from("locker_analytics")
    .select("*")
    .eq("locker_id", lockerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!analytics) {
    return NextResponse.json({ error: "No analytics data" }, { status: 500 });
  }

  // Time series for the last 28 days
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = subDays(new Date(), 27 - i);
    return format(d, "yyyy-MM-dd");
  });
  const chartData = days.map((date) => {
    const views = analytics.filter(
      (a) => a.event_type === "visit" && a.timestamp && a.timestamp.startsWith(date)
    ).length;
    const unlocks = analytics.filter(
      (a) => a.event_type === "unlock" && a.timestamp && a.timestamp.startsWith(date)
    ).length;
    const tasks = analytics.filter(
      (a) => a.event_type === "task_complete" && a.timestamp && a.timestamp.startsWith(date)
    ).length;
    return { date, views, unlocks, tasks };
  });

  const views = analytics.filter((a) => a.event_type === "visit").length;
  const unlocks = analytics.filter((a) => a.event_type === "unlock").length;
  const taskCompletions = analytics.filter((a) => a.event_type === "task_complete").length;
  const unlockRate = views ? (unlocks / views) * 100 : 0;

  const sources: Record<string, number> = {};
  analytics.forEach((a) => {
    const ref = a.referrer || "Direct";
    sources[ref] = (sources[ref] || 0) + 1;
  });

  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  analytics.forEach((a) => {
    const ua = a.user_agent || "";
    if (ua.includes("Mobile")) devices["Mobile"] = (devices["Mobile"] || 0) + 1;
    else if (ua.includes("Tablet")) devices["Tablet"] = (devices["Tablet"] || 0) + 1;
    else devices["Desktop"] = (devices["Desktop"] || 0) + 1;

    if (ua.includes("Chrome")) browsers["Chrome"] = (browsers["Chrome"] || 0) + 1;
    else if (ua.includes("Firefox")) browsers["Firefox"] = (browsers["Firefox"] || 0) + 1;
    else if (ua.includes("Safari")) browsers["Safari"] = (browsers["Safari"] || 0) + 1;
    else browsers["Other"] = (browsers["Other"] || 0) + 1;
  });

  return NextResponse.json({
    overview: {
      views,
      unlocks,
      taskCompletions,
      unlockRate,
    },
    chartData,
    sources,
    devices,
    browsers,
  });
} 