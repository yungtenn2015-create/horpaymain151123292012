import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * ยกเลิกการเชื่อมต่อ LINE OA ของหอนี้ (ปล่อย channel_id)
 * - ลบแถว line_oa_configs ของ dorm นี้
 * - ล้าง tenants.line_user_id ทุกห้องของหอนี้ (กันค้างสถานะผูก)
 */
export async function POST(req: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key') {
    return NextResponse.json(
      { success: false, error: 'ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ในไฟล์ .env.local' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)

  try {
    const body = await req.json().catch(() => ({}))
    const dormId = String(body?.dorm_id || '')
    const accessToken = String(body?.access_token || '')

    if (!dormId || !accessToken) {
      return NextResponse.json({ success: false, error: 'Missing dorm_id or access_token' }, { status: 400 })
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

    const { data: rooms, error: roomsErr } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('dorm_id', dormId)
      .is('deleted_at', null)

    if (roomsErr) {
      return NextResponse.json({ success: false, error: roomsErr.message }, { status: 500 })
    }

    const roomIds = (rooms || []).map((r) => r.id).filter(Boolean)
    if (roomIds.length > 0) {
      const { error: tenantErr } = await supabaseAdmin
        .from('tenants')
        .update({ line_user_id: null })
        .in('room_id', roomIds)
      if (tenantErr) {
        return NextResponse.json(
          { success: false, error: tenantErr.message || 'ล้างการผูกผู้เช่าไม่สำเร็จ' },
          { status: 500 }
        )
      }
    }

    const { error: delErr } = await supabaseAdmin.from('line_oa_configs').delete().eq('dorm_id', dormId)
    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cleared_tenant_links: roomIds.length > 0 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

