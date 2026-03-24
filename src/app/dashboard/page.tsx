import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white min-h-[640px] rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
                    <p className="text-green-600 font-bold animate-pulse text-sm">กำลังเตรียมข้อมูล...</p>
                </div>
            </div>
        }>
            <DashboardClient />
        </Suspense>
    )
}
