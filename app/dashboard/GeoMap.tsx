// @ts-expect-error: No type declarations for react-simple-maps
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { useEffect, useState } from "react";

interface GeoMapProps {
  countryData: Record<string, number | string>;
  userId?: string;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Helper to normalize all values to numbers
function normalizeCountryData(data: Record<string, number | string>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(data)) {
    const num = Number(v);
    if (!isNaN(num)) result[k] = num;
  }
  return result;
}

export default function GeoMap({ countryData: initialCountryData, userId }: GeoMapProps) {
  const [countryData, setCountryData] = useState<Record<string, number>>(normalizeCountryData(initialCountryData));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchCountryData() {
      try {
        const url = userId ? `/api/dashboard-analytics?user_id=${userId}` : '/api/dashboard-analytics';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch country data");
        const data = await res.json();
        if (data.countryData) {
          setCountryData(normalizeCountryData(data.countryData));
        }
      } catch (error) {
        console.error('Error fetching country data:', error);
      }
    }
    interval = setInterval(fetchCountryData, 120000);
    return () => clearInterval(interval);
  }, [userId]);

  const countryValues = Object.values(countryData).filter((v): v is number => typeof v === 'number');
  const maxValue = countryValues.length > 0 ? Math.max(...countryValues) : 1;
  const colorScale = scaleLinear<string>()
    .domain([0, Math.max(1, maxValue)])
    .range(["#1f2937", "#10b981"]); // dark gray to emerald (better contrast)

  return (
    <div className="bg-white/5 backdrop-blur-xl border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Geographies</h2>
        <div className="flex items-center text-xs text-gray-400">
          <span>Low</span>
          <div className="flex ml-2 mr-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-3 rounded"
                style={{ 
                  backgroundColor: colorScale(i * (maxValue / 15)),
                  opacity: 0.8 + (i * 0.0125) // Gradually increase opacity
                }}
              />
            ))}
          </div>
          <span className="text-white">High</span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Map */}
        <div className="w-full md:w-3/4 h-96 flex items-center justify-center">
          <ComposableMap projectionConfig={{ scale: 160 }} style={{ width: "100%", height: "100%" }}>
            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const code = geo.properties.ISO_A2;
                  const views = countryData[code] || 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={views ? colorScale(views) : "#23272f"}
                      stroke="#18181b"
                      style={{ outline: "none" }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>
        {/* Country List */}
        <div className="w-full md:w-1/3">
          <div className="text-gray-300 font-semibold mb-2">Top Countries</div>
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(countryData)
              .filter(([_, views]) => views > 0) // Only show countries with views
              .sort((a, b) => b[1] - a[1])
              .slice(0, 20) // Limit to top 20 countries
              .map(([code, views]) => (
                <div key={code} className="flex items-center justify-between mb-2 p-2 rounded hover:bg-white/5 transition-colors">
                  <span className="text-white font-medium">{code}</span>
                  <span className="text-emerald-400 font-bold">{views.toLocaleString()} views</span>
                </div>
              ))}
            {Object.keys(countryData).length === 0 && (
              <div className="text-gray-500 text-sm italic">No country data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 