-- ============================================================
-- รันใน Supabase → SQL Editor (ทีละบล็อกหรือทั้งไฟล์)
-- 1) ให้ user ใหม่ได้ trial 30 วัน (แก้ trigger ถ้าเคยเป็น 60 วัน)
-- 2) (ทางเลือก) ย่อ trial ของ user free ที่ DB ให้ยาวเกิน 30 วันจากวันสมัคร
-- ============================================================

-- ── ขั้นที่ 1: บังคับให้ signup ใหม่ได้ trial 30 วัน ─────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── ขั้นที่ 2 (ทางเลือก): แก้แถวเก่าที่ trial ยาวเกิน 30 วันจาก created_at ──
-- เฉพาะ plan free และเฉพาะเมื่อ trial_expires_at ช้ากว่า created_at + 30 วัน
-- (ไม่ยืด trial ที่สั้นกว่า 30 วันอยู่แล้ว)
UPDATE public.users
SET trial_expires_at = created_at + INTERVAL '30 days'
WHERE plan_type = 'free'
  AND trial_expires_at > created_at + INTERVAL '30 days';
