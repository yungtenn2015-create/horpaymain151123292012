-- ============================================================
-- Supabase Security Advisor: Function Search Path Mutable
-- รันใน Supabase SQL Editor (ครั้งเดียวต่อโปรเจกต์)
--
-- ตั้ง search_path ให้ฟังก์ชัน public เพื่อกัน search_path hijacking
-- ค่า public, pg_temp สอดคล้องกับฟังก์ชันที่มี SET อยู่แล้วใน migration.sql
-- เช่น is_trial_active, encrypt_id_card, decrypt_id_card และ helper ใน rls_policies.sql
-- ============================================================

ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

ALTER FUNCTION public.check_payment_total() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_payment_on_approve() SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_bill_amount_change() SET search_path = public, pg_temp;

ALTER FUNCTION public.check_plan_limit() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_plan_limit_on_update() SET search_path = public, pg_temp;

ALTER FUNCTION public.calc_utilities() SET search_path = public, pg_temp;
ALTER FUNCTION public.log_audit() SET search_path = public, pg_temp;

-- add_tenant มักมีหลาย overload (4 / 11 / 13 / 14 พารามิเตอร์ ฯลฯ)
-- ALTER แบบระบุ signature เดียวจะแก้แค่ตัวนั้น — Advisor เลยขึ้นซ้ำหลายแถว
DO $fix_add_tenant$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'add_tenant'
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.add_tenant(%s) SET search_path = public, pg_temp',
      pg_get_function_identity_arguments(r.oid)
    );
  END LOOP;
END;
$fix_add_tenant$;

-- Trigger อัปเดต updated_at (migration_v9_tenant_contracts.sql)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- ฟังก์ชันเหล่านี้ใน migration.sql / rls_policies.sql อาจมี SET อยู่แล้ว — รันซ้ำได้ไม่เสีย
ALTER FUNCTION public.is_trial_active(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.protect_users_privileged_columns() SET search_path = public, pg_temp;
ALTER FUNCTION public.encrypt_id_card(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.decrypt_id_card(bytea) SET search_path = public, pg_temp;

ALTER FUNCTION public.is_dorm_owner(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_room_owner(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_tenant_of_room(uuid) SET search_path = public, pg_temp;
