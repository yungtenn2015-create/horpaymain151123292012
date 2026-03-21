'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { 
    ChevronLeftIcon,
    ChevronRightIcon,
    BanknotesIcon, 
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    PrinterIcon,
    ShareIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline'

interface Room {
    id: string;
    room_number: string;
    status: 'available' | 'occupied';
    floor: number;
    base_price: number;
}

export default function BillingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [dormName, setDormName] = useState('หอพักของคุณ')
    const [billingData, setBillingData] = useState<any[]>([])
    const [selectedDate, setSelectedDate] = useState(new Date())

    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]

    const nextMonth = () => {
        const next = new Date(selectedDate)
        next.setMonth(next.getMonth() + 1)
        setSelectedDate(next)
    }

    const prevMonth = () => {
        const prev = new Date(selectedDate)
        prev.setMonth(prev.getMonth() - 1)
        setSelectedDate(prev)
    }

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const supabase = createClient()

            // 1. Get Dorm
            const { data: dorms } = await supabase
                .from('dorms')
                .select('*')
                .limit(1)
            
            if (dorms && dorms.length > 0) {
                setDormName(dorms[0].name)
                
                // 2. Get Rooms
                const { data: roomsData } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('dorm_id', dorms[0].id)
                    .is('deleted_at', null)
                    .order('room_number', { ascending: true })

                if (roomsData) {
                    // Simulate billing data for demo
                    // Some rooms randomly don't have meter data to demonstrate validation
                    const mockBilling = roomsData.map(room => {
                        const hasMeters = room.room_number !== '102' // Force room 102 to have no meters for demo
                        return {
                            roomId: room.id,
                            roomNumber: room.room_number,
                            rent: room.base_price,
                            water: hasMeters ? Math.floor(Math.random() * 200) + 100 : 0,
                            electricity: hasMeters ? Math.floor(Math.random() * 1000) + 500 : 0,
                            others: 0,
                            hasMeters: hasMeters,
                            status: room.status === 'occupied' ? (hasMeters ? (Math.random() > 0.5 ? 'ready' : 'issued') : 'pending_meter') : 'vacant'
                        }
                    })
                    setBillingData(mockBilling)
                }
            }
            setLoading(false)
        }

        fetchData()
    }, [selectedDate]) // Re-fetch or re-simulate if date changes

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        )
    }

    const readyToIssueCount = billingData.filter(d => d.status === 'ready').length

    return (
        <div className="min-h-screen bg-gray-50 sm:flex sm:items-center sm:justify-center font-sans">
            <div className="w-full sm:max-w-lg bg-white min-h-screen sm:min-h-[850px] overflow-hidden flex flex-col relative pb-32 border-gray-100 sm:border sm:rounded-[2.5rem] sm:shadow-2xl">
                
                {/* ── HEADER ── */}
                <header className="px-6 pt-10 pb-6 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <button 
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
                        >
                            <ChevronLeftIcon className="w-6 h-6 stroke-[2.5]" />
                        </button>
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">สรุปยอดบิลค่าเช่า</h1>
                        <button className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all">
                            <ArrowPathIcon className="w-5 h-5 stroke-[2.5]" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between bg-emerald-50 rounded-2xl p-4">
                        <button 
                            onClick={prevMonth}
                            className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                            <ChevronLeftIcon className="w-5 h-5 stroke-[3]" />
                        </button>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">รอบบิลประจำเดือน</p>
                            <p className="text-lg font-black text-emerald-900 leading-none">
                                {thaiMonths[selectedDate.getMonth()]} {selectedDate.getFullYear() + 543}
                            </p>
                        </div>
                        <button 
                            onClick={nextMonth}
                            className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                            <ChevronRightIcon className="w-5 h-5 stroke-[3]" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 px-6 py-6 pb-20 space-y-4">
                    {billingData.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                             <p className="text-gray-400 font-bold">ยังไม่มีข้อมูลสำหรับการออกบิล</p>
                        </div>
                    ) : (
                        billingData.map((item) => {
                            const total = item.rent + item.water + item.electricity + item.others
                            const isVacant = item.status === 'vacant'
                            const isIssued = item.status === 'issued'
                            const noMeters = !item.hasMeters && !isVacant
                            
                            return (
                                <div 
                                    key={item.roomId} 
                                    className={`p-5 rounded-[2.5rem] border-2 transition-all ${
                                        isVacant ? 'bg-gray-50 border-gray-100 opacity-60' : 
                                        isIssued ? 'bg-white border-green-100' : 
                                        noMeters ? 'bg-orange-50/30 border-orange-200' :
                                        'bg-white border-emerald-500 shadow-xl shadow-emerald-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm ${
                                                isVacant ? 'bg-gray-200 text-white' : 
                                                noMeters ? 'bg-orange-400 text-white' : 'bg-emerald-500 text-white'
                                            }`}>
                                                {item.roomNumber}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 italic">ชั้น {Math.floor(parseInt(item.roomNumber)/100) || '-'}</p>
                                                <div className="flex items-center gap-1.5">
                                                    {isVacant ? (
                                                        <span className="text-xs font-bold text-gray-500">ห้องว่าง</span>
                                                    ) : noMeters ? (
                                                        <div className="flex items-center gap-1 text-orange-600">
                                                            <ExclamationCircleIcon className="w-4 h-4" />
                                                            <span className="text-xs font-black">ยังไม่จดมิเตอร์</span>
                                                        </div>
                                                    ) : isIssued ? (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                            <span className="text-xs font-black">ออกบิลแล้ว</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-emerald-600">
                                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                            <span className="text-xs font-black uppercase">พร้อมออกบิล</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {!isVacant && !noMeters && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">ยอดรวมสุทธิ</p>
                                                <p className="text-[22px] font-black text-gray-800 leading-none">฿{total.toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>

                                    {!isVacant && (
                                        <div className={`rounded-3xl p-5 grid grid-cols-2 gap-y-3 mb-4 border ${
                                            noMeters ? 'bg-white/50 border-orange-100' : 'bg-gray-50 border-gray-100'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                                <p className="text-xs text-gray-500 font-bold">ค่าเช่า</p>
                                            </div>
                                            <p className="text-xs text-right font-black text-gray-800">฿{item.rent.toLocaleString()}</p>
                                            
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${noMeters ? 'bg-gray-300' : 'bg-blue-400'}`} />
                                                <p className="text-xs text-gray-500 font-bold">ค่าน้ำ</p>
                                            </div>
                                            <p className={`text-xs text-right font-black ${noMeters ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                                                {noMeters ? 'ยังไม่ระบุ' : `฿${item.water.toLocaleString()}`}
                                            </p>
                                            
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${noMeters ? 'bg-gray-300' : 'bg-yellow-500'}`} />
                                                <p className="text-xs text-gray-500 font-bold">ค่าไฟ</p>
                                            </div>
                                            <p className={`text-xs text-right font-black ${noMeters ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                                                {noMeters ? 'ยังไม่ระบุ' : `฿${item.electricity.toLocaleString()}`}
                                            </p>
                                        </div>
                                    )}

                                    {!isVacant && (
                                        <div className="flex gap-2">
                                            {noMeters ? (
                                                <button 
                                                    onClick={() => router.push('/dashboard/meter')}
                                                    className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-100"
                                                >
                                                    <Squares2X2Icon className="w-4 h-4" />
                                                    ไปหน้าจดมิเตอร์
                                                </button>
                                            ) : isIssued ? (
                                                <>
                                                    <button 
                                                        onClick={() => router.push(`/dashboard/billing/receipt/${item.roomNumber}`)}
                                                        className="flex-1 h-12 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
                                                    >
                                                        <PrinterIcon className="w-4 h-4" />
                                                        พิมพ์ใบเสร็จ
                                                    </button>
                                                    <button 
                                                        onClick={() => router.push(`/dashboard/billing/receipt/${item.roomNumber}`)}
                                                        className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100"
                                                    >
                                                        <ShareIcon className="w-4 h-4 stroke-[2.5]" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95">
                                                    <BanknotesIcon className="w-4 h-4" />
                                                    ยืนยันออกบิลประจำเดือน
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </main>

                {/* ── STICKY FOOTER ACTION ── */}
                <div className="px-6 py-6 bg-white border-t border-gray-50 sticky bottom-0 z-30 shadow-[0_-20px_40px_rgba(0,0,0,0.03)] sm:rounded-b-[2.5rem]">
                    <button className="w-full h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 transition-all active:scale-95">
                        <CheckCircleIcon className="w-6 h-6" />
                        ออกบิลทั้งหมด ({readyToIssueCount} ห้อง)
                    </button>
                </div>
            </div>
        </div>
    )
}
