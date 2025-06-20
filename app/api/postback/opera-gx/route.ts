import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Set your Opera GX task ID here (UUID from your tasks table)
const OPERA_GX_TASK_ID = "617c772b-e868-404c-8113-645214ac2476"; // <-- Replace with your real Opera GX task UUID

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sub1 = searchParams.get("sub1");
    // payout and conversion_ip are still parsed for logging, but payout will be ignored
    const payout = searchParams.get("payout");
    const conversion_ip = searchParams.get("conversion_ip");

    if (!sub1) {
      return NextResponse.json({ error: "Missing sub1" }, { status: 400 });
    }

    // Find the locker/task/user from sub1 (assume sub1 is locker_id)
    const { data: locker, error: lockerError } = await supabase
      .from("lockers")
      .select("id, user_id")
      .eq("id", sub1)
      .single();

    if (lockerError || !locker) {
      console.error("[OperaGX Postback] Locker not found for sub1:", sub1, lockerError);
      return NextResponse.json({ error: "Locker not found" }, { status: 404 });
    }

    // Fetch CPM for Opera GX from tasks table (use cpm_tier1 as default, or add logic for country/tier if needed)
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("cpm_tier1, cpm_tier2, cpm_tier3")
      .eq("id", OPERA_GX_TASK_ID)
      .single();
    if (taskError || !task) {
      console.error("[OperaGX Postback] Opera GX task not found:", OPERA_GX_TASK_ID, taskError);
      return NextResponse.json({ error: "Opera GX task not found" }, { status: 404 });
    }
    // For now, always use cpm_tier1 (you can add logic for country/tier if you want)
    const cpm = Number(task.cpm_tier1) || 0;
    const amount = cpm / 1000;

    const publisherId = locker.user_id;
    const lockerId = locker.id;
    const taskId = OPERA_GX_TASK_ID;
    const country = null; // Not available from postback
    const tier = null; // Not available from postback
    const device = null; // Not available from postback
    const rateSource = "postback";
    const timestamp = new Date().toISOString();

    // Insert revenue event
    const { error: revenueError } = await supabase
      .from("revenue_events")
      .insert({
        user_id: publisherId,
        locker_id: lockerId,
        task_id: taskId,
        amount,
        country,
        tier,
        device,
        rate_source: rateSource,
        timestamp,
      });
    if (revenueError) {
      console.error("[OperaGX Postback] Error inserting revenue event:", revenueError);
      return NextResponse.json({ error: "Failed to log revenue" }, { status: 500 });
    }

    // Update publisher balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", publisherId)
      .single();
    if (!userError && user) {
      const newBalance = (user.balance || 0) + amount;
      await supabase.from("users").update({ balance: newBalance }).eq("id", publisherId);
    }

    // Log analytics event (optional)
    await supabase.from("locker_analytics").insert({
      locker_id: lockerId,
      event_type: "task_complete",
      user_id: publisherId,
      timestamp,
      ip: conversion_ip || null,
      user_agent: "OperaGX-Postback",
      referrer: "postback",
      duration: null,
      extra: { postback: true, payout_macro: payout, used_cpm: cpm, conversion_ip },
      country: null,
      task_index: null,
    });

    // Log for debugging
    console.log(`[OperaGX Postback] Credited publisher ${publisherId} for Opera GX install via postback. Locker: ${lockerId}, Amount: $${amount} (CPM: $${cpm})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OperaGX Postback] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 