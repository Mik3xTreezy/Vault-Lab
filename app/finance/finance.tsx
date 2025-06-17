"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { History, Wallet, TrendingUp, DollarSign, ArrowUpRight, Bitcoin, CreditCard, Coins, Plus } from "lucide-react"

export default function Finance() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [cashoutAmount, setCashoutAmount] = useState("")

  const financeMetrics = [
    {
      title: "Current Balance",
      value: "$1,247.50",
      icon: <Wallet className="w-5 h-5 text-emerald-400" />,
      change: "+12.5%",
      description: "Available for cashout",
    },
    {
      title: "Total Earnings",
      value: "$3,892.30",
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      change: "+2550%",
      description: "All time earnings",
    },
    {
      title: "This Month",
      value: "$892.30",
      icon: <DollarSign className="w-5 h-5 text-purple-400" />,
      change: "+45.2%",
      description: "June 2024 earnings",
    },
    {
      title: "Pending Cashouts",
      value: "$0.00",
      icon: <CreditCard className="w-5 h-5 text-orange-400" />,
      change: "0",
      description: "Processing payments",
    },
  ]

  const paymentMethods = [
    {
      name: "Bitcoin Cash",
      icon: <Bitcoin className="w-6 h-6" />,
      color: "bg-green-500/20 border-green-500/30",
      iconColor: "text-green-400",
      minAmount: "$10",
    },
    {
      name: "Binance",
      icon: <Coins className="w-6 h-6" />,
      color: "bg-yellow-500/20 border-yellow-500/30",
      iconColor: "text-yellow-400",
      minAmount: "$5",
    },
    {
      name: "Litecoin",
      icon: <Bitcoin className="w-6 h-6" />,
      color: "bg-blue-500/20 border-blue-500/30",
      iconColor: "text-blue-400",
      minAmount: "$10",
    },
    {
      name: "Bitcoin",
      icon: <Bitcoin className="w-6 h-6" />,
      color: "bg-orange-500/20 border-orange-500/30",
      iconColor: "text-orange-400",
      minAmount: "$25",
    },
    {
      name: "Ethereum ETH",
      icon: <Coins className="w-6 h-6" />,
      color: "bg-purple-500/20 border-purple-500/30",
      iconColor: "text-purple-400",
      minAmount: "$15",
    },
    {
      name: "USDC BEP20",
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-blue-600/20 border-blue-600/30",
      iconColor: "text-blue-400",
      minAmount: "$5",
    },
    {
      name: "Solana",
      icon: <Coins className="w-6 h-6" />,
      color: "bg-teal-500/20 border-teal-500/30",
      iconColor: "text-teal-400",
      minAmount: "$10",
    },
    {
      name: "PayPal",
      icon: <CreditCard className="w-6 h-6" />,
      color: "bg-blue-700/20 border-blue-700/30",
      iconColor: "text-blue-400",
      minAmount: "$1",
    },
  ]

  const recentTransactions = [
    {
      method: "PayPal",
      amount: "$125.50",
      status: "Completed",
      date: "Jun 10, 2024",
      statusColor: "text-green-400",
    },
    {
      method: "Bitcoin",
      amount: "$250.00",
      status: "Processing",
      date: "Jun 8, 2024",
      statusColor: "text-yellow-400",
    },
    {
      method: "USDC BEP20",
      amount: "$75.25",
      status: "Completed",
      date: "Jun 5, 2024",
      statusColor: "text-green-400",
    },
  ]

  const handleCashoutRequest = () => {
    if (selectedPaymentMethod && cashoutAmount) {
      // Handle cashout request logic here
      console.log(`Requesting cashout of ${cashoutAmount} via ${selectedPaymentMethod}`)
      // Reset form
      setSelectedPaymentMethod(null)
      setCashoutAmount("")
    }
  }

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
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Finance</h1>
            <p className="text-gray-400 text-sm">Manage your earnings and cashouts</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-lg px-4 py-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span className="text-2xl font-bold text-white">$1,247.50</span>
            </div>

            {/* Request Cashout Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium">
                  <Wallet className="w-4 h-4 mr-2" />
                  Request Cashout
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white max-w-2xl">
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
                          className={`${method.color} backdrop-blur-xl border cursor-pointer transition-all duration-300 ${
                            selectedPaymentMethod === method.name
                              ? "ring-2 ring-emerald-500 scale-105 shadow-lg shadow-emerald-500/25"
                              : "hover:scale-105 hover:shadow-lg hover:shadow-white/10 hover:bg-white/10"
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
                    <div className="space-y-4 p-4 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10">
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-gray-300">
                          {selectedPaymentMethod === "PayPal" ? "PayPal Email Address" : "Wallet Address"}
                        </Label>
                        <Input
                          id="address"
                          type="text"
                          placeholder={
                            selectedPaymentMethod === "PayPal" ? "Enter your PayPal email" : "Enter your wallet address"
                          }
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50"
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
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50"
                        />
                        <div className="flex justify-between text-sm">
                          <p className="text-gray-400">Available balance: $1,247.50</p>
                          {cashoutAmount && Number.parseFloat(cashoutAmount) < 50 && (
                            <p className="text-red-400">Minimum $50 to cashout</p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={handleCashoutRequest}
                        disabled={!cashoutAmount || Number.parseFloat(cashoutAmount) < 50}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Request Cashout
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
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors"
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
                <div className="divide-y divide-white/10">
                  {recentTransactions.map((transaction, index) => (
                    <div key={index} className="p-6 hover:bg-white/5 transition-colors">
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
                          <p className={`text-sm ${transaction.statusColor}`}>{transaction.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Removed Payment Methods */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-blue-500/10 backdrop-blur-xl border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <History className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-2">Transaction History</h3>
                  <p className="text-gray-400 text-sm">View all transactions</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-500/10 backdrop-blur-xl border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Plus className="w-8 h-8 text-purple-400 mx-auto mb-3" />
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
                <p className="text-2xl font-bold text-white">3/3</p>
                <p className="text-gray-400 text-sm">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
