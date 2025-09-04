import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { corsHeaders } from '../_middleware'

export default async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return corsHeaders(new NextResponse(null, { status: 200 }))
  }

  // Extract slug/id from URL
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const slugOrId = pathParts[pathParts.length - 1]

  // GET /api/chapters/[slug] - Get single chapter by slug or ID
  if (req.method === 'GET') {
    try {
      let query = supabase.from('chapters').select('*')
      
      // Check if it's a numeric ID or slug
      if (/^\d+$/.test(slugOrId)) {
        query = query.eq('id', parseInt(slugOrId))
      } else {
        query = query.eq('slug', slugOrId)
      }

      const { data: chapter, error } = await query.single()

      if (error || !chapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
      }

      return corsHeaders(NextResponse.json(chapter))
    } catch (error) {
      console.error('Error fetching chapter:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // PUT /api/chapters/[id] - Update chapter (requires auth)
  if (req.method === 'PUT') {
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
      const updates = { ...body }
      
      // Generate slug if title is being updated
      if (updates.title && !updates.slug) {
        updates.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      }

      // Convert camelCase to snake_case for database fields
      const dbUpdates: any = {}
      Object.keys(updates).forEach(key => {
        switch(key) {
          case 'categoryId':
            dbUpdates.category_id = updates[key]
            break
          case 'chapterNumber':
            dbUpdates.chapter_number = updates[key]
            break
          case 'publishedAt':
            dbUpdates.published_at = updates[key]
            break
          case 'bookTitle':
            dbUpdates.book_title = updates[key]
            break
          case 'bookAuthor':
            dbUpdates.book_author = updates[key]
            break
          case 'keyTakeaways':
            dbUpdates.key_takeaways = updates[key]
            break
          case 'isBookSummary':
            dbUpdates.is_book_summary = updates[key]
            break
          case 'audioUrl':
            dbUpdates.audio_url = updates[key]
            break
          default:
            dbUpdates[key] = updates[key]
        }
      })

      dbUpdates.updated_at = new Date().toISOString()

      const { data: chapter, error } = await supabase
        .from('chapters')
        .update(dbUpdates)
        .eq('id', parseInt(slugOrId))
        .select()
        .single()

      if (error) {
        console.error('Error updating chapter:', error)
        return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 })
      }

      return corsHeaders(NextResponse.json(chapter))
    } catch (error) {
      console.error('Error in chapters PUT:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // DELETE /api/chapters/[id] - Delete chapter (requires auth)
  if (req.method === 'DELETE') {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', parseInt(slugOrId))

      if (error) {
        console.error('Error deleting chapter:', error)
        return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 })
      }

      return corsHeaders(NextResponse.json({ success: true }))
    } catch (error) {
      console.error('Error in chapters DELETE:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}