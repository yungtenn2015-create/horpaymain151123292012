-- ============================================================
-- Trial 30 วัน — รันบน Supabase SQL Editor (DB ที่มีข้อมูลอยู่แล้ว)
--
-- ทำอะไรบ้าง:
--   1) default คอลัมน์ users.trial_expires_at → signup ใหม่ได้ 30 วัน
--   2) handle_new_user → now() + 30 days
--   3) check_plan_limit (แบบ v16) + check_plan_limit_on_update → ข้อความ error 30 วัน
--   4) user free ที่ trial ยาวเกิน created_at + 30 วัน → ย่อกลับเป็น created_at + 30 วัน
--      (ไม่ยืดคนที่ trial สั้นกว่า 30 วันจากวันสมัครอยู่แล้ว)
--
-- หมายเหตุ: เคยรัน trial 60 วันมาก่อน — รันไฟล์นี้ครั้งเดียวเพื่อกลับนโยบายเป็น 30 วัน
-- ============================================================

ALTER TABLE public.users
  ALTER COLUMN trial_expires_at SET DEFAULT (now() + INTERVAL '30 days');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role, plan_type, trial_expires_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'owner'),
    'free',
    now() + INTERVAL '30 days'
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION check_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id   UUID;
BEGIN
  IF TG_TABLE_NAME = 'dorms' THEN
    v_owner_id := NEW.owner_id;
  ELSIF TG_TABLE_NAME IN ('announcements', 'dorm_settings', 'dorm_services', 'rooms') THEN
    SELECT d.owner_id INTO v_owner_id FROM dorms d WHERE d.id = NEW.dorm_id;
  ELSIF TG_TABLE_NAME IN ('tenants', 'lease_contracts', 'utilities', 'bills', 'maintenance') THEN
    SELECT d.owner_id INTO v_owner_id FROM dorms d
    JOIN rooms r ON r.dorm_id = d.id
    WHERE r.id = NEW.room_id;
  ELSIF TG_TABLE_NAME = 'payments' THEN
    SELECT d.owner_id INTO v_owner_id FROM dorms d
    JOIN rooms r ON r.dorm_id = d.id
    JOIN bills b ON b.room_id = r.id
    WHERE b.id = NEW.bill_id;
  END IF;

  IF v_owner_id IS NULL AND auth.uid() IS NOT NULL THEN
    v_owner_id := auth.uid();
  END IF;

  IF v_owner_id IS NOT NULL AND NOT is_trial_active(v_owner_id) THEN
    RAISE EXCEPTION 'trial_expired: Trial 30 วันหมดแล้ว — อัปเกรดเป็น Pro เพื่อใช้งานต่อ';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION check_plan_limit_on_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF NEW.dorm_id IS DISTINCT FROM OLD.dorm_id THEN
    SELECT d.owner_id INTO v_owner_id FROM dorms d WHERE d.id = NEW.dorm_id;
    IF NOT is_trial_active(v_owner_id) THEN
      RAISE EXCEPTION 'trial_expired: Trial 30 วันหมดแล้ว — อัปเกรดเป็น Pro เพื่อย้ายห้อง';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.users
SET trial_expires_at = created_at + INTERVAL '30 days'
WHERE plan_type = 'free'
  AND trial_expires_at > created_at + INTERVAL '30 days';
