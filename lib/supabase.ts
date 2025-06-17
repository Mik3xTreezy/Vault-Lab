import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
); 

// Helper to increment user balance atomically (requires Postgres function 'increment_user_balance')
export async function incrementUserBalance(user_id: string, amount: number) {
  return supabase.rpc('increment_user_balance', {
    user_id_input: user_id,
    amount_input: amount
  });
} 
