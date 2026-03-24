import { Suspense } from 'react'
import RoomsClient from './RoomsClient'

export const dynamic = 'force-dynamic'

export default function ManageRoomsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        }>
            <RoomsClient />
        </Suspense>
    )
}
