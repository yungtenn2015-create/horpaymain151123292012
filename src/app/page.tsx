'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function Home() {
    const router = useRouter()
    
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.push('/dashboard')
            } else {
                router.push('/login')
            }
        }
        checkAuth()
    }, [router])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white min-h-[640px] rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
                <p className="text-green-600 font-bold animate-pulse text-sm">กำลังพาคุณเข้าสู่ระบบ...</p>
            </div>
        </div>
    )
}
