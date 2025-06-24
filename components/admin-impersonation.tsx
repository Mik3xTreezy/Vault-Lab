"use client"

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Eye, LogOut, Shield, User, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImpersonationComponentProps {
  targetUser: {
    clerk_user_id: string
    email: string
    full_name: string
  }
  onImpersonationStart?: () => void
  onImpersonationEnd?: () => void
}

interface ImpersonationSession {
  impersonationToken: string
  targetUser: {
    id: string
    email: string
    name: string
  }
  expiresAt: string
}

export function ImpersonationComponent({ 
  targetUser, 
  onImpersonationStart, 
  onImpersonationEnd 
}: ImpersonationComponentProps) {
  const { user: currentUser } = useUser()
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSession, setCurrentSession] = useState<ImpersonationSession | null>(null)

  // Check if we're currently impersonating someone
  useEffect(() => {
    const checkImpersonationStatus = () => {
      const storedSession = localStorage.getItem('admin_impersonation_session')
      if (storedSession) {
        try {
          const session: ImpersonationSession = JSON.parse(storedSession)
          const now = new Date()
          const expiresAt = new Date(session.expiresAt)
          
          if (expiresAt > now) {
            setCurrentSession(session)
            setIsImpersonating(true)
          } else {
            // Session expired, clean up
            localStorage.removeItem('admin_impersonation_session')
            setCurrentSession(null)
            setIsImpersonating(false)
          }
        } catch (error) {
          console.error('Error parsing impersonation session:', error)
          localStorage.removeItem('admin_impersonation_session')
        }
      }
    }

    checkImpersonationStatus()
  }, [])

  const startImpersonation = async () => {
    if (!currentUser) {
      setError('You must be logged in as an admin to impersonate users')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('[IMPERSONATE] Starting impersonation for:', targetUser);
      console.log('[IMPERSONATE] Target user ID:', targetUser.clerk_user_id);
      
      const requestBody = {
        targetUserId: targetUser.clerk_user_id
      };
      
      console.log('[IMPERSONATE] Request body:', requestBody);

      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start impersonation')
      }

      // Store the session information
      const session: ImpersonationSession = {
        impersonationToken: data.impersonationToken,
        targetUser: data.targetUser,
        expiresAt: data.expiresAt
      }

      localStorage.setItem('admin_impersonation_session', JSON.stringify(session))
      setCurrentSession(session)
      setIsImpersonating(true)

      if (onImpersonationStart) {
        onImpersonationStart()
      }

      // Redirect to dashboard as the impersonated user
      window.location.href = '/dashboard'

    } catch (error) {
      console.error('Error starting impersonation:', error)
      setError(error instanceof Error ? error.message : 'Failed to start impersonation')
    } finally {
      setLoading(false)
    }
  }

  const endImpersonation = async () => {
    if (!currentSession) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          impersonationToken: currentSession.impersonationToken
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to end impersonation')
      }

      // Clean up local session
      localStorage.removeItem('admin_impersonation_session')
      setCurrentSession(null)
      setIsImpersonating(false)

      if (onImpersonationEnd) {
        onImpersonationEnd()
      }

      // Redirect back to admin panel
      window.location.href = '/admin'

    } catch (error) {
      console.error('Error ending impersonation:', error)
      setError(error instanceof Error ? error.message : 'Failed to end impersonation')
    } finally {
      setLoading(false)
    }
  }

  // If we're currently impersonating, show the end impersonation controls
  if (isImpersonating && currentSession) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-500/20 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-200">
            <div className="space-y-2">
              <div className="font-medium">
                🔄 Currently impersonating: {currentSession.targetUser.name} ({currentSession.targetUser.email})
              </div>
              <div className="text-sm text-orange-300">
                <Clock className="inline w-3 h-3 mr-1" />
                Session expires: {new Date(currentSession.expiresAt).toLocaleString()}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex space-x-2">
          <Button
            onClick={endImpersonation}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loading ? 'Ending...' : 'End Impersonation'}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Default impersonation start button
  return (
    <div className="space-y-4">
      <Button
        onClick={startImpersonation}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
      >
        <Eye className="w-4 h-4 mr-2" />
        {loading ? 'Starting...' : 'Login as User'}
      </Button>

      {error && (
        <Alert className="border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex items-center">
          <Shield className="w-3 h-3 mr-1" />
          Secure admin impersonation
        </div>
        <div>• 24-hour session limit</div>
        <div>• Full activity logging</div>
        <div>• Can be ended at any time</div>
      </div>
    </div>
  )
}

// Global impersonation status banner component
export function ImpersonationStatusBanner() {
  const [currentSession, setCurrentSession] = useState<ImpersonationSession | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkImpersonationStatus = () => {
      const storedSession = localStorage.getItem('admin_impersonation_session')
      if (storedSession) {
        try {
          const session: ImpersonationSession = JSON.parse(storedSession)
          const now = new Date()
          const expiresAt = new Date(session.expiresAt)
          
          if (expiresAt > now) {
            setCurrentSession(session)
            setIsVisible(true)
          } else {
            localStorage.removeItem('admin_impersonation_session')
            setCurrentSession(null)
            setIsVisible(false)
          }
        } catch (error) {
          console.error('Error parsing impersonation session:', error)
          localStorage.removeItem('admin_impersonation_session')
        }
      }
    }

    checkImpersonationStatus()
    
    // Check periodically for session expiry
    const interval = setInterval(checkImpersonationStatus, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])

  const endImpersonation = async () => {
    if (!currentSession) return

    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          impersonationToken: currentSession.impersonationToken
        })
      })

      localStorage.removeItem('admin_impersonation_session')
      setCurrentSession(null)
      setIsVisible(false)
      
      // Redirect back to admin panel
      window.location.href = '/admin'

    } catch (error) {
      console.error('Error ending impersonation:', error)
    }
  }

  if (!isVisible || !currentSession) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white px-4 py-2 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span className="font-medium">
            Admin Impersonation Active: {currentSession.targetUser.name} ({currentSession.targetUser.email})
          </span>
          <span className="text-orange-200 text-sm">
            Expires: {new Date(currentSession.expiresAt).toLocaleString()}
          </span>
        </div>
        <Button
          onClick={endImpersonation}
          size="sm"
          className="bg-orange-700 hover:bg-orange-800 text-white"
        >
          <LogOut className="w-4 h-4 mr-1" />
          End Session
        </Button>
      </div>
    </div>
  )
} 