import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { locker_id, event_type, user_id, task_id, duration, extra } = await req.json();
    
    console.log('[ANALYTICS API] Received event:', {
      locker_id,
      event_type,
      user_id: user_id || 'anonymous',
      task_id,
      duration,
      extra
    });

    // Get user's IP and user agent
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";

    // Extract country from extra field for dedicated column
    const country = extra?.country || null;
    
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
        country, // Store country in dedicated column for geographic analytics
        task_index: null, // Keep this null since we're using task_id now
      })
      .select();

    if (analyticsError) {
      console.error('[ANALYTICS API] Error inserting analytics:', analyticsError);
      return NextResponse.json({ error: analyticsError.message }, { status: 500 });
    }

    console.log('[ANALYTICS API] Analytics event inserted successfully');

    // If this is a task completion, handle revenue calculation
    if (event_type === "task_complete" && task_id && extra?.country && extra?.tier) {
      console.log('[ANALYTICS API] Processing task completion for revenue...');
      
      try {
        // Get the task details to find CPM rate using the UUID
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("id, cpm_tier1, cpm_tier2, cpm_tier3")
          .eq("id", task_id);

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
          country: extra.country,
          hasUser: !!user_id
        });

        // Get the publisher (locker owner) to credit revenue to
        const { data: lockerData, error: lockerError } = await supabase
          .from('lockers')
          .select('user_id')
          .eq('id', locker_id)
          .single();
        
        if (lockerError) {
          console.error('[ANALYTICS API] Error fetching locker owner:', lockerError);
          return NextResponse.json({ 
            success: true, 
            warning: "Could not determine locker owner for revenue" 
          });
        }
        
        const publisherId = lockerData.user_id;
        console.log('[ANALYTICS API] Revenue will be credited to publisher:', publisherId);
        
        // Create revenue event for the publisher (locker owner), not the visitor
        const { data: revenueData, error: revenueError } = await supabase
          .from("revenue_events")
          .insert({
            user_id: publisherId, // Credit revenue to publisher, not visitor
            locker_id,
            task_id: task_id, // Use the UUID directly
            amount: revenue,
            country: extra.country,
            tier: extra.tier,
            timestamp: new Date().toISOString(),
          })
          .select();

        if (revenueError) {
          console.error('[ANALYTICS API] Error inserting revenue event:', revenueError);
          
          // If it's a foreign key constraint error, try to create the publisher user first
          if (revenueError.message.includes('foreign key constraint') || revenueError.message.includes('user_id_fkey')) {
            console.log('[ANALYTICS API] Foreign key error detected, creating publisher user first...');
            
            // Create publisher user if doesn't exist with minimal required fields
            const { error: createUserError } = await supabase
              .from("users")
              .insert({
                id: publisherId,
                email: `${publisherId}@temp.local`, // Temporary email to satisfy not-null constraint
                balance: revenue,
                joined: new Date().toISOString(),
                status: 'Active',
                role: 'user'
              })
              .select();
            
            if (createUserError && !createUserError.message.includes('duplicate key')) {
              console.error('[ANALYTICS API] Error creating publisher user:', createUserError);
              return NextResponse.json({ error: createUserError.message }, { status: 500 });
            }
            
            // Try inserting revenue event again
            const { data: retryRevenueData, error: retryRevenueError } = await supabase
              .from("revenue_events")
              .insert({
                user_id: publisherId,
                locker_id,
                task_id: task_id,
                amount: revenue,
                country: extra.country,
                tier: extra.tier,
                timestamp: new Date().toISOString(),
              })
              .select();
            
            if (retryRevenueError) {
              console.error('[ANALYTICS API] Error inserting revenue event after publisher creation:', retryRevenueError);
              return NextResponse.json({ error: retryRevenueError.message }, { status: 500 });
            }
            
            console.log('[ANALYTICS API] Revenue event inserted after publisher creation:', retryRevenueData);
            
            return NextResponse.json({ 
              success: true, 
              revenue_calculated: revenue,
              cpm_rate: cpmRate,
              tier: extra.tier,
              publisher_credited: publisherId,
              publisher_created: true
            });
          } else {
            return NextResponse.json({ error: revenueError.message }, { status: 500 });
          }
        }

        console.log('[ANALYTICS API] Revenue event inserted:', revenueData);

        // Update publisher balance (not visitor balance)
        const { data: currentBalance, error: balanceError } = await supabase
          .from("users")
          .select("balance")
          .eq("id", publisherId)
          .single();

        if (balanceError) {
          console.log('[ANALYTICS API] Publisher not found in users table, creating...');
          // Create publisher if doesn't exist with required fields
          const { error: createUserError } = await supabase
            .from("users")
            .insert({
              id: publisherId,
              email: `${publisherId}@temp.local`, // Temporary email to satisfy not-null constraint
              balance: revenue,
              joined: new Date().toISOString(),
              status: 'Active',
              role: 'user'
            });
          
          if (createUserError && !createUserError.message.includes('duplicate key')) {
            console.error('[ANALYTICS API] Error creating publisher:', createUserError);
          } else {
            console.log('[ANALYTICS API] Publisher created with balance:', revenue);
          }
        } else {
          // Update existing publisher balance
          const newBalance = (currentBalance.balance || 0) + revenue;
          const { error: updateError } = await supabase
            .from("users")
            .update({ balance: newBalance })
            .eq("id", publisherId);

          if (updateError) {
            console.error('[ANALYTICS API] Error updating publisher balance:', updateError);
          } else {
            console.log('[ANALYTICS API] Publisher balance updated:', { 
              publisherId,
              oldBalance: currentBalance.balance, 
              newBalance 
            });
          }
        }

        return NextResponse.json({ 
          success: true, 
          revenue_calculated: revenue,
          cpm_rate: cpmRate,
          tier: extra.tier,
          publisher_credited: publisherId,
          visitor_authenticated: !!user_id
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