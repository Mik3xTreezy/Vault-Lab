interface GeolocationData {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  proxy: boolean;
  hosting: boolean;
  query: string;
}

interface LocationResult {
  country: string;
  countryCode: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  isVpn: boolean;
  isProxy: boolean;
  city?: string;
  region?: string;
}

// CPM tier classification based on country codes
const TIER_1_COUNTRIES = ['US', 'UK', 'GB', 'CA', 'AU', 'DE', 'NL', 'SE', 'NO', 'DK', 'CH', 'AT'];
const TIER_2_COUNTRIES = ['FR', 'IT', 'ES', 'JP', 'KR', 'SG', 'HK', 'BE', 'FI', 'IE', 'NZ', 'LU'];

function determineCountryTier(countryCode: string): 'tier1' | 'tier2' | 'tier3' {
  if (TIER_1_COUNTRIES.includes(countryCode.toUpperCase())) {
    return 'tier1';
  }
  if (TIER_2_COUNTRIES.includes(countryCode.toUpperCase())) {
    return 'tier2';
  }
  return 'tier3';
}

export async function getUserLocation(userIp?: string): Promise<LocationResult> {
  try {
    // Use ip-api.com API 
    // Note: For production/commercial use, upgrade to Pro plan for HTTPS support
    // Free tier only supports HTTP, Pro tier supports HTTPS
    const apiKey = process.env.IP_API_KEY; // Optional: for Pro plan
    const baseUrl = apiKey ? 'https://pro.ip-api.com' : 'http://ip-api.com';
    
    const url = userIp 
      ? `${baseUrl}/json/${userIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query${apiKey ? `&key=${apiKey}` : ''}`
      : `${baseUrl}/json?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query${apiKey ? `&key=${apiKey}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ip-api.com API error: ${response.status}`);
    }

    const data: GeolocationData = await response.json();

    // Check if the API returned an error
    if (data.status === 'fail') {
      console.error('[GEOLOCATION] ip-api.com returned error:', data);
      return getFallbackLocation();
    }

    // Check for rate limiting (ip-api.com free tier: 45 requests/minute)
    if (response.status === 429) {
      console.warn('[GEOLOCATION] Rate limit exceeded, using fallback');
      return getFallbackLocation();
    }

    const result: LocationResult = {
      country: data.country,
      countryCode: data.countryCode,
      tier: determineCountryTier(data.countryCode),
      isVpn: false, // ip-api.com doesn't provide VPN detection on free tier
      isProxy: data.proxy || false,
      city: data.city,
      region: data.regionName,
    };

    console.log('[GEOLOCATION] ip-api.com result:', {
      country: result.country,
      tier: result.tier,
      isVpn: result.isVpn,
      isProxy: result.isProxy,
      hosting: data.hosting
    });

    return result;

  } catch (error) {
    console.error('[GEOLOCATION] Error fetching location:', error);
    return getFallbackLocation();
  }
}

// Client-side version that calls our API endpoint
export async function getUserLocationClient(): Promise<LocationResult> {
  try {
    const response = await fetch('/api/geolocation', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geolocation API error: ${response.status}`);
    }

    const result: LocationResult = await response.json();
    
    console.log('[GEOLOCATION] Client result:', {
      country: result.country,
      tier: result.tier,
      isVpn: result.isVpn,
      isProxy: result.isProxy
    });

    return result;

  } catch (error) {
    console.error('[GEOLOCATION] Client error:', error);
    return getFallbackLocation();
  }
}

function getFallbackLocation(): LocationResult {
  console.log('[GEOLOCATION] Using fallback location (US, Tier 1)');
  return {
    country: 'United States',
    countryCode: 'US',
    tier: 'tier1',
    isVpn: false,
    isProxy: false,
  };
}

// Utility function to get country tier without full geolocation
export function getCountryTier(countryCode: string): 'tier1' | 'tier2' | 'tier3' {
  return determineCountryTier(countryCode);
}

// List of all tier classifications for admin reference
export const COUNTRY_TIERS = {
  tier1: TIER_1_COUNTRIES,
  tier2: TIER_2_COUNTRIES,
  tier3: 'All other countries'
} as const; 