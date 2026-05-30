import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3001'
const AGENT_SECRET_KEY = process.env.AGENT_SECRET_KEY || ''

// Supabase server-side untuk verifikasi ownership
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper: forward request ke agent dengan secret key
async function forwardToAgent(path: string, method: string, body?: object) {
  const res = await fetch(`${AGENT_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-agent-secret': AGENT_SECRET_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  return res
}

// Helper: verifikasi bahwa user yang login adalah pemilik businessId
async function verifyOwnership(businessId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', userId)
    .single()
  return !!data
}

// ─── GET /api/agent-proxy?path=...&businessId=... ────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    const businessId = searchParams.get('businessId')

    if (!path || !businessId) {
      return NextResponse.json({ error: 'path dan businessId wajib diisi' }, { status: 400 })
    }

    // Verifikasi session user dari cookie Supabase
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verifikasi ownership
    const isOwner = await verifyOwnership(businessId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: bukan pemilik bisnis ini' }, { status: 403 })
    }

    // Forward ke agent
    const agentRes = await forwardToAgent(`${path}/${businessId}`, 'GET')
    const data = await agentRes.json()
    return NextResponse.json(data, { status: agentRes.status })
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy error', message: err.message }, { status: 500 })
  }
}

// ─── POST /api/agent-proxy?path=...&businessId=... ───────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    const businessId = searchParams.get('businessId')

    if (!path || !businessId) {
      return NextResponse.json({ error: 'path dan businessId wajib diisi' }, { status: 400 })
    }

    // Verifikasi session user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verifikasi ownership
    const isOwner = await verifyOwnership(businessId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: bukan pemilik bisnis ini' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))

    // Forward ke agent
    const agentRes = await forwardToAgent(`${path}/${businessId}`, 'POST', body)
    const data = await agentRes.json()
    return NextResponse.json(data, { status: agentRes.status })
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy error', message: err.message }, { status: 500 })
  }
}
