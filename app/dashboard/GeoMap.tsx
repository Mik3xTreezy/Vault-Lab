"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, MapPin } from "lucide-react";

interface GeoMapProps {
  countryData: Record<string, number>;
  userId: string;
}

export default function GeoMap({ countryData, userId }: GeoMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Convert country data to array for easier processing
  const countries = Object.entries(countryData || {}).map(([code, views]) => ({
    code,
    name: getCountryName(code),
    views: views || 0,
  })).sort((a, b) => b.views - a.views);

  // Get top countries
  const topCountries = countries.slice(0, 10);
  const totalViews = countries.reduce((sum, country) => sum + country.views, 0);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg font-semibold flex items-center">
            <Globe className="w-5 h-5 mr-2 text-emerald-400" />
            Geographic Analytics
          </CardTitle>
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span>Total Countries: {countries.length}</span>
            <span>Total Events: {totalViews.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country List */}
          <div>
            <div className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center">
              <MapPin className="w-3 h-3 mr-2" />
              Top Countries
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {topCountries.map((country, idx) => {
                const percentage = totalViews > 0 ? ((country.views / totalViews) * 100).toFixed(1) : "0";
                return (
                  <div 
                    key={country.code} 
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedCountry === country.code 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                    onClick={() => setSelectedCountry(selectedCountry === country.code ? null : country.code)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-emerald-400 font-semibold text-xs">
                          {idx + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{country.name}</p>
                        <p className="text-slate-400 text-xs font-mono">{country.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{country.views.toLocaleString()}</p>
                      <p className="text-emerald-400 text-xs font-semibold">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Country Details */}
          <div>
            <div className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center">
              <Users className="w-3 h-3 mr-2" />
              {selectedCountry ? `${getCountryName(selectedCountry)} Details` : 'Select a Country'}
            </div>
            
            {selectedCountry ? (
              <div className="space-y-4">
                {/* Selected Country Stats */}
                {(() => {
                  const country = countries.find(c => c.code === selectedCountry);
                  if (!country) return null;
                  
                  return (
                    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-white mb-2">
                          {country.views.toLocaleString()}
                        </div>
                        <div className="text-slate-400 text-sm uppercase tracking-wider">
                          Total Events from {country.name}
                        </div>
                        <div className="mt-4 text-emerald-400 text-2xl font-semibold">
                          {((country.views / totalViews) * 100).toFixed(1)}%
                        </div>
                        <div className="text-slate-400 text-xs">
                          of total traffic
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Country Rank */}
                {(() => {
                  const country = countries.find(c => c.code === selectedCountry);
                  const rank = countries.findIndex(c => c.code === selectedCountry) + 1;
                  if (!country) return null;
                  
                  return (
                    <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <h4 className="text-white font-medium mb-3">Country Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Global Rank</span>
                          <span className="text-emerald-400 font-semibold">#{rank} of {countries.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Traffic Share</span>
                          <span className="text-yellow-400 font-semibold">{((country.views / totalViews) * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Event Count</span>
                          <span className="text-blue-400 font-semibold">{country.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>Click on a country to view detailed analytics</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get country name from country code
function getCountryName(countryCode: string): string {
  const countryNames: { [key: string]: string } = {
    'US': 'United States',
    'GB': 'United Kingdom', 
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'JP': 'Japan',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'HK': 'Hong Kong',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'RU': 'Russia',
    'CN': 'China',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'ID': 'Indonesia',
    'MY': 'Malaysia',
    'PH': 'Philippines',
    'BD': 'Bangladesh',
    'PK': 'Pakistan',
    'EG': 'Egypt',
    'ZA': 'South Africa',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'GH': 'Ghana',
    'MA': 'Morocco',
    'DZ': 'Algeria',
    'TN': 'Tunisia',
    'AE': 'UAE',
    'SA': 'Saudi Arabia',
    'IL': 'Israel',
    'TR': 'Turkey',
    'GR': 'Greece',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'SI': 'Slovenia',
    'SK': 'Slovakia',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'EE': 'Estonia',
    'FI': 'Finland',
    'DK': 'Denmark',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'LU': 'Luxembourg',
    'IS': 'Iceland',
    'MT': 'Malta',
    'CY': 'Cyprus',
  };
  
  return countryNames[countryCode] || countryCode;
} 