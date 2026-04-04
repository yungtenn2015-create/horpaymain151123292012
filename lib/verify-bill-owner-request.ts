import type { SupabaseClient } from '@supabase/supabase-js'

export type VerifyBillOwnerResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; body: { error: string } }

/**
 * ตรวจว่า Authorization: Bearer <access_token> เป็นของ user ที่เป็น owner ของหอที่บิลสังกัด
 * ใช้กับ API ที่ยิง service role แต่ต้องจำกัดเฉพาะเจ้าของหอเท่านั้น
 */
export async function verifyBillOwnerFromRequest(
  req: Request,
  billId: string,
  supabaseAdmin: SupabaseClient
): Promise<VerifyBillOwnerResult> {
  const raw = req.headers.get('authorization')?.trim() ?? ''
  const m = /^Bearer\s+(\S+)/i.exec(raw)
  const accessToken = m?.[1]
  if (!accessToken) {
    return { ok: false, status: 401, body: { error: 'ต้องส่ง Authorization: Bearer <access_token>' } }
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken)
  if (userErr || !userData?.user) {
    return { ok: false, status: 401, body: { error: 'เซสชันไม่ถูกต้องหรือหมดอายุ' } }
  }

  const userId = userData.user.id

  const { data: bill, error: billError } = await supabaseAdmin
    .from('bills')
    .select('room_id, rooms:room_id ( dorm_id )')
    .eq('id', billId)
    .maybeSingle()

  if (billError || !bill) {
    return { ok: false, status: 404, body: { error: 'Bill not found' } }
  }

  const dormId = (bill as { rooms?: { dorm_id?: string } | null }).rooms?.dorm_id
  if (!dormId) {
    return { ok: false, status: 404, body: { error: 'Bill not found' } }
  }

  const { data: dorm, error: dormErr } = await supabaseAdmin
    .from('dorms')
    .select('owner_id')
    .eq('id', dormId)
    .maybeSingle()

  if (dormErr || !dorm) {
    return { ok: false, status: 404, body: { error: 'Dorm not found' } }
  }

  if (dorm.owner_id !== userId) {
    return { ok: false, status: 403, body: { error: 'Forbidden' } }
  }

  return { ok: true, userId }
}
