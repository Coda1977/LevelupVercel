import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../lib/supabase'
import { corsHeaders } from './_middleware'

export default async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return corsHeaders(new NextResponse(null, { status: 200 }))
  }

  // GET /api/chapters - Get all chapters or chapters by category
  if (req.method === 'GET') {
    try {
      const { searchParams } = new URL(req.url)
      const categoryId = searchParams.get('categoryId')
      
      let query = supabase
        .from('chapters')
        .select('*')

      // Filter by category if provided
      if (categoryId) {
        query = query.eq('category_id', parseInt(categoryId))
      }

      const { data: chapters, error } = await query.order('chapter_number')

      if (error) {
        console.error('Error fetching chapters:', error)
        return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 })
      }

      return corsHeaders(NextResponse.json(chapters))
    } catch (error) {
      console.error('Error in chapters GET:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // POST /api/chapters - Create new chapter (requires auth)
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
      const { 
        title, 
        content, 
        summary, 
        categoryId, 
        sortOrder,
        publishedAt,
        author,
        bookTitle,
        bookAuthor,
        keyTakeaways,
        isBookSummary
      } = body

      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      
      const { data: chapter, error } = await supabase
        .from('chapters')
        .insert([{
          slug,
          title,
          content,
          summary,
          category_id: parseInt(categoryId),
          chapter_number: sortOrder || 0,
          published_at: publishedAt || new Date().toISOString(),
          author,
          book_title: bookTitle,
          book_author: bookAuthor,
          key_takeaways: keyTakeaways,
          is_book_summary: isBookSummary || false
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating chapter:', error)
        return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 })
      }

      return corsHeaders(NextResponse.json(chapter))
    } catch (error) {
      console.error('Error in chapters POST:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // PUT /api/chapters/:id would be handled by a separate dynamic route file
  // DELETE /api/chapters/:id would be handled by a separate dynamic route file

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}