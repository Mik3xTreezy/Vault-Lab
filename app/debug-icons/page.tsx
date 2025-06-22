"use client"

import { LordIcon } from "@/components/ui/lordicon"
import { LORDICON_COLORS, SETTINGS_ICON_DATA, WALLET_ICON_DATA } from "@/lib/lordicons"
import { useState } from "react"

export default function DebugIconsPage() {
  const [hoverCount, setHoverCount] = useState(0)
  
  const icons = [
    {
      name: "Settings (Local Data)",
      src: SETTINGS_ICON_DATA,
      colors: LORDICON_COLORS.emerald,
    },
    {
      name: "Wallet (Local Data)",
      src: WALLET_ICON_DATA,
      colors: LORDICON_COLORS.green,
    },
    {
      name: "Analytics (URL)",
      src: "https://cdn.lordicon.com/msoeawqm.json",
      colors: LORDICON_COLORS.emerald,
    },
    {
      name: "Shield (URL)",
      src: "https://cdn.lordicon.com/yqzmiobz.json",
      colors: LORDICON_COLORS.blue,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Debug Lordicon Integration</h1>
      
      <div className="mb-8">
        <p className="text-gray-400">Hover Count: {hoverCount}</p>
      </div>

      <div className="grid gap-8">
        {/* Test 1: Basic hover */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test 1: Basic Hover (No Container)</h2>
          <div className="flex gap-4">
            {icons.map((icon, index) => (
              <div key={index} className="text-center">
                <div 
                  className="mb-2"
                  onMouseEnter={() => setHoverCount(prev => prev + 1)}
                >
                  <LordIcon
                    src={icon.src}
                    size={48}
                    trigger="hover"
                    colors={icon.colors}
                  />
                </div>
                <p className="text-sm text-gray-400">{icon.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test 2: With button container (like dashboard) */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test 2: With Button Container (Dashboard Style)</h2>
          <div className="flex gap-4">
            {icons.map((icon, index) => (
              <div key={index} className="text-center">
                <button
                  className="w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer bg-slate-700 hover:bg-slate-600"
                  onMouseEnter={() => setHoverCount(prev => prev + 1)}
                >
                  <LordIcon
                    src={icon.src}
                    size={32}
                    trigger="hover"
                    colors={icon.colors}
                  />
                </button>
                <p className="text-sm text-gray-400 mt-2">{icon.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test 3: Different triggers */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test 3: Different Triggers</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <LordIcon
                src={SETTINGS_ICON_DATA}
                size={48}
                trigger="hover"
                colors={LORDICON_COLORS.emerald}
              />
              <p className="text-sm text-gray-400 mt-2">Hover</p>
            </div>
            <div className="text-center">
              <LordIcon
                src={SETTINGS_ICON_DATA}
                size={48}
                trigger="click"
                colors={LORDICON_COLORS.blue}
              />
              <p className="text-sm text-gray-400 mt-2">Click</p>
            </div>
            <div className="text-center">
              <LordIcon
                src={SETTINGS_ICON_DATA}
                size={48}
                trigger="loop"
                colors={LORDICON_COLORS.purple}
                delay={2000}
              />
              <p className="text-sm text-gray-400 mt-2">Loop</p>
            </div>
            <div className="text-center">
              <LordIcon
                src={SETTINGS_ICON_DATA}
                size={48}
                trigger="auto"
                colors={LORDICON_COLORS.orange}
              />
              <p className="text-sm text-gray-400 mt-2">Auto</p>
            </div>
          </div>
        </div>

        {/* Test 4: Inline hover without wrapper */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test 4: Direct Hover (Potential Fix)</h2>
          <div className="flex gap-4">
            {icons.map((icon, index) => (
              <div 
                key={index} 
                className="text-center w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer bg-slate-700 hover:bg-slate-600"
                onMouseEnter={() => {
                  setHoverCount(prev => prev + 1)
                  console.log(`Hovering ${icon.name}`)
                }}
              >
                <LordIcon
                  src={icon.src}
                  size={32}
                  trigger="hover"
                  colors={icon.colors}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 