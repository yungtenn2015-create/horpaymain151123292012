import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { releaseArchivedDormChannelDuplicates } from '@/lib/line-oa-release-archived-channel'

function generate6DigitCode() {
  const n = crypto.randomInt(0, 1_000_000)
  return String(n).padStart(6, '0')
}

/**
 * เปลี่ยน LINE OA แบบปลอดภัย: ล้างการผูกผู้เช่า + รีเซ็ต owner + บันทึก credential ใหม่ + สร้าง owner code ใหม่
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
    const channelSecret = String(body?.channel_secret || '').trim()
    const lineAccessToken = String(body?.line_access_token || '').trim()

    if (!dormId || !accessToken) {
      return NextResponse.json({ success: false, error: 'Missing dorm_id or access_token' }, { status: 400 })
    }
    if (!channelId || !channelSecret || !lineAccessToken) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอก Bot User ID, Channel Secret และ Channel Access Token ให้ครบ' },
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

    const releaseResult = await releaseArchivedDormChannelDuplicates(
      supabaseAdmin,
      userId,
      dormId,
      channelId
    )
    if (!releaseResult.ok) {
      const status =
        releaseResult.code === 'ACTIVE_DORM_CONFLICT' || releaseResult.code === 'OTHER_OWNER_CONFLICT'
          ? 409
          : 500
      return NextResponse.json({ success: false, error: releaseResult.message }, { status })
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

    const code = generate6DigitCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const nowIso = new Date().toISOString()

    const configPayload = {
      channel_id: channelId,
      channel_secret: channelSecret,
      access_token: lineAccessToken,
      owner_line_user_id: null as string | null,
      owner_claim_code: code,
      owner_claim_expires_at: expiresAt,
      owner_claim_used_at: null as string | null,
      updated_at: nowIso,
    }

    const { data: existingCfg } = await supabaseAdmin
      .from('line_oa_configs')
      .select('id')
      .eq('dorm_id', dormId)
      .maybeSingle()

    if (existingCfg) {
      const { error: updErr } = await supabaseAdmin
        .from('line_oa_configs')
        .update(configPayload)
        .eq('dorm_id', dormId)

      if (updErr) {
        const msg = updErr.message || ''
        if (msg.includes('line_oa_configs_channel_id') || msg.includes('duplicate key')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Channel ID ซ้ำกับหอพักอื่นในระบบ (แต่ละ OA ใช้ได้ทีละหอพักเท่านั้น)',
            },
            { status: 409 }
          )
        }
        return NextResponse.json({ success: false, error: updErr.message }, { status: 500 })
      }
    } else {
      const { error: insErr } = await supabaseAdmin.from('line_oa_configs').insert({
        dorm_id: dormId,
        ...configPayload,
      })
      if (insErr) {
        const msg = insErr.message || ''
        if (msg.includes('line_oa_configs_channel_id') || msg.includes('duplicate key')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Channel ID ซ้ำกับหอพักอื่นในระบบ (แต่ละ OA ใช้ได้ทีละหอพักเท่านั้น)',
            },
            { status: 409 }
          )
        }
        return NextResponse.json({ success: false, error: insErr.message }, { status: 500 })
      }
    }

    // ล้างการผูกผู้เช่าหลังบันทึก config สำเร็จ — หลีกเลี่ยงกรณีล้างแล้วแต่บันทึก OA ไม่ผ่าน
    if (roomIds.length > 0) {
      const { error: tenantErr } = await supabaseAdmin
        .from('tenants')
        .update({ line_user_id: null })
        .in('room_id', roomIds)
      if (tenantErr) {
        return NextResponse.json(
          {
            success: false,
            error:
              tenantErr.message ||
              'บันทึก LINE แล้ว แต่ล้างการผูกผู้เช่าไม่สำเร็จ กรุณากดเปลี่ยน OA อีกครั้งหรือติดต่อผู้ดูแล',
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      code,
      expires_at: expiresAt,
      cleared_tenant_links: roomIds.length > 0,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
