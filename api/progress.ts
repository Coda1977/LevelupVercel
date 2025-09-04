import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../lib/supabase'
import { corsHeaders } from './_middleware'

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

  // GET /api/progress - Get user's progress
  if (req.method === 'GET') {
    try {
      const { data: progress, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          chapter:chapters!inner(*)
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching progress:', error)
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
      }

      return corsHeaders(NextResponse.json(progress || []))
    } catch (error) {
      console.error('Error in progress GET:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}