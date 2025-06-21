import React from 'react';
import { LordIcon } from './lordicon';
import { getLordicon, LORDICON_COLORS } from '@/lib/lordicons';
import { Card, CardContent, CardHeader, CardTitle } from './card';

export function LordIconExamples() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">Animated Icon Examples</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Loading Animation */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Loading Animation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <LordIcon 
              src={getLordicon('loading')} 
              size={48} 
              trigger="loop" 
              delay={1000}
              colors={LORDICON_COLORS.emerald}
            />
            <p className="text-slate-400 text-xs text-center">Auto-loops every second</p>
          </CardContent>
        </Card>

        {/* Hover Animation */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Hover Animation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <LordIcon 
              src={getLordicon('wallet')} 
              size={48} 
              trigger="hover"
              colors={LORDICON_COLORS.emerald}
            />
            <p className="text-slate-400 text-xs text-center">Hover to animate</p>
          </CardContent>
        </Card>

        {/* Click Animation */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Click Animation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <LordIcon 
              src={getLordicon('success')} 
              size={48} 
              trigger="click"
              colors={LORDICON_COLORS.green}
            />
            <p className="text-slate-400 text-xs text-center">Click to animate</p>
          </CardContent>
        </Card>

        {/* Auto Animation */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Auto Animation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <LordIcon 
              src={getLordicon('analytics')} 
              size={48} 
              trigger="auto"
              delay={2000}
              colors={LORDICON_COLORS.blue}
            />
            <p className="text-slate-400 text-xs text-center">Plays automatically once</p>
          </CardContent>
        </Card>

        {/* Security Icon */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Security Icon</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <LordIcon 
              src={getLordicon('shield')} 
              size={48} 
              trigger="hover"
              colors={LORDICON_COLORS.purple}
            />
            <p className="text-slate-400 text-xs text-center">Shield protection</p>
          </CardContent>
        </Card>

        {/* Settings Icon */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Settings Icon</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-3">
            <LordIcon 
              src={getLordicon('settings')} 
              size={48} 
              trigger="hover"
              colors={LORDICON_COLORS.orange}
            />
            <p className="text-slate-400 text-xs text-center">Configuration</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Dashboard Metrics Example</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "Revenue", value: "$1,234.56", icon: 'wallet', color: LORDICON_COLORS.emerald },
            { title: "Views", value: "12,345", icon: 'eye', color: LORDICON_COLORS.blue },
            { title: "Users", value: "1,234", icon: 'users', color: LORDICON_COLORS.purple },
            { title: "Success Rate", value: "98.5%", icon: 'success', color: LORDICON_COLORS.green },
          ].map((metric, index) => (
            <Card key={index} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all duration-200 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{metric.title}</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <LordIcon 
                      src={getLordicon(metric.icon as any)} 
                      size={20} 
                      trigger="hover"
                      colors={metric.color}
                    />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 