import { Suspense } from 'react'
import AddTenantClient from './AddTenantClient'

export const dynamic = 'force-dynamic'

export default function AddTenantPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white min-h-[640px] rounded-[2.5rem] flex flex-col items-center justify-center gap-4 shadow-xl">
                    <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
                </div>
            </div>
        }>
            <AddTenantClient />
        </Suspense>
    )
}
