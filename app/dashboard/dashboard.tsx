"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DollarSign,
  Eye,
  Unlock,
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  MousePointer,
  CheckCircle,
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

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("28 Days")
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      if (!user) return;
      const res = await fetch(`/api/dashboard-analytics?user_id=${user.id}`);
      const data = await res.json();
      setAnalytics(data);
      setLoading(false);
    }
    if (user) fetchAnalytics();
    // No polling here; GeoMap will handle its own polling
  }, [user]);

  if (loading || !analytics) {
    return <div className="text-white p-8">Loading analytics...</div>;
  }

  // Overview metrics
  const overviewMetrics = [
    {
      title: "Revenue",
      value: `$${analytics.userEarnings?.totalRevenue?.toFixed(2) ?? "0.00"}`,
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Avg. CPM",
      value: `$${analytics.userEarnings?.avgCpm?.toFixed(2) ?? "0.00"}`,
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Views",
      value: analytics.overview.views,
      icon: <Eye className="w-5 h-5 text-emerald-400" />,
      change: "+0%", // You can calculate change if you add previous period data
      changeType: "positive" as const,
    },
    {
      title: "Unlocks",
      value: analytics.overview.unlocks,
      icon: <Unlock className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Task completions",
      value: analytics.overview.taskCompletions,
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Unlock Rate",
      value: `${analytics.overview.unlockRate.toFixed(1)}%`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    // Add more metrics as needed
  ];

  // Content performance
  const contentData = Object.entries(analytics.contentPerformance).map(([id, perf]: any) => ({
    title: perf.title || id,
    id,
    views: perf.views,
    percentage: "-", // You can calculate this if you add total views per content
  }));

  // Traffic sources
  const totalSources = Object.values(analytics.sources).reduce((a: number, b: any) => a + Number(b), 0);
  const trafficSources = Object.entries(analytics.sources).map(([source, views]: any) => ({
    source,
    views,
    percentage: totalSources ? `${((Number(views) / totalSources) * 100).toFixed(1)}%` : "0%",
  }));

  // Devices
  const totalDevices = Object.values(analytics.devices).reduce((a: number, b: any) => a + Number(b), 0);
  const deviceData = Object.entries(analytics.devices).map(([device, count]: any) => ({
    device,
    percentage: totalDevices ? `${((Number(count) / totalDevices) * 100).toFixed(1)}%` : "0%",
    icon:
      device === "Desktop" ? <Monitor className="w-4 h-4" /> :
      device === "Mobile" ? <Smartphone className="w-4 h-4" /> :
      <Tablet className="w-4 h-4" />,
  }));

  // Browsers
  const totalBrowsers = Object.values(analytics.browsers).reduce((a: number, b: any) => a + Number(b), 0);
  const browserData = Object.entries(analytics.browsers).map(([browser, count]: any) => ({
    browser,
    percentage: totalBrowsers ? `${((Number(count) / totalBrowsers) * 100).toFixed(1)}%` : "0%",
    icon:
      browser === "Chrome" ? <Chrome className="w-4 h-4" /> :
      browser === "Firefox" ? <Chrome className="w-4 h-4" /> : // Replace with Firefox icon if available
      browser === "Safari" ? <Chrome className="w-4 h-4" /> : // Replace with Safari icon if available
      <Globe className="w-4 h-4" />,
  }));

  return (
    <div className="min-h-screen text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
            {/* Live indicator */}
            <span className="flex items-center space-x-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Live</span>
            </span>
          </div>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium"
            onClick={() => router.push("/create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create link locker
          </Button>
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

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewMetrics.map((metric, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300 text-sm">{metric.title}</span>
                    {metric.icon}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">{metric.value}</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 text-sm font-medium">{metric.change}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analytics Chart (placeholder, you can use analytics.chartData if you add it) */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Analytics Overview</CardTitle>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-300">Views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Unlocks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-300">Tasks</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', color: '#fff' }} labelStyle={{ color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={false} name="Views" />
                    <Line type="monotone" dataKey="unlocks" stroke="#22c55e" strokeWidth={2} dot={false} name="Unlocks" />
                    <Line type="monotone" dataKey="tasks" stroke="#eab308" strokeWidth={2} dot={false} name="Tasks" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Content & Traffic Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Content Performance */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Content Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Globe className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold leading-tight">{item.title}</p>
                        <p className="text-gray-400 text-sm font-mono">{item.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium text-lg">{item.views}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold">Incoming Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Domains/Referrers */}
                  <div className="flex-1">
                    <div className="text-gray-300 font-bold uppercase tracking-wide mb-2 text-sm">Domains</div>
                    {trafficSources.map((source, idx) => (
                      <div key={idx} className="flex items-center mb-2">
                        <Globe className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-white text-base font-medium truncate max-w-[160px]">{source.source}</span>
                        <span className="ml-2 text-yellow-400 text-base font-bold">{source.percentage}</span>
                        <div className="ml-2 flex items-center">
                          {Array.from({ length: Math.round(Number(source.percentage.replace('%', '')) / 5) }).map((_, i) => (
                            <div key={i} className="w-1 h-3 bg-yellow-400 rounded mr-0.5" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Sources */}
                  <div className="flex-1">
                    <div className="text-gray-300 font-bold uppercase tracking-wide mb-2 text-sm">Sources</div>
                    {[
                      { label: "Links", icon: <Link className="w-4 h-4 text-yellow-400" />, key: "Links", color: "bg-yellow-400" },
                      { label: "Direct", icon: <Search className="w-4 h-4 text-gray-400" />, key: "Direct", color: "bg-gray-400" },
                      { label: "Social Media", icon: <Share2 className="w-4 h-4 text-blue-400" />, key: "Social Media", color: "bg-blue-400" },
                      { label: "Search", icon: <Search className="w-4 h-4 text-green-400" />, key: "Search", color: "bg-green-400" },
                    ].map((src, idx) => {
                      const found = trafficSources.find(s => s.source === src.key) || { percentage: "0%" };
                      return (
                        <div key={idx} className="flex items-center mb-2">
                          {src.icon}
                          <span className="text-white text-base font-medium ml-2">{src.label}</span>
                          <span className="ml-2 text-yellow-400 text-base font-bold">{found.percentage}</span>
                          <div className="ml-2 flex items-center">
                            {Array.from({ length: Math.round(Number(found.percentage.replace('%', '')) / 5) }).map((_, i) => (
                              <div key={i} className={`w-1 h-3 ${src.color} rounded mr-0.5`} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platforms (Devices & Browsers) */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Devices */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-bold uppercase tracking-wide text-sm">Devices</span>
                    <span className="text-gray-400 text-xs flex items-center">
                      <BarChart3 className="w-3 h-3 mr-1" /> Views
                    </span>
                  </div>
                  {deviceData.map((device, idx) => (
                    <div key={idx} className="flex items-center mb-2">
                      <span className="w-6 h-6 flex items-center justify-center">{device.icon}</span>
                      <span className="text-white ml-2">{device.device}</span>
                      <span className="ml-auto text-purple-400 font-bold">{device.percentage}</span>
                      <div className="ml-2 flex items-center">
                        {Array.from({ length: Math.round(Number(device.percentage.replace('%', '')) / 5) }).map((_, i) => (
                          <div key={i} className="w-1 h-3 bg-purple-400 rounded mr-0.5" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Browsers */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-bold uppercase tracking-wide text-sm">Web browsers</span>
                    <span className="text-gray-400 text-xs flex items-center">
                      <BarChart3 className="w-3 h-3 mr-1" /> Views
                    </span>
                  </div>
                  {browserData.map((browser, idx) => (
                    <div key={idx} className="flex items-center mb-2">
                      <span className="w-6 h-6 flex items-center justify-center">{browser.icon}</span>
                      <span className="text-white ml-2">{browser.browser}</span>
                      <span className="ml-auto text-teal-400 font-bold">{browser.percentage}</span>
                      <div className="ml-2 flex items-center">
                        {Array.from({ length: Math.round(Number(browser.percentage.replace('%', '')) / 5) }).map((_, i) => (
                          <div key={i} className="w-1 h-3 bg-teal-400 rounded mr-0.5" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geo Map Section */}
          <div className="mt-8">
            <GeoMap countryData={analytics.countryData} />
          </div>
        </div>
      </div>
    </div>
  )
}