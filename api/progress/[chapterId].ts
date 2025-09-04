import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { corsHeaders } from '../_middleware'

export default async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return corsHeaders(new NextResponse(null, { status: 200 }))
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extract chapter ID from URL
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const chapterId = pathParts[pathParts.length - 1]

  if (!chapterId || !/^\d+$/.test(chapterId)) {
    return NextResponse.json({ error: 'Invalid chapter ID' }, { status: 400 })
  }

  // POST /api/progress/[chapterId] - Update user progress for a chapter
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const { completed } = body

      // Use upsert to handle both insert and update
      const { data: progress, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          chapter_id: parseInt(chapterId),
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,chapter_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating progress:', error)
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
      }

      return corsHeaders(NextResponse.json(progress))
    } catch (error) {
      console.error('Error in progress POST:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}