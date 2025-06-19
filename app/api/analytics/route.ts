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
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
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
      console.log("[DEBUG] Processing task completion for revenue calculation...");
      const { locker_id, task_index, extra, user_id } = body;
      const country = extra?.country || "US";
      const tier = extra?.tier || "tier1";

      console.log("[DEBUG] Task completion details:", { locker_id, task_index, country, tier, user_id });

      // 1. Get the locker to find the owner
      const { data: locker, error: lockerError } = await supabase
        .from("lockers")
        .select("user_id")
        .eq("id", locker_id)
        .single();
      
      if (lockerError || !locker) {
        console.error("[ERROR] Locker not found:", lockerError);
        throw new Error("Locker not found");
      }

      console.log("[DEBUG] Locker owner:", locker.user_id);

      // 2. Get the task to find CPM for the tier
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", task_index)
        .single();
      
      if (taskError || !task) {
        console.error("[ERROR] Task not found:", taskError);
        throw new Error("Task not found");
      }

      console.log("[DEBUG] Task details:", { id: task.id, cpm_tier1: task.cpm_tier1, cpm_tier2: task.cpm_tier2, cpm_tier3: task.cpm_tier3 });

      // 3. Get CPM for the tier
      let cpm = 0;
      if (tier === "tier1") cpm = parseFloat(task.cpm_tier1) || 0;
      else if (tier === "tier2") cpm = parseFloat(task.cpm_tier2) || 0;
      else cpm = parseFloat(task.cpm_tier3) || 0;

      console.log("[DEBUG] CPM for tier", tier, ":", cpm);

      // 4. Calculate revenue (CPM is per 1000 views, so divide by 1000)
      const revenue = cpm / 1000;
      console.log("[DEBUG] Calculated revenue:", revenue);

      // 5. Update user's balance (try direct update if RPC fails)
      try {
        const { error: updateError } = await incrementUserBalance(locker.user_id, revenue);
        if (updateError) {
          console.warn("[WARN] RPC increment failed, trying direct update:", updateError);
          // Fallback to direct update - get current balance first, then update
          const { data: userData, error: getUserError } = await supabase
            .from("users")
            .select("balance")
            .eq("id", locker.user_id)
            .single();
          
          if (getUserError) {
            console.error("[ERROR] Failed to get user balance:", getUserError);
            throw new Error("Failed to update user balance");
          }
          
          const currentBalance = parseFloat(userData?.balance || "0") || 0;
          const newBalance = currentBalance + revenue;
          
          const { error: directUpdateError } = await supabase
            .from("users")
            .update({ balance: newBalance })
            .eq("id", locker.user_id);
          
          if (directUpdateError) {
            console.error("[ERROR] Direct balance update failed:", directUpdateError);
            throw new Error("Failed to update user balance");
          }
        }
        console.log("[DEBUG] User balance updated successfully");
      } catch (balanceError) {
        console.error("[ERROR] Balance update error:", balanceError);
        // Continue with revenue event logging even if balance update fails
      }

      // 6. Log the revenue event
      const revenueEventData = {
        user_id: locker.user_id,
        locker_id,
        task_id: task_index,
        amount: revenue,
        country,
        tier,
        timestamp: new Date().toISOString(),
      };
      
      console.log("[DEBUG] Creating revenue event:", revenueEventData);
      
      const { error: revenueError } = await supabase
        .from("revenue_events")
        .insert([revenueEventData]);
      
      if (revenueError) {
        console.error("[ERROR] Failed to create revenue event:", revenueError);
        throw new Error("Failed to log revenue event");
      }
      
      console.log("[DEBUG] Revenue event created successfully");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Simple test endpoint to check revenue events and tasks
    const { data: tasks, error: tasksError } = await supabase.from("tasks").select("*");
    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    const { data: revenueEvents, error: revenueError } = await supabase
      .from("revenue_events")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);
    
    if (revenueError) {
      return NextResponse.json({ error: revenueError.message }, { status: 500 });
    }

    const { data: analytics, error: analyticsError } = await supabase
      .from("locker_analytics")
      .select("*")
      .eq("event_type", "task_complete")
      .order("timestamp", { ascending: false })
      .limit(10);
    
    if (analyticsError) {
      return NextResponse.json({ error: analyticsError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Revenue system test endpoint",
      tasks: tasks?.map(t => ({
        id: t.id,
        title: t.title,
        cpm_tier1: t.cpm_tier1,
        cpm_tier2: t.cpm_tier2,
        cpm_tier3: t.cpm_tier3,
        status: t.status
      })),
      recentRevenueEvents: revenueEvents,
      recentTaskCompletions: analytics,
      summary: {
        totalTasks: tasks?.length || 0,
        totalRevenueEvents: revenueEvents?.length || 0,
        totalTaskCompletions: analytics?.length || 0,
        totalRevenue: revenueEvents?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}