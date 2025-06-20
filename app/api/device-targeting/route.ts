import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = "ananthu9539@gmail.com";

// Placeholder admin check (always true for now)
async function isAdmin(req: NextRequest) {
  return true;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    
    let query = supabase
      .from("device_targeting")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Filter by task ID if provided
    if (taskId) {
      query = query.eq('task_id', taskId);
      console.log("[DEVICE TARGETING API] Filtering by task ID:", taskId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("[DEVICE TARGETING API] Error fetching:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Convert array to object format for easier frontend handling
    const formattedData: any = {};
    data?.forEach((item) => {
      const key = `${item.device}_${item.country}`;
      formattedData[key] = {
        device: item.device,
        country: item.country,
        task_id: item.task_id,
        taskId: item.task_id, // Keep both for compatibility
        adUrl: item.ad_url,
        ad_url: item.ad_url, // Keep both for compatibility
        cpm: item.cpm,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    });
    
    console.log("[DEVICE TARGETING API] Fetched data:", Object.keys(formattedData).length, "records");
    return NextResponse.json(formattedData);
    
  } catch (error: any) {
    console.error("[DEVICE TARGETING API] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  try {
    const deviceTargetingData = await req.json();
    console.log("[DEVICE TARGETING API] Saving data:", deviceTargetingData);
    
    // Convert object format to array for database storage
    const dataToSave = Object.values(deviceTargetingData).filter((item: any) => {
      // Only save entries that have at least one field filled
      return item.taskId || item.adUrl || item.cpm;
    }).map((item: any) => ({
      device: item.device,
      country: item.country,
      task_id: item.taskId || null,
      ad_url: item.adUrl || null,
      cpm: item.cpm ? parseFloat(item.cpm) : null
    }));
    
    if (dataToSave.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No data to save",
        saved: 0 
      });
    }
    
    // Delete existing data first
    const { error: deleteError } = await supabase
      .from("device_targeting")
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (deleteError) {
      console.error("[DEVICE TARGETING API] Error deleting existing data:", deleteError);
    }
    
    // Insert new data
    const { data, error } = await supabase
      .from("device_targeting")
      .insert(dataToSave)
      .select();
    
    if (error) {
      console.error("[DEVICE TARGETING API] Error saving:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log("[DEVICE TARGETING API] Saved successfully:", data);
    return NextResponse.json({ 
      success: true, 
      message: `Saved ${dataToSave.length} device targeting configurations`,
      saved: dataToSave.length,
      data 
    });
    
  } catch (error: any) {
    console.error("[DEVICE TARGETING API] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 