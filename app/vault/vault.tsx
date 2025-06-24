"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit,
  ExternalLink,
  Globe,
  TrendingUp,
  BarChart3,
  X,
  Save,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

function MiniChart({ data }: { data: { views: number }[] }) {
  return (
    <LineChart width={60} height={24} data={data} style={{ background: "transparent" }}>
      <Line
        type="monotone"
        dataKey="views"
        stroke="#fff"
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  )
}

export default function Vault() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [lockers, setLockers] = useState<any[]>([])
  const [filteredLockers, setFilteredLockers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocker, setSelectedLocker] = useState<any>(null)
  const [lockerAnalytics, setLockerAnalytics] = useState<any>(null)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingLocker, setEditingLocker] = useState<any>(null)
  const [editForm, setEditForm] = useState({ title: '', destination_url: '' })
  const [lockerCharts, setLockerCharts] = useState<Record<string, { chartData: any[], totalViews: number }>>({})
  const [bestPerformingLockers, setBestPerformingLockers] = useState<any[]>([])

  // Authentication check
  if (!isLoaded) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex items-center justify-center">Loading...</div>
  }
  if (!isSignedIn) {
    router.push('/sign-in')
    return null
  }

  useEffect(() => {
    async function fetchLockers() {
      setLoading(true)
      const res = await fetch("/api/lockers")
      const data = await res.json()
      setLockers(data)
      setFilteredLockers(data) // Initialize filtered lockers with all lockers
      setLoading(false)
    }
    fetchLockers()
  }, [])

  // Filter lockers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLockers(lockers)
    } else {
      const filtered = lockers.filter(locker => 
        locker.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locker.destination_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locker.id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLockers(filtered)
    }
  }, [searchQuery, lockers])

  useEffect(() => {
    if (!loading && lockers.length > 0) {
      Promise.all(
        lockers.map(locker =>
          fetch(`/api/locker-analytics/${locker.id}`)
            .then(res => res.json())
            .then(data => ({
              id: locker.id,
              title: locker.title,
              chartData: data.chartData || [],
              totalViews: data.overview?.views ?? 0,
              unlocks: data.overview?.unlocks ?? 0,
              taskCompletions: data.overview?.taskCompletions ?? 0,
              unlockRate: data.overview?.unlockRate ?? 0,
            }))
        )
      ).then(results => {
        const charts: Record<string, { chartData: any[], totalViews: number }> = {}
        results.forEach(({ id, chartData, totalViews }) => {
          charts[id] = { chartData, totalViews }
        })
        setLockerCharts(charts)

        // Calculate best performing lockers
        // Sort by a combination of views, unlocks, and task completions
        const sortedLockers = results
          .map(result => ({
            ...result,
            // Performance score: weighted combination of metrics
            performanceScore: (result.totalViews * 1) + (result.unlocks * 2) + (result.taskCompletions * 3)
          }))
          .sort((a, b) => b.performanceScore - a.performanceScore)
          .slice(0, 6) // Top 6 performers
          .map(locker => ({
            title: locker.title || 'Untitled',
            views: locker.totalViews > 0 ? `${locker.totalViews} views` : 'No views',
            id: locker.id,
            hasData: locker.totalViews > 0
          }))

        // Fill remaining slots with "No data" if less than 6 lockers
        while (sortedLockers.length < 6) {
          sortedLockers.push({
            title: "No data",
            views: "No views",
            id: "No data",
            hasData: false
          })
        }

        setBestPerformingLockers(sortedLockers)
      })
    }
  }, [loading, lockers])

  // Fetch analytics when a locker is selected
  useEffect(() => {
    if (selectedLocker && analyticsOpen) {
      setLockerAnalytics(null)
      fetch(`/api/locker-analytics/${selectedLocker.id}`)
        .then(res => res.json())
        .then(data => setLockerAnalytics(data))
    }
  }, [selectedLocker, analyticsOpen])

  // Handle edit locker
  const handleEditLocker = (locker: any) => {
    setEditingLocker(locker)
    setEditForm({
      title: locker.title || '',
      destination_url: locker.destination_url || ''
    })
    setEditOpen(true)
  }

  // Save edited locker
  const handleSaveEdit = async () => {
    if (!editingLocker) return
    
    try {
      const response = await fetch(`/api/lockers/${editingLocker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })
      
      if (response.ok) {
        // Refresh lockers list
        const res = await fetch("/api/lockers")
        const data = await res.json()
        setLockers(data)
        setFilteredLockers(data) // Update filtered lockers as well
        setEditOpen(false)
        setEditingLocker(null)
      }
    } catch (error) {
      console.error('Error updating locker:', error)
    }
  }

  // Open locked link in new tab
  const handleOpenLink = (locker: any) => {
    const url = `${window.location.origin}/locked/${locker.id}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Vault</h1>
            <p className="text-gray-400 text-sm">{user?.emailAddresses?.[0]?.emailAddress || 'No email'}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              onClick={() => router.push("/create")}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
              />
              
              <div className="relative flex items-center space-x-2">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Plus className="w-4 h-4" />
                </motion.div>
                <span>Create Locker</span>
              </div>
            </Button>
          </motion.div>
        </div>

        <div className="p-6 space-y-8">
          {/* Best Performing Lockers */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Best performing lockers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-lg animate-pulse"></div>
                        <div className="w-12 h-3 bg-gray-600 rounded animate-pulse"></div>
                      </div>
                      <div className="w-20 h-4 bg-gray-600 rounded animate-pulse mb-1"></div>
                      <div className="w-16 h-3 bg-gray-600 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                bestPerformingLockers.map((locker, index) => (
                <Card
                  key={index}
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        {locker.hasData ? (
                          <Globe className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-4 h-4 bg-gray-600 rounded"></div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-mono">{locker.id}</span>
                    </div>
                    <h3 className="text-white font-medium mb-1">{locker.title}</h3>
                    <p className="text-gray-400 text-sm">{locker.views}</p>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>

          {/* Created Lockers */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Created lockers</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by title, URL, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50"
                  />
                </div>
                <Button variant="outline" size="icon" className="border-white/10 bg-white/5 hover:bg-white/10">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-white/10 bg-white/5 hover:bg-white/10">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-white/10 bg-white/5 hover:bg-white/10">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-gray-300">Title</TableHead>
                    <TableHead className="text-gray-300">ID</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Views chart</TableHead>
                    <TableHead className="text-gray-300">Views</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                  ) : filteredLockers.length === 0 ? (
                    <TableRow><TableCell colSpan={6}>{searchQuery ? 'No lockers match your search.' : 'No lockers found.'}</TableCell></TableRow>
                  ) : filteredLockers.map((locker, index) => (
                    <TableRow key={index} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Globe className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{locker.title}</p>
                            <p className="text-gray-400 text-sm">{locker.destination_url}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-300 font-mono text-sm">{locker.id}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-300">{locker.created_at ? new Date(locker.created_at).toLocaleDateString() : "-"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {lockerCharts[locker.id]?.chartData ? (
                            <MiniChart data={lockerCharts[locker.id].chartData} />
                          ) : (
                            <div className="w-[60px] h-[24px] bg-gray-800 rounded" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-white font-medium">
                          {lockerCharts[locker.id]?.totalViews ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 hover:bg-white/10"
                            onClick={() => handleEditLocker(locker)}
                            aria-label="Edit locker"
                          >
                            <Edit className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 hover:bg-white/10"
                            onClick={() => handleOpenLink(locker)}
                            aria-label="Open locked link"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 hover:bg-white/10"
                            onClick={() => {
                              setSelectedLocker(locker)
                              setAnalyticsOpen(true)
                            }}
                            aria-label="View analytics"
                          >
                            <BarChart3 className="w-4 h-4 text-emerald-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                Use filters in the table below for detailed sorting by date or views.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-[#18181b] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Edit Locker
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-300">
                Title
              </Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50"
                placeholder="Enter locker title"
              />
            </div>
            <div>
              <Label htmlFor="destination_url" className="text-sm font-medium text-gray-300">
                Destination URL
              </Label>
              <Textarea
                id="destination_url"
                value={editForm.destination_url}
                onChange={(e) => setEditForm({ ...editForm, destination_url: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50 min-h-[80px]"
                placeholder="Enter destination URL"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="border-white/10 bg-white/5 hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="max-w-2xl bg-[#18181b] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Analytics for: <span className="font-mono text-emerald-400">{selectedLocker?.title}</span>
            </DialogTitle>
          </DialogHeader>
          {!lockerAnalytics ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={lockerAnalytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={{ stroke: '#334155' }}
                    />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: 'none', color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#fff' }}
                      iconType="circle"
                    />
                    <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={false} name="Views" />
                    <Line type="monotone" dataKey="unlocks" stroke="#22c55e" strokeWidth={2} dot={false} name="Unlocks" />
                    <Line type="monotone" dataKey="tasks" stroke="#eab308" strokeWidth={2} dot={false} name="Tasks" />
                    <Line type="monotone" dataKey="revenue" stroke="#60a5fa" strokeWidth={2} dot={false} name="Revenue ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">Views</div>
                  <div className="text-2xl font-bold text-white">{lockerAnalytics.overview.views}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Unlocks</div>
                  <div className="text-2xl font-bold text-white">{lockerAnalytics.overview.unlocks}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Task Completions</div>
                  <div className="text-2xl font-bold text-white">{lockerAnalytics.overview.taskCompletions}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Unlock Rate</div>
                  <div className="text-2xl font-bold text-white">{lockerAnalytics.overview.unlockRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Revenue Generated</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${lockerAnalytics.revenue?.totalRevenue?.toFixed(4) || '0.0000'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Avg. CPM</div>
                  <div className="text-2xl font-bold text-white">
                    ${lockerAnalytics.revenue?.avgCpm?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
