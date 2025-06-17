import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { incrementUserBalance } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for inserts
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract IP, user agent, referrer
    const ip = req.headers.get("x-forwarded-for") || req.ip || null;
    const user_agent = req.headers.get("user-agent") || null;
    const referrer = req.headers.get("referer") || null;

    // Compose the analytics row
    const analyticsRow = {
      locker_id: body.locker_id,
      event_type: body.event_type,
      user_id: body.user_id || null,
      ip,
      user_agent,
      referrer,
      task_index: body.task_index || null,
      duration: body.duration || null,
      extra: body.extra || null,
    };

    const { error } = await supabase.from("locker_analytics").insert([analyticsRow]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // CPM Revenue Logic
    if (body.event_type === "task_complete") {
      const { locker_id, task_index, extra } = body;
      const country = extra?.country || "US";
      const tier = extra?.tier || "tier1";

      // 1. Get the locker to find the owner
      const { data: locker, error: lockerError } = await supabase
        .from("lockers")
        .select("user_id")
        .eq("id", locker_id)
        .single();
      if (lockerError || !locker) throw new Error("Locker not found");

      // 2. Get the task to find CPM for the tier
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", task_index)
        .single();
      if (taskError || !task) throw new Error("Task not found");

      // 3. Get CPM for the tier
      let cpm = 0;
      if (tier === "tier1") cpm = parseFloat(task.cpm_tier1);
      else if (tier === "tier2") cpm = parseFloat(task.cpm_tier2);
      else cpm = parseFloat(task.cpm_tier3);

      // 4. Calculate revenue
      const revenue = cpm / 1000;

      // 5. Update user's balance (atomic increment)
      const { error: updateError } = await incrementUserBalance(locker.user_id, revenue);
      if (updateError) throw new Error("Failed to update user balance");

      // 6. Log the revenue event
      await supabase.from("revenue_events").insert([{
        user_id: locker.user_id,
        locker_id,
        task_id: task_index,
        amount: revenue,
        country,
        tier,
        timestamp: new Date().toISOString(),
      }]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // ... your existing code ...
    const { data: analytics, error } = await supabase
      .from("locker_analytics")
      .select("*");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!analytics) {
      console.error("No analytics data returned");
      return NextResponse.json({ error: "No analytics data" }, { status: 500 });
    }

    // ... rest of your aggregation code ...

    return NextResponse.json({
      overview: { /* ... */ },
      contentPerformance: { /* ... */ },
      sources: { /* ... */ },
      devices: { /* ... */ },
      browsers: { /* ... */ },
    });
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}