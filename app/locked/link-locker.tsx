"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Lock, Unlock, ExternalLink, Gift, FileText, Check, Zap, Loader2 } from "lucide-react"
import { trackLockerEvent } from "@/lib/analytics"

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
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true);

  const hasTrackedVisit = useRef(false);

  // Device detection
  function getDeviceType() {
    const ua = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    if (/android/i.test(ua)) return 'Android';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
    if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) return 'Mac';
    if (/Win32|Win64|Windows|WinCE/.test(ua)) return 'Windows';
    return 'Other';
  }

  // Country tier detection
  function getCountryTier(countryCode: string) {
    const tier1 = ['US', 'UK', 'CA', 'AU', 'DE', 'NL', 'SE', 'NO'];
    const tier2 = ['FR', 'IT', 'ES', 'JP', 'KR', 'SG', 'HK'];
    if (tier1.includes(countryCode)) return 'tier1';
    if (tier2.includes(countryCode)) return 'tier2';
    return 'tier3';
  }

  useEffect(() => {
    async function fetchAndFilterTasks() {
      setLoadingTasks(true);
      // 1. Detect device
      const device = getDeviceType();
      // 2. Detect country
      let countryCode = 'US'; // fallback
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        const geoData = await geoRes.json();
        if (geoData && geoData.country) countryCode = geoData.country;
      } catch (e) {
        // fallback to US
      }
      const tier = getCountryTier(countryCode);
      // 3. Fetch tasks
      const res = await fetch('/api/tasks');
      const data = await res.json();
      console.log('API /api/tasks response:', data);
      const tasksArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      // 4. Filter tasks by device and tier
      const filtered = tasksArray.filter((t: any) => {
        // Device match
        if (t.devices && Array.isArray(t.devices) && !t.devices.includes(device)) return false;
        // Status match
        if (t.status && t.status !== 'Active') return false;
        // CPM tier match: allow if CPM for this tier is set and > 0
        if (tier === 'tier1' && (!t.cpm_tier1 || Number(t.cpm_tier1) <= 0)) return false;
        if (tier === 'tier2' && (!t.cpm_tier2 || Number(t.cpm_tier2) <= 0)) return false;
        if (tier === 'tier3' && (!t.cpm_tier3 || Number(t.cpm_tier3) <= 0)) return false;
        return true;
      });
      // 5. Map to Task structure
      setTasks(
        filtered.map((t: any, idx: number) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          loadingText: t.loadingText || "Loading...",
          icon: idx === 0 ? <FileText className="w-5 h-5" /> : idx === 1 ? <Gift className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />,
          completed: false,
          loading: false,
          adUrl: t.ad_url,
          action: () => handleTaskClick(t.id, countryCode, tier),
        }))
      );
      setLoadingTasks(false);
    }
    fetchAndFilterTasks();
  }, []);

  const unlockStartTime = useRef(Date.now());

  type HandleTaskClick = (taskId: string, countryCode?: string, tier?: string) => void;
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

    // Complete after 60 seconds
    setTimeout(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, loading: false, completed: true } : task)),
      );
      // Track task completion
      trackLockerEvent({
        locker_id: lockerId,
        event_type: "task_complete",
        task_index: taskId,
        extra: { country: countryCode, tier },
      });
    }, 60000);
  }

  const allTasksCompleted = tasks.every((task) => task.completed)
  const completedCount = tasks.filter((task) => task.completed).length

  const handleUnlock = () => {
    if (allTasksCompleted) {
      const duration = Date.now() - unlockStartTime.current;
      trackLockerEvent({
        locker_id: lockerId,
        event_type: "unlock",
        duration,
      });
      window.location.href = destinationUrl
    }
  }

  useEffect(() => {
    const handleUnload = () => {
      if (!allTasksCompleted) {
        trackLockerEvent({
          locker_id: lockerId,
          event_type: "dropoff",
          task_index: completedCount,
        });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [allTasksCompleted, completedCount, lockerId]);

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
          {loadingTasks ? (
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
        {!loadingTasks && (
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
