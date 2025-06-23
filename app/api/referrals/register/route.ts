import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Register a new user with referral code
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { referralCode } = await req.json();

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    // Find referrer by referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('referral_code', referralCode)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    // Check if user is trying to refer themselves
    if (referrer.id === userId) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Check if user already has a referrer
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('referred_by')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingUser.referred_by) {
      return NextResponse.json({ error: "User already has a referrer" }, { status: 409 });
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: userId,
        referral_code: referralCode,
        status: 'pending'
      })
      .select()
      .single();

    if (referralError) {
      console.error('[REFERRAL REGISTER] Error creating referral:', referralError);
      return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
    }

    // Update user's referred_by field
    const { error: updateError } = await supabase
      .from('users')
      .update({ referred_by: referrer.id })
      .eq('id', userId);

    if (updateError) {
      console.error('[REFERRAL REGISTER] Error updating user:', updateError);
      // Don't fail the whole operation for this
    }

    return NextResponse.json({ 
      success: true, 
      referralId: referral.id,
      referrerEmail: referrer.email,
      message: "Referral registered successfully" 
    });

  } catch (error) {
    console.error('[REFERRAL REGISTER] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 