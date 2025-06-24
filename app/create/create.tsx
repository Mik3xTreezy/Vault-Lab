"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Link, Globe, Loader2, CheckCircle, Copy, ExternalLink, Sparkles, Lock, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

export default function Create() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    destinationUrl: "",
    taskTypes: [] as string[], // Changed to array for multiple types
    adUrlMode: "common" as "common" | "tiered", // New field for ad URL configuration
    commonAdUrl: "", // Single ad URL for all tiers
    tieredAdUrls: { // Separate ad URLs for each tier
      tier1: "",
      tier2: "",
      tier3: ""
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    destinationUrl: "",
    taskTypes: "",
    adUrl: ""
  })
  const [error, setError] = useState<string | null>(null)

  const taskTypeOptions = [
    { value: "adult", label: "NSFW Tasks", icon: "🔞", description: "18+ content tasks for mature audiences" },
    { value: "game", label: "Game Tasks", icon: "🎮", description: "General gaming related tasks and activities" },
    { value: "minecraft", label: "Minecraft Tasks", icon: "⛏️", description: "Minecraft specific tasks and server activities" },
    { value: "roblox", label: "Roblox Tasks", icon: "🎯", description: "Roblox related tasks and game experiences" },
    { value: "download", label: "Download Tasks", icon: "📥", description: "Software and file download tasks" }
  ]

  const validateForm = () => {
    const newErrors = { title: "", description: "", destinationUrl: "", taskTypes: "", adUrl: "" }
    let isValid = true

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
      isValid = false
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
      isValid = false
    }

    if (!formData.destinationUrl.trim()) {
      newErrors.destinationUrl = "Destination URL is required"
      isValid = false
    } else {
      try {
        new URL(formData.destinationUrl)
      } catch {
        newErrors.destinationUrl = "Please enter a valid URL"
        isValid = false
      }
    }

    if (formData.taskTypes.length === 0) {
      newErrors.taskTypes = "Please select at least one task type"
      isValid = false
    }

    // Validate ad URLs based on mode
    if (formData.adUrlMode === "common") {
      if (!formData.commonAdUrl.trim()) {
        newErrors.adUrl = "Common ad URL is required"
        isValid = false
      } else {
        try {
          new URL(formData.commonAdUrl)
        } catch {
          newErrors.adUrl = "Please enter a valid ad URL"
          isValid = false
        }
      }
    } else {
      // Check if at least one tier has an ad URL
      const hasAnyTierUrl = formData.tieredAdUrls.tier1.trim() || 
                           formData.tieredAdUrls.tier2.trim() || 
                           formData.tieredAdUrls.tier3.trim()
      
      if (!hasAnyTierUrl) {
        newErrors.adUrl = "Please provide at least one tier ad URL"
        isValid = false
      } else {
        // Validate individual tier URLs
        const tierUrls = [
          { tier: "tier1", url: formData.tieredAdUrls.tier1 },
          { tier: "tier2", url: formData.tieredAdUrls.tier2 },
          { tier: "tier3", url: formData.tieredAdUrls.tier3 }
        ]
        
        for (const { tier, url } of tierUrls) {
          if (url.trim()) {
            try {
              new URL(url)
            } catch {
              newErrors.adUrl = `Invalid URL for ${tier.toUpperCase()}`
              isValid = false
              break
            }
          }
        }
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/lockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          destinationUrl: formData.destinationUrl,
          taskTypes: formData.taskTypes,
          adUrlMode: formData.adUrlMode,
          commonAdUrl: formData.commonAdUrl,
          tieredAdUrls: formData.tieredAdUrls
        }),
      });
      if (!res.ok) throw new Error("Failed to create locker");
      const data = await res.json();
      setGeneratedLink(`https://vaultlab.co/locked/${data.id}`);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      // Handle nested properties like tieredAdUrls.tier1
      const [parent, child] = field.split('.')
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
    
    // Clear related errors
    if (field === 'commonAdUrl' || field.startsWith('tieredAdUrls')) {
      setErrors((prev) => ({ ...prev, adUrl: "" }))
    } else if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleTaskTypeChange = (taskType: string) => {
    setFormData((prev) => ({
      ...prev,
      taskTypes: prev.taskTypes.includes(taskType) ? prev.taskTypes.filter((t) => t !== taskType) : [...prev.taskTypes, taskType]
    }))
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setShowCopyNotification(true)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (showCopyNotification) {
      const timer = setTimeout(() => {
        setShowCopyNotification(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showCopyNotification])

  const resetForm = () => {
    setFormData({ title: "", description: "", destinationUrl: "", taskTypes: [], adUrlMode: "common", commonAdUrl: "", tieredAdUrls: { tier1: "", tier2: "", tier3: "" } })
    setIsSuccess(false)
    setGeneratedLink("")
    setErrors({ title: "", description: "", destinationUrl: "", taskTypes: "", adUrl: "" })
    setShowCopyNotification(false)
  }

  if (isSuccess) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex items-center justify-center p-6 relative overflow-hidden"
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

        <div className="max-w-lg w-full relative z-10">
          {/* Success Animation */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-6 relative overflow-hidden"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
            >
              {/* Animated Checkmark SVG */}
              <motion.svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                className="text-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.path
                  d="M8 20L18 28L32 12"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    pathLength: { 
                      duration: 0.8, 
                      ease: "easeInOut",
                      delay: 1
                    },
                    opacity: { duration: 0.1, delay: 1 }
                  }}
                />
              </motion.svg>
              
              {/* Success particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  initial={{ 
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: Math.cos(i * 45 * Math.PI / 180) * 30,
                    y: Math.sin(i * 45 * Math.PI / 180) * 30,
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 1.8 + i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
              
              {/* Ring animation */}
              <motion.div
                className="absolute inset-0 border-2 border-white/30 rounded-full"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1.4],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 1.5,
                  delay: 1.2,
                  ease: "easeOut"
                }}
              />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent mb-2 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Locker Created Successfully!
              
              {/* Subtle underline animation */}
              <motion.div
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500"
                initial={{ width: "0%" }}
                animate={{ width: "60%" }}
                transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
              />
            </motion.h1>
            <motion.p 
              className="text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Your VaultLab locker is ready to use
            </motion.p>
          </motion.div>

          {/* Generated Link Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7, type: "spring", stiffness: 100 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <motion.div 
                    className="flex items-center space-x-3 mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                  >
                    <motion.div 
                      className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Lock className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-white font-semibold">{formData.title}</h3>
                      <div className="flex items-center space-x-2">
                        <img 
                          src="/Icon.svg" 
                          alt="VaultLab" 
                          className="w-4 h-4 object-contain"
                        />
                        <p className="text-gray-400 text-sm">VaultLab</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                  >
                    <Label className="text-gray-300 text-sm">Your Locker Link</Label>
                    <div className="flex items-center space-x-2">
                      <motion.div 
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-emerald-400 font-mono text-sm break-all">{generatedLink}</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          onClick={copyToClipboard}
                          variant="outline"
                          size="icon"
                          className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                  >
                    <Label className="text-gray-300 text-sm">Destination</Label>
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <Globe className="w-4 h-4" />
                      <span className="break-all">{formData.destinationUrl}</span>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => window.open(generatedLink, "_blank")}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium py-3 h-12"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Test Your Locker
              </Button>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-200 text-white backdrop-blur-xl transition-all duration-300 h-12"
                >
                  Create Another
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => router.push("/vault")}
                  variant="outline"
                  className="w-full border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-200 text-white backdrop-blur-xl transition-all duration-300 h-12"
                >
                  View in Vault
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Copy Notification Toast */}
        <AnimatePresence>
          {showCopyNotification && (
            <motion.div 
              className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4"
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                mass: 0.8
              }}
              layout
            >
              <motion.div 
                className="bg-black/90 backdrop-blur-xl border border-emerald-500/30 rounded-xl px-4 py-3 shadow-2xl shadow-emerald-500/20"
                whileHover={{ 
                  scale: 1.02,
                  borderColor: "rgba(16, 185, 129, 0.5)" 
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center space-x-3">
                  <motion.div 
                    className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      backgroundColor: [
                        "rgba(16, 185, 129, 0.2)",
                        "rgba(16, 185, 129, 0.3)",
                        "rgba(16, 185, 129, 0.2)"
                      ]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  </motion.div>
                  <motion.span 
                    className="text-white font-medium text-sm whitespace-nowrap"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    Link copied to clipboard!
                  </motion.span>
                </div>
                
                {/* Progress bar for auto-dismiss */}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-emerald-400 rounded-b-xl"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex flex-col p-6 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Back Button */}
      <motion.div
        className="absolute top-6 left-6 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.button
          onClick={() => router.push("/dashboard")}
          className="flex items-center space-x-2 text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/5 transition-all duration-300 px-4 py-2 rounded-lg border border-transparent hover:border-emerald-500/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ x: [-2, 2, -2] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </motion.button>
      </motion.div>

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

        {/* Floating particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-${i % 2 === 0 ? '2' : '1'} h-${i % 2 === 0 ? '2' : '1'} bg-emerald-400/30 rounded-full`}
            style={{
              top: `${25 + i * 20}%`,
              left: `${25 + i * 15}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="max-w-lg w-full">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <motion.div 
              className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 mb-6"
              whileHover={{ 
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                scale: 1.05 
              }}
              transition={{ duration: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Create Locker</span>
            </motion.div>

            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent mb-2 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Create Locker
              
              {/* Subtle underline animation */}
              <motion.div
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500"
                initial={{ width: "0%" }}
                animate={{ width: "60%" }}
                transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
              />
            </motion.h1>
            <motion.p 
              className="text-gray-400 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Transform any link into a monetized experience
            </motion.p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7, type: "spring", stiffness: 100 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title Field */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                  >
                    <Label htmlFor="title" className="text-gray-300 font-medium">
                      Locker Title
                    </Label>
                    <div className="relative">
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          id="title"
                          type="text"
                          placeholder="e.g., Premium Content Download"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          className={`bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 pl-12 ${
                            errors.title ? "border-red-500/50" : ""
                          }`}
                          style={{ boxShadow: "none" }}
                          required
                          disabled={isLoading}
                        />
                      </motion.div>
                      <motion.div 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {errors.title && (
                        <motion.p 
                          className="text-red-400 text-sm"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {errors.title}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Description Field */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.1 }}
                  >
                    <Label htmlFor="description" className="text-gray-300 font-medium">
                      Description
                    </Label>
                    <div className="relative">
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                                                 <Textarea
                           id="description"
                           placeholder="Enter a brief description of your locker"
                           value={formData.description}
                           onChange={(e) => handleInputChange("description", e.target.value)}
                           className={`bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 pl-12 ${
                             errors.description ? "border-red-500/50" : ""
                           }`}
                           style={{ boxShadow: "none" }}
                           required
                           disabled={isLoading}
                         />
                       </motion.div>
                       <motion.div 
                         className="absolute left-4 top-4 transform"
                         whileHover={{ scale: 1.1 }}
                         transition={{ duration: 0.2 }}
                       >
                         <Settings className="w-4 h-4 text-gray-400" />
                       </motion.div>
                    </div>
                    <AnimatePresence>
                      {errors.description && (
                        <motion.p 
                          className="text-red-400 text-sm"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {errors.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Destination URL Field */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                  >
                    <Label htmlFor="destinationUrl" className="text-gray-300 font-medium">
                      Destination URL
                    </Label>
                    <div className="relative">
                      <motion.div
                        whileFocus={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Input
                          id="destinationUrl"
                          type="url"
                          placeholder="https://example.com/your-content"
                          value={formData.destinationUrl}
                          onChange={(e) => handleInputChange("destinationUrl", e.target.value)}
                          className={`bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 pl-12 ${
                            errors.destinationUrl ? "border-red-500/50" : ""
                          }`}
                          style={{ boxShadow: "none" }}
                          required
                          disabled={isLoading}
                        />
                      </motion.div>
                      <motion.div 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Globe className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {errors.destinationUrl && (
                        <motion.p 
                          className="text-red-400 text-sm"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {errors.destinationUrl}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Task Type Selection */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.5 }}
                  >
                    <Label className="text-gray-300 font-medium">
                      Task Types
                    </Label>
                    <p className="text-gray-400 text-xs">Select the types of tasks visitors will complete to unlock your content</p>
                    
                                         <div className="grid grid-cols-1 gap-3">
                       {taskTypeOptions.map((option) => (
                         <motion.div
                           key={option.value}
                           className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                             formData.taskTypes.includes(option.value) 
                               ? "bg-emerald-500/10 border-emerald-500/30" 
                               : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                           }`}
                           onClick={() => handleTaskTypeChange(option.value)}
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                         >
                           <Checkbox
                             checked={formData.taskTypes.includes(option.value)}
                             onChange={() => handleTaskTypeChange(option.value)}
                             className="mt-0.5"
                           />
                           <div className="flex-1">
                             <div className="flex items-center space-x-2">
                               <span className="text-lg">{option.icon}</span>
                               <span className="text-white font-medium">{option.label}</span>
                             </div>
                             <p className="text-gray-400 text-xs mt-1">{option.description}</p>
                           </div>
                         </motion.div>
                       ))}
                     </div>
                     
                     <AnimatePresence>
                       {errors.taskTypes && (
                         <motion.p 
                           className="text-red-400 text-sm"
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           exit={{ opacity: 0, height: 0 }}
                           transition={{ duration: 0.3 }}
                         >
                           {errors.taskTypes}
                         </motion.p>
                       )}
                     </AnimatePresence>
                  </motion.div>

                  {/* Ad URL Configuration */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.7 }}
                  >
                    <Label className="text-gray-300 font-medium">
                      Ad URL Configuration
                    </Label>
                    <p className="text-gray-400 text-xs">Select how you want to configure your ad URLs</p>
                    
                    <motion.select 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                      value={formData.adUrlMode}
                      onChange={(e) => handleInputChange("adUrlMode", e.target.value as "common" | "tiered")}
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <option value="common">Common Ad URL</option>
                      <option value="tiered">Tiered Ad URLs</option>
                    </motion.select>
                  </motion.div>

                  {/* Common Ad URL Field */}
                  {formData.adUrlMode === "common" && (
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 1.9 }}
                    >
                      <Label htmlFor="commonAdUrl" className="text-gray-300 font-medium">
                        Common Ad URL
                      </Label>
                      <div className="relative">
                        <motion.div
                          whileFocus={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                                                     <Input
                             id="commonAdUrl"
                             type="url"
                             placeholder="https://example.com/ad"
                             value={formData.commonAdUrl}
                             onChange={(e) => handleInputChange("commonAdUrl", e.target.value)}
                             className={`bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 pl-12 ${
                               errors.adUrl ? "border-red-500/50" : ""
                             }`}
                             style={{ boxShadow: "none" }}
                             required
                             disabled={isLoading}
                           />
                         </motion.div>
                         <motion.div 
                           className="absolute left-4 top-1/2 transform -translate-y-1/2"
                           whileHover={{ scale: 1.1 }}
                           transition={{ duration: 0.2 }}
                         >
                           <Globe className="w-4 h-4 text-gray-400" />
                         </motion.div>
                      </div>
                      <AnimatePresence>
                        {errors.adUrl && (
                          <motion.p 
                            className="text-red-400 text-sm"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {errors.adUrl}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Tiered Ad URLs */}
                  {formData.adUrlMode === "tiered" && (
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 2.1 }}
                    >
                      <Label className="text-gray-300 font-medium">
                        Tiered Ad URLs
                      </Label>
                      <p className="text-gray-400 text-xs">Enter ad URLs for each tier</p>
                      
                                             <div className="space-y-4">
                         {Object.entries(formData.tieredAdUrls).map(([tier, url]) => (
                           <motion.div
                             key={tier}
                             className="space-y-2"
                             whileHover={{ scale: 1.01 }}
                             transition={{ duration: 0.2 }}
                           >
                             <Label className="text-gray-300 text-sm font-medium">
                               {tier.toUpperCase()} - {
                                 tier === 'tier1' ? 'US, UK, CA, AU, DE, NL, SE, NO' :
                                 tier === 'tier2' ? 'FR, IT, ES, JP, KR, SG, HK' :
                                 'All other countries'
                               }
                             </Label>
                             <div className="relative">
                               <motion.div
                                 whileFocus={{ scale: 1.02 }}
                                 transition={{ duration: 0.2 }}
                               >
                                 <Input
                                   type="url"
                                   placeholder={`https://example.com/ad-${tier}`}
                                   value={url}
                                   onChange={(e) => handleInputChange(`tieredAdUrls.${tier}`, e.target.value)}
                                   className={`bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 pl-12 ${
                                     errors.adUrl ? "border-red-500/50" : ""
                                   }`}
                                   style={{ boxShadow: "none" }}
                                   disabled={isLoading}
                                 />
                               </motion.div>
                               <motion.div 
                                 className="absolute left-4 top-1/2 transform -translate-y-1/2"
                                 whileHover={{ scale: 1.1 }}
                                 transition={{ duration: 0.2 }}
                               >
                                 <Globe className="w-4 h-4 text-gray-400" />
                               </motion.div>
                             </div>
                           </motion.div>
                         ))}
                       </div>
                       
                       <AnimatePresence>
                         {errors.adUrl && (
                           <motion.p 
                             className="text-red-400 text-sm"
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: "auto" }}
                             exit={{ opacity: 0, height: 0 }}
                             transition={{ duration: 0.3 }}
                           >
                             {errors.adUrl}
                           </motion.p>
                         )}
                       </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Info Box */}
                  <motion.div 
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2.3 }}
                    whileHover={{ 
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      borderColor: "rgba(16, 185, 129, 0.3)" 
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <motion.div 
                        className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center mt-0.5"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                      </motion.div>
                      <div>
                        <h4 className="text-emerald-400 font-medium text-sm mb-1">How it works</h4>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          Users will complete tasks from your selected category to unlock access to your destination URL. You earn revenue from each completed task.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Error Display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-red-400 text-sm">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-4 h-4" />
                          </motion.div>
                          <span>Creating Locker...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Lock className="w-4 h-4" />
                          <span>Create Locker</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
