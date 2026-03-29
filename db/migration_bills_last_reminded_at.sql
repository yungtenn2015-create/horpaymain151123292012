-- Idempotency: overdue LINE reminder — ไม่ทวงซ้ำในวันเดียวกัน (เช็กในแอปจาก last_reminded_at + วัน Asia/Bangkok)
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.bills.last_reminded_at IS 'เวลาส่ง LINE ทวงบิลค้างชำระล่าสุด (ใช้กัน cron/ยิง API ซ้ำในวันเดียวกัน)';

CREATE INDEX IF NOT EXISTS idx_bills_last_reminded_at ON public.bills (last_reminded_at)
  WHERE last_reminded_at IS NOT NULL;
