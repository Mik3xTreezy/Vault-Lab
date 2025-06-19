import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get user's IP address from request
function getUserIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const userIp = forwarded?.split(',')[0] || realIp || 'unknown';
  return userIp;
}

export async function POST(req: NextRequest) {
  try {
    const { taskId, lockerId, userId, country, device, eventType } = await req.json();
    const userIP = getUserIP(req);
    
    console.log(`[IP TRACKING] Checking IP ${userIP} for ${eventType || 'task completion'} on task ${taskId || 'locker ' + lockerId}`);
    
    // For locker-level events (views, unlocks), check against locker_id
    // For task-level events (task_complete), check against task_id
    const isLockerEvent = eventType === 'visit' || eventType === 'unlock';
    const searchField = isLockerEvent ? 'locker_id' : 'task_id';
    const searchValue = isLockerEvent ? lockerId : taskId;
    
    // Check if this IP has performed this action in the last 24 hours
    let query = supabase
      .from("ip_task_tracking")
      .select("*")
      .eq("ip_address", userIP)
      .eq("locker_id", lockerId)
      .eq("event_type", eventType || 'task_complete');
    
    // For task-specific events, also filter by task_id
    if (!isLockerEvent && taskId) {
      query = query.eq("task_id", taskId);
    } else if (isLockerEvent) {
      // For locker events, task_id should be null
      query = query.is("task_id", null);
    }
    
    const { data: existingRecord, error: fetchError } = await query.single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("[IP TRACKING] Error fetching existing record:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (existingRecord) {
      const firstCompletion = new Date(existingRecord.first_completion_at);
      const isWithin24Hours = firstCompletion > twentyFourHoursAgo;
      
      if (isWithin24Hours) {
        // Update completion count but don't count for revenue
        const { error: updateError } = await supabase
          .from("ip_task_tracking")
          .update({
            last_completion_at: now.toISOString(),
            completion_count: existingRecord.completion_count + 1
          })
          .eq("id", existingRecord.id);
        
        if (updateError) {
          console.error("[IP TRACKING] Error updating record:", updateError);
        }
        
        console.log(`[IP TRACKING] ❌ BLOCKED: IP ${userIP} already performed ${eventType || 'task completion'} within 24h`);
        return NextResponse.json({
          shouldCount: false,
          reason: "duplicate_ip_24h",
          message: `This IP has already performed this action within the last 24 hours`,
          firstActionAt: existingRecord.first_completion_at,
          actionCount: existingRecord.completion_count + 1,
          eventType: eventType || 'task_complete'
        });
      } else {
        // More than 24 hours ago, reset the tracking
        const { error: resetError } = await supabase
          .from("ip_task_tracking")
          .update({
            first_completion_at: now.toISOString(),
            last_completion_at: now.toISOString(),
            completion_count: 1,
            revenue_counted: true
          })
          .eq("id", existingRecord.id);
        
        if (resetError) {
          console.error("[IP TRACKING] Error resetting record:", resetError);
          return NextResponse.json({ error: resetError.message }, { status: 500 });
        }
        
        console.log(`[IP TRACKING] ✅ ALLOWED: IP ${userIP} last performed action more than 24h ago`);
        return NextResponse.json({
          shouldCount: true,
          reason: "24h_cooldown_expired",
          message: "Analytics counting allowed - 24 hour cooldown expired",
          actionCount: 1,
          eventType: eventType || 'task_complete'
        });
      }
    } else {
      // First time this IP is performing this action
      const insertData: any = {
        ip_address: userIP,
        locker_id: lockerId,
        user_id: userId,
        country: country,
        device: device,
        event_type: eventType || 'task_complete',
        revenue_counted: true,
        first_completion_at: now.toISOString(),
        last_completion_at: now.toISOString(),
        completion_count: 1
      };
      
      // Only set task_id for task-specific events
      if (!isLockerEvent && taskId) {
        insertData.task_id = taskId;
      }
      
      const { error: insertError } = await supabase
        .from("ip_task_tracking")
        .insert([insertData]);
      
      if (insertError) {
        console.error("[IP TRACKING] Error inserting new record:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      
      console.log(`[IP TRACKING] ✅ ALLOWED: First ${eventType || 'completion'} for IP ${userIP}`);
      return NextResponse.json({
        shouldCount: true,
        reason: "first_action",
        message: `Analytics counting allowed - first ${eventType || 'completion'} from this IP`,
        actionCount: 1,
        eventType: eventType || 'task_complete'
      });
    }
    
  } catch (error: any) {
    console.error("[IP TRACKING] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const userIP = getUserIP(req);
    
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }
    
    // Check current status for this IP/task combination
    const { data: record, error } = await supabase
      .from("ip_task_tracking")
      .select("*")
      .eq("ip_address", userIP)
      .eq("task_id", taskId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("[IP TRACKING] Error fetching record:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!record) {
      return NextResponse.json({
        canComplete: true,
        reason: "no_previous_completion",
        message: "No previous completion found for this IP"
      });
    }
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const firstCompletion = new Date(record.first_completion_at);
    const isWithin24Hours = firstCompletion > twentyFourHoursAgo;
    
    if (isWithin24Hours) {
      const timeRemaining = firstCompletion.getTime() + (24 * 60 * 60 * 1000) - now.getTime();
      const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
      
      return NextResponse.json({
        canComplete: false,
        reason: "within_24h_cooldown",
        message: `Must wait ${hoursRemaining} more hours before next revenue-counting completion`,
        hoursRemaining,
        completionCount: record.completion_count,
        firstCompletionAt: record.first_completion_at
      });
    }
    
    return NextResponse.json({
      canComplete: true,
      reason: "cooldown_expired",
      message: "24 hour cooldown has expired, can complete for revenue",
      completionCount: record.completion_count
    });
    
  } catch (error: any) {
    console.error("[IP TRACKING] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 