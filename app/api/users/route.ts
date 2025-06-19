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
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await supabase.from("users").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, email, full_name, balance, status, joined, last_login, role, lockers, country, referral_code, referred_by, notes } = body;
  const { data, error } = await supabase.from("users").insert([
    { id, email, full_name, balance, status, joined, last_login, role, lockers, country, referral_code, referred_by, notes }
  ]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);
  return NextResponse.json(null);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, ...fields } = body;
  const { data, error } = await supabase.from("users").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);
  return NextResponse.json(null);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 