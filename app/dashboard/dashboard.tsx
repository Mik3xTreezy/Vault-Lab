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
import { motion, AnimatePresence } from "motion/react"

export default function Dashboard() {
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
      interval = setInterval(fetchAnalytics, 30000); // Poll every 30 seconds instead of 60
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded) {
    return (
      <motion.div 
        className="text-white p-8 min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <motion.div
            className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p>Loading...</p>
        </div>
      </motion.div>
    );
  }
  
  if (!isSignedIn) {
    return (
      <motion.div 
        className="text-white p-8 min-h-screen flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        Access denied.
      </motion.div>
    );
  }
  
  if (loading || !analytics) {
    return (
      <motion.div 
        className="text-white p-8 min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <motion.div
            className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p>Loading analytics...</p>
        </div>
      </motion.div>
    );
  }

  // Overview metrics
  const overviewMetrics = [
    {
      title: "Revenue",
      value: `$${analytics?.userEarnings?.totalRevenue?.toFixed(2) ?? "0.00"}`,
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Avg. CPM",
      value: `$${analytics?.userEarnings?.avgCpm?.toFixed(2) ?? "0.00"}`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Views",
      value: analytics?.overview?.views ?? 0,
      icon: <Eye className="w-5 h-5 text-emerald-400" />,
      change: "+0%", // You can calculate change if you add previous period data
      changeType: "positive" as const,
    },
    {
      title: "Unlocks",
      value: analytics?.overview?.unlocks ?? 0,
      icon: <Unlock className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Task completions",
      value: analytics?.overview?.taskCompletions ?? 0,
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      title: "Unlock Rate",
      value: `${analytics?.overview?.unlockRate?.toFixed(1) ?? "0.0"}%`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      change: "+0%",
      changeType: "positive" as const,
    },
    // Add more metrics as needed
  ];

  // Content performance
  const contentData = Object.entries(analytics?.contentPerformance ?? {}).map(([id, perf]: any) => ({
    title: perf?.title || id,
    id,
    views: perf?.views ?? 0,
    percentage: "-", // You can calculate this if you add total views per content
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
      browser === "Firefox" ? <Chrome className="w-4 h-4 text-emerald-400" /> : // Replace with Firefox icon if available
      browser === "Safari" ? <Chrome className="w-4 h-4 text-emerald-400" /> : // Replace with Safari icon if available
      <Globe className="w-4 h-4 text-emerald-400" />,
  }));

  return (
    <motion.div 
      className="min-h-screen text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between p-6 border-b border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center space-x-3">
            <motion.h1 
              className="text-3xl font-bold text-white mb-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Dashboard
            </motion.h1>
            {/* Live indicator */}
            <motion.span 
              className="flex items-center space-x-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.span 
                className="inline-block w-2 h-2 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Live</span>
            </motion.span>
          </div>
          <motion.div 
            className="flex space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
            </motion.div>
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
          </motion.div>
        </motion.div>

        <div className="p-6 space-y-8">
          {/* Overview Section */}
          <motion.div 
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-white">Overview</h2>
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center space-x-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2"
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-white text-sm">{timeRange}</span>
                <ChevronLeft className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {overviewMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.7 + index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{metric.title}</span>
                      <motion.div 
                        className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"
                        whileHover={{ 
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          scale: 1.1 
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {metric.icon}
                      </motion.div>
                    </div>
                    <div className="space-y-1">
                      <motion.div 
                        className="text-2xl font-bold text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                      >
                        {metric.value}
                      </motion.div>
                      <div className="flex items-center text-xs">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400 mr-1" />
                        <span className="text-emerald-400 font-medium">{metric.change}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Analytics Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg font-semibold">Analytics & Revenue Overview</CardTitle>
                  <motion.div 
                    className="flex items-center space-x-6 text-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.5 }}
                  >
                    {[
                      { color: "bg-emerald-500", label: "Views" },
                      { color: "bg-green-400", label: "Unlocks" },
                      { color: "bg-yellow-400", label: "Tasks" },
                      { color: "bg-blue-400", label: "Revenue" }
                    ].map((item, index) => (
                      <motion.div 
                        key={item.label}
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
                      >
                        <div className={`w-2 h-2 ${item.color} rounded-full`}></div>
                        <span className="text-slate-400">{item.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <motion.div 
                  className="h-64 flex items-end justify-center relative"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.7 }}
                >
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
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content & Traffic Analysis */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.9 }}
          >
            {/* Content Performance */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg font-semibold">Content Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <AnimatePresence>
                    {contentData.map((item, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 2.1 + index * 0.1 }}
                        whileHover={{ 
                          backgroundColor: "rgba(51, 65, 85, 0.8)",
                          x: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <motion.div 
                            className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Globe className="w-4 h-4 text-emerald-400" />
                          </motion.div>
                          <div>
                            <p className="text-white font-medium text-sm">{item.title}</p>
                            <p className="text-slate-400 text-xs font-mono">{item.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{item.views}</p>
                          <p className="text-slate-400 text-xs">views</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Traffic Sources */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg font-semibold">Incoming Traffic</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {/* Domains/Referrers */}
                    <div>
                      <motion.div 
                        className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 2.3 }}
                      >
                        <Globe className="w-3 h-3 mr-2" />
                        Domains
                      </motion.div>
                      <div className="space-y-2">
                        {trafficSources.map((source, idx) => (
                          <motion.div 
                            key={idx} 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 2.4 + idx * 0.1 }}
                            whileHover={{ x: 5 }}
                          >
                            <div className="flex items-center space-x-3">
                              <motion.div 
                                className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center"
                                whileHover={{ scale: 1.1 }}
                              >
                                <Globe className="w-3 h-3 text-emerald-400" />
                              </motion.div>
                              <span className="text-white text-sm font-medium">{source.source}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-emerald-400 text-sm font-semibold">{source.percentage}</span>
                              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-emerald-400 rounded-full"
                                  initial={{ width: "0%" }}
                                  animate={{ width: source.percentage }}
                                  transition={{ duration: 1, delay: 2.5 + idx * 0.1 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Sources */}
                    <div>
                      <motion.div 
                        className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 2.8 }}
                      >
                        <Link className="w-3 h-3 mr-2" />
                        Sources
                      </motion.div>
                      <div className="space-y-2">
                        {[
                          { label: "Links", icon: <Link className="w-3 h-3 text-emerald-400" />, key: "Links" },
                          { label: "Direct", icon: <Search className="w-3 h-3 text-emerald-400" />, key: "Direct" },
                          { label: "Social Media", icon: <Share2 className="w-3 h-3 text-emerald-400" />, key: "Social Media" },
                          { label: "Search", icon: <Search className="w-3 h-3 text-emerald-400" />, key: "Search" },
                        ].map((src, idx) => {
                          const found = trafficSources.find(s => s.source === src.key) || { percentage: "0%" };
                          return (
                            <motion.div 
                              key={idx} 
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: 2.9 + idx * 0.1 }}
                              whileHover={{ x: 5 }}
                            >
                              <div className="flex items-center space-x-3">
                                <motion.div 
                                  className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center"
                                  whileHover={{ scale: 1.1 }}
                                >
                                  {src.icon}
                                </motion.div>
                                <span className="text-white text-sm font-medium">{src.label}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-emerald-400 text-sm font-semibold">{found.percentage}</span>
                                <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-emerald-400 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: found.percentage }}
                                    transition={{ duration: 1, delay: 3 + idx * 0.1 }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Platforms (Devices & Browsers) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 3.3 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg font-semibold">Platforms</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Devices */}
                  <div>
                    <motion.div 
                      className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 3.5 }}
                    >
                      <Monitor className="w-3 h-3 mr-2" />
                      Devices
                    </motion.div>
                    <div className="space-y-2">
                      {deviceData.map((device, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 3.6 + idx * 0.1 }}
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                            >
                              {device.icon}
                            </motion.div>
                            <span className="text-white text-sm font-medium">{device.device}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-emerald-400 text-sm font-semibold">{device.percentage}</span>
                            <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-emerald-400 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: device.percentage }}
                                transition={{ duration: 1, delay: 3.7 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Browsers */}
                  <div>
                    <motion.div 
                      className="text-slate-400 font-medium uppercase tracking-wider mb-3 text-xs flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 3.9 }}
                    >
                      <Chrome className="w-3 h-3 mr-2" />
                      Web browsers
                    </motion.div>
                    <div className="space-y-2">
                      {browserData.map((browser, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 4 + idx * 0.1 }}
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                            >
                              {browser.icon}
                            </motion.div>
                            <span className="text-white text-sm font-medium">{browser.browser}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-emerald-400 text-sm font-semibold">{browser.percentage}</span>
                            <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-emerald-400 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: browser.percentage }}
                                transition={{ duration: 1, delay: 4.1 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Geo Map Section */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 4.3 }}
          >
            <GeoMap countryData={analytics.countryData} userId={user.id} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}