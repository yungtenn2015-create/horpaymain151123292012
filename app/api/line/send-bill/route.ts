import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { billId } = await req.json();

    if (!billId) {
      return NextResponse.json({ error: 'billId is required' }, { status: 400 });
    }

    // 1. Fetch Bill Data with all relations
    const { data: bill, error: billError } = await supabaseAdmin
      .from('bills')
      .select(`
        *,
        rooms:room_id (room_number, dorm_id),
        tenants:tenant_id (name, line_user_id)
      `)
      .eq('id', billId)
      .single();

    if (billError || !bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    if (!bill.tenants?.line_user_id) {
       return NextResponse.json({ error: 'Tenant has no LINE linked' }, { status: 400 });
    }

    // 2. Fetch Dorm & LINE Config
    const { data: dormConfig } = await supabaseAdmin
      .from('line_oa_configs')
      .select('*')
      .eq('dorm_id', bill.rooms.dorm_id)
      .single();

    if (!dormConfig) {
      return NextResponse.json({ error: 'LINE OA not configured for this dorm' }, { status: 400 });
    }

    const { data: dorm } = await supabaseAdmin
      .from('dorms')
      .select('name')
      .eq('id', bill.rooms.dorm_id)
      .single();

    // 3. Construct Flex Message
    const flexMessage = createBillFlexMessage(bill, dorm?.name || 'หอพัก');

    // 4. Send via LINE Messaging API
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

    const result = await response.json();

    // 5. Log notification
    await supabaseAdmin.from('line_notification_logs').insert({
        dorm_id: bill.rooms.dorm_id,
        receiver_id: bill.tenants.line_user_id,
        message_type: 'flex',
        status: response.ok ? 'sent' : 'failed',
        error_message: response.ok ? null : JSON.stringify(result)
    });

    return NextResponse.json({ success: response.ok, result });
  } catch (error: any) {
    console.error('Send bill error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function createBillFlexMessage(bill: any, dormName: string) {
  const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?billId=${bill.id}`;
  const total = (bill.rent_amount || 0) + (bill.water_amount || 0) + (bill.electric_amount || 0) + (bill.other_amount || 0);
  
  // Format Month Year (Thai)
  const date = new Date(bill.billing_date);
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const monthStr = months[date.getMonth()];
  const yearStr = (date.getFullYear() + 543).toString().slice(-2);

  return {
    type: "flex",
    altText: `ใบแจ้งหนี้เดือน ${monthStr} ${yearStr} - ห้อง ${bill.rooms.room_number}`,
    contents: {
      type: "bubble",
      size: "flat",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "INVOICE",
            color: "#ffffff",
            weight: "bold",
            size: "sm",
            letterSpacing: "0.2em"
          },
          {
            type: "text",
            text: dormName,
            color: "#ffffff",
            size: "xl",
            weight: "bold",
            margin: "sm"
          },
          {
            type: "text",
            text: `ห้อง ${bill.rooms.room_number}`,
            color: "#ffffffcc",
            size: "sm",
            weight: "bold"
          }
        ],
        backgroundColor: "#059669",
        paddingAll: "25px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
                { type: "text", text: "ประจำเดือน", size: "sm", color: "#8c8c8c" },
                { type: "text", text: `${monthStr} 25${yearStr}`, size: "sm", color: "#111111", align: "end", weight: "bold" }
            ]
          },
          { type: "separator", margin: "xl" },
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
                  { type: "text", text: "ค่าเช่าห้อง", size: "sm", color: "#555555" },
                  { type: "text", text: `฿${bill.rent_amount.toLocaleString()}`, size: "sm", color: "#111111", align: "end", weight: "bold" }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ค่าน้ำประปา", size: "sm", color: "#555555" },
                  { type: "text", text: `฿${bill.water_amount.toLocaleString()}`, size: "sm", color: "#111111", align: "end", weight: "bold" }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ค่าไฟฟ้า", size: "sm", color: "#555555" },
                  { type: "text", text: `฿${bill.electric_amount.toLocaleString()}`, size: "sm", color: "#111111", align: "end", weight: "bold" }
                ]
              }
            ]
          },
          { type: "separator", margin: "xl" },
          {
            type: "box",
            layout: "horizontal",
            margin: "xl",
            contents: [
              { type: "text", text: "ยอดรวมทั้งสิ้น", weight: "bold", size: "lg", color: "#111111" },
              { type: "text", text: `฿${total.toLocaleString()}`, weight: "bold", size: "lg", align: "end", color: "#059669" }
            ]
          }
        ],
        paddingAll: "25px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "ดูรายละเอียด / จ่ายเงิน",
              uri: liffUrl
            },
            style: "primary",
            color: "#059669",
            height: "md"
          }
        ],
        paddingAll: "20px"
      },
      styles: {
        footer: {
          separator: true
        }
      }
    }
  };
}
