"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Shield, Code, Users, HelpCircle, Fingerprint } from "lucide-react"

export default function Settings() {
  const settingsItems = [
    {
      title: "Security",
      description: "Manage your account security settings.",
      icon: <Shield className="w-5 h-5 text-blue-400" />,
    },
    {
      title: "API",
      description: "Easily create lockers in your application.",
      icon: <Code className="w-5 h-5 text-purple-400" />,
    },
    {
      title: "Referrals",
      description: "Invite friends to Lockr and earn.",
      icon: <Users className="w-5 h-5 text-orange-400" />,
    },
    {
      title: "Help",
      description: "Get support and find contact details.",
      icon: <HelpCircle className="w-5 h-5 text-red-400" />,
    },
  ]

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
            <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
            <p className="text-gray-400 text-sm">apklox9539@gmail.com</p>
          </div>
          <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Create link locker
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Account Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Your account</h2>

            <div className="space-y-4">
              {settingsItems.map((item, index) => (
                <Card
                  key={index}
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                          <p className="text-gray-400 text-sm">
                            {item.title === "API" || item.title === "Referrals" ? "Coming soon" : item.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Help Section Expanded Content */}
                    {item.title === "Help" && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-blue-400 text-sm font-bold">@</span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">Email</p>
                              <p className="text-gray-400 text-xs">support@vaultlab.co</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-cyan-400 text-sm font-bold">T</span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">Telegram</p>
                              <p className="text-gray-400 text-xs">@vaultlab</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-indigo-400 text-sm font-bold">D</span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">Discord</p>
                              <p className="text-gray-400 text-xs">VaultLab#1234</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-sm font-bold">X</span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">X (Twitter)</p>
                              <p className="text-gray-400 text-xs">@vaultlab</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional decorative elements matching the design */}
          <div className="flex justify-end">
            <div className="flex items-center space-x-4 opacity-20">
              <div className="w-16 h-10 bg-gradient-to-r from-yellow-400 via-blue-500 to-purple-600 rounded-lg"></div>
              <div className="w-20 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
