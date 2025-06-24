"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { History, Wallet, TrendingUp, DollarSign, ArrowUpRight, Bitcoin, CreditCard, Coins, Plus, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function Finance() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [cashoutAmount, setCashoutAmount] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [financeData, setFinanceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isSubmittingCashout, setIsSubmittingCashout] = useState(false)
  const [cashoutDialogOpen, setCashoutDialogOpen] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

  // Authentication check
  if (!isLoaded) {
    return <div className="min-h-screen text-white flex items-center justify-center">Loading...</div>
  }
  if (!isSignedIn) {
    router.push('/sign-in')
    return null
  }

  // Fetch finance data
  useEffect(() => {
    async function fetchFinanceData() {
      if (!user) return
      setLoading(true)
      try {
        // Fetch user's financial data from dashboard analytics
        const financeRes = await fetch(`/api/dashboard-analytics?user_id=${user.id}`)
        if (financeRes.ok) {
          const data = await financeRes.json()
          setFinanceData(data)
        }

        // Fetch withdrawal transactions
        const transactionsRes = await fetch(`/api/withdrawals?user_id=${user.id}`)
        if (transactionsRes.ok) {
          const transactionData = await transactionsRes.json()
          setTransactions(transactionData)
        }
      } catch (error) {
        console.error('Error fetching finance data:', error)
      }
      setLoading(false)
    }

    if (user) {
      fetchFinanceData()
    }
  }, [user])

  // Calculate current month earnings
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  const thisMonthEarnings = financeData?.userEarnings?.events?.filter((event: any) => 
    event.timestamp?.startsWith(currentMonth)
  ).reduce((sum: number, event: any) => sum + Number(event.amount), 0) || 0

  // Calculate pending cashouts
  const pendingCashouts = transactions.filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Dynamic finance metrics
  const financeMetrics = [
    {
      title: "Current Balance",
      value: `$${(financeData?.userEarnings?.currentBalance || 0).toFixed(2)}`,
      icon: <Wallet className="w-5 h-5 text-emerald-400" />,
      change: "+0%", // Could calculate based on previous period
      description: "Available for cashout",
    },
    {
      title: "Total Earnings",
      value: `$${(financeData?.userEarnings?.totalRevenue || 0).toFixed(2)}`,
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      change: "+0%", // Could calculate based on previous period
      description: "All time earnings",
    },
    {
      title: "This Month",
      value: `$${thisMonthEarnings.toFixed(2)}`,
      icon: <DollarSign className="w-5 h-5 text-purple-400" />,
      change: "+0%", // Could calculate based on previous month
      description: `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} earnings`,
    },
    {
      title: "Pending Cashouts",
      value: `$${pendingCashouts.toFixed(2)}`,
      icon: <CreditCard className="w-5 h-5 text-orange-400" />,
      change: "0",
      description: "Processing payments",
    },
  ]

  const paymentMethods = [
    {
      name: "Bitcoin Cash",
      icon: (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">₿</span>
        </div>
      ),
      color: "bg-green-500/20 border-green-500/30",
      iconColor: "text-green-400",
      minAmount: "$10",
    },
    {
      name: "Binance",
      icon: (
        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center transform rotate-45">
          <div className="w-3 h-3 bg-white rounded-sm"></div>
        </div>
      ),
      color: "bg-yellow-500/20 border-yellow-500/30",
      iconColor: "text-yellow-400",
      minAmount: "$5",
    },
    {
      name: "Litecoin",
      icon: (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">Ł</span>
        </div>
      ),
      color: "bg-blue-500/20 border-blue-500/30",
      iconColor: "text-blue-400",
      minAmount: "$10",
    },
    {
      name: "Bitcoin",
      icon: (
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">₿</span>
        </div>
      ),
      color: "bg-orange-500/20 border-orange-500/30",
      iconColor: "text-orange-400",
      minAmount: "$25",
    },
    {
      name: "Ethereum ETH",
      icon: (
        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white transform rotate-45" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
        </div>
      ),
      color: "bg-purple-500/20 border-purple-500/30",
      iconColor: "text-purple-400",
      minAmount: "$15",
    },
    {
      name: "USDC BEP20",
      icon: (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">$</span>
        </div>
      ),
      color: "bg-blue-600/20 border-blue-600/30",
      iconColor: "text-blue-400",
      minAmount: "$5",
    },
    {
      name: "Solana",
      icon: (
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-1 bg-white rounded-full transform -rotate-12"></div>
        </div>
      ),
      color: "bg-purple-600/20 border-purple-600/30",
      iconColor: "text-purple-400",
      minAmount: "$10",
    },
    {
      name: "PayPal",
      icon: (
        <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
      ),
      color: "bg-blue-700/20 border-blue-700/30",
      iconColor: "text-blue-400",
      minAmount: "$1",
    },
  ]

  // Format transactions for display
  const recentTransactions = transactions.slice(0, 3).map(transaction => ({
    method: transaction.method || 'Unknown',
    amount: `$${Number(transaction.amount).toFixed(2)}`,
    status: transaction.status === 'completed' ? 'Completed' : 
            transaction.status === 'pending' ? 'Processing' : 'Failed',
    date: new Date(transaction.requested_at || transaction.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    statusColor: transaction.status === 'completed' ? 'text-green-400' : 
                 transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400',
    statusIcon: transaction.status === 'completed' ? CheckCircle : 
                transaction.status === 'pending' ? Clock : AlertCircle,
  }))

  const handleCashoutRequest = async () => {
    if (!selectedPaymentMethod || !cashoutAmount || !walletAddress) return
    
    const amount = Number.parseFloat(cashoutAmount)
    const availableBalance = financeData?.userEarnings?.currentBalance || 0
    
    if (amount < 50) {
      setAlertMessage('Minimum cashout amount is $50')
      setShowErrorAlert(true)
      setTimeout(() => setShowErrorAlert(false), 4000)
      return
    }
    
    if (amount > availableBalance) {
      setAlertMessage('Insufficient balance for this cashout amount')
      setShowErrorAlert(true)
      setTimeout(() => setShowErrorAlert(false), 4000)
      return
    }

    setIsSubmittingCashout(true)
    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          amount: amount,
          method: selectedPaymentMethod,
          address: walletAddress,
        }),
      })

      if (response.ok) {
        setAlertMessage('Cashout request submitted successfully! Processing will begin within 24 hours.')
        setShowSuccessAlert(true)
        setTimeout(() => setShowSuccessAlert(false), 5000)
        
        // Reset form
        setSelectedPaymentMethod(null)
        setCashoutAmount("")
        setWalletAddress("")
        setCashoutDialogOpen(false)
        
        // Refresh data
        setTimeout(() => window.location.reload(), 2000)
      } else {
        const error = await response.json()
        setAlertMessage(error.message || 'Failed to submit cashout request')
        setShowErrorAlert(true)
        setTimeout(() => setShowErrorAlert(false), 4000)
      }
    } catch (error) {
      console.error('Cashout request error:', error)
      setAlertMessage('Network error. Please check your connection and try again.')
      setShowErrorAlert(true)
      setTimeout(() => setShowErrorAlert(false), 4000)
    }
    setIsSubmittingCashout(false)
  }

  return (
    <div className="min-h-screen text-white">
      {/* Animated Alerts */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-500">
          <div className="bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-xl rounded-lg p-4 flex items-center space-x-3 shadow-lg shadow-emerald-500/25">
            <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
            <p className="text-emerald-100 font-medium">{alertMessage}</p>
          </div>
        </div>
      )}
      
      {showErrorAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-500">
          <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-xl rounded-lg p-4 flex items-center space-x-3 shadow-lg shadow-red-500/25">
            <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
            <p className="text-red-100 font-medium">{alertMessage}</p>
          </div>
        </div>
      )}

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Finance</h1>
            <p className="text-gray-400 text-sm">Manage your earnings and cashouts</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-lg px-4 py-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span className="text-2xl font-bold text-white">
                ${loading ? '0.00' : (financeData?.userEarnings?.currentBalance || 0).toFixed(2)}
              </span>
            </div>

            {/* Request Cashout Dialog */}
            <Dialog open={cashoutDialogOpen} onOpenChange={setCashoutDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
                  onClick={() => setCashoutDialogOpen(true)}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Request Cashout
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white max-w-2xl animate-in fade-in-0 zoom-in-95 duration-300">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Request Cashout</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Payment Methods Selection */}
                  <div className="space-y-4">
                    <Label className="text-gray-300">Select Payment Method</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {paymentMethods.map((method, index) => (
                        <Card
                          key={index}
                          className={`${method.color} backdrop-blur-xl border cursor-pointer transition-all duration-500 transform ${
                            selectedPaymentMethod === method.name
                              ? "ring-2 ring-emerald-500 scale-110 shadow-xl shadow-emerald-500/30 animate-pulse"
                              : "hover:scale-105 hover:shadow-lg hover:shadow-white/10 hover:bg-white/10 hover:border-emerald-500/20"
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.name)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex flex-col items-center space-y-2">
                              <div className={method.iconColor}>{method.icon}</div>
                              <div>
                                <h3 className="text-white font-medium text-xs">{method.name}</h3>
                                <p className="text-gray-400 text-xs">Min: {method.minAmount}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Address Input - Only show when payment method is selected */}
                  {selectedPaymentMethod && (
                    <div className="space-y-4 p-4 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 animate-in slide-in-from-top duration-500">
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-gray-300">
                          {selectedPaymentMethod === "PayPal" ? "PayPal Email Address" : "Wallet Address"}
                        </Label>
                        <Input
                          id="address"
                          type="text"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder={
                            selectedPaymentMethod === "PayPal" ? "Enter your PayPal email" : "Enter your wallet address"
                          }
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-gray-300">
                          Cashout Amount
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={cashoutAmount}
                          onChange={(e) => setCashoutAmount(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                        />
                        <div className="flex justify-between text-sm">
                          <p className="text-gray-400">
                            Available balance: ${(financeData?.userEarnings?.currentBalance || 0).toFixed(2)}
                          </p>
                          {cashoutAmount && Number.parseFloat(cashoutAmount) < 50 && (
                            <p className="text-red-400">Minimum $50 to cashout</p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={handleCashoutRequest}
                        disabled={!cashoutAmount || !walletAddress || Number.parseFloat(cashoutAmount) < 50 || isSubmittingCashout}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
                      >
                        {isSubmittingCashout ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          'Request Cashout'
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Cancel Button */}
                  <div className="flex justify-center">
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl"
                      >
                        Cancel
                      </Button>
                    </DialogTrigger>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Finance Overview */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Financial Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financeMetrics.map((metric, index) => (
                <Card
                  key={index}
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-white/10 animate-in fade-in-0 slide-in-from-bottom duration-700"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-300 text-sm">{metric.title}</span>
                      {metric.icon}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">{metric.value}</span>
                        {metric.change !== "0" && (
                          <div className="flex items-center space-x-1">
                            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-sm font-medium">{metric.change}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">{metric.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
                <History className="w-4 h-4 mr-2" />
                View All History
              </Button>
            </div>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 text-center text-gray-400">Loading transactions...</div>
                ) : recentTransactions.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">No transactions yet</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {recentTransactions.map((transaction, index) => (
                      <div key={index} className="p-6 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{transaction.method}</p>
                              <p className="text-gray-400 text-sm">{transaction.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{transaction.amount}</p>
                            <div className={`text-sm ${transaction.statusColor} flex items-center justify-end space-x-1`}>
                              <transaction.statusIcon className="w-3 h-3" />
                              <span>{transaction.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Removed Payment Methods */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-blue-500/10 backdrop-blur-xl border-blue-500/20 hover:bg-blue-500/20 transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 animate-in fade-in-0 slide-in-from-left duration-700">
                <CardContent className="p-6 text-center">
                  <History className="w-8 h-8 text-blue-400 mx-auto mb-3 transition-transform duration-300 hover:scale-110" />
                  <h3 className="text-white font-medium mb-2">Transaction History</h3>
                  <p className="text-gray-400 text-sm">View all transactions</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-500/10 backdrop-blur-xl border-purple-500/20 hover:bg-purple-500/20 transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 animate-in fade-in-0 slide-in-from-right duration-700">
                <CardContent className="p-6 text-center">
                  <Plus className="w-8 h-8 text-purple-400 mx-auto mb-3 transition-transform duration-300 hover:scale-110" />
                  <h3 className="text-white font-medium mb-2">Earnings Report</h3>
                  <p className="text-gray-400 text-sm">Download detailed reports</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Cashout Info */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium mb-1">Monthly Cashout Limit</h3>
                <p className="text-gray-400 text-sm">Track your remaining cashouts for this month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {loading ? '0/3' : `${Math.max(0, 3 - transactions.filter(t => 
                    t.requested_at?.startsWith(currentMonth) || t.created_at?.startsWith(currentMonth)
                  ).length)}/3`}
                </p>
                <p className="text-gray-400 text-sm">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
