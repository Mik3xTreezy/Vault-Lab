"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Users,
  DollarSign,
  UserPlus,
  Share2,
  Copy,
  TrendingUp,
  Calendar,
  Mail,
  ExternalLink,
  Loader2,
  CheckCircle,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  inactiveReferrals: number
  totalCommission: string
}

interface ReferredUser {
  id: string
  email: string
  commission: number
  joinedAt: string
  status: string
  lastActivity: string
}

interface Commission {
  commission_amount: number
  created_at: string
}

interface ReferralData {
  referralCode: string
  stats: ReferralStats
  referredUsers: ReferredUser[]
  commissions: Commission[]
  referralUrl: string
}

export default function Referrals() {
  const { user, isLoaded } = useUser()
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      fetchReferralData()
    }
  }, [isLoaded, user])

  const fetchReferralData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/referrals')
      if (response.ok) {
        const data = await response.json()
        setReferralData(data)
      } else {
        console.error('Failed to fetch referral data')
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralUrl = async () => {
    if (referralData?.referralUrl) {
      try {
        await navigator.clipboard.writeText(referralData.referralUrl)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (error) {
        console.error('Failed to copy referral URL:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Prepare chart data from commissions
  const chartData = referralData?.commissions?.slice(0, 7).reverse().map((commission, index) => ({
    day: `Day ${index + 1}`,
    commission: commission.commission_amount
  })) || []

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-400">Please sign in to view referrals</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Referrals
            </h1>
            <p className="text-gray-400 mt-2">Earn 5% commission on every referral's earnings</p>
          </div>
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium">
                <UserPlus className="w-4 h-4 mr-2" />
                Refer a Friend
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                  Share Your Referral Link
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Your Referral Code</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralData?.referralCode || ''}
                      readOnly
                      className="bg-white/5 border-white/10 text-white flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(referralData?.referralCode || '')}
                      className="border-white/10 hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Referral Link</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralData?.referralUrl || ''}
                      readOnly
                      className="bg-white/5 border-white/10 text-white flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyReferralUrl}
                      className="border-white/10 hover:bg-white/10"
                    >
                      {copySuccess ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <h4 className="text-emerald-400 font-medium mb-2">How it works:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Share your referral link with friends</li>
                    <li>• They sign up and start creating lockers</li>
                    <li>• You earn 5% of their total earnings forever</li>
                    <li>• Get paid when you reach $5 minimum</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="ml-3 text-gray-400">Loading referral data...</span>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Inactive Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {referralData?.stats.inactiveReferrals || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Total Commission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${referralData?.stats.totalCommission || '0.00'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Active Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {referralData?.stats.activeReferrals || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Commission Chart */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Referral Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="day" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#F9FAFB' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="commission" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No commission data yet</p>
                      <p className="text-sm">Start referring friends to see your earnings!</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referred Users Table */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Your Referred Users</CardTitle>
              </CardHeader>
              <CardContent>
                {referralData?.referredUsers && referralData.referredUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">User</TableHead>
                        <TableHead className="text-gray-300">Commission</TableHead>
                        <TableHead className="text-gray-300">Last Activity</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralData.referredUsers.map((user) => (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center text-black font-medium text-sm">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-white">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-emerald-400 font-medium">
                              ${user.commission.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {formatDate(user.lastActivity)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.status === 'active' 
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : user.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No referrals yet</p>
                      <p className="text-sm">Share your referral link to start earning commissions!</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Rate */}
            <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-black">5%</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Commission Rate</h3>
                      <p className="text-emerald-400">Earn 5% of all referral earnings</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShareDialogOpen(true)}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Refer a Friend
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
} 