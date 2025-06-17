// @ts-expect-error: No type declarations for react-simple-maps
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { useEffect, useState } from "react";

interface GeoMapProps {
  countryData: Record<string, number>;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GeoMap({ countryData: initialCountryData }: GeoMapProps) {
  const [countryData, setCountryData] = useState(initialCountryData);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchCountryData() {
      const res = await fetch("/api/dashboard-analytics");
      const data = await res.json();
      if (data.countryData) setCountryData(data.countryData);
    }
    interval = setInterval(fetchCountryData, 120000);
    return () => clearInterval(interval);
  }, []);

  const colorScale = scaleLinear()
    .domain([0, Math.max(...(Object.values(countryData) as number[])) || 1])
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