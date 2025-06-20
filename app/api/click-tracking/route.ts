import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { task_id, user_id, locker_id } = await req.json();

    // Validate required fields
    if (!task_id || !locker_id) {
      return NextResponse.json({ 
        error: "Missing required fields: task_id, locker_id" 
      }, { status: 400 });
    }

    // Get user's IP and user agent
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, ad_url, external_offer_id")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      console.error('[CLICK TRACKING] Task not found:', task_id);
      return NextResponse.json({ 
        error: "Task not found" 
      }, { status: 404 });
    }

    // Get publisher (locker owner)
    const { data: locker, error: lockerError } = await supabase
      .from("lockers")
      .select("user_id")
      .eq("id", locker_id)
      .single();

    if (lockerError || !locker) {
      console.error('[CLICK TRACKING] Locker not found:', locker_id);
      return NextResponse.json({ 
        error: "Locker not found" 
      }, { status: 404 });
    }

    // Generate unique click ID
    const clickId = `click_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Detect device and country (you might want to use a geolocation service)
    const device = getDeviceFromUserAgent(userAgent);
    
    // Insert click tracking record
    const { data: clickRecord, error: insertError } = await supabase
      .from("click_tracking")
      .insert({
        click_id: clickId,
        task_id: task_id,
        user_id: user_id || null,
        locker_id: locker_id,
        publisher_id: locker.user_id,
        ip: ip,
        user_agent: userAgent,
        device: device,
        referrer: referrer,
        destination_url: task.ad_url,
        clicked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('[CLICK TRACKING] Error inserting click record:', insertError);
      return NextResponse.json({ 
        error: "Failed to track click" 
      }, { status: 500 });
    }

    console.log('[CLICK TRACKING] Click tracked:', {
      click_id: clickId,
      task_id: task_id,
      publisher_id: locker.user_id
    });

    // Build tracking URL with parameters for the advertiser
    const trackingUrl = buildTrackingUrl(task.ad_url, {
      click_id: clickId,
      task_id: task_id,
      offer_id: task.external_offer_id,
      user_id: user_id,
      publisher_id: locker.user_id,
      postback_url: `${getBaseUrl(req)}/api/postback`
    });

    return NextResponse.json({
      success: true,
      click_id: clickId,
      tracking_url: trackingUrl,
      message: "Click tracked successfully"
    });

  } catch (error: any) {
    console.error('[CLICK TRACKING] Unexpected error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// GET endpoint to retrieve click statistics
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const task_id = searchParams.get('task_id');
  const publisher_id = searchParams.get('publisher_id');

  try {
    let query = supabase
      .from("click_tracking")
      .select(`
        *,
        tasks:task_id (title),
        postback_events!inner (status, payout)
      `)
      .order("clicked_at", { ascending: false });

    if (task_id) {
      query = query.eq("task_id", task_id);
    }

    if (publisher_id) {
      query = query.eq("publisher_id", publisher_id);
    }

    const { data: clicks, error } = await query.limit(100);

    if (error) {
      console.error('[CLICK TRACKING] Error fetching clicks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate statistics
    const totalClicks = clicks?.length || 0;
    const conversions = clicks?.filter(c => c.converted).length || 0;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;
    const totalPayout = clicks?.reduce((sum, c) => sum + (c.payout || 0), 0) || 0;

    return NextResponse.json({
      clicks: clicks || [],
      statistics: {
        total_clicks: totalClicks,
        conversions: conversions,
        conversion_rate: conversionRate.toFixed(2) + '%',
        total_payout: totalPayout
      }
    });

  } catch (error: any) {
    console.error('[CLICK TRACKING] Error in GET:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

function getDeviceFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Macintosh')) return 'MacOS';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Desktop';
}

function buildTrackingUrl(baseUrl: string, params: any): string {
  try {
    const url = new URL(baseUrl);
    
    // Add tracking parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.set(key, params[key].toString());
      }
    });

    return url.toString();
  } catch (error) {
    console.error('[CLICK TRACKING] Error building tracking URL:', error);
    return baseUrl; // Return original URL if parsing fails
  }
}

function getBaseUrl(req: NextRequest): string {
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${protocol}://${host}`;
} 