import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * รับ redirect จากลิงก์ในอีเมล (ยืนยันสมัคร / รีเซ็ตรหัสผ่าน) แบบ PKCE
 * ต้องใส่ URL นี้ใน Supabase → Authentication → URL Configuration → Redirect URLs
 * เช่น https://horpay.app/auth/callback และ http://localhost:3000/auth/callback
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    let next = searchParams.get('next') ?? '/dashboard'

    if (!next.startsWith('/') || next.startsWith('//')) {
        next = '/dashboard'
    }

    if (code) {
        const supabase = await createServerSupabase()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
