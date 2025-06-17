import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { subDays, formatISO, format } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Get user_id from query param (for per-user analytics)
  const userId = req.nextUrl.searchParams.get("user_id") || null;

  // 1. Get all lockers for this user
  // const { data: lockers } = await supabase.from("lockers").select("id, title").eq("user_id", userId);

  // Fetch all lockers (id, title)
  const { data: lockers, error: lockersError } = await supabase
    .from("lockers")
    .select("id, title");
  if (lockersError) {
    console.error("Supabase lockers error:", lockersError);
    return NextResponse.json({ error: lockersError.message }, { status: 500 });
  }
  const lockerTitleMap = lockers?.reduce((acc: Record<string, string>, locker: any) => {
    acc[locker.id] = locker.title;
    return acc;
  }, {}) || {};

  // For now, get all analytics (remove .eq for all users, or add .eq for per-user)
  const { data: analytics, error } = await supabase
    .from("locker_analytics")
    .select("*, locker_id")
    // Optionally, filter by user_id if needed
    // .eq('user_id', userId)

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!analytics) {
    console.error("No analytics data returned");
    return NextResponse.json({ error: "No analytics data" }, { status: 500 });
  }

  // Time series for the last 28 days
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = subDays(new Date(), 27 - i);
    return format(d, 'yyyy-MM-dd');
  });
  const chartData = days.map(date => {
    const views = analytics.filter(a => a.event_type === "visit" && a.timestamp && a.timestamp.startsWith(date)).length;
    const unlocks = analytics.filter(a => a.event_type === "unlock" && a.timestamp && a.timestamp.startsWith(date)).length;
    const tasks = analytics.filter(a => a.event_type === "task_complete" && a.timestamp && a.timestamp.startsWith(date)).length;
    return { date, views, unlocks, tasks };
  });

  // Aggregate metrics
  const views = analytics.filter(a => a.event_type === "visit").length;
  const unlocks = analytics.filter(a => a.event_type === "unlock").length;
  const taskCompletions = analytics.filter(a => a.event_type === "task_complete").length;
  const unlockRate = views ? (unlocks / views) * 100 : 0;

  // Content performance (per locker)
  const contentPerformance: Record<string, { title: string, views: number }> = {};
  analytics.forEach(a => {
    if (!contentPerformance[a.locker_id]) {
      contentPerformance[a.locker_id] = { title: lockerTitleMap[a.locker_id] || a.locker_id, views: 0 };
    }
    if (a.event_type === "visit") contentPerformance[a.locker_id].views += 1;
  });

  // Traffic sources
  const sources: Record<string, number> = {};
  analytics.forEach(a => {
    const ref = a.referrer || "Direct";
    sources[ref] = (sources[ref] || 0) + 1;
  });

  // Devices & browsers (very basic parsing)
  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  analytics.forEach(a => {
    const ua = a.user_agent || "";
    if (ua.includes("Mobile")) devices["Mobile"] = (devices["Mobile"] || 0) + 1;
    else if (ua.includes("Tablet")) devices["Tablet"] = (devices["Tablet"] || 0) + 1;
    else devices["Desktop"] = (devices["Desktop"] || 0) + 1;

    if (ua.includes("Chrome")) browsers["Chrome"] = (browsers["Chrome"] || 0) + 1;
    else if (ua.includes("Firefox")) browsers["Firefox"] = (browsers["Firefox"] || 0) + 1;
    else if (ua.includes("Safari")) browsers["Safari"] = (browsers["Safari"] || 0) + 1;
    else browsers["Other"] = (browsers["Other"] || 0) + 1;
  });

  // Aggregate country data
  const countryData: Record<string, number> = {};
  analytics.forEach(a => {
    if (a.country) {
      countryData[a.country] = (countryData[a.country] || 0) + 1;
    }
  });

  // --- USER ANALYTICS ---
  // Total users
  const { data: users, error: usersError } = await supabase.from("users").select("id, joined");
  if (usersError) {
    console.error("Supabase users error:", usersError);
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  const totalUsers = users.length;
  // New users per day (last 28 days)
  const userDays = days.map(date => {
    const count = users.filter(u => u.joined && u.joined.startsWith(date)).length;
    return { date, count };
  });
  // Daily active users (from analytics)
  const dau = days.map(date => {
    const userSet = new Set(analytics.filter(a => a.timestamp && a.timestamp.startsWith(date)).map(a => a.user_id));
    userSet.delete(null); userSet.delete(undefined);
    return { date, count: userSet.size };
  });
  // Retention rate: % of users active on 2+ days in last 28
  const userActivity: Record<string, Set<string>> = {};
  analytics.forEach(a => {
    if (a.user_id && a.timestamp) {
      const d = a.timestamp.slice(0, 10);
      if (!userActivity[a.user_id]) userActivity[a.user_id] = new Set();
      userActivity[a.user_id].add(d);
    }
  });
  const retainedUsers = Object.values(userActivity).filter(set => set.size > 1).length;
  const retentionRate = totalUsers ? (retainedUsers / totalUsers) * 100 : 0;

  // --- REVENUE ANALYTICS ---
  // Total earnings (sum of payments)
  const { data: payments, error: paymentsError } = await supabase.from("payments").select("amount, status");
  if (paymentsError) {
    console.error("Supabase payments error:", paymentsError);
    return NextResponse.json({ error: paymentsError.message }, { status: 500 });
  }
  const totalEarnings = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0);
  // CPM (earnings per 1000 views)
  const cpm = views ? (totalEarnings / views) * 1000 : 0;

  // Total payouts (sum of completed withdrawals)
  const { data: withdrawals, error: withdrawalsError } = await supabase.from("withdrawals").select("amount, status");
  if (withdrawalsError) {
    console.error("Supabase withdrawals error:", withdrawalsError);
    return NextResponse.json({ error: withdrawalsError.message }, { status: 500 });
  }
  const totalPayouts = withdrawals.filter(w => w.status === "completed").reduce((sum, w) => sum + Number(w.amount), 0);
  const pendingCashouts = withdrawals.filter(w => w.status === "pending").reduce((sum, w) => sum + Number(w.amount), 0);
  // Profit margin (earnings - payouts)
  const profitMargin = totalEarnings - totalPayouts;

  // --- RECENT TRANSACTIONS ---
  // Last 10 payments and withdrawals
  const { data: recentPayments } = await supabase.from("payments").select("amount, type, description, created_at, status").order("created_at", { ascending: false }).limit(5);
  const { data: recentWithdrawals } = await supabase.from("withdrawals").select("amount, method, address, requested_at, status").order("requested_at", { ascending: false }).limit(5);

  // --- USER REVENUE EVENTS & AVG CPM ---
  let userRevenue = 0;
  let userEvents = [];
  let userAvgCpm = 0;
  if (userId) {
    const { data: events, error: eventsError } = await supabase
      .from("revenue_events")
      .select("amount, task_id, tier, country, timestamp")
      .eq("user_id", userId);
    if (!eventsError && events && events.length > 0) {
      userRevenue = events.reduce((sum, e) => sum + Number(e.amount), 0);
      // Calculate average CPM (weighted by event count)
      userAvgCpm = events.reduce((sum, e) => sum + (Number(e.amount) * 1000), 0) / events.length;
      userEvents = events;
    }
  }

  return NextResponse.json({
    overview: {
      views,
      unlocks,
      taskCompletions,
      unlockRate,
      totalUsers,
      retentionRate,
      totalEarnings,
      totalPayouts,
      pendingCashouts,
      cpm,
      profitMargin,
    },
    userAnalytics: {
      userDays,
      dau,
      retentionRate,
    },
    userEarnings: {
      totalRevenue: userRevenue,
      avgCpm: userAvgCpm,
      events: userEvents,
    },
    contentPerformance,
    sources,
    devices,
    browsers,
    chartData,
    countryData,
    recentTransactions: {
      payments: recentPayments || [],
      withdrawals: recentWithdrawals || [],
    },
  });
}