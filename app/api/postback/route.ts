import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handle postback notifications from advertisers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[POSTBACK] Received postback:", body);

    const { 
      click_id, 
      task_id, 
      status, 
      payout = 0, 
      currency = 'USD',
      conversion_id,
      ip,
      country,
      device,
      offer_id,
      signature 
    } = body;

    // Validate required fields
    if (!click_id || !task_id || !status) {
      return NextResponse.json({ 
        error: "Missing required fields: click_id, task_id, status" 
      }, { status: 400 });
    }

    // Get task details to verify postback secret
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      console.error("[POSTBACK] Task not found:", task_id);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify signature if postback_secret is configured
    if (task.postback_secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', task.postback_secret)
        .update(JSON.stringify({ click_id, task_id, status, payout }))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error("[POSTBACK] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Check if this postback already exists (prevent duplicates)
    const { data: existingPostback } = await supabase
      .from("postback_events")
      .select("id")
      .eq("click_id", click_id)
      .eq("task_id", task_id)
      .single();

    if (existingPostback) {
      console.log("[POSTBACK] Duplicate postback ignored:", click_id);
      return NextResponse.json({ 
        success: true, 
        message: "Postback already processed" 
      });
    }

    // Get click tracking info to find publisher
    const { data: clickData } = await supabase
      .from("click_tracking")
      .select("*")
      .eq("click_id", click_id)
      .single();

    // Store postback event
    const { data: postbackEvent, error: postbackError } = await supabase
      .from("postback_events")
      .insert([{
        click_id,
        task_id,
        user_id: clickData?.user_id,
        locker_id: clickData?.locker_id,
        status,
        payout: parseFloat(payout.toString()),
        currency,
        conversion_id,
        ip,
        country: country || clickData?.country,
        device: device || clickData?.device,
        offer_id: offer_id || task.external_offer_id,
        raw_data: body,
        processed: false
      }])
      .select()
      .single();

    if (postbackError) {
      console.error("[POSTBACK] Error storing postback:", postbackError);
      return NextResponse.json({ error: "Failed to store postback" }, { status: 500 });
    }

    // Process approved conversions
    if (status === 'approved' && clickData) {
      await processApprovedConversion(postbackEvent, clickData, task);
    }

    console.log("[POSTBACK] Successfully processed postback:", postbackEvent.id);
    return NextResponse.json({ 
      success: true, 
      postback_id: postbackEvent.id,
      message: "Postback processed successfully" 
    });

  } catch (error: any) {
    console.error("[POSTBACK] Error processing postback:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}

// Process approved conversions by crediting revenue
async function processApprovedConversion(postbackEvent: any, clickData: any, task: any) {
  try {
    console.log("[POSTBACK] Processing approved conversion:", postbackEvent.id);

    // Calculate CPM-based revenue
    const tier = getTierFromCountry(clickData.country);
    let cpmRate = 0;
    
    switch (tier) {
      case 'tier1':
        cpmRate = task.cpm_tier1 || 0;
        break;
      case 'tier2':
        cpmRate = task.cpm_tier2 || 0;
        break;
      case 'tier3':
        cpmRate = task.cpm_tier3 || 0;
        break;
    }

    // Use postback payout if provided, otherwise calculate from CPM
    const revenue = postbackEvent.payout > 0 ? postbackEvent.payout : (cpmRate / 1000);

    if (revenue > 0) {
      // Create verified revenue event
      const { error: revenueError } = await supabase
        .from("revenue_events")
        .insert([{
          user_id: clickData.publisher_id, // Credit the locker owner
          locker_id: clickData.locker_id,
          task_id: task.id,
          amount: revenue,
          country: clickData.country,
          tier,
          device: clickData.device,
          rate_source: 'postback_verified',
          postback_id: postbackEvent.id
        }]);

      if (revenueError) {
        console.error("[POSTBACK] Error creating revenue event:", revenueError);
        return;
      }

      // Update user balance
      const { error: balanceError } = await supabase.rpc('increment_user_balance', {
        user_id: clickData.publisher_id,
        amount: revenue
      });

      if (balanceError) {
        console.error("[POSTBACK] Error updating balance:", balanceError);
      } else {
        console.log(`[POSTBACK] Credited $${revenue} to user ${clickData.publisher_id}`);
      }
    }

    // Mark postback as processed
    await supabase
      .from("postback_events")
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq("id", postbackEvent.id);

    // Update click tracking
    await supabase
      .from("click_tracking")
      .update({ 
        converted: true, 
        conversion_time: new Date().toISOString(),
        payout: revenue
      })
      .eq("click_id", clickData.click_id);

  } catch (error) {
    console.error("[POSTBACK] Error processing approved conversion:", error);
  }
}

// Helper function to determine tier from country
function getTierFromCountry(country: string): string {
  const tier1Countries = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'CH', 'AT'];
  const tier2Countries = ['ES', 'IT', 'BE', 'FI', 'IE', 'NZ', 'JP', 'KR', 'SG', 'HK'];
  
  if (tier1Countries.includes(country?.toUpperCase())) return 'tier1';
  if (tier2Countries.includes(country?.toUpperCase())) return 'tier2';
  return 'tier3';
}

// Handle GET requests (for testing)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const task_id = searchParams.get('task_id');

  if (task_id) {
    // Get postback events for specific task
    const { data, error } = await supabase
      .from("postback_events")
      .select("*")
      .eq("task_id", task_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // Get recent postback events
  const { data, error } = await supabase
    .from("postback_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
} 