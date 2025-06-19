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
    
    console.log(`[IP TRACKING] Checking IP ${userIP} for ${eventType || 'task completion'} on locker ${lockerId}`);
    
    // Get the publisher (owner) of this locker
    const { data: lockerData, error: lockerError } = await supabase
      .from('lockers')
      .select('user_id')
      .eq('id', lockerId)
      .single();
    
    if (lockerError) {
      console.error('[IP TRACKING] Error fetching locker data:', lockerError);
      return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
    }
    
    const publisherId = lockerData.user_id;
    console.log(`[IP TRACKING] Publisher ID: ${publisherId}`);
    
    // For locker-level events (views, unlocks), check against locker_id
    // For task-level events (task_complete), check against task_id
    const isLockerEvent = eventType === 'visit' || eventType === 'unlock';
    const searchField = isLockerEvent ? 'locker_id' : 'task_id';
    const searchValue = isLockerEvent ? lockerId : taskId;
    
    // Check if this IP has performed ANY action for this PUBLISHER in the last 24 hours
    // This prevents revenue farming across multiple links from the same publisher
    const { data: existingRecords, error: fetchRecordsError } = await supabase
      .from("ip_task_tracking")
      .select("*")
      .eq("ip_address", userIP)
      .eq("publisher_id", publisherId);
    
    if (fetchRecordsError) {
      console.error("[IP TRACKING] Error fetching existing records:", fetchRecordsError);
      return NextResponse.json({ error: fetchRecordsError.message }, { status: 500 });
    }
    
    // Find the most recent record for this IP + publisher combination
    const existingRecord = existingRecords && existingRecords.length > 0 
      ? existingRecords.sort((a, b) => new Date(b.first_completion_at).getTime() - new Date(a.first_completion_at).getTime())[0]
      : null;
    
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
        
        console.log(`[IP TRACKING] ❌ BLOCKED: IP ${userIP} already interacted with publisher ${publisherId} within 24h`);
        return NextResponse.json({
          shouldCount: false,
          reason: "duplicate_ip_publisher_24h",
          message: `This IP has already interacted with this publisher within the last 24 hours`,
          firstActionAt: existingRecord.first_completion_at,
          actionCount: existingRecord.completion_count + 1,
          eventType: eventType || 'task_complete',
          publisherId: publisherId
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
        
        console.log(`[IP TRACKING] ✅ ALLOWED: IP ${userIP} last interacted with publisher ${publisherId} more than 24h ago`);
        return NextResponse.json({
          shouldCount: true,
          reason: "24h_cooldown_expired",
          message: "Analytics counting allowed - 24 hour publisher cooldown expired",
          actionCount: 1,
          eventType: eventType || 'task_complete',
          publisherId: publisherId
        });
      }
    } else {
      // First time this IP is interacting with this PUBLISHER
      const insertData: any = {
        ip_address: userIP,
        locker_id: lockerId, // Keep for reference
        publisher_id: publisherId, // Track by publisher instead of individual locker
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
      
      console.log(`[IP TRACKING] ✅ ALLOWED: First interaction between IP ${userIP} and publisher ${publisherId}`);
      return NextResponse.json({
        shouldCount: true,
        reason: "first_publisher_interaction",
        message: `Analytics counting allowed - first interaction with this publisher from this IP`,
        actionCount: 1,
        eventType: eventType || 'task_complete',
        publisherId: publisherId
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
    const lockerId = searchParams.get('lockerId');
    const userIP = getUserIP(req);
    
    if (!taskId && !lockerId) {
      return NextResponse.json({ error: "taskId or lockerId is required" }, { status: 400 });
    }
    
    // Get publisher ID from locker
    let publisherId = null;
    if (lockerId) {
      const { data: lockerData, error: lockerError } = await supabase
        .from('lockers')
        .select('user_id')
        .eq('id', lockerId)
        .single();
      
      if (lockerError) {
        return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
      }
      publisherId = lockerData.user_id;
    } else if (taskId) {
      // Get publisher ID from task -> locker relationship
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('locker_id')
        .eq('id', taskId)
        .single();
      
      if (taskError) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      
      const { data: lockerData, error: lockerError } = await supabase
        .from('lockers')
        .select('user_id')
        .eq('id', taskData.locker_id)
        .single();
      
      if (lockerError) {
        return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
      }
      publisherId = lockerData.user_id;
    }
    
    // Check current status for this IP/publisher combination
    const { data: records, error } = await supabase
      .from("ip_task_tracking")
      .select("*")
      .eq("ip_address", userIP)
      .eq("publisher_id", publisherId);
    
    const record = records && records.length > 0 
      ? records.sort((a, b) => new Date(b.first_completion_at).getTime() - new Date(a.first_completion_at).getTime())[0]
      : null;
    
    if (error) {
      console.error("[IP TRACKING] Error fetching records:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!record) {
      return NextResponse.json({
        canComplete: true,
        reason: "no_previous_interaction",
        message: "No previous interaction found between this IP and publisher"
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
        reason: "within_24h_publisher_cooldown",
        message: `Must wait ${hoursRemaining} more hours before next interaction with this publisher counts for revenue`,
        hoursRemaining,
        completionCount: record.completion_count,
        firstCompletionAt: record.first_completion_at,
        publisherId: publisherId
      });
    }
    
    return NextResponse.json({
      canComplete: true,
      reason: "publisher_cooldown_expired",
      message: "24 hour publisher cooldown has expired, can interact for revenue",
      completionCount: record.completion_count,
      publisherId: publisherId
    });
    
  } catch (error: any) {
    console.error("[IP TRACKING] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 