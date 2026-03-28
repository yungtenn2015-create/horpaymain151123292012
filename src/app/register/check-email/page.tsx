'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CheckEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') ?? ''

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-8 py-10 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                        ✉️
                    </div>
                    <h1 className="text-xl font-bold text-white">เช็กอีเมลของคุณ</h1>
                    <p className="mt-2 text-sm text-white/85">เราส่งลิงก์ยืนยันไปแล้ว</p>
                </div>
                <div className="space-y-4 p-8 text-center">
                    {email ? (
                        <p className="text-sm text-gray-600">
                            เปิดอีเมลที่ <span className="font-bold text-gray-900">{email}</span> แล้วกดปุ่ม
                            <span className="font-bold text-emerald-600"> ยืนยันอีเมล </span>
                            เพื่อเปิดใช้งานบัญชี
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600">
                            เปิดอีเมลที่คุณใช้สมัคร แล้วกดลิงก์ยืนยันจาก HORPAY
                        </p>
                    )}
                    <p className="text-xs text-gray-400">
                        ไม่เจอจดหมาย? ลองดูโฟลเดอร์สแปมหรือขยะ
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="mt-2 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                    >
                        ไปหน้าเข้าสู่ระบบ
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function RegisterCheckEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">กำลังโหลด...</p>
                </div>
            }
        >
            <CheckEmailContent />
        </Suspense>
    )
}
