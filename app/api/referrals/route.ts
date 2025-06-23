import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get referral stats for current user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's referral code
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('referral_code, total_referral_earnings')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[REFERRALS API] Error fetching user:', userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get referral stats
    const { data: referralStats, error: statsError } = await supabase
      .from('referrals')
      .select(`
        id,
        status,
        total_earned,
        created_at,
        referred_id,
        users!referrals_referred_id_fkey(email, joined)
      `)
      .eq('referrer_id', userId);

    if (statsError) {
      console.error('[REFERRALS API] Error fetching referral stats:', statsError);
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    // Calculate stats
    const totalReferrals = referralStats?.length || 0;
    const activeReferrals = referralStats?.filter(r => r.status === 'active').length || 0;
    const inactiveReferrals = referralStats?.filter(r => r.status === 'inactive').length || 0;
    const totalCommission = referralStats?.reduce((sum, r) => sum + (r.total_earned || 0), 0) || 0;

    // Get recent commissions for chart data
    const { data: commissions, error: commissionsError } = await supabase
      .from('referral_commissions')
      .select(`
        commission_amount,
        created_at,
        referrals!inner(referrer_id)
      `)
      .eq('referrals.referrer_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    // Format referred users data
    const referredUsers = referralStats?.map(ref => ({
      id: ref.id,
      email: (ref.users as any)?.email || 'Unknown',
      commission: ref.total_earned,
      joinedAt: (ref.users as any)?.joined,
      status: ref.status,
      lastActivity: ref.created_at
    })) || [];

    return NextResponse.json({
      referralCode: user.referral_code,
      stats: {
        totalReferrals,
        activeReferrals,
        inactiveReferrals,
        totalCommission: totalCommission.toFixed(2)
      },
      referredUsers,
      commissions: commissions || [],
      referralUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vaultlab.co'}/sign-up?ref=${user.referral_code}`
    });

  } catch (error) {
    console.error('[REFERRALS API] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Process referral registration
export async function POST(req: NextRequest) {
  try {
    const { referralCode, newUserId } = await req.json();

    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_id', newUserId)
      .single();

    if (existingReferral) {
      return NextResponse.json({ error: "Referral already exists" }, { status: 409 });
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        referral_code: referralCode,
        status: 'pending'
      })
      .select()
      .single();

    if (referralError) {
      console.error('[REFERRALS API] Error creating referral:', referralError);
      return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
    }

    // Update referred user's record
    const { error: updateError } = await supabase
      .from('users')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId);

    if (updateError) {
      console.error('[REFERRALS API] Error updating referred user:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      referralId: referral.id,
      message: "Referral created successfully" 
    });

  } catch (error) {
    console.error('[REFERRALS API] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 