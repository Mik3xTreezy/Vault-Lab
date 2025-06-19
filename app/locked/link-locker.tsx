"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Lock, Unlock, ExternalLink, Gift, FileText, Check, Zap, Loader2 } from "lucide-react"
import { trackLockerEvent } from "@/lib/analytics"
import { useUser } from "@clerk/nextjs"

declare interface Task {
  id: string
  title: string
  description: string
  loadingText: string
  icon: React.ReactNode
  completed: boolean
  loading: boolean
  adUrl?: string
  action: () => void
}

interface LinkLockerProps {
  title?: string
  destinationUrl?: string
  lockerId: string
}

export default function LinkLocker({ title = "Premium Content Download", destinationUrl = "#", lockerId }: LinkLockerProps) {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const unlockStartTime = useRef(Date.now())

  // Get user's country and tier (you can implement geolocation or use a service)
  const getUserLocation = () => {
    // For now, default to US and tier1. You can implement proper geolocation later
    return { country: 'US', tier: 'tier1' };
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks")
        const data = await res.json()
        console.log("Fetched tasks:", data)

        const formattedTasks: Task[] = data.map((task: any) => ({
          id: task.id.toString(),
          title: task.title,
          description: task.description,
          loadingText: "Completing task...",
          icon: <Gift className="w-5 h-5" />,
          completed: false,
          loading: false,
          adUrl: task.ad_url,
          action: () => handleTaskClick(task.id.toString()),
        }))

        setTasks(formattedTasks)
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()

    // Track initial visit
    if (user) {
      trackLockerEvent({
        locker_id: lockerId,
        event_type: "visit",
        user_id: user.id,
      });
    }
  }, [lockerId, user])

  type HandleTaskClick = (taskId: string, countryCode?: string, tier?: string) => void

  const handleTaskClick: HandleTaskClick = (taskId, countryCode = 'US', tier = 'tier1') => {
    const task = tasks.find((t) => t.id === taskId);
    console.log('Clicked task:', task);
    const adUrl = task?.adUrl || (task as any)?.ad_url;
    if (task?.completed || task?.loading) return;

    // Open adUrl if present and valid
    if (adUrl && typeof adUrl === 'string' && adUrl.trim() !== '') {
      window.open(adUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('No Ad URL set for this task.');
      return;
    }

    // Start loading
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, loading: true } : task)));

    // Get user location for proper revenue calculation
    const location = getUserLocation();

    // Complete after 60 seconds
    setTimeout(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, loading: false, completed: true } : task)),
      );
      // Track task completion with user ID
      if (user) {
        console.log('[DEBUG] Tracking task completion:', {
          locker_id: lockerId,
          event_type: "task_complete",
          task_index: Number(taskId),
          extra: { country: location.country, tier: location.tier },
          user_id: user.id,
        });
        
        trackLockerEvent({
          locker_id: lockerId,
          event_type: "task_complete",
          task_index: Number(taskId),
          extra: { country: location.country, tier: location.tier },
          user_id: user.id,
        });
      }
    }, 60000);
  }

  const allTasksCompleted = tasks.every((task) => task.completed)
  const completedCount = tasks.filter((task) => task.completed).length

  const handleUnlock = () => {
    if (allTasksCompleted && user) {
      const duration = Date.now() - unlockStartTime.current;
      trackLockerEvent({
        locker_id: lockerId,
        event_type: "unlock",
        duration,
        user_id: user.id,
      });
      window.location.href = destinationUrl
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-lg w-full relative z-10">
        {/* Header with Glassmorphism */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 mb-4">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Unlock Required</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
            Access Link
          </h1>
          <p className="text-gray-400 text-sm">Complete the challenges below to access your content</p>
        </div>

        {/* Tasks Grid */}
        <div className="grid gap-4 mb-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="ml-3 text-gray-400">Loading tasks...</span>
            </div>
          ) : (
            tasks.map((task, index) => (
              <button
                key={task.id}
                type="button"
                onClick={() => handleTaskClick(task.id)}
                className={`
                  group relative overflow-hidden backdrop-blur-xl border transition-all duration-300 cursor-pointer
                  ${
                    task.completed
                      ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                      : task.loading
                        ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/20"
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  }
                  rounded-2xl p-6 w-full text-left
                `}
                style={{
                  animationDelay: `${index * 150}ms`,
                  transform: task.completed ? "scale(1.02)" : "scale(1)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`
                      relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
                      ${
                        task.completed
                          ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-md"
                          : task.loading
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-md"
                            : "bg-white/10 group-hover:bg-white/15 group-hover:shadow-sm"
                      }
                    `}
                    >
                      {task.completed ? (
                        <Check className="w-6 h-6 text-black" />
                      ) : (
                        task.icon
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-white">{task.title}</h3>
                      <p className="text-gray-400 text-sm">{task.loading ? task.loadingText : task.description}</p>
                    </div>
                  </div>

                  <div className="ml-4">
                    {task.completed ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : task.loading ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      </div>
                    ) : (
                      <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Progress Section & Unlock Button: Only show after tasks are loaded */}
        {!isLoading && (
          <>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300 font-medium">Progress</span>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          i < completedCount
                            ? "bg-emerald-500"
                            : tasks[i]?.loading
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-emerald-400 font-bold text-lg">{completedCount}/3</span>
                </div>
              </div>

              <div className="relative w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-1000 ease-out"
                  style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Unlock Button */}
            <div className="text-center">
              <Button
                onClick={handleUnlock}
                disabled={!allTasksCompleted}
                className={`
                  relative w-full py-4 text-lg font-bold rounded-2xl transition-all duration-300 overflow-hidden
                  ${
                    allTasksCompleted
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                      : "bg-white/10 text-gray-500 cursor-not-allowed border border-white/10 backdrop-blur-xl"
                  }
                `}
              >
                <div className="flex items-center justify-center space-x-3 relative z-10">
                  {allTasksCompleted ? (
                    <>
                      <Unlock className="w-6 h-6" />
                      <span>UNLOCK CONTENT</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-6 h-6" />
                      <span>CONTENT LOCKED</span>
                    </>
                  )}
                </div>

                {/* Subtle gradient overlay for active state */}
                {allTasksCompleted && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                )}
              </Button>

              {!allTasksCompleted && (
                <p className="text-gray-500 text-sm mt-4">
                  Complete {3 - completedCount} more challenge{3 - completedCount !== 1 ? "s" : ""} to unlock
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
