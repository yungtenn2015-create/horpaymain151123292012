import { Suspense } from 'react'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        }>
            <SettingsClient />
        </Suspense>
    )
}
