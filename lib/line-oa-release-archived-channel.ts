import type { SupabaseClient } from '@supabase/supabase-js'

export type ReleaseArchivedChannelResult =
  | { ok: true; releasedCount: number }
  | { ok: false; code: 'ACTIVE_DORM_CONFLICT' | 'OTHER_OWNER_CONFLICT' | 'DB_ERROR'; message: string }

/**
 * ถ้ามี line_oa_configs อื่นที่ใช้ channel_id เดียวกัน:
 * - หอนั้นถูก soft-delete และเป็นเจ้าของคนเดียวกัน → ตั้ง channel_id = null เพื่อปล่อยให้หอปัจจุบันใช้
 * - หอนั้นยัง active → ชน (1 OA ต่อ 1 หอที่ใช้งาน)
 * - เป็นหอของคนอื่น → ชน
 */
export async function releaseArchivedDormChannelDuplicates(
  supabaseAdmin: SupabaseClient,
  currentUserId: string,
  currentDormId: string,
  channelId: string
): Promise<ReleaseArchivedChannelResult> {
  const { data: rows, error: selErr } = await supabaseAdmin
    .from('line_oa_configs')
    .select('dorm_id')
    .eq('channel_id', channelId)
    .neq('dorm_id', currentDormId)

  if (selErr) {
    return { ok: false, code: 'DB_ERROR', message: selErr.message }
  }
  if (!rows?.length) {
    return { ok: true, releasedCount: 0 }
  }

  let releasedCount = 0

  for (const row of rows) {
    const otherDormId = row.dorm_id as string
    const { data: otherDorm, error: dormErr } = await supabaseAdmin
      .from('dorms')
      .select('owner_id, deleted_at')
      .eq('id', otherDormId)
      .maybeSingle()

    if (dormErr) {
      return { ok: false, code: 'DB_ERROR', message: dormErr.message }
    }
    if (!otherDorm) {
      continue
    }

    if (otherDorm.owner_id !== currentUserId) {
      return {
        ok: false,
        code: 'OTHER_OWNER_CONFLICT',
        message: 'Channel ID นี้ถูกใช้กับหอพักของบัญชีอื่นในระบบแล้ว',
      }
    }

    if (otherDorm.deleted_at == null) {
      return {
        ok: false,
        code: 'ACTIVE_DORM_CONFLICT',
        message:
          'Channel ID นี้ถูกใช้กับหอพักอื่นที่ยังใช้งานอยู่แล้ว แต่ละ LINE OA ผูกได้ทีละหอพักเท่านั้น',
      }
    }

    const { error: updErr } = await supabaseAdmin
      .from('line_oa_configs')
      .update({
        channel_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('dorm_id', otherDormId)

    if (updErr) {
      return { ok: false, code: 'DB_ERROR', message: updErr.message }
    }
    releasedCount += 1
  }

  return { ok: true, releasedCount }
}
