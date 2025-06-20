// @ts-expect-error: No type declarations for react-simple-maps
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { useEffect, useState } from "react";
import { Globe, TrendingUp, Users, MapPin } from "lucide-react";

interface GeoMapProps {
  countryData: Record<string, number | string>;
  userId?: string;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country code to name mapping (top countries)
const countryNames: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom", 
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  IE: "Ireland",
  PT: "Portugal",
  GR: "Greece",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  RO: "Romania",
  BG: "Bulgaria",
  HR: "Croatia",
  SI: "Slovenia",
  SK: "Slovakia",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  ID: "Indonesia",
  PH: "Philippines",
  VN: "Vietnam",
  TW: "Taiwan",
  HK: "Hong Kong",
  BR: "Brazil",
  MX: "Mexico",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  VE: "Venezuela",
  UY: "Uruguay",
  PY: "Paraguay",
  BO: "Bolivia",
  EC: "Ecuador",
  ZA: "South Africa",
  EG: "Egypt",
  MA: "Morocco",
  NG: "Nigeria",
  KE: "Kenya",
  GH: "Ghana",
  TN: "Tunisia",
  DZ: "Algeria",
  IL: "Israel",
  AE: "UAE",
  SA: "Saudi Arabia",
  TR: "Turkey",
  RU: "Russia",
  UA: "Ukraine",
  BY: "Belarus",
  KZ: "Kazakhstan",
  UZ: "Uzbekistan",
  NZ: "New Zealand",
};

// Reverse mapping: country name to country code (for legacy data compatibility)
const countryNameToCode: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Australia": "AU",
  "Germany": "DE",
  "France": "FR",
  "Italy": "IT",
  "Spain": "ES",
  "Netherlands": "NL",
  "Belgium": "BE",
  "Switzerland": "CH",
  "Austria": "AT",
  "Sweden": "SE",
  "Norway": "NO",
  "Denmark": "DK",
  "Finland": "FI",
  "Ireland": "IE",
  "Portugal": "PT",
  "Greece": "GR",
  "Poland": "PL",
  "Czech Republic": "CZ",
  "Hungary": "HU",
  "Romania": "RO",
  "Bulgaria": "BG",
  "Croatia": "HR",
  "Slovenia": "SI",
  "Slovakia": "SK",
  "Lithuania": "LT",
  "Latvia": "LV",
  "Estonia": "EE",
  "Japan": "JP",
  "South Korea": "KR",
  "China": "CN",
  "India": "IN",
  "Singapore": "SG",
  "Malaysia": "MY",
  "Thailand": "TH",
  "Indonesia": "ID",
  "Philippines": "PH",
  "Vietnam": "VN",
  "Taiwan": "TW",
  "Hong Kong": "HK",
  "Brazil": "BR",
  "Mexico": "MX",
  "Argentina": "AR",
  "Chile": "CL",
  "Colombia": "CO",
  "Peru": "PE",
  "Venezuela": "VE",
  "Uruguay": "UY",
  "Paraguay": "PY",
  "Bolivia": "BO",
  "Ecuador": "EC",
  "South Africa": "ZA",
  "Egypt": "EG",
  "Morocco": "MA",
  "Nigeria": "NG",
  "Kenya": "KE",
  "Ghana": "GH",
  "Tunisia": "TN",
  "Algeria": "DZ",
  "Israel": "IL",
  "UAE": "AE",
  "Saudi Arabia": "SA",
  "Turkey": "TR",
  "Russia": "RU",
  "Ukraine": "UA",
  "Belarus": "BY",
  "Kazakhstan": "KZ",
  "Uzbekistan": "UZ",
  "New Zealand": "NZ",
};

// Helper to normalize all values to numbers and convert country names to codes
function normalizeCountryData(data: Record<string, number | string>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(data)) {
    const num = Number(v);
    if (!isNaN(num)) {
      // Convert country name to country code if needed (for legacy data)
      const countryCode = countryNameToCode[k] || k; // Use code if already a code, or convert if it's a name
      result[countryCode] = (result[countryCode] || 0) + num; // Aggregate if there are duplicates
    }
  }
  return result;
}

export default function GeoMap({ countryData: initialCountryData, userId }: GeoMapProps) {
  // TEST: Hardcode some country data to see if the map can highlight at all
  const testData = { "US": 78, "IN": 10 };
  const [countryData, setCountryData] = useState<Record<string, number>>(testData);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchCountryData() {
      setIsLoading(true);
      try {
        const url = userId ? `/api/dashboard-analytics?user_id=${userId}` : '/api/dashboard-analytics';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch country data");
        const data = await res.json();
        if (data.countryData) {
          console.log('[GeoMap] Raw country data from API:', data.countryData);
          const normalizedData = normalizeCountryData(data.countryData);
          console.log('[GeoMap] Normalized country data:', normalizedData);
          setCountryData(normalizedData);
        }
      } catch (error) {
        console.error('Error fetching country data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Initial fetch
    fetchCountryData();
    
    // Set up interval for updates
    interval = setInterval(fetchCountryData, 120000);
    return () => clearInterval(interval);
  }, [userId]);

  const countryValues = Object.values(countryData).filter((v): v is number => typeof v === 'number');
  const totalViews = countryValues.reduce((sum, val) => sum + val, 0);
  const maxValue = countryValues.length > 0 ? Math.max(...countryValues) : 1;
  const uniqueCountries = Object.keys(countryData).length;
  
  // Debug logging
  console.log('[GeoMap] Current state:', {
    countryData,
    countryValues,
    totalViews,
    maxValue,
    uniqueCountries
  });
  
  // Enhanced color scale with green gradient to match dashboard theme
  // TEST: Use very obvious colors to see if highlighting works at all
  const colorScale = scaleLinear<string>()
    .domain([0, Math.max(1, maxValue)])
    .range(["#1e293b", "#00ff00"]); // dark to bright green
    
  // Test the color scale
  console.log('[GeoMap] Color scale test:', {
    color0: colorScale(0),
    colorMax: colorScale(maxValue),
    colorMid: colorScale(maxValue / 2)
  });

  const topCountries = Object.entries(countryData)
    .filter(([_, views]) => views > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Global Visitor Analytics</h2>
            <p className="text-slate-400">Geographic distribution of your audience</p>
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-sm text-slate-400">
            {isLoading ? 'Updating...' : 'Live'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-300 font-medium">Total Views</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-300 font-medium">Countries</span>
          </div>
          <div className="text-3xl font-bold text-white">{uniqueCountries}</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-300 font-medium">Top Country</span>
          </div>
          <div className="text-xl font-bold text-white">
            {topCountries.length > 0 ? (
              <div>
                <div>{countryNames[topCountries[0][0]] || topCountries[0][0]}</div>
                <div className="text-sm text-slate-400 font-normal">
                  {topCountries[0][1].toLocaleString()} views
                </div>
              </div>
            ) : (
              <div className="text-slate-500">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Color Scale Legend */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-4 bg-slate-800/30 rounded-full px-6 py-3">
          <span className="text-sm text-slate-400">Low</span>
          <div className="flex gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-4 rounded-full"
                style={{ 
                  backgroundColor: colorScale(i * (maxValue / 19)),
                }}
              />
            ))}
          </div>
          <span className="text-sm text-emerald-400 font-medium">High</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* World Map */}
        <div className="xl:col-span-3">
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
            <div className="relative h-96 w-full">
              <ComposableMap 
                projectionConfig={{ 
                  scale: 160,
                  center: [0, 20] // Slightly adjust center for better view
                }} 
                style={{ width: "100%", height: "100%" }}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo: any) => {
                      const code = geo.properties.ISO_A2;
                      const views = countryData[code] || 0;
                      const countryName = countryNames[code] || geo.properties.NAME || code;
                      const fillColor = views > 0 ? colorScale(views) : "#1e293b";
                      
                      // Debug logging for US and IN specifically
                      if (code === 'US' || code === 'IN') {
                        console.log(`[GeoMap] RENDERING ${code}:`, {
                          code,
                          countryName,
                          views,
                          fillColor,
                          hasViews: views > 0,
                          countryDataEntry: countryData[code]
                        });
                      }
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fillColor}
                          stroke="#334155"
                          strokeWidth={0.5}
                          style={{ 
                            outline: "none",
                            cursor: views > 0 ? "pointer" : "default",
                            transition: "all 0.2s ease-in-out"
                          }}
                          onMouseEnter={() => {
                            if (views > 0) setHoveredCountry(`${countryName}: ${views.toLocaleString()} views`);
                          }}
                          onMouseLeave={() => setHoveredCountry(null)}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
              
              {/* Hover Tooltip */}
              {hoveredCountry && (
                <div className="absolute top-4 left-4 bg-slate-900/95 text-white px-4 py-2 rounded-lg border border-slate-700 shadow-lg pointer-events-none">
                  <div className="text-sm font-medium">{hoveredCountry}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Countries List */}
        <div className="xl:col-span-1">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 h-full">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Top Countries
            </h3>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topCountries.length > 0 ? (
                topCountries.map(([code, views], index) => {
                  const percentage = totalViews > 0 ? (views / totalViews) * 100 : 0;
                  const countryName = countryNames[code] || code;
                  
                  return (
                    <div 
                      key={code} 
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200 border border-slate-600/30"
                    >
                                             <div className="flex items-center gap-3">
                         <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold">
                           {index + 1}
                         </div>
                         <div>
                           <div className="text-white font-medium text-sm">{countryName}</div>
                           <div className="text-slate-400 text-xs">{percentage.toFixed(1)}% of traffic</div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-emerald-400 font-bold text-sm">{views.toLocaleString()}</div>
                         <div className="text-slate-500 text-xs">views</div>
                       </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <div className="text-slate-500 text-sm">No visitor data available</div>
                  <div className="text-slate-600 text-xs mt-1">Start sharing your links to see analytics</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 