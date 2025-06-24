import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Admin emails allowed to impersonate users
const ADMIN_EMAILS = ['ananthu9539@gmail.com']

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await currentUser()
    
    if (!adminUser || !adminUser.emailAddresses?.[0]) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmail = adminUser.emailAddresses[0].emailAddress
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 })
    }

    const { targetUserId } = await request.json()

    console.log('[IMPERSONATE] Received request body:', { targetUserId })

    if (!targetUserId) {
      return NextResponse.json({ 
        error: 'Target user ID is required',
        details: 'The targetUserId field must be provided and cannot be empty'
      }, { status: 400 })
    }

    // Verify the target user exists in our database
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('clerk_user_id, email, full_name')
      .eq('clerk_user_id', targetUserId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Create an impersonation session record
    const impersonationToken = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { error: sessionError } = await supabase
      .from('admin_impersonation_sessions')
      .insert({
        admin_user_id: adminUser.id,
        target_user_id: targetUserId,
        impersonation_token: impersonationToken,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        status: 'active'
      })

    if (sessionError) {
      console.error('Error creating impersonation session:', sessionError)
      return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 })
    }

    // Log the impersonation activity
    await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: adminUser.id,
        action: 'user_impersonation_started',
        target_user_id: targetUserId,
        details: {
          target_user_email: targetUser.email,
          target_user_name: targetUser.full_name,
          impersonation_token: impersonationToken
        },
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      impersonationToken,
      targetUser: {
        id: targetUserId,
        email: targetUser.email,
        name: targetUser.full_name
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('Error in impersonation API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // End impersonation session
    const adminUser = await currentUser()
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { impersonationToken } = await request.json()

    if (!impersonationToken) {
      return NextResponse.json({ error: 'Impersonation token is required' }, { status: 400 })
    }

    // End the impersonation session
    const { error: endSessionError } = await supabase
      .from('admin_impersonation_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('impersonation_token', impersonationToken)

    if (endSessionError) {
      console.error('Error ending impersonation session:', endSessionError)
    }

    // Log the end of impersonation
    await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: adminUser.id,
        action: 'user_impersonation_ended',
        details: {
          impersonation_token: impersonationToken
        },
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error ending impersonation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 