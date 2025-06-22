"use client"

import { LordIcon } from '@/components/ui/lordicon';
import { SETTINGS_ICON_DATA, LORDICON_COLORS } from '@/lib/lordicons';
import { WALLET_ICON_DATA } from '@/lib/wallet-icon-data';
import { ANALYTICS_ICON_DATA } from '@/lib/analytics-icon-data';

export default function DebugIconsPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-white text-3xl font-bold">Debug Icons</h1>
        
        {/* Test 1: Simple URL-based icon */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-white text-xl mb-4">Test 1: Simple URL Icon</h2>
          <div className="flex items-center gap-4">
            <LordIcon 
              src="https://cdn.lordicon.com/msoeawqm.json"
              size={48}
              trigger="hover"
              className="border border-white"
            />
            <p className="text-white">Hover over this icon (should be analytics chart)</p>
          </div>
        </div>

        {/* Test 2: Embedded JSON data */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-white text-xl mb-4">Test 2: Embedded JSON Data</h2>
          <div className="flex items-center gap-4">
            <LordIcon 
              src={SETTINGS_ICON_DATA}
              size={48}
              trigger="hover"
              className="border border-white"
            />
            <p className="text-white">Hover over this icon (should be settings cog)</p>
          </div>
        </div>

        {/* Test 3: With colors */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-white text-xl mb-4">Test 3: With Colors</h2>
          <div className="flex items-center gap-4">
            <LordIcon 
              src={SETTINGS_ICON_DATA}
              size={48}
              trigger="hover"
              colors={LORDICON_COLORS.emerald}
              className="border border-white"
            />
            <p className="text-white">Hover over this icon (should be green settings cog)</p>
          </div>
        </div>

        {/* Test 4: Loop animation */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-white text-xl mb-4">Test 4: Loop Animation</h2>
          <div className="flex items-center gap-4">
            <LordIcon 
              src={SETTINGS_ICON_DATA}
              size={48}
              trigger="loop"
              delay={2000}
              colors={LORDICON_COLORS.emerald}
              className="border border-white"
            />
            <p className="text-white">This should loop every 2 seconds</p>
          </div>
        </div>

        {/* Test 5: Wallet Icon */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-white text-xl mb-4">Test 5: Wallet Icon (Finance)</h2>
          <div className="flex items-center gap-4">
            <LordIcon 
              src={WALLET_ICON_DATA}
              size={48}
              trigger="hover"
              colors={LORDICON_COLORS.green}
              className="border border-white"
            />
            <p className="text-white">Hover over this icon (should be animated wallet/coins)</p>
          </div>
        </div>

        {/* Test 6: Analytics Icon */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-white text-xl mb-4">Test 6: Analytics Icon (Dashboard)</h2>
          <div className="flex items-center gap-4">
            <LordIcon 
              src={ANALYTICS_ICON_DATA}
              size={48}
              trigger="hover"
              colors={LORDICON_COLORS.emerald}
              className="border border-white"
            />
            <p className="text-white">Hover over this icon (should be animated bar chart)</p>
          </div>
        </div>

        {/* Debug info */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-white text-xl mb-4">Debug Info</h2>
          <div className="text-sm text-gray-300 space-y-2">
            <p>Settings Icon Data Type: {typeof SETTINGS_ICON_DATA}</p>
            <p>Settings Icon Data Keys: {Object.keys(SETTINGS_ICON_DATA).join(', ')}</p>
            <p>Wallet Icon Data Type: {typeof WALLET_ICON_DATA}</p>
            <p>Analytics Icon Data Type: {typeof ANALYTICS_ICON_DATA}</p>
            <p>Colors: {LORDICON_COLORS.emerald}</p>
            <p>Green Colors: {LORDICON_COLORS.green}</p>
            <p>Open browser console to check for errors</p>
          </div>
        </div>
      </div>
    </div>
  );
} 