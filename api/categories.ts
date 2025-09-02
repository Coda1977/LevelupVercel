import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../lib/supabase'
import { corsHeaders } from './_middleware'

export default async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return corsHeaders(new NextResponse(null, { status: 200 }))
  }

  if (req.method === 'GET') {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')

      if (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
      }

      return corsHeaders(NextResponse.json(categories))
    } catch (error) {
      console.error('Error in categories GET:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  if (req.method === 'POST') {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const body = await req.json()
      const { title, description, sortOrder } = body

      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      const { data: category, error } = await supabase
        .from('categories')
        .insert([{
          slug,
          title,
          description,
          sort_order: sortOrder || 1
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating category:', error)
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
      }

      return corsHeaders(NextResponse.json(category))
    } catch (error) {
      console.error('Error in categories POST:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}