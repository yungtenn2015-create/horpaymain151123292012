import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { releaseArchivedDormChannelDuplicates } from '@/lib/line-oa-release-archived-channel'

/**
 * ปล่อย channel_id จากหอที่ soft-delete ของ user เดียวกัน เพื่อให้นำ OA กลับมาใช้กับหอที่ active ได้
 */
export async function POST(req: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key') {
    return NextResponse.json(
      { success: false, error: 'ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ในไฟล์ .env.local' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  try {
    const body = await req.json().catch(() => ({}))
    const dormId = String(body?.dorm_id || '')
    const accessToken = String(body?.access_token || '')
    const channelId = String(body?.channel_id || '').trim()

    if (!dormId || !accessToken || !channelId) {
      return NextResponse.json(
        { success: false, error: 'Missing dorm_id, access_token หรือ channel_id' },
        { status: 400 }
      )
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken)
    if (userErr || !userData?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = userData.user.id

    const { data: dorm, error: dormErr } = await supabaseAdmin
      .from('dorms')
      .select('id, owner_id')
      .eq('id', dormId)
      .maybeSingle()

    if (dormErr) {
      return NextResponse.json({ success: false, error: dormErr.message }, { status: 500 })
    }
    if (!dorm || dorm.owner_id !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const result = await releaseArchivedDormChannelDuplicates(supabaseAdmin, userId, dormId, channelId)

    if (!result.ok) {
      const status =
        result.code === 'ACTIVE_DORM_CONFLICT' || result.code === 'OTHER_OWNER_CONFLICT' ? 409 : 500
      return NextResponse.json({ success: false, error: result.message }, { status })
    }

    return NextResponse.json({ success: true, released_count: result.releasedCount })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
