-- ============================================================
-- SQL Migration: Add tenant_id to utilities
-- ============================================================

-- 1. เพิ่มคอลัมน์ tenant_id ในตาราง utilities
ALTER TABLE public.utilities ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. ย้ายข้อมูลเดิม (ถ้ามี) - พยายามผูกกับ active tenant ในห้องนั้น ณ ปัจจุบัน (Optional/Best effort)
DO $$
BEGIN
    UPDATE public.utilities u
    SET tenant_id = t.id
    FROM public.tenants t
    WHERE u.room_id = t.room_id 
    AND t.status = 'active'
    AND u.tenant_id IS NULL;
EXCEPTION WHEN others THEN
    -- ถ้าไม่มี active tenant ก็ข้ามไปก่อน (ไม่ให้ error ขวาง migration)
    NULL;
END $$;

-- 3. อัปเดต Unique Constraint ให้รวม tenant_id ด้วย
-- (เดิมคือ UNIQUE (room_id, meter_date) ใน migration.sql)
ALTER TABLE public.utilities DROP CONSTRAINT IF EXISTS utilities_room_id_meter_date_key;

-- สร้าง Constraint ใหม่ที่รวม tenant_id
-- เพื่อให้ 1 ห้อง สามารถมีบันทึกซ้ำเดือนเดิมได้ถ้าเปลี่ยนผู้เช่า (เช่น คนเก่าออก คนใหม่เข้า)
ALTER TABLE public.utilities ADD CONSTRAINT utilities_room_id_meter_date_tenant_id_unique UNIQUE (room_id, meter_date, tenant_id);
