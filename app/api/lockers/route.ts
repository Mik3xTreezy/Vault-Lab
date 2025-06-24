import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

function generateShortId(length = 5) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { 
    title, 
    description, 
    destinationUrl, 
    taskTypes, 
    adUrlMode, 
    commonAdUrl, 
    tieredAdUrls 
  } = await req.json();

  const shortId = generateShortId(5);
  
  // Prepare the ad URL configuration
  let adUrlConfig = {};
  if (adUrlMode === 'common') {
    adUrlConfig = {
      ad_url_mode: 'common',
      common_ad_url: commonAdUrl,
      tiered_ad_urls: null
    };
  } else {
    adUrlConfig = {
      ad_url_mode: 'tiered',
      common_ad_url: null,
      tiered_ad_urls: tieredAdUrls
    };
  }

  const { data, error } = await supabase
    .from('lockers')
    .insert([{ 
      id: shortId, 
      user_id: user.id, 
      title, 
      description: description || null,
      destination_url: destinationUrl,
      task_types: taskTypes, // Array of task types
      ...adUrlConfig
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating locker:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('lockers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
} 