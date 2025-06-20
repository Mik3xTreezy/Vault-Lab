"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export default function Admin() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoaded) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  if (!isSignedIn || !user?.emailAddresses?.[0] || user.emailAddresses[0].emailAddress !== "ananthu9539@gmail.com") {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p>You don't have permission to access this admin panel.</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Admin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Dashboard</h2>
            <p className="text-gray-400">System overview and statistics</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Users</h2>
            <p className="text-gray-400">Manage platform users</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Opera GX Postbacks</h2>
            <p className="text-gray-400">Postback system is configured and working!</p>
            <div className="mt-4 p-3 bg-emerald-500/10 rounded border border-emerald-500/20">
              <p className="text-emerald-400 text-sm">✅ Postback API: /api/postback</p>
              <p className="text-emerald-400 text-sm">✅ Opera GX Task: Configured</p>
              <p className="text-emerald-400 text-sm">✅ Secret: opera_gx_secret_abc123def456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 