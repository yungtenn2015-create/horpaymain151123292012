-- ============================================================
-- Migration v10: Add Occupation and Address to Tenants
-- ============================================================

-- 1. Add Column to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Update add_tenant function to handle new fields
CREATE OR REPLACE FUNCTION public.add_tenant(
  p_room_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_id_card_number TEXT,
  p_car_registration TEXT DEFAULT NULL,
  p_motorcycle_registration TEXT DEFAULT NULL,
  p_emergency_contact TEXT DEFAULT NULL,
  p_rent_price NUMERIC DEFAULT 0,
  p_deposit_amount NUMERIC DEFAULT 0,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT NULL,
  p_occupation TEXT DEFAULT NULL, -- NEW
  p_address TEXT DEFAULT NULL      -- NEW
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encrypted_id_card BYTEA;
  v_tenant_id UUID;
BEGIN
  -- เข้ารหัสบัตร ปชช. (ถ้ามีส่งมา)
  -- Note: We are moving away from ID card storage for PDPA in the latest UI, but keeping crypto logic for compatibility
  IF p_id_card_number IS NOT NULL AND p_id_card_number != '' THEN
    v_encrypted_id_card := encrypt_id_card(p_id_card_number);
  END IF;

  -- 1. Insert ลงตาราง tenants
  INSERT INTO tenants (
    room_id, 
    name, 
    phone, 
    id_card_number, 
    car_registration, 
    motorcycle_registration, 
    emergency_contact, 
    status,
    occupation, -- NEW
    address     -- NEW
  )
  VALUES (
    p_room_id, 
    p_name, 
    p_phone, 
    v_encrypted_id_card, 
    p_car_registration, 
    p_motorcycle_registration, 
    p_emergency_contact, 
    'active',
    p_occupation, -- NEW
    p_address     -- NEW
  )
  RETURNING id INTO v_tenant_id;

  -- 2. บันทึกสัญญาเช่า (Lease Contract)
  INSERT INTO lease_contracts (
    tenant_id, 
    room_id, 
    start_date, 
    end_date, 
    rent_price, 
    deposit_amount, 
    status
  )
  VALUES (
    v_tenant_id, 
    p_room_id, 
    p_start_date, 
    p_end_date, 
    p_rent_price, 
    p_deposit_amount, 
    'active'
  );

  -- 3. Update สถานะห้องเป็น 'occupied' (มีผู้เช่าแล้ว)
  UPDATE rooms SET status = 'occupied' WHERE id = p_room_id;

  RETURN v_tenant_id;
END;
$$;
