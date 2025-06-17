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
      const url = userId ? `/api/dashboard-analytics?user_id=${userId}` : '/api/dashboard-analytics';
      const res = await fetch(url);
      const data = await res.json();
      if (data.countryData) {
        setCountryData(normalizeCountryData(data.countryData));
      }
    }
    interval = setInterval(fetchCountryData, 120000);
    return () => clearInterval(interval);
  }, [userId]);

  const countryValues = Object.values(countryData);
  const colorScale = scaleLinear()
    .domain([0, Math.max(1, ...countryValues)])
    .range(["#23272f", "#facc15"]); // dark to yellow

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
                className="w-1 h-3 rounded bg-yellow-400/10"
                style={{ background: `linear-gradient(to right, #23272f, #facc15 ${i * 6.25}%)` }}
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
          {Object.entries(countryData)
            .sort((a, b) => b[1] - a[1])
            .map(([code, views]) => (
              <div key={code} className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{code}</span>
                <span className="text-yellow-400 font-bold">{views} views</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 