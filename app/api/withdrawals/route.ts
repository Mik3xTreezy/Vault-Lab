import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch withdrawals for the user
    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Supabase withdrawals error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(withdrawals || []);
  } catch (error) {
    console.error("Withdrawals GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, amount, method, address } = body;

    // Validation
    if (!user_id || !amount || !method || !address) {
      return NextResponse.json({ 
        error: "Missing required fields: user_id, amount, method, address" 
      }, { status: 400 });
    }

    if (amount < 50) {
      return NextResponse.json({ 
        error: "Minimum withdrawal amount is $50" 
      }, { status: 400 });
    }

    // Check user's balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", user_id)
      .single();

    if (userError) {
      console.error("User balance check error:", userError);
      return NextResponse.json({ error: "Failed to check user balance" }, { status: 500 });
    }

    const userBalance = user?.balance || 0;
    if (amount > userBalance) {
      return NextResponse.json({ 
        error: "Insufficient balance" 
      }, { status: 400 });
    }

    // Check monthly withdrawal limit (3 per month)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: monthlyWithdrawals, error: monthlyError } = await supabase
      .from("withdrawals")
      .select("id")
      .eq("user_id", user_id)
      .gte("requested_at", `${currentMonth}-01`)
      .lt("requested_at", `${currentMonth}-32`);

    if (monthlyError) {
      console.error("Monthly withdrawals check error:", monthlyError);
      return NextResponse.json({ error: "Failed to check monthly limit" }, { status: 500 });
    }

    if ((monthlyWithdrawals || []).length >= 3) {
      return NextResponse.json({ 
        error: "Monthly withdrawal limit reached (3 withdrawals per month)" 
      }, { status: 400 });
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        user_id,
        amount,
        method,
        address,
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error("Withdrawal creation error:", withdrawalError);
      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 });
    }

    // Update user balance (deduct the withdrawal amount)
    const { error: balanceError } = await supabase
      .from("users")
      .update({ balance: userBalance - amount })
      .eq("id", user_id);

    if (balanceError) {
      console.error("Balance update error:", balanceError);
      // Rollback withdrawal if balance update fails
      await supabase.from("withdrawals").delete().eq("id", withdrawal.id);
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Withdrawal request created successfully",
      withdrawal 
    });
  } catch (error) {
    console.error("Withdrawals POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 