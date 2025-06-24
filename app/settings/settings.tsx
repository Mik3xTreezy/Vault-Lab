"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Fingerprint, Mail, MessageCircle, Twitter } from "lucide-react"
import { LordIcon } from "@/components/ui/lordicon"
import { LORDICON_COLORS } from "@/lib/lordicons"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function Settings() {
  const { signOut, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSecurityClick = () => {
    window.open('https://accounts.vaultlab.co/user', '_blank');
  };

  const settingsItems = [
    {
      title: "Security",
      description: "Manage your account security settings.",
      icon: <LordIcon 
        src="https://cdn.lordicon.com/gbycmzod.json" 
        size={20} 
        trigger="hover" 
        colors={LORDICON_COLORS.blue} 
      />,
    },
    {
      title: "API",
      description: "Easily create lockers in your application.",
      icon: <LordIcon 
        src="https://cdn.lordicon.com/lrubprlz.json" 
        size={20} 
        trigger="hover" 
        colors={LORDICON_COLORS.purple} 
      />,
    },
    {
      title: "Referrals",
      description: "Invite friends to Lockr and earn.",
      icon: <LordIcon 
        src="https://cdn.lordicon.com/kphwxuxr.json" 
        size={20} 
        trigger="hover" 
        colors={LORDICON_COLORS.orange} 
      />,
    },
    {
      title: "Help",
      description: "Get support and find contact details.",
      icon: <LordIcon 
        src="https://cdn.lordicon.com/hvenareh.json" 
        size={20} 
        trigger="hover" 
        colors={LORDICON_COLORS.red} 
      />,
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
            <p className="text-gray-400 text-sm">{user?.emailAddresses?.[0]?.emailAddress || 'No email'}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium relative overflow-hidden"
              onClick={() => router.push('/create')}
            >
              {/* Animated pulse effect */}
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{
                  opacity: [0, 0.3, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: [0, 90, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
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
          {/* Account Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Your account</h2>

            <div className="space-y-4">
              {settingsItems.map((item, index) => (
                <Card
                  key={index}
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => item.title === "Security" ? handleSecurityClick() : null}
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
                              <Mail className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">Email</p>
                              <p className="text-gray-400 text-xs">support@vaultlab.co</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">Telegram</p>
                              <p className="text-gray-400 text-xs">@vaultlab</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">Discord</p>
                              <p className="text-gray-400 text-xs">VaultLab#1234</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
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

          {/* Log Out Button */}
          <div className="flex justify-end mt-8">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl"
              onClick={() => isLoaded && signOut()}
            >
              Log Out
            </Button>
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
