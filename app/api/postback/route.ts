import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[POSTBACK] Received postback:', body);

    // Extract common postback parameters
    const {
      click_id,        // Unique identifier for the click/conversion
      task_id,         // Your task ID
      user_id,         // User who completed the task (optional)
      locker_id,       // Locker where task was completed
      status,          // 'approved', 'rejected', 'pending'
      payout,          // Amount to pay (in USD)
      currency = 'USD', // Currency
      conversion_id,   // External network's conversion ID
      ip,              // User's IP address
      country,         // User's country
      device,          // User's device
      offer_id,        // External offer ID
      signature,       // Security signature (if provided)
      timestamp,       // When conversion happened
      event_type = 'conversion', // Type of event
      ...extraData     // Any additional data
    } = body;

    // Validate required fields
    if (!click_id || !task_id || !status) {
      console.error('[POSTBACK] Missing required fields:', { click_id, task_id, status });
      return NextResponse.json({ 
        error: "Missing required fields: click_id, task_id, status" 
      }, { status: 400 });
    }

    // Verify the task exists
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, postback_secret, status as task_status")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      console.error('[POSTBACK] Task not found:', task_id, taskError);
      return NextResponse.json({ 
        error: "Task not found" 
      }, { status: 404 });
    }

    // Verify signature if task has postback_secret
    if (task.postback_secret && signature) {
      const expectedSignature = generatePostbackSignature(body, task.postback_secret);
      if (signature !== expectedSignature) {
        console.error('[POSTBACK] Invalid signature:', { 
          provided: signature, 
          expected: expectedSignature 
        });
        return NextResponse.json({ 
          error: "Invalid signature" 
        }, { status: 401 });
      }
      console.log('[POSTBACK] Signature verified successfully');
    }

    // Check for duplicate postbacks
    const { data: existingPostback } = await supabase
      .from("postback_events")
      .select("id")
      .eq("click_id", click_id)
      .eq("task_id", task_id)
      .single();

    if (existingPostback) {
      console.log('[POSTBACK] Duplicate postback ignored:', click_id);
      return NextResponse.json({ 
        message: "Postback already processed",
        status: "duplicate"
      });
    }

    // Insert postback event
    const { data: postbackEvent, error: insertError } = await supabase
      .from("postback_events")
      .insert({
        click_id,
        task_id,
        user_id: user_id || null,
        locker_id: locker_id || null,
        status,
        payout: parseFloat(payout) || 0,
        currency,
        conversion_id: conversion_id || null,
        ip: ip || null,
        country: country || null,
        device: device || null,
        offer_id: offer_id || null,
        event_type,
        raw_data: body, // Store the complete postback for debugging
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        processed: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POSTBACK] Error inserting postback event:', insertError);
      return NextResponse.json({ 
        error: "Failed to store postback event" 
      }, { status: 500 });
    }

    console.log('[POSTBACK] Postback event stored:', postbackEvent.id);

    // Process the postback based on status
    if (status === 'approved') {
      await processApprovedConversion(postbackEvent);
    } else if (status === 'rejected') {
      await processRejectedConversion(postbackEvent);
    }

    // Mark as processed
    await supabase
      .from("postback_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("id", postbackEvent.id);

    return NextResponse.json({ 
      message: "Postback processed successfully",
      postback_id: postbackEvent.id,
      status: "success"
    });

  } catch (error: any) {
    console.error('[POSTBACK] Unexpected error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error.message
    }, { status: 500 });
  }
}

// GET endpoint for testing and webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('challenge');
  
  // Handle webhook verification challenges (like Facebook, etc.)
  if (challenge) {
    console.log('[POSTBACK] Webhook challenge received:', challenge);
    return NextResponse.json({ challenge });
  }

  // Return postback endpoint info
  return NextResponse.json({
    message: "Postback endpoint is active",
    endpoint: "/api/postback",
    method: "POST",
    required_fields: ["click_id", "task_id", "status"],
    optional_fields: ["user_id", "locker_id", "payout", "currency", "conversion_id", "ip", "country", "device", "signature"],
    supported_statuses: ["approved", "rejected", "pending"],
    timestamp: new Date().toISOString()
  });
}

async function processApprovedConversion(postbackEvent: any) {
  console.log('[POSTBACK] Processing approved conversion:', postbackEvent.id);
  
  try {
    // Get the locker owner (publisher) who should receive the revenue
    let publisherId = postbackEvent.user_id; // Default to the user who completed the task
    
    if (postbackEvent.locker_id) {
      const { data: locker } = await supabase
        .from("lockers")
        .select("user_id")
        .eq("id", postbackEvent.locker_id)
        .single();
      
      if (locker) {
        publisherId = locker.user_id; // Credit the locker owner, not the visitor
      }
    }

    if (!publisherId) {
      console.warn('[POSTBACK] No publisher ID found for revenue credit');
      return;
    }

    // Create verified revenue event
    const { data: revenueEvent, error: revenueError } = await supabase
      .from("revenue_events")
      .insert({
        user_id: publisherId,
        locker_id: postbackEvent.locker_id,
        task_id: postbackEvent.task_id,
        amount: postbackEvent.payout,
        country: postbackEvent.country,
        device: postbackEvent.device,
        rate_source: 'postback_verified',
        timestamp: new Date().toISOString(),
        postback_id: postbackEvent.id // Link to the postback event
      })
      .select()
      .single();

    if (revenueError) {
      console.error('[POSTBACK] Error creating revenue event:', revenueError);
      return;
    }

    console.log('[POSTBACK] Revenue event created:', revenueEvent.id);

    // Update publisher balance
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", publisherId)
      .single();

    if (userError) {
      // Create user if doesn't exist
      await supabase
        .from("users")
        .insert({
          id: publisherId,
          email: `${publisherId}@temp.local`,
          balance: postbackEvent.payout,
          joined: new Date().toISOString(),
          status: 'Active',
          role: 'user'
        });
      console.log('[POSTBACK] Created new publisher with balance:', postbackEvent.payout);
    } else {
      // Update existing balance
      const newBalance = (currentUser.balance || 0) + postbackEvent.payout;
      await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", publisherId);
      console.log('[POSTBACK] Updated publisher balance:', newBalance);
    }

  } catch (error) {
    console.error('[POSTBACK] Error processing approved conversion:', error);
  }
}

async function processRejectedConversion(postbackEvent: any) {
  console.log('[POSTBACK] Processing rejected conversion:', postbackEvent.id);
  
  // If there's an existing revenue event for this conversion, we might need to reverse it
  // This depends on your business logic - you might want to:
  // 1. Mark the revenue event as reversed
  // 2. Deduct from publisher balance
  // 3. Send notification to publisher
  
  // For now, just log it
  console.log('[POSTBACK] Conversion rejected - no action taken');
}

function generatePostbackSignature(data: any, secret: string): string {
  // Generate HMAC-SHA256 signature for postback verification
  const sortedParams = Object.keys(data)
    .filter(key => key !== 'signature') // Exclude signature itself
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');
} 