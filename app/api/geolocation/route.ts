import { NextRequest, NextResponse } from 'next/server';
import { getUserLocation } from '@/lib/geolocation';

export async function GET(req: NextRequest) {
  try {
    // Get the user's IP from the request
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const userIp = forwarded?.split(',')[0] || realIp || undefined;

    console.log('[GEOLOCATION API] Processing request for IP:', userIp);

    // Get location data using ip-api.com
    const locationData = await getUserLocation(userIp || undefined);

    // Return the location data
    return NextResponse.json(locationData);

  } catch (error) {
    console.error('[GEOLOCATION API] Error:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      country: 'United States',
      countryCode: 'US',
      tier: 'tier1',
      isVpn: false,
      isProxy: false,
      error: 'Failed to detect location, using fallback'
    });
  }
}

// For testing purposes - allows manual IP lookup
export async function POST(req: NextRequest) {
  try {
    const { ip } = await req.json();
    
    if (!ip) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 });
    }

    console.log('[GEOLOCATION API] Manual lookup for IP:', ip);

    const locationData = await getUserLocation(ip);
    
    return NextResponse.json(locationData);

  } catch (error) {
    console.error('[GEOLOCATION API] POST Error:', error);
    return NextResponse.json({ error: 'Failed to lookup IP' }, { status: 500 });
  }
} 