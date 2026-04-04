-- ============================================================
-- MIGRATION: v19 — กันผู้ใช้ยกระดับสิทธิ์ผ่าน UPDATE users เอง
-- ============================================================
-- รันบน Supabase SQL Editor (DB ที่มี public.users อยู่แล้ว)
--
-- พฤติกรรม:
--   - JWT role = service_role → แก้ทุกคอลัมน์ได้ (API ฝั่ง server / webhook)
--   - JWT role = authenticated → แก้ได้แค่ name, phone (และคอลัมน์ที่ไม่ได้อยู่ในรายการห้าม)
--   - ไม่มี JWT / role อื่น (เช่น รันใน SQL Editor) → ไม่บล็อก (แก้มือ / maintenance)
--
-- คอลัมน์ที่ client ห้ามแตะ: plan_type, subscription_plan, subscription_ends_at,
--   trial_expires_at, role, email
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_users_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := COALESCE(NULLIF(trim(auth.jwt() ->> 'role'), ''), '');

  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF jwt_role <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan_type IS DISTINCT FROM OLD.plan_type
     OR NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     OR NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at
     OR NEW.trial_expires_at IS DISTINCT FROM OLD.trial_expires_at
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.email IS DISTINCT FROM OLD.email
  THEN
    RAISE EXCEPTION 'forbidden_privileged_user_update: แก้แผน สิทธิ์ อีเมล หรือช่วงทดลองได้เฉพาะระบบภายในเท่านั้น';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_users_privileged_columns ON public.users;
CREATE TRIGGER trg_protect_users_privileged_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_users_privileged_columns();
