-- migration_v9_tenant_contracts.sql

-- 1. สร้างฟังก์ชันสำหรับอัปเดตวันที่ (ถ้ายังไม่มี)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. สร้างตารางบันทึกสัญญา (Tenant Contracts)
CREATE TABLE IF NOT EXISTS public.tenant_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dorm_id UUID NOT NULL REFERENCES public.dorms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    emergency_contact TEXT,
    occupation TEXT,
    car_registration TEXT,
    motorcycle_registration TEXT,
    address TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    deposit_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'moved_in', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. เปิดใช้งาน RLS (Row Level Security)
ALTER TABLE public.tenant_contracts ENABLE ROW LEVEL SECURITY;

-- 4. เพิ่มนโยบายความปลอดภัย (RLS Policies)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tenant_contracts' AND policyname = 'Users can manage their own dorm''s contracts'
    ) THEN
        CREATE POLICY "Users can manage their own dorm's contracts" 
        ON public.tenant_contracts
        FOR ALL
        USING (
            dorm_id IN (
                SELECT id FROM public.dorms WHERE owner_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 5. ตั้งค่า Trigger สำหรับอัปเดตวันที่อัตโนมัติ (Updated At)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenant_contracts_updated_at') THEN
        CREATE TRIGGER update_tenant_contracts_updated_at
            BEFORE UPDATE ON public.tenant_contracts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
