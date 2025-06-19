import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
); 

// Helper to increment user balance atomically
export async function incrementUserBalance(user_id: string, amount: number) {
  try {
    // Try using the RPC function first (if it exists)
    return await supabase.rpc('increment_user_balance', {
      user_id_input: user_id,
      amount_input: amount
    });
  } catch (error) {
    // Fallback to manual increment if RPC doesn't exist
    console.log("[DEBUG] RPC function not available, using manual increment");
    
    // Get current balance
    const { data: userData, error: getUserError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", user_id)
      .single();
    
    if (getUserError) {
      return { error: getUserError };
    }
    
    const currentBalance = parseFloat(userData?.balance || "0") || 0;
    const newBalance = currentBalance + amount;
    
    // Update balance
    const { error: updateError } = await supabase
      .from("users")
      .update({ balance: newBalance })
      .eq("id", user_id);
    
    return { error: updateError };
  }
} 
