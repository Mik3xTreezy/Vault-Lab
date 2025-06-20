"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Link, Globe, Loader2, CheckCircle, Copy, ExternalLink, Sparkles, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Create() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    destinationUrl: "",
    taskType: "adult" as string, // Single task type selection
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [errors, setErrors] = useState({
    title: "",
    destinationUrl: "",
  })
  const [error, setError] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors = { title: "", destinationUrl: "" }
    let isValid = true

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
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

    // Task type is always selected in dropdown, so no validation needed

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
          destinationUrl: formData.destinationUrl,
          taskType: formData.taskType,
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
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleTaskTypeChange = (taskType: string) => {
    setFormData((prev) => ({
      ...prev,
      taskType: taskType
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
    setFormData({ title: "", destinationUrl: "", taskType: "adult" })
    setIsSuccess(false)
    setGeneratedLink("")
    setErrors({ title: "", destinationUrl: "" })
    setShowCopyNotification(false)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-lg w-full relative z-10">
          {/* Success Animation */}
          <div className="text-center mb-8 animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-6 animate-pulse">
              <CheckCircle className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
              Locker Created Successfully!
            </h1>
            <p className="text-gray-400">Your link locker is ready to use</p>
          </div>

          {/* Generated Link Card */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{formData.title}</h3>
                    <p className="text-gray-400 text-sm">Link Locker</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Your Locker Link</Label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                      <p className="text-emerald-400 font-mono text-sm break-all">{generatedLink}</p>
                    </div>
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Destination</Label>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Globe className="w-4 h-4" />
                    <span className="break-all">{formData.destinationUrl}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 animate-in slide-in-from-bottom-4 duration-700 delay-400">
            <Button
              onClick={() => window.open(generatedLink, "_blank")}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium py-3"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Test Your Locker
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl"
              >
                Create Another
              </Button>
              <Button
                onClick={() => router.push("/vault")}
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl"
              >
                View in Vault
              </Button>
            </div>
          </div>
        </div>

        {/* Copy Notification Toast */}
        {showCopyNotification && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500 ease-out">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-2xl shadow-black/20">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-white font-medium text-sm">Link copied to clipboard!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>

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
      </div>

      <div className="max-w-lg w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Create Locker</span>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
            Create Link Locker
          </h1>
          <p className="text-gray-400 text-sm">Transform any link into a monetized experience</p>
        </div>

        {/* Form Card */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300 font-medium">
                  Locker Title
                </Label>
                <div className="relative">
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
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Link className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {errors.title && (
                  <p className="text-red-400 text-sm animate-in slide-in-from-top-1 duration-300">{errors.title}</p>
                )}
              </div>

              {/* Destination URL Field */}
              <div className="space-y-2">
                <Label htmlFor="destinationUrl" className="text-gray-300 font-medium">
                  Destination URL
                </Label>
                <div className="relative">
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
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {errors.destinationUrl && (
                  <p className="text-red-400 text-sm animate-in slide-in-from-top-1 duration-300">
                    {errors.destinationUrl}
                  </p>
                )}
              </div>

              {/* Task Type Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">
                  Task Type
                </Label>
                <p className="text-gray-400 text-xs">Select the type of tasks visitors will complete to unlock your content</p>
                
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                  value={formData.taskType}
                  onChange={(e) => handleTaskTypeChange(e.target.value)}
                >
                  <option value="adult" className="bg-gray-800 text-white py-2">Adult Tasks</option>
                  <option value="game" className="bg-gray-800 text-white py-2">Game Tasks</option>
                  <option value="minecraft" className="bg-gray-800 text-white py-2">Minecraft Tasks</option>
                  <option value="roblox" className="bg-gray-800 text-white py-2">Roblox Tasks</option>
                </select>
                
                <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-300 text-xs">
                    {formData.taskType === "adult" && "18+ content tasks for mature audiences"}
                    {formData.taskType === "game" && "General gaming related tasks and activities"}
                    {formData.taskType === "minecraft" && "Minecraft specific tasks and server activities"}
                    {formData.taskType === "roblox" && "Roblox related tasks and game experiences"}
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center mt-0.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-medium text-sm mb-1">How it works</h4>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      Users will complete tasks from your selected category to unlock access to your destination URL. You earn revenue from each completed task.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-medium py-3 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Locker...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Create Locker</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-400">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:underline transition-all duration-200 hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
