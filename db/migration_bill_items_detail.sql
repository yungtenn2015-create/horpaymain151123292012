-- Optional detail text per line (e.g. มิเตอร์ก่อน/หลัง สำหรับบิลปิดบัญชี)
-- Run in Supabase SQL Editor after migration_bill_items.sql

ALTER TABLE public.bill_items
  ADD COLUMN IF NOT EXISTS detail TEXT;
