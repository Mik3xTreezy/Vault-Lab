"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowRight, Crown, Discord, Telegram, Google, Globe, MessageCircle, Mail } from "lucide-react"
import { useSignIn } from "@clerk/nextjs"

export default function Landing() {
  const [email, setEmail] = useState("")
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const { signIn } = useSignIn();

  useEffect(() => {
    const updateCursorPosition = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", updateCursorPosition)
    return () => window.removeEventListener("mousemove", updateCursorPosition)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden">
      {/* Big Light Shade Following Cursor - Real Time */}
      <div
        className="fixed w-96 h-96 pointer-events-none z-10 opacity-30"
        style={{
          left: cursorPosition.x - 192,
          top: cursorPosition.y - 192,
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 30%, rgba(6, 120, 95, 0.1) 60%, transparent 100%)",
          filter: "blur(40px)",
          transition: "none", // Removed transition for real-time movement
        }}
      ></div>

      {/* Secondary smaller light - Real Time */}
      <div
        className="fixed w-64 h-64 pointer-events-none z-10 opacity-20"
        style={{
          left: cursorPosition.x - 128,
          top: cursorPosition.y - 128,
          background:
            "radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(16, 185, 129, 0.2) 50%, transparent 100%)",
          filter: "blur(60px)",
          transition: "none", // Removed transition for real-time movement
        }}
      ></div>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient orbs */}
        <div className="absolute top-1/3 left-1/2 w-[800px] h-[400px] -translate-x-1/2 bg-gradient-to-r from-emerald-500/15 via-green-500/15 to-cyan-500/15 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div
          className="absolute bottom-1/3 left-1/2 w-[600px] h-[300px] -translate-x-1/2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 rounded-full blur-[100px] opacity-30 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Floating particles */}
        <div
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/30 rounded-full animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-1 h-1 bg-green-400/40 rounded-full animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        ></div>
        <div
          className="absolute top-3/4 right-1/3 w-1 h-1 bg-emerald-300/40 rounded-full animate-bounce"
          style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}
        ></div>

        {/* Subtle moving gradients */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-20 px-4">
        {/* Elite notice - Smaller and tighter */}
        <div className="text-center mb-6">
          <p className="text-emerald-400/80 text-xs">
            Exclusive content platform for elite creators and influencers -{" "}
            <span className="text-emerald-400 hover:text-emerald-300 transition-colors">support@vaultlab.co</span>
          </p>
        </div>

        {/* Hero Section - Wider container */}
        <div className="w-full max-w-5xl text-center space-y-4">
          {/* Hero Text with Gradient */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center mb-4 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
              <Crown className="w-4 h-4 text-emerald-400 mr-1.5" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Elite Only</span>
            </div>

            <h1
              className="text-4xl md:text-6xl font-semibold leading-tight hover:scale-105 transition-transform duration-300"
              style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: "-0.02em" }}
            >
              <span className="block bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                The Next Generation Link
              </span>
              <span
                className="block bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 bg-clip-text text-transparent relative italic"
                style={{
                  backgroundSize: "200% 100%",
                  animation: "gradientShift 4s ease-in-out infinite",
                }}
              >
                Monetization
              </span>
            </h1>

            <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap');
          
          @keyframes gradientShift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}</style>

            {/* Description text */}
            <p className="text-gray-400 text-sm max-w-sm mx-auto hover:text-gray-300 transition-colors leading-relaxed">
              Get access to your account or sign up for one by entering your email below.
            </p>
          </div>

          {/* Email form - Smaller and tighter */}
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="relative max-w-sm mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 text-sm"
                required
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black rounded-full p-1.5 transition-all duration-300 hover:scale-110 shadow-lg shadow-emerald-500/25"
                aria-label="Submit"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          {/* Social Login Buttons */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              aria-label="Sign in with Google"
              className="bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors border border-white/10"
              onClick={() => signIn?.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: '/dashboard' })}
              type="button"
            >
              <Globe className="w-6 h-6 text-emerald-300" />
            </button>
            <button
              aria-label="Sign in with Discord"
              className="bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors border border-white/10"
              onClick={() => signIn?.authenticateWithRedirect({ strategy: 'oauth_discord', redirectUrl: '/dashboard' })}
              type="button"
            >
              <MessageCircle className="w-6 h-6 text-emerald-300" />
            </button>
            <button
              aria-label="Sign in with Telegram"
              className="bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors border border-white/10"
              onClick={() => signIn?.authenticateWithRedirect({ strategy: 'oauth_telegram', redirectUrl: '/dashboard' })}
              type="button"
            >
              <Mail className="w-6 h-6 text-emerald-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Smaller and tighter */}
      <div className="text-center py-4 relative z-20">
        <p className="text-gray-500 text-xs hover:text-gray-400 transition-colors">
          Transform your content into premium revenue streams.
        </p>
      </div>
    </div>
  )
}
