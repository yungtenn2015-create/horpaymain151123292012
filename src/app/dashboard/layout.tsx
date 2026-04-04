'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
    HomeIcon,
    Squares2X2Icon,
    DocumentTextIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline'
import {
    HomeIcon as HomeIconSolid,
    Squares2X2Icon as Squares2X2IconSolid,
    DocumentTextIcon as DocumentTextIconSolid,
    ChartBarIcon as ChartBarIconSolid
} from '@heroicons/react/24/solid'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentTab = searchParams.get('tab') || (pathname === '/dashboard' ? 'overview' : '')

    const navItems = [
        { id: 'overview', name: 'หน้าหลัก', icon: HomeIcon, solidIcon: HomeIconSolid, path: '/dashboard?tab=overview' },
        { id: 'stats', name: 'ภาพรวม', icon: ChartBarIcon, solidIcon: ChartBarIconSolid, path: '/dashboard?tab=stats' },
        { id: 'rooms', name: 'สถานะห้อง', icon: Squares2X2Icon, solidIcon: Squares2X2IconSolid, path: '/dashboard?tab=rooms' },
        { id: 'tenants', name: 'บันทึกสัญญา', icon: DocumentTextIcon, solidIcon: DocumentTextIconSolid, path: '/dashboard?tab=tenants' },
    ]

    const handleNavClick = (path: string) => {
        router.push(path)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const activeId = navItems.find(item => {
        if (item.id === 'overview' && pathname === '/dashboard' && (!searchParams.get('tab') || searchParams.get('tab') === 'overview')) return true
        if (currentTab === item.id) return true
        return false
    })?.id || (pathname.startsWith('/dashboard') ? 'overview' : '')

    return (
        <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-[#fcfdfd]">
            <main className="relative z-0 flex min-h-0 min-w-0 w-full max-w-none flex-1 flex-col overflow-x-hidden overflow-y-auto pb-dashboard-nav">
                {children}
            </main>

            <nav
                className="fixed inset-x-0 bottom-0 z-[100] box-border rounded-t-[2.5rem] border-t border-gray-100 bg-white pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] shadow-[0_-3px_16px_-4px_rgba(15,23,42,0.07)]"
                aria-label="เมนูหลัก"
            >
                <div className="mx-auto flex h-[92px] w-full max-w-lg items-center justify-around px-6">
                    {navItems.map((item) => {
                        const isActive = activeId === item.id
                        const Icon = isActive ? item.solidIcon : item.icon
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleNavClick(item.path)}
                                className={`flex flex-col items-center gap-2 transition-all duration-300 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isActive ? 'text-green-600' : 'text-slate-500'}`}
                            >
                                <div className={`rounded-2xl p-2.5 transition-all ${isActive ? 'bg-green-50 shadow-sm' : 'bg-transparent'}`}>
                                    <Icon className="h-7 w-7" />
                                </div>
                                <span className={`text-[12px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-90'}`}>
                                    {item.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
