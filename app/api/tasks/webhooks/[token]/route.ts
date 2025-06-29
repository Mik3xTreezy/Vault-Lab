import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a secure token for webhook URL
export function generateWebhookToken(taskId: string, publisherId: string): string {
  const data = `${taskId}|${publisherId}|${process.env.WEBHOOK_SECRET || 'default-secret'}`;
  return Buffer.from(data).toString('base64url');
}

// Decode webhook token to get task and publisher info
export function decodeWebhookToken(token: string): { taskId: string; publisherId: string } | null {
  // Try multiple parsing strategies
  const strategies = [
    // Strategy 1: Clean and split on separators
    (token: string) => {
      let cleanToken = token.trim().replace(/\s+/g, '');
      
      const separators = ['.', '0test', 'test'];
      for (const sep of separators) {
        if (cleanToken.includes(sep)) {
          const parts = cleanToken.split(sep);
          for (const part of parts) {
            if (part.length > 10 && part.length < 500) {
              cleanToken = part;
              break;
            }
          }
          break;
        }
      }
      
      return cleanToken;
    },
    
    // Strategy 2: Try to extract base64url-like substring
    (token: string) => {
      const base64urlPattern = /[A-Za-z0-9_-]{20,}/;
      const match = token.match(base64urlPattern);
      return match ? match[0] : token.trim();
    },
    
    // Strategy 3: Just clean whitespace and use as-is
    (token: string) => {
      return token.trim().replace(/\s+/g, '');
    }
  ];
  
  console.log('[WEBHOOK] Original token length:', token.length);
  console.log('[WEBHOOK] Original token:', token);
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      const cleanToken = strategies[i](token);
      console.log(`[WEBHOOK] Strategy ${i + 1} - cleaned token:`, cleanToken);
      
      const decoded = Buffer.from(cleanToken, 'base64url').toString();
      const parts = decoded.split('|');
      
      if (parts.length >= 2 && parts[0] && parts[1]) {
        console.log(`[WEBHOOK] Strategy ${i + 1} successful - decoded parts:`, parts.length);
        return { taskId: parts[0], publisherId: parts[1] };
      } else {
        console.log(`[WEBHOOK] Strategy ${i + 1} failed - insufficient parts:`, parts.length);
      }
    } catch (error) {
      console.log(`[WEBHOOK] Strategy ${i + 1} failed with error:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.error('[WEBHOOK] All decoding strategies failed for token:', token);
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return handleWebhook(req, token);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return handleWebhook(req, token);
}

async function handleWebhook(req: NextRequest, token: string) {
  try {
    console.log('[WEBHOOK] Received postback with token:', token);
    console.log('[WEBHOOK] Token length:', token.length);
    console.log('[WEBHOOK] Request method:', req.method);
    console.log('[WEBHOOK] Request URL:', req.url);
    
    // Basic token validation
    if (!token || token.length < 10 || token.length > 1000) {
      console.error('[WEBHOOK] Token length invalid:', token.length);
      return NextResponse.json({ error: "Invalid token length" }, { status: 400 });
    }
    
    // Decode the token to get task and publisher info
    const tokenData = decodeWebhookToken(token);
    if (!tokenData) {
      console.error('[WEBHOOK] Invalid token');
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { taskId, publisherId } = tokenData;
    console.log('[WEBHOOK] Decoded token:', { taskId, publisherId });

    // Get parameters from query string (advertiser will send data as URL params)
    const searchParams = req.nextUrl.searchParams;
    const sub1 = searchParams.get('sub1'); // Usually contains visitor/click ID
    const payout = searchParams.get('payout') || searchParams.get('payout_amount');
    const conversionIp = searchParams.get('conversion_ip') || searchParams.get('session_ip');
    const status = searchParams.get('status') || 'approved';
    
    // Some networks send additional data
    const offerId = searchParams.get('offer_id');
    const transactionId = searchParams.get('transaction_id') || searchParams.get('txid');
    
    console.log('[WEBHOOK] Conversion data:', {
      sub1,
      payout,
      conversionIp,
      status,
      offerId,
      transactionId
    });

    // Validate required parameters
    if (!sub1) {
      console.error('[WEBHOOK] Missing sub1 parameter');
      return NextResponse.json({ error: "Missing sub1 parameter" }, { status: 400 });
    }

    // Check if this conversion was already processed (prevent duplicates)
    const { data: existingConversion } = await supabase
      .from('conversions')
      .select('id')
      .eq('sub_id', sub1)
      .eq('task_id', taskId)
      .single();

    if (existingConversion) {
      console.log('[WEBHOOK] Duplicate conversion, already processed:', sub1);
      return NextResponse.json({ 
        status: "success", 
        message: "Conversion already processed" 
      });
    }

    // Get task details to verify it exists and get default payout
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('[WEBHOOK] Task not found:', taskId);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Parse payout amount or use task's default CPM
    let payoutAmount = 0;
    if (payout) {
      payoutAmount = parseFloat(payout);
    } else {
      // Use task's CPM rate divided by 1000 (CPM is per 1000)
      payoutAmount = (task.cpm_tier1 || 0) / 1000;
    }

    console.log('[WEBHOOK] Payout amount:', payoutAmount);

    // Record the conversion
    const { data: conversionRecord, error: conversionError } = await supabase
      .from('conversions')
      .insert({
        task_id: taskId,
        publisher_id: publisherId,
        sub_id: sub1,
        payout: payoutAmount,
        conversion_ip: conversionIp,
        status: status,
        offer_id: offerId,
        transaction_id: transactionId,
        raw_params: Object.fromEntries(searchParams.entries()),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (conversionError) {
      console.error('[WEBHOOK] Error recording conversion:', conversionError);
      return NextResponse.json({ error: "Failed to record conversion" }, { status: 500 });
    }

    // Only credit revenue if status is approved
    if (status === 'approved' && payoutAmount > 0) {
      // Create revenue event for the publisher
      const { error: revenueError } = await supabase
        .from('revenue_events')
        .insert({
          user_id: publisherId,
          task_id: taskId,
          amount: payoutAmount,
          source: 'webhook',
          conversion_id: conversionRecord.id,
          timestamp: new Date().toISOString()
        });

      if (revenueError) {
        console.error('[WEBHOOK] Error creating revenue event:', revenueError);
      }

      // Update publisher balance
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', publisherId)
        .single();

      if (!userError && currentUser) {
        const newBalance = (currentUser.balance || 0) + payoutAmount;
        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', publisherId);

        if (updateError) {
          console.error('[WEBHOOK] Error updating balance:', updateError);
        } else {
          console.log('[WEBHOOK] Updated publisher balance:', {
            publisherId,
            oldBalance: currentUser.balance,
            newBalance,
            payout: payoutAmount
          });
        }
      }
    }

    console.log('[WEBHOOK] Conversion processed successfully:', conversionRecord.id);

    // Return success response (most networks expect a simple OK or 1)
    return new NextResponse("OK", { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 