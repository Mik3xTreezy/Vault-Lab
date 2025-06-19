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