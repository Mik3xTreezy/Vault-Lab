import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = "ananthu9539@gmail.com";

// Placeholder admin check (always true)
async function isAdmin(req: NextRequest) {
  return true;
}

export async function GET(req: NextRequest) {
  // Public: anyone can fetch tasks
  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Add debug logging for CPM rates
  console.log("[DEBUG] Tasks with CPM rates:", data?.map(task => ({
    id: task.id,
    title: task.title,
    cpm_tier1: task.cpm_tier1,
    cpm_tier2: task.cpm_tier2,
    cpm_tier3: task.cpm_tier3
  })));
  
  if (data) return NextResponse.json(data);
  return NextResponse.json([]); // fallback
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { title, description, ad_url, devices, cpm_tier1, cpm_tier2, cpm_tier3, country_cpm, status } = body;
  const { data, error } = await supabase.from("tasks").insert([
    { title, description, ad_url, devices, cpm_tier1, cpm_tier2, cpm_tier3, country_cpm, status }
  ]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);
  return NextResponse.json(null); // fallback
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, title, description, ad_url, devices, cpm_tier1, cpm_tier2, cpm_tier3, status } = body;
  const { data, error } = await supabase.from('tasks').update({
    title, description, ad_url, devices, cpm_tier1, cpm_tier2, cpm_tier3, status
  }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);
  return NextResponse.json(null); // fallback
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { taskIds, cpmRates } = body;
  
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    return NextResponse.json({ error: "Task IDs are required" }, { status: 400 });
  }
  
  try {
    const updatePromises = taskIds.map(async (taskId: number) => {
      const updateData: any = {};
      if (cpmRates.tier1 !== undefined) updateData.cpm_tier1 = parseFloat(cpmRates.tier1) || 0;
      if (cpmRates.tier2 !== undefined) updateData.cpm_tier2 = parseFloat(cpmRates.tier2) || 0;
      if (cpmRates.tier3 !== undefined) updateData.cpm_tier3 = parseFloat(cpmRates.tier3) || 0;
      
      return supabase.from('tasks').update(updateData).eq('id', taskId);
    });
    
    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      return NextResponse.json({ error: "Some updates failed", details: errors }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, updated: taskIds.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 