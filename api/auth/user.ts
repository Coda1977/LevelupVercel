import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { corsHeaders } from '../_middleware'

export default async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return corsHeaders(new NextResponse(null, { status: 200 }))
  }

  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get additional user info from our users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error fetching user data:', userError)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }

  const responseData = {
    id: user.id,
    email: user.email,
    firstName: userData?.first_name || user.user_metadata?.first_name,
    lastName: userData?.last_name || user.user_metadata?.last_name,
    profileImageUrl: userData?.profile_image_url || user.user_metadata?.avatar_url,
    createdAt: userData?.created_at || user.created_at,
    updatedAt: userData?.updated_at || user.updated_at
  }

  return corsHeaders(NextResponse.json(responseData))
}