-- ============================================================
-- LINE Notification System Extension
-- Version 2 — เพิ่มเติม channel_id และปรับสถานะบิลรอตรวจสอบ
-- ============================================================

-- 1. เพิ่ม Column และปรับปรุงตารางเดิม
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS line_user_id TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- ปรับปรุงสถานะบิลให้รองรับ 'waiting_verify' (ใช้สำหรับ Phase 5 ตอนผู้เช่าอัปโหลดสลิปแล้ว)
-- ต้องลบ constraint เดิมก่อนแล้วสร้างใหม่เพื่อให้ระบุค่าเพิ่มได้
DO $$
BEGIN
    ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_status_check;
    ALTER TABLE public.bills ADD CONSTRAINT bills_status_check 
      CHECK (status IN ('unpaid', 'pending', 'paid', 'overdue', 'waiting_verify'));
EXCEPTION
    WHEN undefined_object THEN
        -- กรณีไม่มี constraint นี้อยู่แล้ว ให้ข้ามไป
END $$;

-- 2. TABLE: line_oa_configs
-- เก็บค่าคอนฟิก Messaging API แยกตามแต่ละหอพัก
CREATE TABLE IF NOT EXISTS public.line_oa_configs (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id        UUID          NOT NULL UNIQUE REFERENCES public.dorms(id) ON DELETE CASCADE,
  channel_id     TEXT          UNIQUE,       -- สำคัญ: ใช้สำหรับแยก Webhook ว่ามาจากหอไหน
  channel_secret TEXT          NOT NULL,
  access_token   TEXT          NOT NULL,
  owner_line_user_id TEXT,    -- [เพิ่ม] เก็บ LINE User ID ของเจ้าของหอพักเพื่อรับแจ้งเตือน
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 3. TABLE: line_link_tokens
CREATE TABLE IF NOT EXISTS public.line_link_tokens (
  token          TEXT          PRIMARY KEY,
  tenant_id      UUID          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expires_at     TIMESTAMPTZ   NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 4. TABLE: line_notification_logs
CREATE TABLE IF NOT EXISTS public.line_notification_logs (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id        UUID          REFERENCES public.dorms(id) ON DELETE SET NULL,
  receiver_id    TEXT          NOT NULL,
  message_type   TEXT          NOT NULL, -- 'text', 'flex', etc.
  status         TEXT          NOT NULL, -- 'sent', 'failed'
  error_message  TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.line_oa_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. line_oa_configs: เจ้าของจัดการได้
CREATE POLICY "line_oa_configs: เจ้าของจัดการได้"
  ON public.line_oa_configs FOR ALL
  USING (is_dorm_owner(dorm_id))
  WITH CHECK (is_dorm_owner(dorm_id));

-- 6. line_link_tokens: เจ้าของจัดการได้
CREATE POLICY "line_link_tokens: เจ้าของจัดการได้"
  ON public.line_link_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      JOIN public.rooms r ON r.id = t.room_id
      WHERE t.id = line_link_tokens.tenant_id
        AND is_dorm_owner(r.dorm_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants t
      JOIN public.rooms r ON r.id = t.room_id
      WHERE t.id = line_link_tokens.tenant_id
        AND is_dorm_owner(r.dorm_id)
    )
  );

-- 7. line_notification_logs: เจ้าของดู logs ของหอตัวเองได้
CREATE POLICY "line_notification_logs: เจ้าของตรวจดูได้"
  ON public.line_notification_logs FOR SELECT
  USING (is_dorm_owner(dorm_id));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_line_oa_configs_dorm ON public.line_oa_configs(dorm_id);
CREATE INDEX IF NOT EXISTS idx_line_oa_configs_channel ON public.line_oa_configs(channel_id);
CREATE INDEX IF NOT EXISTS idx_line_link_tokens_tenant ON public.line_link_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_line_notification_logs_dorm ON public.line_notification_logs(dorm_id);
CREATE INDEX IF NOT EXISTS idx_line_notification_logs_receiver ON public.line_notification_logs(receiver_id);
