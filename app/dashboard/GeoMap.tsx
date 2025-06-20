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
  const [countryData, setCountryData] = useState<Record<string, number>>(normalizeCountryData(initialCountryData));
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
          const normalizedData = normalizeCountryData(data.countryData);
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
  
  // Enhanced color scale with green gradient for heat map effect
  const colorScale = scaleLinear<string>()
    .domain([0, Math.max(1, maxValue)])
    .range(["#0f172a", "#10b981"]); // slate-900 to emerald-500
    
  // Create heat map intensity levels
  const getHeatMapColor = (views: number) => {
    if (views === 0) return "#1e293b"; // Dark background for no views
    
    const intensity = views / maxValue;
    if (intensity >= 0.8) return "#10b981"; // Brightest emerald for highest views
    if (intensity >= 0.6) return "#22c55e"; // Bright green
    if (intensity >= 0.4) return "#4ade80"; // Medium green  
    if (intensity >= 0.2) return "#86efac"; // Light green
    return "#bbf7d0"; // Very light green for lowest views
  };

  const topCountries = Object.entries(countryData)
    .filter(([_, views]) => views > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-white">Geographies</h2>
          <p className="text-slate-400 text-sm mt-1">Geographic distribution of your audience</p>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-xs text-slate-400">
            {isLoading ? 'Updating...' : 'Views'}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Color Scale Legend */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">Low</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-2 rounded-sm"
                  style={{ 
                    backgroundColor: colorScale(i * (maxValue / 19)),
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-emerald-400 font-medium">High</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* World Map */}
          <div className="xl:col-span-3">
            <div className="relative h-80 w-full">
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
                      const fillColor = getHeatMapColor(views);
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fillColor}
                          stroke="#374151"
                          strokeWidth={0.3}
                          style={{ 
                            outline: "none",
                            cursor: views > 0 ? "pointer" : "default",
                            transition: "all 0.3s ease-in-out"
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
                <div className="absolute top-4 left-4 bg-slate-900/95 text-white px-3 py-2 rounded border border-slate-700 shadow-lg pointer-events-none">
                  <div className="text-xs font-medium">{hoveredCountry}</div>
                </div>
              )}
            </div>
          </div>

          {/* Top Countries List */}
          <div className="xl:col-span-1">
            <div className="h-full">
              <h3 className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs">
                Top Countries
              </h3>
              
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {topCountries.length > 0 ? (
                  topCountries.map(([code, views], index) => {
                    const percentage = totalViews > 0 ? (views / totalViews) * 100 : 0;
                    const countryName = countryNames[code] || code;
                    
                    return (
                      <div 
                        key={code} 
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">{countryName}</div>
                            <div className="text-slate-400 text-xs">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="text-emerald-400 font-semibold text-sm">{views.toLocaleString()}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <div className="text-slate-500 text-xs">No visitor data available</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 