"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Lock, Unlock, ExternalLink, Gift, FileText, Check, Zap, Loader2 } from "lucide-react"
import { trackLockerEvent } from "@/lib/analytics"
import { useUser } from "@clerk/nextjs"
import { getUserLocationClient } from "@/lib/geolocation"

// Browser detection utility
const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Opera GX')) return 'Opera GX';
  if (userAgent.includes('OPR') || userAgent.includes('Opera')) return 'Opera';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome') && !userAgent.includes('Safari')) return 'Chrome';
  if (userAgent.includes('CriOS')) return 'Chrome'; // Chrome on iOS
  if (userAgent.includes('Firefox') || userAgent.includes('FxiOS')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  
  return 'Unknown';
};

// Device detection utility
const getDevicePlatform = (): string => {
  const userAgent = navigator.userAgent;
  
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'Mac';
  if (/Windows/.test(userAgent)) return 'Windows';
  
  return 'Unknown';
};

declare interface Task {
  id: string
  title: string
  description: string
  loadingText: string
  icon: React.ReactNode
  completed: boolean
  loading: boolean
  adUrl?: string
  completionTimeSeconds?: number
  deviceSpecificCpm?: number
  action: () => void
}

interface LinkLockerProps {
  title?: string
  destinationUrl?: string
  lockerId: string
  taskType?: string | string[]
}

export default function LinkLocker({ title = "Premium Content Download", destinationUrl = "#", lockerId, taskType = "adult" }: LinkLockerProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userReady, setUserReady] = useState(false)
  const unlockStartTime = useRef(Date.now())

  // Get user's country and tier using IPLocate service
  const getUserLocation = async () => {
    try {
      const location = await getUserLocationClient();
      return { 
        country: location.countryCode, 
        tier: location.tier,
        isVpn: location.isVpn,
        isProxy: location.isProxy
      };
    } catch (error) {
              console.error('[VAULTLAB] Error getting location:', error);
      // Fallback to US/tier1 on error
      return { country: 'US', tier: 'tier1', isVpn: false, isProxy: false };
    }
  };

  // Helper function to get effective ad URL for a task
  const getEffectiveAdUrl = async (task: any, userTier: string, deviceSpecificConfig: any) => {
    // Priority order:
    // 1. Device-specific override (highest priority)
    // 2. Locker-level ad URL configuration
    // 3. Task-level ad URL (fallback)
    
    if (deviceSpecificConfig && deviceSpecificConfig.adUrl) {
      return { url: deviceSpecificConfig.adUrl, source: 'device-specific' };
    }
    
    try {
      // Fetch locker data to check ad URL configuration
      const lockerRes = await fetch(`/api/lockers/${lockerId}`);
      if (lockerRes.ok) {
        const lockerData = await lockerRes.json();
        
        if (lockerData.ad_url_mode === 'common' && lockerData.common_ad_url) {
          return { url: lockerData.common_ad_url, source: 'locker-common' };
        } else if (lockerData.ad_url_mode === 'tiered' && lockerData.tiered_ad_urls) {
          const tierUrls = lockerData.tiered_ad_urls;
          if (tierUrls[userTier]) {
            return { url: tierUrls[userTier], source: `locker-${userTier}` };
          }
          // Fallback to other tiers if current tier is not available
          const fallbackUrl = tierUrls.tier1 || tierUrls.tier2 || tierUrls.tier3;
          if (fallbackUrl) {
            return { url: fallbackUrl, source: 'locker-fallback' };
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch locker ad URL configuration:', error);
    }
    
    // Fallback to task-level ad URL
    return { url: task.ad_url, source: 'task-default' };
  };

  // Wait for user to be ready
  useEffect(() => {
    if (isLoaded) {
      setUserReady(true);
      console.log('[DEBUG] User state:', { isLoaded, isSignedIn, userId: user?.id });
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks")
        const data = await res.json()
        console.log("Fetched tasks:", data)

        // Get user's browser and device
        const userBrowser = getBrowserName();
        const userDevice = getDevicePlatform();
        console.log("User browser detected:", userBrowser);
        console.log("User device detected:", userDevice);
        console.log("User agent:", navigator.userAgent);

        // Get user's location for device targeting
        const location = await getUserLocation();
        console.log("User location detected:", location);

        // Get device-specific targeting data
        let deviceTargetingData: any = {};
        try {
          const deviceRes = await fetch("/api/device-targeting");
          if (deviceRes.ok) {
            deviceTargetingData = await deviceRes.json();
            console.log("Device targeting data:", deviceTargetingData);
          }
        } catch (error) {
          console.error("Error fetching device targeting:", error);
        }

        // Filter out tasks based on task type, tier targeting, browser exclusions, device targeting, and device-specific overrides
        const filteredTasks = data.filter((task: any) => {
          console.log(`\n--- Checking task: "${task.title}" ---`);
          console.log(`Task type: ${task.task_type || 'not set'}, Locker requires: ${taskType}`);
          console.log(`Target tiers: [${(task.target_tiers || ['tier1', 'tier2', 'tier3']).join(', ')}], User tier: ${location.tier}`);
          console.log(`Excluded browsers: [${(task.excluded_browsers || []).join(', ')}]`);
          console.log(`Target devices: [${(task.devices || []).join(', ')}]`);
          
          // Check task type matching - now support multiple task types
          const taskTypeToCheck = task.task_type || 'adult'; // Default to adult if not set
          
          // Handle both single task type (string) and multiple task types (array)
          let taskTypeMatches = false;
          if (typeof taskType === 'string') {
            // Single task type (legacy support)
            taskTypeMatches = taskTypeToCheck === taskType;
          } else if (Array.isArray(taskType)) {
            // Multiple task types - check if task type is in the array
            taskTypeMatches = taskType.includes(taskTypeToCheck);
          } else {
            // Fallback for unexpected formats
            taskTypeMatches = taskTypeToCheck === 'adult';
          }
          
          if (!taskTypeMatches) {
            console.log(`❌ EXCLUDED: Task type ${taskTypeToCheck} doesn't match locker requirements ${Array.isArray(taskType) ? taskType.join(', ') : taskType}`);
            return false;
          } else {
            console.log(`✅ Task type check passed: ${taskTypeToCheck} matches requirements`);
          }
          
          // Check browser exclusions
          const excludedBrowsers = task.excluded_browsers || [];
          const isBrowserExcluded = excludedBrowsers.includes(userBrowser);
          
          if (isBrowserExcluded) {
            console.log(`❌ EXCLUDED: Browser ${userBrowser} is in exclusion list`);
            return false;
          } else {
            console.log(`✅ Browser check passed: ${userBrowser} not excluded`);
          }
          
          // Check device targeting
          const targetDevices = task.devices || [];
          if (targetDevices.length > 0) {
            const isDeviceTargeted = targetDevices.includes(userDevice);
            if (!isDeviceTargeted) {
              console.log(`❌ EXCLUDED: Device ${userDevice} not in target list [${targetDevices.join(', ')}]`);
              return false;
            } else {
              console.log(`✅ Device check passed: ${userDevice} is targeted`);
            }
          } else {
            console.log(`✅ Device check skipped: No device targeting set`);
          }

          // Check tier targeting
          const targetTiers = task.target_tiers || ["tier1", "tier2", "tier3"]; // Default to all tiers if not set
          const userTier = location.tier;
          
          if (Array.isArray(targetTiers) && !targetTiers.includes(userTier)) {
            console.log(`❌ EXCLUDED: User tier ${userTier} not in target tiers [${targetTiers.join(', ')}]`);
            return false;
          } else {
            console.log(`✅ Tier check passed: User tier ${userTier} is in target tiers [${targetTiers.join(', ')}]`);
          }

          // Check device-specific targeting overrides
          const deviceTargetKey = `${userDevice}_${location.country}`;
          const deviceSpecificConfig = deviceTargetingData[deviceTargetKey];
          
          if (deviceSpecificConfig && deviceSpecificConfig.taskId) {
            // If there's a device-specific task configured for this device/country combo
            const isTaskMatching = deviceSpecificConfig.taskId === task.id.toString();
            if (!isTaskMatching) {
              console.log(`❌ EXCLUDED: Device-specific targeting shows different task for ${userDevice} in ${location.country}`);
              return false;
            } else {
              console.log(`✅ Device-specific targeting: Task matches for ${userDevice} in ${location.country}`);
            }
          }
          
          console.log(`✅ INCLUDED: Task passed all filters`);
          return true;
        });

        // Process tasks with async ad URL resolution
        const formattedTasks: Task[] = await Promise.all(
          filteredTasks.map(async (task: any) => {
            // Check for device-specific overrides
            const deviceTargetKey = `${userDevice}_${location.country}`;
            const deviceSpecificConfig = deviceTargetingData[deviceTargetKey];
            
            // Get effective ad URL using helper function
            const { url: effectiveAdUrl, source: urlSource } = await getEffectiveAdUrl(
              task, 
              location.tier, 
              deviceSpecificConfig
            );
            
            console.log(`[TASK MAPPING] Task "${task.title}" - Using ad URL: ${effectiveAdUrl} (${urlSource})`);
            
            return {
              id: task.id.toString(),
              title: task.title,
              description: task.description,
              loadingText: "Completing task...",
              icon: <Gift className="w-5 h-5" />,
              completed: false,
              loading: false,
              adUrl: effectiveAdUrl,
              completionTimeSeconds: task.completion_time_seconds || 60,
              deviceSpecificCpm: deviceSpecificConfig?.cpm, // Store device-specific CPM for revenue calculation
              action: () => handleTaskClick(task.id.toString()),
            };
          })
        )

        console.log(`Filtered tasks: ${filteredTasks.length}/${data.length} tasks shown for ${userBrowser} on ${userDevice}`);
        
        // Publisher-level IP tracking is now handled in real-time during events
        // No need for pre-checking individual task cooldowns
        setTasks(formattedTasks)
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  // Track initial visit when user is ready (with IP tracking)
  useEffect(() => {
    if (userReady) {
      const trackVisit = async () => {
        try {
          // Check IP tracking for visit events
          const ipTrackingResponse = await fetch('/api/ip-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lockerId: lockerId,
              userId: user?.id || null,
              eventType: 'visit'
            })
          });

          const ipTrackingResult = await ipTrackingResponse.json();
          console.log('[IP TRACKING] Visit result:', ipTrackingResult);

          // Only track visit if IP tracking allows it
          if (ipTrackingResult.shouldCount) {
            console.log('[DEBUG] ✅ IP tracking allows visit counting');
            trackLockerEvent({
              locker_id: lockerId,
              event_type: "visit",
              user_id: user?.id || null,
              extra: {
                ipTrackingReason: ipTrackingResult.reason,
                analyticsAllowed: true
              }
            });
          } else {
            console.log('[DEBUG] ❌ IP tracking blocked visit counting:', ipTrackingResult.reason);
          }
        } catch (error) {
          console.error('[IP TRACKING] Error checking visit:', error);
          // Fallback: track visit anyway if IP tracking fails
          trackLockerEvent({
            locker_id: lockerId,
            event_type: "visit",
            user_id: user?.id || null,
          });
        }
      };

      trackVisit();
    }
  }, [userReady, user, lockerId])

  type HandleTaskClick = (taskId: string, countryCode?: string, tier?: string) => void

  const handleTaskClick: HandleTaskClick = (taskId, countryCode = 'US', tier = 'tier1') => {
    const task = tasks.find((t) => t.id === taskId);
    console.log('[TASK CLICK] Starting task click:', { 
      taskId, 
      task: task ? { id: task.id, title: task.title } : 'not found',
      userReady,
      userId: user?.id
    });
    
    const adUrl = task?.adUrl || (task as any)?.ad_url;
    if (task?.completed || task?.loading) {
      console.log('[TASK CLICK] Task already completed or loading, skipping');
      return;
    }

    // Generate a unique sub_id for this click
    const sub1 = `${lockerId}_${taskId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('[TASK CLICK] Generated sub_id:', sub1);
    
    // Store sub_id in localStorage for later verification if needed
    const clickData = {
      sub_id: sub1,
      task_id: taskId,
      locker_id: lockerId,
      timestamp: Date.now()
    };
    localStorage.setItem(`click_${sub1}`, JSON.stringify(clickData));

    // Open adUrl if present and valid
    if (adUrl && typeof adUrl === 'string' && adUrl.trim() !== '') {
      // Append sub1 to the task URL
      let taskUrl = adUrl;
      try {
        const url = new URL(taskUrl);
        url.searchParams.set('sub1', sub1);
        taskUrl = url.toString();
      } catch (e) {
        // If URL parsing fails, append manually
        const separator = taskUrl.includes('?') ? '&' : '?';
        taskUrl = `${taskUrl}${separator}sub1=${sub1}`;
      }
      
      console.log('[TASK CLICK] Opening ad URL with sub_id:', taskUrl);
      window.open(taskUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.error('[TASK CLICK] No valid ad URL found:', adUrl);
      alert('No Ad URL set for this task.');
      return;
    }

    // Start loading
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, loading: true } : task)));
    console.log('[TASK CLICK] Task loading started for:', taskId);

    // Get user location for proper revenue calculation
    const currentTask = tasks.find(t => t.id === taskId);
    const completionTime = (currentTask?.completionTimeSeconds || 60) * 1000; // Convert to milliseconds
    
    console.log(`[TASK COMPLETION] Task will complete in ${completionTime/1000} seconds`);
    
    setTimeout(async () => {
      const location = await getUserLocation();
        console.log('[TASK COMPLETION] Starting task completion process for:', taskId);
        console.log('[TASK COMPLETION] User location detected:', location);

        // Check IP tracking to prevent duplicate analytics counting
        const ipTrackingResponse = await fetch('/api/ip-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: taskId,
            lockerId: lockerId,
            userId: user?.id || null,
            country: location.country,
            device: getDevicePlatform(),
            eventType: 'task_complete'
          })
        });

        const ipTrackingResult = await ipTrackingResponse.json();
        console.log('[IP TRACKING] Task completion result:', ipTrackingResult);
        
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? { ...task, loading: false, completed: true } : task)),
        );

        // Only track analytics if IP tracking allows it
        if (ipTrackingResult.shouldCount) {
          console.log('[TASK COMPLETION] ✅ IP tracking allows analytics counting');
          
          // Track task completion with user ID - only if user is ready and available
          if (userReady && user) {
                      const eventData = {
            locker_id: lockerId,
            event_type: "task_complete",
            task_id: taskId, // Use the actual UUID
            extra: { 
              country: location.country, // Already contains countryCode from getUserLocation
              tier: location.tier,
              device: getDevicePlatform(), // Add device info for CSV-uploaded CPM lookup
              isVpn: location.isVpn,
              isProxy: location.isProxy,
              ipTrackingReason: ipTrackingResult.reason,
              analyticsAllowed: true
            },
            user_id: user.id,
          };
            
            console.log('[TASK COMPLETION] Tracking task completion with user:', eventData);
            
            trackLockerEvent(eventData)
              .then(() => {
                console.log('[TASK COMPLETION] ✅ Analytics event sent successfully');
              })
              .catch((error) => {
                console.error('[TASK COMPLETION] ❌ Failed to send analytics event:', error);
              });
          } else {
            const eventData = {
              locker_id: lockerId,
              event_type: "task_complete",
              task_id: taskId, // Use the actual UUID instead of task_index
              extra: { 
                country: location.country, // Already contains countryCode from getUserLocation
                tier: location.tier,
                device: getDevicePlatform(), // Add device info for CSV-uploaded CPM lookup
                isVpn: location.isVpn,
                isProxy: location.isProxy,
                ipTrackingReason: ipTrackingResult.reason,
                analyticsAllowed: true
              },
              user_id: null,
            };
            
            console.warn('[TASK COMPLETION] User not ready, tracking as anonymous:', { 
              userReady, 
              hasUser: !!user,
              userId: user?.id,
              eventData
            });
            
            trackLockerEvent(eventData)
              .then(() => {
                console.log('[TASK COMPLETION] ✅ Anonymous analytics event sent successfully');
              })
              .catch((error) => {
                console.error('[TASK COMPLETION] ❌ Failed to send anonymous analytics event:', error);
              });
          }
        } else {
          console.log('[TASK COMPLETION] ❌ IP tracking blocked analytics counting:', ipTrackingResult.reason);
          console.log('[TASK COMPLETION] No analytics will be tracked for this duplicate IP');
        }
      }, completionTime); // Use dynamic completion time from task settings
  }

  const allTasksCompleted = tasks.length > 0 && tasks.every((task) => task.completed)
  const completedCount = tasks.filter((task) => task.completed).length

  const handleUnlock = async () => {
    console.log('[DEBUG] Unlock button clicked:', { 
      allTasksCompleted, 
      userReady,
      hasUser: !!user,
      userId: user?.id, 
      destinationUrl 
    });
    
    if (allTasksCompleted) {
      const duration = Date.now() - unlockStartTime.current;
      
      try {
        // Check IP tracking for unlock events
        const ipTrackingResponse = await fetch('/api/ip-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lockerId: lockerId,
            userId: user?.id || null,
            eventType: 'unlock'
          })
        });

        const ipTrackingResult = await ipTrackingResponse.json();
        console.log('[IP TRACKING] Unlock result:', ipTrackingResult);

        // Only track unlock if IP tracking allows it
        if (ipTrackingResult.shouldCount) {
          console.log('[DEBUG] ✅ IP tracking allows unlock counting');
          
          // Track unlock event (with or without user)
          if (userReady && user) {
            console.log('[DEBUG] Tracking unlock event with user:', {
              locker_id: lockerId,
              event_type: "unlock",
              duration,
              user_id: user.id,
            });
            
            trackLockerEvent({
              locker_id: lockerId,
              event_type: "unlock",
              duration,
              user_id: user.id,
              extra: {
                ipTrackingReason: ipTrackingResult.reason,
                analyticsAllowed: true
              }
            });
          } else {
            console.log('[DEBUG] Tracking unlock event without user');
            trackLockerEvent({
              locker_id: lockerId,
              event_type: "unlock",
              duration,
              user_id: null,
              extra: {
                ipTrackingReason: ipTrackingResult.reason,
                analyticsAllowed: true
              }
            });
          }
        } else {
          console.log('[DEBUG] ❌ IP tracking blocked unlock counting:', ipTrackingResult.reason);
        }
      } catch (error) {
        console.error('[IP TRACKING] Error checking unlock:', error);
        // Fallback: track unlock anyway if IP tracking fails
        if (userReady && user) {
          trackLockerEvent({
            locker_id: lockerId,
            event_type: "unlock",
            duration,
            user_id: user.id,
          });
        } else {
          trackLockerEvent({
            locker_id: lockerId,
            event_type: "unlock",
            duration,
            user_id: null,
          });
        }
      }
      
      // Ensure destinationUrl is valid and redirect (always allow this regardless of IP tracking)
      if (destinationUrl && destinationUrl !== "#") {
        console.log('[DEBUG] Redirecting to:', destinationUrl);
        window.location.href = destinationUrl;
      } else {
        console.error('[DEBUG] Invalid destination URL:', destinationUrl);
        alert('Invalid destination URL. Please contact support.');
      }
    } else {
      console.log('[DEBUG] Unlock conditions not met:', { 
        allTasksCompleted,
        completedCount,
        totalTasks: tasks.length
      });
    }
  }

  // Show loading state while user authentication is loading
  if (!userReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex items-center justify-center p-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="ml-3 text-gray-400">Loading...</span>
        </div>
      </div>
    );
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
        {!isLoading && tasks.length > 0 && (
          <>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300 font-medium">Progress</span>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {tasks.map((_, i) => (
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
                  <span className="text-emerald-400 font-bold text-lg">{completedCount}/{tasks.length}</span>
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
                  Complete {tasks.length - completedCount} more challenge{tasks.length - completedCount !== 1 ? "s" : ""} to unlock
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
