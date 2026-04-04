-- ============================================================
-- MIGRATION: v18 — subscription_ends_at (Pro มีวันหมดรอบ) + is_trial_active
-- ============================================================
-- รันบน Supabase SQL Editor (DB ที่มี users อยู่แล้ว)
--
-- หลังรัน:
--   - Pro + subscription_ends_at = NULL → ใช้งานได้ไม่จำกัดวัน (แก้มือแบบเดิม)
--   - Pro + subscription_ends_at > now() → ใช้งานได้จนถึงวันนั้น
--   - Pro แต่ subscription_ends_at <= now() → ถูกล็อกเหมือนหมด trial
--   - free → ยังใช้ trial_expires_at ตามเดิม
--
-- ตัวอย่างอัปเกรดทดสอบ 30 วัน (เปลี่ยนอีเมล):
--   UPDATE public.users
--   SET plan_type = 'pro',
--       subscription_plan = 'monthly',
--       subscription_ends_at = now() + INTERVAL '30 days'
--   WHERE email = 'your-test@example.com';
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.users.subscription_ends_at IS
  'Pro: วันหมดรอบที่จ่ายแล้ว — NULL = Pro ไม่กำหนดวันหมด';

CREATE OR REPLACE FUNCTION is_trial_active(p_user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id
      AND (
        (
          plan_type = 'pro'
          AND (
            subscription_ends_at IS NULL
            OR subscription_ends_at > now()
          )
        )
        OR (
          plan_type = 'free'
          AND trial_expires_at > now()
        )
      )
  );
$$;
