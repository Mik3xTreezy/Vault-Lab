"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Users,
  DollarSign,
  Share2,
  Copy,
  TrendingUp,
  Calendar,
  ExternalLink,
  Loader2,
  CheckCircle,
  Clock,
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
  commissionRate: number
}

export default function ReferralsComponent() {
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
              Partner Program
            </h1>
            <p className="text-slate-400 mt-2">Build your network and earn passive income</p>
          </div>
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-medium shadow-lg">
                <Share2 className="w-4 h-4 mr-2" />
                Share & Earn
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  Partner Link
                </DialogTitle>
                <p className="text-slate-400 text-sm">Share your unique link and start earning</p>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-3 block">Your Partner Code</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralData?.referralCode || ''}
                      readOnly
                      className="bg-slate-800/50 border-slate-600/50 text-white flex-1 font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(referralData?.referralCode || '')}
                      className="border-slate-600/50 hover:bg-slate-700/50 text-slate-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-3 block">Partner Link</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralData?.referralUrl || ''}
                      readOnly
                      className="bg-slate-800/50 border-slate-600/50 text-white flex-1 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyReferralUrl}
                      className="border-slate-600/50 hover:bg-slate-700/50 text-slate-400 hover:text-white"
                    >
                      {copySuccess ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                    </div>
                    <h4 className="text-emerald-400 font-semibold">Earning {referralData?.commissionRate || 10}%</h4>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                      <span>Share with content creators and marketers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                      <span>They join VaultLab and start earning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                      <span>You earn {referralData?.commissionRate || 10}% of their lifetime earnings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                      <span>Payments processed automatically</span>
                    </li>
                  </ul>
                </div>
                <Button 
                  onClick={() => setShareDialogOpen(false)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-medium"
                >
                  Got it!
                </Button>
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
            {/* Overview Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Main Earnings Card */}
              <div className="lg:col-span-2">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 border border-emerald-500/20 backdrop-blur-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Your Earnings</CardTitle>
                        <p className="text-slate-400 text-sm mt-1">Lifetime commission earned</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-emerald-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-3xl font-bold text-emerald-400">
                        ${referralData?.stats.totalCommission || '0.00'}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-sm text-slate-400">Active Partners</div>
                          <div className="text-lg font-semibold text-white">
                            {referralData?.stats.activeReferrals || 0}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-sm text-slate-400">Commission Rate</div>
                          <div className="text-lg font-semibold text-emerald-400">
                            {referralData?.commissionRate || 10}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Total Network</div>
                        <div className="text-xl font-bold text-white">
                          {referralData?.stats.totalReferrals || 0}
                        </div>
                      </div>
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Inactive</div>
                        <div className="text-xl font-bold text-yellow-400">
                          {referralData?.stats.inactiveReferrals || 0}
                        </div>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Growth</div>
                        <div className="text-xl font-bold text-emerald-400">
                          +{referralData?.stats.activeReferrals || 0}
                        </div>
                      </div>
                      <TrendingUp className="w-8 h-8 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Analytics & Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Commission Timeline */}
              <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Earnings Timeline</CardTitle>
                      <p className="text-slate-400 text-sm">Track your commission growth</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                        <YAxis stroke="#64748B" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1E293B', 
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#F1F5F9'
                          }}
                          labelStyle={{ color: '#E2E8F0' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="commission" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-slate-400">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="font-medium mb-1">No earnings yet</p>
                        <p className="text-sm text-slate-500">Start building your network to see growth!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Referrals */}
              <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Top Referrals</CardTitle>
                      <p className="text-slate-400 text-sm">Your highest earning partners</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referralData?.referredUsers && referralData.referredUsers.length > 0 ? (
                      referralData.referredUsers
                        .sort((a, b) => b.commission - a.commission)
                        .slice(0, 3)
                        .map((user, index) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                                'bg-gradient-to-r from-orange-500 to-orange-600'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="text-white font-medium text-sm">{user.email}</div>
                                <div className="text-slate-400 text-xs">
                                  {user.status === 'active' ? 'Active' : 'Inactive'}
                                </div>
                              </div>
                            </div>
                            <div className="text-emerald-400 font-semibold">
                              ${user.commission.toFixed(2)}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex items-center justify-center py-8 text-slate-400">
                        <div className="text-center">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No earnings yet</p>
                        </div>
                      </div>
                    )}
                    {referralData?.referredUsers && referralData.referredUsers.length > 3 && (
                      <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div>
                          <div className="text-sm text-emerald-400">Total Network</div>
                          <div className="text-lg font-semibold text-emerald-300">
                            {referralData.stats.totalReferrals}
                          </div>
                        </div>
                        <div className="text-emerald-400">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Network Overview */}
            <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50 mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Your Network</CardTitle>
                    <p className="text-slate-400 text-sm">Partners you've brought to VaultLab</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-slate-400">
                      {referralData?.referredUsers?.length || 0} members
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {referralData?.referredUsers && referralData.referredUsers.length > 0 ? (
                  <div className="space-y-3">
                    {referralData.referredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center text-white font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-medium">{user.email}</div>
                            <div className="text-slate-400 text-sm">
                              Joined {formatDate(user.lastActivity)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-emerald-400 font-semibold">
                              ${user.commission.toFixed(2)}
                            </div>
                            <div className="text-slate-400 text-sm">earned</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : user.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {user.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center">
                        <Users className="w-10 h-10 text-slate-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Build Your Network</h3>
                      <p className="text-slate-400 mb-4 max-w-sm">
                        Start referring creators to VaultLab and earn commission on their success
                      </p>
                      <Button 
                        onClick={() => setShareDialogOpen(true)}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Get Started
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Partnership Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 border border-emerald-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">{referralData?.commissionRate || 10}%</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Your Commission Rate</h3>
                      <p className="text-slate-400 mb-4">
                        Earn {referralData?.commissionRate || 10}% commission on all earnings from your referrals. 
                        The more successful they are, the more you earn.
                      </p>
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Lifetime earnings
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                      <Share2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">Ready to Start?</h3>
                      <p className="text-slate-400 mb-4">
                        Share your unique link with creators and start building 
                        your network today. No limits, no caps.
                      </p>
                      <Button
                        onClick={() => setShareDialogOpen(true)}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-medium w-full"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Get Your Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 