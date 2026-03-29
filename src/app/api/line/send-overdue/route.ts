import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatMeterScheduleLine } from '@/lib/meter-schedule';

/** วันที่ปฏิทินใน Asia/Bangkok รูปแบบ yyyy-MM-dd */
function getBangkokCalendarYmd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** บวก/ลบวันตามปฏิทิน (ไม่ใช้ timezone เครื่อง) */
function addCalendarDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getBangkokHour(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  return parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
}

/** ทวงหลังวันครบกำหนดกี่วัน (วันนี้ไทย − N = due_date ที่ต้องดึง) */
const REMIND_DAYS_AFTER_DUE = 3;

/** เริ่มต้นวันที่ bangkokYmd ใน Asia/Bangkok สำหรับเทียบ last_reminded_at */
function bangkokDayStartIso(ymd: string): string {
  return `${ymd}T00:00:00+07:00`;
}

function isEligibleForReminderToday(
  lastRemindedAt: string | null | undefined,
  bangkokYmd: string
): boolean {
  if (lastRemindedAt == null || lastRemindedAt === '') return true;
  const start = new Date(bangkokDayStartIso(bangkokYmd));
  return new Date(lastRemindedAt) < start;
}

export async function GET(req: Request) {
  // We use GET so it can be easily triggered by a cron job URL call
  // Vercel Cron: ตั้ง CRON_SECRET ใน Project Env — ระบบจะส่ง Authorization: Bearer <CRON_SECRET>
  // Schedule: 01:00 UTC (= 08:00 Asia/Bangkok). Local: OVERDUE_REMINDER_BYPASS_TIME=1 ข้ามช่วงเวลา (ยังต้องมี CRON_SECRET ยกเว้น CRON_AUTH_BYPASS)
  const cronSecret = process.env.CRON_SECRET;
  const authBypass =
    process.env.CRON_AUTH_BYPASS === '1' || process.env.CRON_AUTH_BYPASS === 'true';
  if (!authBypass) {
    if (!cronSecret) {
      console.error('send-overdue: CRON_SECRET is not set');
      return NextResponse.json({ error: 'Server misconfiguration: CRON_SECRET' }, { status: 500 });
    }
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const now = new Date();
    const bangkokYmd = getBangkokCalendarYmd(now);
    const bangkokHour = getBangkokHour(now);
    const bypassTime =
      process.env.OVERDUE_REMINDER_BYPASS_TIME === '1' ||
      process.env.OVERDUE_REMINDER_BYPASS_TIME === 'true';

    if (!bypassTime && bangkokHour !== 8) {
      return NextResponse.json({
        skipped: true,
        reason: 'Overdue reminder runs only at 08:00–08:59 Asia/Bangkok',
        bangkokHour,
        bangkokDate: bangkokYmd,
      });
    }

    // due_date ที่ครบกำหนดแล้ว REMIND_DAYS_AFTER_DUE วัน (เทียบวันนี้ตามปฏิทินไทย)
    const dateStr = addCalendarDaysYmd(bangkokYmd, -REMIND_DAYS_AFTER_DUE);

    console.log(
      `Checking unpaid bills with due_date ${dateStr} (Bangkok today ${bangkokYmd}, remind ${REMIND_DAYS_AFTER_DUE} days after due)`
    );

    const { data: dueDateRows, error: billsError } = await supabaseAdmin
      .from('bills')
      .select(`
        *,
        rooms:room_id (room_number, dorm_id),
        tenants:tenant_id (name, line_user_id),
        utilities:utility_id(*)
      `)
      .eq('status', 'unpaid')
      .eq('due_date', dateStr);

    if (billsError) {
      console.error('Error fetching overdue bills:', billsError);
      return NextResponse.json({ error: billsError.message }, { status: 500 });
    }

    const overdueBills = (dueDateRows || []).filter((b) =>
      isEligibleForReminderToday(b.last_reminded_at, bangkokYmd)
    );

    if (overdueBills.length === 0) {
      return NextResponse.json({
        message:
          dueDateRows && dueDateRows.length > 0
            ? `No eligible bills (all already reminded today in Asia/Bangkok, or none matched)`
            : `No unpaid bills with due_date ${dateStr} (${REMIND_DAYS_AFTER_DUE} days before Bangkok today)`,
        dueDateMatched: dateStr,
        bangkokDate: bangkokYmd,
        matchedDueDateCount: dueDateRows?.length ?? 0,
        eligibleCount: 0,
      });
    }

    console.log(`Found ${overdueBills.length} overdue bills (eligible for reminder). Processing...`);

    const results: {
      billId: string;
      status: string;
      reason?: string;
      error?: string;
      lineResult?: unknown;
    }[] = [];

    for (const bill of overdueBills) {
      try {
        if (!bill.tenants?.line_user_id) {
          results.push({ billId: bill.id, status: 'skipped', reason: 'No LINE ID' });
          continue;
        }

        const dormId = bill.rooms?.dorm_id;
        if (dormId == null) {
          results.push({ billId: bill.id, status: 'skipped', reason: 'Missing room or dorm_id' });
          continue;
        }

        const [{ data: dorm }, { data: settings }, { data: dormConfig }] = await Promise.all([
          supabaseAdmin.from('dorms').select('name, contact_number').eq('id', dormId).single(),
          supabaseAdmin.from('dorm_settings').select('*').eq('dorm_id', dormId).maybeSingle(),
          supabaseAdmin.from('line_oa_configs').select('*').eq('dorm_id', dormId).maybeSingle(),
        ]);

        if (!dormConfig?.access_token) {
          results.push({
            billId: bill.id,
            status: 'skipped',
            reason: 'LINE OA not configured or missing access_token',
          });
          continue;
        }

        const dormSafe = dorm ?? { name: 'หอพัก' };
        const bankSettings = settings ?? null;

        const flexMessage = createOverdueFlexMessage(bill, dormSafe, bankSettings);
        if (!flexMessage) {
          results.push({
            billId: bill.id,
            status: 'skipped',
            reason: 'Total amount is zero or invalid (no LINE reminder sent)',
          });
          continue;
        }

        const response = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dormConfig.access_token}`
          },
          body: JSON.stringify({
            to: bill.tenants.line_user_id,
            messages: [flexMessage]
          })
        });

        let lineResult: unknown;
        try {
          lineResult = await response.json();
        } catch {
          lineResult = { parseError: true, status: response.status };
        }

        if (response.ok) {
          await supabaseAdmin
            .from('bills')
            .update({
              status: 'overdue',
              last_reminded_at: new Date().toISOString(),
            })
            .eq('id', bill.id);
        }

        await supabaseAdmin.from('line_notification_logs').insert({
          dorm_id: dormId,
          receiver_id: bill.tenants.line_user_id,
          message_type: 'overdue_flex',
          status: response.ok ? 'sent' : 'failed',
          error_message: response.ok ? null : JSON.stringify(lineResult)
        });

        results.push({
          billId: bill.id,
          status: response.ok ? 'sent' : 'failed',
          lineResult,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`send-overdue bill ${bill.id}:`, err);
        results.push({ billId: bill.id, status: 'error', error: message });
      }
    }

    return NextResponse.json({
      message: `Processed ${overdueBills.length} bills`,
      dueDateMatched: dateStr,
      bangkokDate: bangkokYmd,
      remindDaysAfterDue: REMIND_DAYS_AFTER_DUE,
      matchedDueDateCount: dueDateRows?.length ?? 0,
      eligibleCount: overdueBills.length,
      results,
    });

  } catch (error: any) {
    console.error('Send overdue error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function createOverdueFlexMessage(
  bill: any,
  dorm: { name?: string; contact_number?: string | null } | null,
  bankSettings: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  const rawTotal = Number(bill.total_amount);
  const totalAmount = Number.isFinite(rawTotal) ? rawTotal : 0;
  if (totalAmount <= 0) return null;

  const dormName = dorm?.name || 'หอพัก';

  const roomNumber = bill.rooms?.room_number || '-';

  const billingMonth = bill.billing_month ?
    new Date(bill.billing_month).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) :
    '-';

  const meterScheduleLine = formatMeterScheduleLine(
    bankSettings == null ? undefined : bankSettings.billing_day
  );

  return {
    type: "flex",
    altText: `⚠️ แจ้งเตือนเกินกำหนดชำระ - ห้อง ${roomNumber} (฿${totalAmount.toLocaleString()})`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#F59E0B", // Amber/Yellow for overdue
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "แจ้งเตือนเกินกำหนดชำระ ⚠️",
            color: "#FFFFFF",
            weight: "bold",
            size: "xl"
          },
          {
            type: "text",
            text: `ห้องพักเลขที่ ${roomNumber} | ${dormName}`,
            color: "#FEF3C7",
            size: "sm",
            margin: "sm"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "บิลค่าห้องของคุณเกินกำหนดชำระแล้วค่ะ",
            color: "#92400E",
            weight: "bold",
            size: "sm",
            wrap: true
          },
          {
            type: "separator",
            margin: "xl",
            color: "#F3F4F6"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ประจำเดือน", color: "#6B7280", size: "sm" },
                  { type: "text", text: billingMonth, color: "#111827", weight: "bold", size: "sm", align: "end" }
                ]
              },
              ...(meterScheduleLine
                ? [{
                  type: "text" as const,
                  text: meterScheduleLine,
                  color: "#6B7280",
                  size: "xs" as const,
                  margin: "xs" as const,
                  wrap: true
                }]
                : []),
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ยอดค้างชำระรวม", color: "#111827", weight: "bold", size: "md" },
                  { type: "text", text: `฿${totalAmount.toLocaleString()}`, color: "#D97706", weight: "bold", size: "lg", align: "end" }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            backgroundColor: "#F9FAFB",
            paddingAll: "16px",
            cornerRadius: "12px",
            contents: [
              {
                type: "text",
                text: "บัญชีโอนชำระเงิน",
                color: "#374151",
                weight: "bold",
                size: "sm"
              },
              {
                type: "text",
                text: `${bankSettings == null ? '-' : (bankSettings.bank_name as string) || '-'}`,
                color: "#111827",
                weight: "bold",
                size: "sm",
                margin: "sm"
              },
              {
                type: "text",
                text: `${bankSettings == null ? '-' : (bankSettings.bank_account_no as string) || '-'}`,
                color: "#D97706",
                weight: "bold",
                size: "lg",
                margin: "4px"
              },
              {
                type: "text",
                text: `${bankSettings == null ? dormName : (bankSettings.bank_account_name as string) || dormName}`,
                color: "#6B7280",
                size: "sm"
              }
            ]
          },
          {
            type: "text",
            text: "โอนแล้วส่งสลิปแจ้งในแชทนี้ได้เลยค่ะ",
            color: "#4B5563",
            size: "xs",
            align: "center",
            margin: "xl"
          },
          {
            type: "text",
            text: "ขออภัยหากท่านชำระค่าห้องแล้วค่ะ",
            color: "#9CA3AF",
            size: "xxs",
            align: "center",
            margin: "md",
            style: "italic"
          }
        ]
      }
    }
  };
}
