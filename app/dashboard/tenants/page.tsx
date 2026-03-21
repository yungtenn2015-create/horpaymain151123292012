'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

import {
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
    PhoneIcon,
    BuildingOfficeIcon,
    CalendarDaysIcon,
    ChevronRightIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'

interface Tenant {
    id: string;
    name: string;
    phone: string | null;
    status: string;
    created_at: string;
    room_id: string;
    rooms: {
        room_number: string;
        floor: string;
    };
}

export default function TenantsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const supabase = createClient()
        
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Fetch tenants with room info
            const { data, error } = await supabase
                .from('tenants')
                .select(`
                    *,
                    rooms (
                        room_number,
                        floor
                    )
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTenants(data as any[] || [])
        } catch (err: any) {
            setErrorMsg(err.message || 'ไม่สามารถโหลดข้อมูลผู้เช่าได้')
        } finally {
            setLoading(false)
        }
    }

    const filteredTenants = tenants.filter(t => {
        const query = searchQuery.toLowerCase()
        return (
            t.name.toLowerCase().includes(query) ||
            t.rooms.room_number.toLowerCase().includes(query)
        )
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex sm:items-center sm:justify-center sm:py-8 font-sans text-gray-800">
            <div className="w-full sm:max-w-lg bg-white min-h-screen sm:min-h-[850px] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative">
                
                {/* ── Fixed Header ── */}
                <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
                    <div className="px-6 py-4 sm:py-6">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => router.push('/dashboard')}
                                    className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 transition-all active:scale-95"
                                >
                                    <ArrowLeftIcon className="w-5 h-5 stroke-[2.5]" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-black text-gray-800 tracking-tight">ข้อมูลผู้เช่า</h1>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">รายชื่อที่กำลังพักอยู่</p>
                                </div>
                            </div>
                            <div className="bg-green-50 px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-green-700 uppercase">{tenants.length} ราย</span>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className={`h-5 w-5 transition-colors duration-300 ${searchQuery ? 'text-green-500' : 'text-gray-400'}`} />
                            </div>
                            <input
                                type="text"
                                placeholder="ค้นหา ชื่อ หรือ เลขห้อง..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-2xl transition-all font-bold text-sm outline-none shadow-sm hover:bg-gray-100/50"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                        <XMarkIcon className="h-4 w-4 stroke-[3]" />
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-20">
                    {errorMsg && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-3xl text-red-600 text-xs font-bold font-sans">
                            {errorMsg}
                        </div>
                    )}

                    {filteredTenants.length > 0 ? (
                        filteredTenants.map((tenant) => (
                            <div 
                                key={tenant.id}
                                className="bg-white p-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 flex items-center justify-between group hover:border-green-100 hover:shadow-xl hover:shadow-green-50/50 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Room Number Icon */}
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 shadow-sm group-hover:bg-green-50 group-hover:border-green-100 transition-colors shrink-0">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">ห้อง</span>
                                        <span className="text-lg font-black text-gray-800 leading-none group-hover:text-green-600 transition-colors">{tenant.rooms.room_number}</span>
                                    </div>

                                    <div className="space-y-0.5">
                                        <h3 className="text-sm font-black text-gray-800 tracking-tight leading-tight">{tenant.name}</h3>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <PhoneIcon className="w-3 h-3" />
                                                <span className="text-[11px] font-bold tracking-wide">{tenant.phone || 'ไม่ระบุ'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <CalendarDaysIcon className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">พักตั้งแต่วันที่ {new Date(tenant.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 group-hover:bg-green-600 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                                    <ChevronRightIcon className="w-5 h-5 stroke-[3]" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-700">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center border border-dashed border-gray-200">
                                <MagnifyingGlassIcon className="w-10 h-10 text-gray-200" />
                            </div>
                            <div>
                                <p className="text-gray-400 font-black">ไม่พบข้อมูลผู้เช่า</p>
                                <p className="text-gray-300 text-[10px] font-bold">ลองพิมพ์ชื่อตัวย่อ หรือเลขห้องดูนะครับ</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
