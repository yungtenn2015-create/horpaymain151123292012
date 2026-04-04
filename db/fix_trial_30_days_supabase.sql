-- ============================================================
-- โปรเจกต์หลักใช้ trial 30 วัน — สำหรับ DB จริงให้รัน `migration_trial_30_days.sql` (ครบทุกอย่าง)
--
-- ไฟล์นี้ = ทางลัดเดิม: แค่ handle_new_user + UPDATE ย่อ trial เกิน 30 วันจากวันสมัคร
-- ถ้ายังไม่ได้แก้ check_plan_limit / default คอลัมน์ ให้ใช้ migration_trial_30_days.sql แทน
-- ============================================================

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

UPDATE public.users
SET trial_expires_at = created_at + INTERVAL '30 days'
WHERE plan_type = 'free'
  AND trial_expires_at > created_at + INTERVAL '30 days';
