"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowRight, Crown, Globe, MessageCircle, Mail, Loader2 } from "lucide-react"
import { useSignIn, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function Landing() {
  const [email, setEmail] = useState("")
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { signIn } = useSignIn()
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  
  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    const updateCursorPosition = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", updateCursorPosition)
    return () => window.removeEventListener("mousemove", updateCursorPosition)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsLoading(true)
    setError("")
    
    try {
      // Simply redirect to sign-in page with email pre-filled
      // This is the most reliable approach with Clerk
      window.location.href = `/sign-in?email=${encodeURIComponent(email)}`
    } catch (err: any) {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  // Handle social sign-in with proper error handling
  const handleSocialSignIn = async (strategy: "oauth_google" | "oauth_discord" | "oauth_apple") => {
    setIsLoading(true)
    setError("")
    
    try {
      await signIn?.authenticateWithRedirect({
      strategy,
      redirectUrl: "/dashboard",
      redirectUrlComplete: "/dashboard"
    });
    } catch (err: any) {
      console.error("Social sign-in error:", err)
      setError("Social sign-in failed. Please try again.")
      setIsLoading(false)
    }
  };

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
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

          {/* Error message */}
          {error && (
            <div className="max-w-sm mx-auto mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

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
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="absolute right-2 top-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-black rounded-full p-1.5 transition-all duration-300 hover:scale-110 shadow-lg shadow-emerald-500/25 disabled:shadow-none disabled:hover:scale-100"
                aria-label="Submit"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
          {/* Social Login Buttons */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              aria-label="Sign in with Google"
              className="bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full p-3 transition-colors border border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSocialSignIn("oauth_google")}
              disabled={isLoading}
              type="button"
            >
              {/* Google Icon SVG with green tint */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#10b981"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#059669"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#22c55e"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#16a34a"/>
              </svg>
            </button>
            <button
              aria-label="Sign in with Discord"
              className="bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full p-3 transition-colors border border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSocialSignIn("oauth_discord")}
              disabled={isLoading}
              type="button"
            >
              {/* Discord Icon SVG with green tint */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#10b981">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
              </svg>
            </button>
            <button
              aria-label="Sign in with Apple"
              className="bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full p-3 transition-colors border border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSocialSignIn("oauth_apple")}
              disabled={isLoading}
              type="button"
            >
              {/* Apple Icon SVG with green tint */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#10b981">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
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
