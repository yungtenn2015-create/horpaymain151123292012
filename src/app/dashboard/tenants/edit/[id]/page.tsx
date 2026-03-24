import { Suspense } from 'react'
import EditTenantClient from './EditTenantClient'

export const dynamic = 'force-dynamic'

export default function EditTenantPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
            </div>
        }>
            <EditTenantClient />
        </Suspense>
    )
}
