"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LordIcon } from "@/components/ui/lordicon"
import { getLordicon, LORDICON_COLORS } from "@/lib/lordicons"
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  Link,
  Search,
  Share2,
  ArrowUpRight,
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import GeoMap from "./GeoMap";
import { motion } from "framer-motion"

export default function DashboardEnhanced() {
  const [timeRange, setTimeRange] = useState("28 Days")
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchAnalytics() {
      setLoading(true);
      if (!user) return;
      try {
        const res = await fetch(`/api/dashboard-analytics?user_id=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Dashboard analytics error:', error);
        setAnalytics(null);
      }
      setLoading(false);
    }
    if (isLoaded && isSignedIn && user) {
      fetchAnalytics();
      interval = setInterval(fetchAnalytics, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LordIcon 
          src={getLordicon('loading')} 
          size={64} 
          trigger="loop" 
          delay={500}
          colors={LORDICON_COLORS.emerald}
        />
      </div>
    );
  }
  
  if (!isSignedIn) {
    return <div className="text-white p-8">Access denied.</div>;
  }
  
  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LordIcon 
            src={getLordicon('loading')} 
            size={64} 
            trigger="loop" 
            delay={1000}
            colors={LORDICON_COLORS.emerald}
          />
          <p className="text-white">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Enhanced overview metrics with animated icons
  const overviewMetrics = [
    {
      title: "Revenue",
      value: `$${analytics?.userEarnings?.totalRevenue?.toFixed(2) ?? "0.00"}`,
      icon: (
        <LordIcon 
          src={getLordicon('wallet')} 
          size={32} 
          trigger="hover"
          colors={LORDICON_COLORS.emerald}
          className="opacity-90 hover:opacity-100"
        />
      ),
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Avg. CPM",
      value: `$${analytics?.userEarnings?.avgCpm?.toFixed(2) ?? "0.00"}`,
      icon: (
        <LordIcon 
          src={getLordicon('analytics')} 
          size={32} 
          trigger="hover"
          colors={LORDICON_COLORS.emerald}
          className="opacity-90 hover:opacity-100"
        />
      ),
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Views",
      value: analytics?.overview?.views ?? 0,
      icon: (
        <LordIcon 
          src={getLordicon('eye')} 
          size={32} 
          trigger="hover"
          colors={LORDICON_COLORS.emerald}
          className="opacity-90 hover:opacity-100"
        />
      ),
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Unlocks",
      value: analytics?.overview?.unlocks ?? 0,
      icon: (
        <LordIcon 
          src={getLordicon('unlock')} 
          size={32} 
          trigger="hover"
          colors={LORDICON_COLORS.emerald}
          className="opacity-90 hover:opacity-100"
        />
      ),
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Task completions",
      value: analytics?.overview?.taskCompletions ?? 0,
      icon: (
        <LordIcon 
          src={getLordicon('success')} 
          size={32} 
          trigger="hover"
          colors={LORDICON_COLORS.emerald}
          className="opacity-90 hover:opacity-100"
        />
      ),
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Unlock Rate",
      value: `${analytics?.overview?.unlockRate?.toFixed(1) ?? "0.0"}%`,
      icon: (
        <LordIcon 
          src={getLordicon('stats')} 
          size={32} 
          trigger="hover"
          colors={LORDICON_COLORS.emerald}
          className="opacity-90 hover:opacity-100"
        />
      ),
      change: "+0%",
      changeType: "positive" as const,
    },
  ];

  // Content performance with animated icons
  const contentData = Object.entries(analytics?.contentPerformance ?? {}).map(([id, perf]: any) => ({
    title: perf?.title || id,
    id,
    views: perf?.views ?? 0,
    percentage: "-",
  }));

  // Traffic sources
  const totalSources = Object.values(analytics?.sources ?? {}).reduce((a: number, b: any) => a + Number(b), 0);
  const trafficSources = Object.entries(analytics?.sources ?? {}).map(([source, views]: any) => ({
    source,
    views,
    percentage: totalSources ? `${((Number(views) / totalSources) * 100).toFixed(1)}%` : "0%",
  }));

  // Devices
  const totalDevices = Object.values(analytics?.devices ?? {}).reduce((a: number, b: any) => a + Number(b), 0);
  const deviceData = Object.entries(analytics?.devices ?? {}).map(([device, count]: any) => ({
    device,
    percentage: totalDevices ? `${((Number(count) / totalDevices) * 100).toFixed(1)}%` : "0%",
    icon:
      device === "Desktop" ? <Monitor className="w-4 h-4 text-emerald-400" /> :
      device === "Mobile" ? <Smartphone className="w-4 h-4 text-emerald-400" /> :
      <Tablet className="w-4 h-4 text-emerald-400" />,
  }));

  // Browsers
  const totalBrowsers = Object.values(analytics?.browsers ?? {}).reduce((a: number, b: any) => a + Number(b), 0);
  const browserData = Object.entries(analytics?.browsers ?? {}).map(([browser, count]: any) => ({
    browser,
    percentage: totalBrowsers ? `${((Number(count) / totalBrowsers) * 100).toFixed(1)}%` : "0%",
    icon:
      browser === "Chrome" ? <Chrome className="w-4 h-4 text-emerald-400" /> :
      browser === "Firefox" ? <Chrome className="w-4 h-4 text-emerald-400" /> :
      browser === "Safari" ? <Chrome className="w-4 h-4 text-emerald-400" /> :
      <Globe className="w-4 h-4 text-emerald-400" />,
  }));

  return (
    <div className="min-h-screen text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Enhanced Header with animated dashboard icon */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <LordIcon 
              src={getLordicon('dashboard')} 
              size={40} 
              trigger="auto"
              delay={2000}
              colors={LORDICON_COLORS.emerald}
            />
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              {/* Live indicator with animated notification */}
              <div className="flex items-center space-x-2 mt-1">
                <LordIcon 
                  src={getLordicon('notification')} 
                  size={16} 
                  trigger="loop"
                  delay={3000}
                  colors={LORDICON_COLORS.green}
                />
                <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => {
                if (user) {
                  const fetchAnalytics = async () => {
                    setLoading(true);
                    try {
                      const res = await fetch(`/api/dashboard-analytics?user_id=${user.id}&_t=${Date.now()}`);
                      if (!res.ok) throw new Error("Failed to fetch analytics");
                      const data = await res.json();
                      setAnalytics(data);
                    } catch (error) {
                      console.error('Manual refresh error:', error);
                    }
                    setLoading(false);
                  };
                  fetchAnalytics();
                }
              }}
            >
              Refresh
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium relative overflow-hidden group"
                onClick={() => router.push("/create")}
              >
                {/* Animated background shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                />
                
                {/* Button content */}
                <div className="relative flex items-center space-x-2">
                  <motion.div
                    animate={{ rotate: [0, 90, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.div>
                  <span>Create Locker</span>
                </div>
                
                {/* Pulsing glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-md"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(16, 185, 129, 0)',
                      '0 0 0 8px rgba(16, 185, 129, 0.1)',
                      '0 0 0 0 rgba(16, 185, 129, 0)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Overview Section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Overview</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">{timeRange}</span>
                <ChevronLeft className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
              </div>
            </div>
          </div>

          {/* Enhanced Metrics Grid with animated icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {overviewMetrics.map((metric, index) => (
              <Card
                key={index}
                className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all duration-200 group"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{metric.title}</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      {metric.icon}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-white">{metric.value}</div>
                    <div className="flex items-center text-xs">
                      <ArrowUpRight className="w-3 h-3 text-emerald-400 mr-1" />
                      <span className="text-emerald-400 font-medium">{metric.change}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analytics Chart with animated header */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <LordIcon 
                    src={getLordicon('analytics')} 
                    size={24} 
                    trigger="hover"
                    colors={LORDICON_COLORS.emerald}
                  />
                  <CardTitle className="text-white text-lg font-semibold">Analytics & Revenue Overview</CardTitle>
                </div>
                <div className="flex items-center space-x-6 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-400">Views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-400">Unlocks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-slate-400">Tasks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-400">Revenue</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 flex items-end justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.chartData ?? []} margin={{ top: 20, right: 60, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#60a5fa', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', color: '#fff' }} 
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'Revenue ($)') {
                          return [`$${Number(value).toFixed(4)}`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={false} name="Views" yAxisId="left" />
                    <Line type="monotone" dataKey="unlocks" stroke="#22c55e" strokeWidth={2} dot={false} name="Unlocks" yAxisId="left" />
                    <Line type="monotone" dataKey="tasks" stroke="#eab308" strokeWidth={2} dot={false} name="Tasks" yAxisId="left" />
                    <Line type="monotone" dataKey="revenue" stroke="#60a5fa" strokeWidth={2} dot={false} name="Revenue ($)" yAxisId="right" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Content & Traffic Analysis with animated icons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Performance */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <LordIcon 
                    src={getLordicon('eye')} 
                    size={20} 
                    trigger="hover"
                    colors={LORDICON_COLORS.emerald}
                  />
                  <CardTitle className="text-white text-lg font-semibold">Content Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {contentData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 group hover:bg-slate-800/70 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <LordIcon 
                          src={getLordicon('lock')} 
                          size={16} 
                          trigger="hover"
                          colors={LORDICON_COLORS.emerald}
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{item.title}</p>
                        <p className="text-slate-400 text-xs font-mono">{item.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{item.views}</p>
                      <p className="text-slate-400 text-xs">views</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <LordIcon 
                    src={getLordicon('analytics')} 
                    size={20} 
                    trigger="hover"
                    colors={LORDICON_COLORS.emerald}
                  />
                  <CardTitle className="text-white text-lg font-semibold">Incoming Traffic</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Rest of the traffic sources content remains the same */}
                  <div>
                    <div className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center">
                      <Globe className="w-3 h-3 mr-2" />
                      Domains
                    </div>
                    <div className="space-y-2">
                      {trafficSources.map((source, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                              <Globe className="w-3 h-3 text-emerald-400" />
                            </div>
                            <span className="text-white text-sm font-medium">{source.source}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-emerald-400 text-sm font-semibold">{source.percentage}</span>
                            <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: source.percentage }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center">
                      <Link className="w-3 h-3 mr-2" />
                      Sources
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Links", icon: <Link className="w-3 h-3 text-emerald-400" />, key: "Links" },
                        { label: "Direct", icon: <Search className="w-3 h-3 text-emerald-400" />, key: "Direct" },
                        { label: "Social Media", icon: <Share2 className="w-3 h-3 text-emerald-400" />, key: "Social Media" },
                        { label: "Search", icon: <Search className="w-3 h-3 text-emerald-400" />, key: "Search" },
                      ].map((src, idx) => {
                        const found = trafficSources.find(s => s.source === src.key) || { percentage: "0%" };
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                {src.icon}
                              </div>
                              <span className="text-white text-sm font-medium">{src.label}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-emerald-400 text-sm font-semibold">{found.percentage}</span>
                              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                                  style={{ width: found.percentage }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platforms (Devices & Browsers) */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <LordIcon 
                  src={getLordicon('settings')} 
                  size={20} 
                  trigger="hover"
                  colors={LORDICON_COLORS.emerald}
                />
                <CardTitle className="text-white text-lg font-semibold">Platforms</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Devices */}
                <div>
                  <div className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center">
                    <Monitor className="w-3 h-3 mr-2" />
                    Devices
                  </div>
                  <div className="space-y-2">
                    {deviceData.map((device, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            {device.icon}
                          </div>
                          <span className="text-white text-sm font-medium">{device.device}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-emerald-400 text-sm font-semibold">{device.percentage}</span>
                          <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                              style={{ width: device.percentage }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Browsers */}
                <div>
                  <div className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center">
                    <Chrome className="w-3 h-3 mr-2" />
                    Web browsers
                  </div>
                  <div className="space-y-2">
                    {browserData.map((browser, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            {browser.icon}
                          </div>
                          <span className="text-white text-sm font-medium">{browser.browser}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-emerald-400 text-sm font-semibold">{browser.percentage}</span>
                          <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                              style={{ width: browser.percentage }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geo Map Section */}
          <div className="mt-8">
            <GeoMap countryData={analytics.countryData} userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
} 