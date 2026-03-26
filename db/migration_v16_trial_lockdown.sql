-- ============================================================
-- MIGRATION: v16 — Full Trial Lockdown (Read-Only on Expiry)
-- ============================================================
-- ยกระดับการตรวจสอบสถานะ Trial ให้ครอบคลุมทั้งระบบ
-- ทำให้ผู้ใช้ที่หมดช่วงทดลอง 30 วัน ไม่สามารถเพิ่มหรือแก้ไขข้อมูลในตารางสำคัญได้

-- 1. อัปเกรดฟังก์ชัน check_plan_limit ให้ฉลาดขึ้นและครอบคลุมทุก Table
CREATE OR REPLACE FUNCTION check_plan_limit()
RETURNS trigger AS $$
DECLARE
  v_owner_id   UUID;
BEGIN
  -- หา owner_id ตามความสัมพันธ์ของแต่ละตาราง
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

  -- Fallback: ถ้าหาจากความสัมพันธ์ไม่เจอ ให้ใช้ ID ของคนที่พยายามเขียนข้อมูล (ถ้ามี)
  IF v_owner_id IS NULL AND auth.uid() IS NOT NULL THEN
    v_owner_id := auth.uid();
  END IF;

  -- ตรวจสอบสถานะ Trial (is_trial_active อยู่ใน migration.sql หลัก)
  IF v_owner_id IS NOT NULL AND NOT is_trial_active(v_owner_id) THEN
    RAISE EXCEPTION 'trial_expired: Trial 30 วันหมดแล้ว — อัปเกรดเป็น Pro เพื่อใช้งานต่อ';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. สร้าง Trigger เพิ่มเติมสำหรับตารางที่ยังไม่มีการดัก
-- (Dorms และ Rooms มี Trigger เดิมอยู่แล้ว จะใช้ฟังก์ชันใหม่ที่อัปเกรดนี้ทันที)

-- Announcements
DROP TRIGGER IF EXISTS trg_check_announcement_trial ON announcements;
CREATE TRIGGER trg_check_announcement_trial
  BEFORE INSERT OR UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Tenants
DROP TRIGGER IF EXISTS trg_check_tenant_trial ON tenants;
CREATE TRIGGER trg_check_tenant_trial
  BEFORE INSERT OR UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Utilities
DROP TRIGGER IF EXISTS trg_check_utility_trial ON utilities;
CREATE TRIGGER trg_check_utility_trial
  BEFORE INSERT OR UPDATE ON utilities
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Bills
DROP TRIGGER IF EXISTS trg_check_bill_trial ON bills;
CREATE TRIGGER trg_check_bill_trial
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Payments
DROP TRIGGER IF EXISTS trg_check_payment_trial ON payments;
CREATE TRIGGER trg_check_payment_trial
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Maintenance
DROP TRIGGER IF EXISTS trg_check_maintenance_trial ON maintenance;
CREATE TRIGGER trg_check_maintenance_trial
  BEFORE INSERT OR UPDATE ON maintenance
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Settings
DROP TRIGGER IF EXISTS trg_check_settings_trial ON dorm_settings;
CREATE TRIGGER trg_check_settings_trial
  BEFORE INSERT OR UPDATE ON dorm_settings
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Contracts
DROP TRIGGER IF EXISTS trg_check_contract_trial ON lease_contracts;
CREATE TRIGGER trg_check_contract_trial
  BEFORE INSERT OR UPDATE ON lease_contracts
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Services
DROP TRIGGER IF EXISTS trg_check_services_trial ON dorm_services;
CREATE TRIGGER trg_check_services_trial
  BEFORE INSERT OR UPDATE ON dorm_services
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();
