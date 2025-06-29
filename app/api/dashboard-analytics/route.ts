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
  console.log(`[DASHBOARD API] Request for userId: ${userId}`);

  // Fetch all lockers (id, title) for this user
  let lockerIds: string[] = [];
  let lockerTitleMap: Record<string, string> = {};
  if (userId) {
    const { data: userLockers, error: lockersError } = await supabase
      .from("lockers")
      .select("id, title")
      .eq("user_id", userId);
    if (lockersError) {
      console.error("Supabase lockers error:", lockersError);
      return NextResponse.json({ error: lockersError.message }, { status: 500 });
    }
    lockerIds = userLockers?.map((l: any) => l.id) || [];
    lockerTitleMap = (userLockers || []).reduce((acc: Record<string, string>, locker: any) => {
      acc[locker.id] = locker.title;
      return acc;
    }, {});
    console.log(`[DASHBOARD API] User ${userId} has ${lockerIds.length} lockers:`, lockerIds);
  } else {
    const { data: allLockers, error: lockersError } = await supabase
      .from("lockers")
      .select("id, title");
    if (lockersError) {
      console.error("Supabase lockers error:", lockersError);
      return NextResponse.json({ error: lockersError.message }, { status: 500 });
    }
    lockerIds = allLockers?.map((l: any) => l.id) || [];
    lockerTitleMap = (allLockers || []).reduce((acc: Record<string, string>, locker: any) => {
      acc[locker.id] = locker.title;
      return acc;
    }, {});
  }

  // Query analytics for these lockers
  let analytics: any[] = [];
  if (lockerIds.length > 0) {
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("locker_analytics")
      .select("*, locker_id")
      .in('locker_id', lockerIds);
    
    if (analyticsError) {
      console.error("Supabase analytics error:", analyticsError);
      return NextResponse.json({ error: analyticsError.message }, { status: 500 });
    }
    analytics = analyticsData || [];
  } else if (userId) {
    // User has no lockers, return empty analytics
    console.log(`[DEBUG] User ${userId} has no lockers, returning empty analytics`);
    analytics = [];
  } else {
    // Admin view - get all analytics
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("locker_analytics")
      .select("*, locker_id");

    if (analyticsError) {
      console.error("Supabase analytics error:", analyticsError);
      return NextResponse.json({ error: analyticsError.message }, { status: 500 });
  }
    analytics = analyticsData || [];
  }

  // Initialize analytics as empty array if null/undefined
  const analyticsData = analytics || [];

  // Time series for the last 28 days
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = subDays(new Date(), 27 - i);
    return format(d, 'yyyy-MM-dd');
  });
  
  // Get revenue events for chart data calculation
  let revenueEventsForChart: any[] = [];
  if (userId && lockerIds.length > 0) {
    const { data: chartEvents } = await supabase
      .from("revenue_events")
      .select("amount, timestamp")
      .in('locker_id', lockerIds);
    revenueEventsForChart = chartEvents || [];
  } else if (userId) {
    // User has no lockers, return empty revenue events
    revenueEventsForChart = [];
  } else {
    // Admin view - get all revenue events
    const { data: chartEvents } = await supabase
      .from("revenue_events")
      .select("amount, timestamp");
    revenueEventsForChart = chartEvents || [];
  }
  
  const chartData = days.map(date => {
    const views = analyticsData.filter(a => a.event_type === "visit" && a.timestamp && a.timestamp.startsWith(date)).length;
    const unlocks = analyticsData.filter(a => a.event_type === "unlock" && a.timestamp && a.timestamp.startsWith(date)).length;
    const tasks = analyticsData.filter(a => a.event_type === "task_complete" && a.timestamp && a.timestamp.startsWith(date)).length;
    const revenue = revenueEventsForChart
      .filter(e => e.timestamp && e.timestamp.startsWith(date))
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { date, views, unlocks, tasks, revenue };
  });

  // Aggregate metrics
  const views = analyticsData.filter(a => a.event_type === "visit").length;
  const unlocks = analyticsData.filter(a => a.event_type === "unlock").length;
  const taskCompletions = analyticsData.filter(a => a.event_type === "task_complete").length;
  const unlockRate = views ? (unlocks / views) * 100 : 0;

  // Content performance (per locker)
  const contentPerformance: Record<string, { title: string, views: number }> = {};
  analyticsData.forEach(a => {
    if (!contentPerformance[a.locker_id]) {
      contentPerformance[a.locker_id] = { title: lockerTitleMap[a.locker_id] || a.locker_id, views: 0 };
    }
    if (a.event_type === "visit") contentPerformance[a.locker_id].views += 1;
  });

  // Traffic sources
  const sources: Record<string, number> = {};
  analyticsData.forEach(a => {
    const ref = a.referrer || "Direct";
    sources[ref] = (sources[ref] || 0) + 1;
  });

  // Devices & browsers (very basic parsing)
  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  analyticsData.forEach(a => {
    const ua = a.user_agent || "";
    if (ua.includes("Mobile")) devices["Mobile"] = (devices["Mobile"] || 0) + 1;
    else if (ua.includes("Tablet")) devices["Tablet"] = (devices["Tablet"] || 0) + 1;
    else devices["Desktop"] = (devices["Desktop"] || 0) + 1;

    if (ua.includes("Chrome")) browsers["Chrome"] = (browsers["Chrome"] || 0) + 1;
    else if (ua.includes("Firefox")) browsers["Firefox"] = (browsers["Firefox"] || 0) + 1;
    else if (ua.includes("Safari")) browsers["Safari"] = (browsers["Safari"] || 0) + 1;
    else browsers["Other"] = (browsers["Other"] || 0) + 1;
  });

  // Aggregate country data (with fallback to extra field for legacy data)
  const countryData: Record<string, number> = {};
  analyticsData.forEach(a => {
    // Try to get country from dedicated column first, then fallback to extra field
    const country = a.country || (a.extra && a.extra.country);
    if (country) {
      countryData[country] = (countryData[country] || 0) + 1;
    }
  });
  


  // --- USER ANALYTICS ---
  // Total users
  const { data: users, error: usersError } = await supabase.from("users").select("id, joined");
  if (usersError) {
    console.error("Supabase users error:", usersError);
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  const usersData = users || [];
  const totalUsers = usersData.length;
  
  // New users per day (last 28 days)
  const userDays = days.map(date => {
    const count = usersData.filter(u => u.joined && u.joined.startsWith(date)).length;
    return { date, count };
  });
  
  // Daily active users (from analytics)
  const dau = days.map(date => {
    const userSet = new Set(analyticsData.filter(a => a.timestamp && a.timestamp.startsWith(date)).map(a => a.user_id));
    userSet.delete(null); userSet.delete(undefined);
    return { date, count: userSet.size };
  });
  
  // Retention rate: % of users active on 2+ days in last 28
  const userActivity: Record<string, Set<string>> = {};
  analyticsData.forEach(a => {
    if (a.user_id && a.timestamp) {
      const d = a.timestamp.slice(0, 10);
      if (!userActivity[a.user_id]) userActivity[a.user_id] = new Set();
      userActivity[a.user_id].add(d);
    }
  });
  const retainedUsers = Object.values(userActivity).filter(set => set.size > 1).length;
  const retentionRate = totalUsers ? (retainedUsers / totalUsers) * 100 : 0;

  // --- REVENUE ANALYTICS ---
  // Get revenue events for user's lockers (revenue generated from their lockers, regardless of who completed tasks)
  let userRevenue = 0;
  let userEvents: { amount: number|string, task_id: string, tier: string, country: string, timestamp: string }[] = [];
  let userAvgCpm = 0;
  
  if (userId && lockerIds.length > 0) {
    // For specific user, get revenue events from their lockers (regardless of who completed the tasks)
    const { data: events, error: eventsError } = await supabase
      .from("revenue_events")
      .select("amount, task_id, tier, country, timestamp, locker_id")
      .in('locker_id', lockerIds);
    
    console.log(`[DEBUG] Revenue events query for user ${userId} lockers:`, lockerIds);
    console.log(`[DEBUG] Revenue events found:`, events?.length || 0);
    
    if (!eventsError && events) {
      userRevenue = events.reduce((sum, e) => sum + Number(e.amount), 0);
      // Calculate average CPM (weighted by event count)
      userAvgCpm = events.length > 0 ? events.reduce((sum, e) => sum + (Number(e.amount) * 1000), 0) / events.length : 0;
      userEvents = events;
      console.log(`[DEBUG] User revenue calculated: $${userRevenue}, events: ${events.length}`);
    } else if (eventsError) {
      console.error(`[DEBUG] Revenue events error:`, eventsError);
    }
  } else {
    // For admin view, get all revenue events
    const { data: events, error: eventsError } = await supabase
      .from("revenue_events")
      .select("amount, task_id, tier, country, timestamp, locker_id");
    if (!eventsError && events) {
      userRevenue = events.reduce((sum, e) => sum + Number(e.amount), 0);
      userAvgCpm = events.length > 0 ? events.reduce((sum, e) => sum + (Number(e.amount) * 1000), 0) / events.length : 0;
      userEvents = events;
    }
  }

  // Use revenue events for main earnings calculation instead of payments
  const totalEarnings = userRevenue;
  const cpm = taskCompletions > 0 ? userAvgCpm : 0;

  // Total payouts (sum of completed withdrawals)
  let withdrawalsQuery = supabase.from("withdrawals").select("amount, status, user_id");
  if (userId) {
    withdrawalsQuery = withdrawalsQuery.eq("user_id", userId);
  }
  const { data: withdrawals, error: withdrawalsError } = await withdrawalsQuery;
  if (withdrawalsError) {
    console.error("Supabase withdrawals error:", withdrawalsError);
    return NextResponse.json({ error: withdrawalsError.message }, { status: 500 });
  }
  const withdrawalsData = withdrawals || [];
  const totalPayouts = withdrawalsData.filter(w => w.status === "completed").reduce((sum, w) => sum + Number(w.amount), 0);
  const pendingCashouts = withdrawalsData.filter(w => w.status === "pending").reduce((sum, w) => sum + Number(w.amount), 0);
  // Profit margin (earnings - payouts)
  const profitMargin = totalEarnings - totalPayouts;

  // --- RECENT TRANSACTIONS ---
  // Get recent payments from revenue_events instead of payments table
  let recentPaymentsQuery = supabase
    .from("revenue_events")
    .select("amount, task_id, tier, country, timestamp, locker_id, user_id")
    .order("timestamp", { ascending: false })
    .limit(5);
  
  if (userId && lockerIds.length > 0) {
    // For specific user, get revenue events from their lockers
    recentPaymentsQuery = recentPaymentsQuery.in('locker_id', lockerIds);
  } else if (!userId) {
    // For admin view, get all revenue events (no filter needed)
  }
  
  let recentWithdrawalsQuery = supabase.from("withdrawals").select("amount, method, address, requested_at, status, user_id").order("requested_at", { ascending: false }).limit(5);
  if (userId) {
    recentWithdrawalsQuery = recentWithdrawalsQuery.eq("user_id", userId);
  }
  const { data: recentPayments } = await recentPaymentsQuery;
  const { data: recentWithdrawals } = await recentWithdrawalsQuery;

  // Get user's current balance if userId is provided
  let userBalance = 0;
  if (userId) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", userId)
      .single();
    
    if (!userError && userData) {
      userBalance = userData.balance || 0;
    }
  }

  const responseData = {
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
      currentBalance: userBalance,
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
  };

  return NextResponse.json(responseData);
}