import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { locker_id, event_type, user_id, task_index, duration, extra } = await req.json();
    
    console.log('[ANALYTICS API] Received event:', {
      locker_id,
      event_type,
      user_id,
      task_index,
      duration,
      extra
    });

    // Get user's IP and user agent
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";

    // Insert analytics event
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("locker_analytics")
      .insert({
        locker_id,
        event_type,
        user_id: user_id || null,
        timestamp: new Date().toISOString(),
        ip,
        user_agent: userAgent,
        referrer,
        duration,
        extra,
        task_index,
      })
      .select();

    if (analyticsError) {
      console.error('[ANALYTICS API] Error inserting analytics:', analyticsError);
      return NextResponse.json({ error: analyticsError.message }, { status: 500 });
    }

    console.log('[ANALYTICS API] Analytics event inserted:', analyticsData);

    // If this is a task completion, handle revenue calculation
    if (event_type === "task_complete" && user_id && task_index !== null && extra?.country && extra?.tier) {
      console.log('[ANALYTICS API] Processing task completion for revenue...');
      
      try {
        // Get the task details to find CPM rate
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("id, cpm_tier1, cpm_tier2, cpm_tier3")
          .eq("id", task_index);

        if (tasksError || !tasks || tasks.length === 0) {
          console.error('[ANALYTICS API] Error fetching task:', tasksError);
          return NextResponse.json({ success: true, warning: "Task not found for revenue calculation" });
        }

        const task = tasks[0];
        console.log('[ANALYTICS API] Found task:', task);

        // Calculate revenue based on tier
        let cpmRate = 0;
        switch (extra.tier) {
          case 'tier1':
            cpmRate = task.cpm_tier1 || 0;
            break;
          case 'tier2':
            cpmRate = task.cpm_tier2 || 0;
            break;
          case 'tier3':
            cpmRate = task.cpm_tier3 || 0;
            break;
          default:
            cpmRate = task.cpm_tier3 || 0; // Default to tier3
        }

        // Convert CPM to revenue per task (CPM is per 1000 impressions, so divide by 1000)
        const revenue = cpmRate / 1000;

        console.log('[ANALYTICS API] Revenue calculation:', {
          tier: extra.tier,
          cpmRate,
          revenue,
          country: extra.country
        });

        // Insert revenue event
        const { data: revenueData, error: revenueError } = await supabase
          .from("revenue_events")
          .insert({
            user_id,
            locker_id,
            task_id: task_index.toString(),
            amount: revenue,
            country: extra.country,
            tier: extra.tier,
            timestamp: new Date().toISOString(),
          })
          .select();

        if (revenueError) {
          console.error('[ANALYTICS API] Error inserting revenue event:', revenueError);
          return NextResponse.json({ error: revenueError.message }, { status: 500 });
        }

        console.log('[ANALYTICS API] Revenue event inserted:', revenueData);

        // Update user balance
        const { data: currentBalance, error: balanceError } = await supabase
          .from("users")
          .select("balance")
          .eq("id", user_id)
          .single();

        if (balanceError) {
          console.log('[ANALYTICS API] User not found in users table, creating...');
          // Create user if doesn't exist
          const { error: createUserError } = await supabase
            .from("users")
            .insert({
              id: user_id,
              balance: revenue,
              joined: new Date().toISOString(),
            });
          
          if (createUserError) {
            console.error('[ANALYTICS API] Error creating user:', createUserError);
          } else {
            console.log('[ANALYTICS API] User created with balance:', revenue);
          }
        } else {
          // Update existing user balance
          const newBalance = (currentBalance.balance || 0) + revenue;
          const { error: updateError } = await supabase
            .from("users")
            .update({ balance: newBalance })
            .eq("id", user_id);

          if (updateError) {
            console.error('[ANALYTICS API] Error updating user balance:', updateError);
          } else {
            console.log('[ANALYTICS API] User balance updated:', { 
              oldBalance: currentBalance.balance, 
              newBalance 
            });
          }
        }

        return NextResponse.json({ 
          success: true, 
          revenue_calculated: revenue,
          cpm_rate: cpmRate,
          tier: extra.tier
        });
      } catch (revenueError) {
        console.error('[ANALYTICS API] Error in revenue calculation:', revenueError);
        return NextResponse.json({ 
          success: true, 
          warning: "Analytics tracked but revenue calculation failed",
          error: revenueError
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ANALYTICS API] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint for testing/debugging
export async function GET(req: NextRequest) {
  try {
    console.log('[ANALYTICS API] GET request - fetching test data...');
    
    // Get recent analytics events
    const { data: recentEvents, error: eventsError } = await supabase
      .from("locker_analytics")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    // Get recent revenue events  
    const { data: revenueEvents, error: revenueError } = await supabase
      .from("revenue_events")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    // Get tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, cpm_tier1, cpm_tier2, cpm_tier3, status");

    // Calculate totals
    const totalRevenue = revenueEvents?.reduce((sum, event) => sum + Number(event.amount), 0) || 0;
    const totalEvents = recentEvents?.length || 0;
    const taskCompletions = recentEvents?.filter(e => e.event_type === 'task_complete').length || 0;

    const response = {
      message: "Analytics API test endpoint",
      timestamp: new Date().toISOString(),
      recent_events: recentEvents || [],
      recent_revenue_events: revenueEvents || [],
      tasks: tasks || [],
      summary: {
        total_events: totalEvents,
        task_completions: taskCompletions,
        total_revenue: totalRevenue,
        revenue_events_count: revenueEvents?.length || 0
      },
      errors: {
        events_error: eventsError,
        revenue_error: revenueError,
        tasks_error: tasksError
      }
    };

    console.log('[ANALYTICS API] GET response summary:', response.summary);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[ANALYTICS API] GET error:', error);
    return NextResponse.json({ error: "Failed to fetch test data" }, { status: 500 });
  }
}