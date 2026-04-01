'use client'

import React from 'react'
import {
    UsersIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon,
    ArrowRightOnRectangleIcon,
    BellIcon,
    ClockIcon,
    BoltIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline'
import { BanknotesIcon as BanknotesSolid } from '@heroicons/react/24/solid'

interface StatsTabProps {
    fetchingOverview: boolean;
    overviewData: {
        monthlyRevenue: number;
        collectedRevenue: number;
        pendingRevenue: number;
        /** ยอดรอชำระที่ไม่นับเป็นเกินกำหนด (คำนวณใน DashboardClient; อย่าใช้ pendingRevenue − overdueAmount) */
        pendingNotOverdueAmount?: number;
        billStatusCounts: {
            paid: number;
            waiting_verify: number;
            unpaid: number;
            overdue: number;
            overdueAmount?: number;
            movingOut?: number;
        };
        occupancyRate: number;
        waterUnits: number;
        waterAmount: number;
        electricityUnits: number;
        electricityAmount: number;
        historicalRevenue: { month: string; amount: number }[];
        historicalUtilities: { month: string; electricity: number; water: number; electricityAmount: number; waterAmount: number }[];
    };
    router: any;
    setActiveTab: (tab: string) => void;
    setSelectedStatus: (status: string) => void;
    dorm: { name: string } | null;
    userName: string;
}

const StatsTab: React.FC<StatsTabProps> = ({
    fetchingOverview,
    overviewData,
    router,
    setActiveTab,
    setSelectedStatus,
    dorm,
    userName
}) => {
    return (
        <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-gray-50 pb-dashboard-nav font-body text-slate-800 antialiased tabular-nums">
            {/* Hero Section */}
            <div className="relative min-h-[210px]">
                {/* Background with clipping */}
                <div className="absolute inset-0 bg-primary rounded-b-[2.5rem] sm:rounded-t-[2.5rem] shadow-lg overflow-hidden z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse duration-[4000ms]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-56 h-56 bg-white/5 rounded-full blur-2xl" />
                </div>

                {/* Header Content */}
                <div className="relative z-50 pt-8 pb-10 px-6 sm:px-10">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-[20px] rounded-[1.8rem] sm:rounded-[2.2rem] flex items-center justify-center text-white border border-white/30 shadow-2xl animate-in zoom-in duration-700">
                            <ChartBarIcon className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-3xl sm:text-4xl font-headline font-extrabold tracking-tight text-white leading-tight underline decoration-white/20 underline-offset-8">
                                ภาพรวมหอพัก
                            </h1>
                            <p className="text-sm sm:text-base text-white/95 font-bold tracking-tight mt-2">
                                สรุปข้อมูลการเงินและสถานะรายเดือน
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-20 relative z-20 space-y-6 pb-8">
                {fetchingOverview ? (
                    <div className="bg-white rounded-[2rem] p-12 shadow-xl border border-gray-50 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-bold text-sm">กำลังคำนวณข้อมูล...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* ── Revenue Card ── */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-[1.8rem] p-5 text-green-700 shadow-sm border border-green-100">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-green-600 text-[11px] font-black uppercase tracking-widest mb-1">รายรับเดือนนี้</p>
                                    <h2 className="text-3xl font-black tracking-tight">฿{overviewData.monthlyRevenue.toLocaleString()}</h2>
                                </div>
                                <div className="bg-white/50 p-2.5 rounded-2xl backdrop-blur-md">
                                    <BanknotesSolid className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-green-600">เก็บแล้ว {Math.round((overviewData.collectedRevenue / (overviewData.monthlyRevenue || 1)) * 100)}%</span>
                                        <span className="text-green-800">฿{overviewData.collectedRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-green-200/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-600 transition-all duration-1000"
                                            style={{ width: `${(overviewData.collectedRevenue / (overviewData.monthlyRevenue || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-green-200/50">
                                    <div className="flex justify-between text-[11px] font-bold text-green-600">
                                        <span>รอชำระ (เดือนนี้)</span>
                                        <span className="text-green-800">฿{Math.max(0, overviewData.pendingNotOverdueAmount ?? 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-bold text-orange-600">
                                        <span>ค้างชำระ (เกินกำหนด)</span>
                                        <span className="text-orange-800">฿{(overviewData.billStatusCounts as any).overdueAmount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Status & Utilities Grid ── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                        <UsersIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[11px] font-black text-blue-900 uppercase">อัตราเข้าพัก</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-black text-emerald-600">{overviewData.occupancyRate}%</span>
                                    <span className="text-[10px] font-bold text-blue-400 pb-1">Occupied</span>
                                </div>
                            </div>
                            <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                        <ArrowPathIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[11px] font-black text-orange-900 uppercase">การใช้น้ำ/ไฟ</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[11px] font-bold text-orange-600">💡 ไฟ: {overviewData.electricityUnits} หน่วย</p>
                                        <p className="text-[10px] font-black text-orange-700">฿{overviewData.electricityAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[11px] font-bold text-teal-600">💧 น้ำ: {overviewData.waterUnits} หน่วย</p>
                                        <p className="text-[10px] font-black text-teal-700">฿{overviewData.waterAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Bill Status Summary ── */}
                        <div className="bg-white rounded-[1.5rem] p-1.5 border-2 border-gray-50 shadow-sm overflow-hidden">
                            <div className="p-3 border-b border-gray-50 bg-gray-50/30 rounded-t-[1.3rem]">
                                <h3 className="text-[13px] font-black text-gray-900 tracking-tight">สถานะบิลเดือนนี้</h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                <div
                                    onClick={() => router.push('/dashboard/billing')}
                                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors">ชำระแล้ว</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-green-600">{overviewData.billStatusCounts.paid} ห้อง</span>
                                        <ChevronRightIcon className="w-4 h-4 text-gray-200 group-hover:text-green-400 transition-colors" />
                                    </div>
                                </div>
                                <div
                                    onClick={() => router.push('/dashboard/billing')}
                                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <ArrowPathIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">รอชำระ</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-blue-600">{overviewData.billStatusCounts.waiting_verify} ห้อง</span>
                                        <ChevronRightIcon className="w-4 h-4 text-gray-200 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                </div>
                                <div
                                    onClick={() => router.push('/dashboard/billing')}
                                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <ExclamationTriangleIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">ค้างชำระ</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-orange-600">{overviewData.billStatusCounts.overdue} ห้อง</span>
                                        <ChevronRightIcon className="w-4 h-4 text-gray-200 group-hover:text-orange-400 transition-colors" />
                                    </div>
                                </div>
                                <div
                                    onClick={() => router.push('/dashboard/billing')}
                                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group border-t border-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">แจ้งออก</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-red-600">{(overviewData.billStatusCounts as any).movingOut || 0} ห้อง</span>
                                        <ChevronRightIcon className="w-4 h-4 text-gray-200 group-hover:text-red-400 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Revenue History (Full Width) ── */}
                        <div className="bg-white rounded-[1.5rem] p-5 border-2 border-gray-50 shadow-sm">
                            <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2">
                                <BanknotesSolid className="w-4 h-4 text-emerald-600" />
                                รายรับรายเดือน (6 เดือนล่าสุด)
                            </h3>
                            <div className="flex justify-between gap-1.5 px-1 pt-1 sm:gap-3 sm:px-2">
                                {overviewData.historicalRevenue.map((data, i) => {
                                    const maxVal = Math.max(...overviewData.historicalRevenue.map(h => h.amount), 1);
                                    const pct = (data.amount / maxVal) * 100;
                                    const barPct = Math.max(pct, data.amount > 0 ? 8 : 4);
                                    return (
                                        <div key={i} className="group flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1">
                                            <div className="flex min-h-[2.25rem] w-full flex-col items-center justify-end px-0.5 text-center">
                                                <span
                                                    className={`max-w-full truncate text-[9px] font-black tabular-nums leading-tight sm:text-[10px] ${i === 5 ? 'text-emerald-700' : 'text-slate-700'}`}
                                                    title={`฿${data.amount.toLocaleString('th-TH')}`}
                                                >
                                                    ฿{data.amount.toLocaleString('th-TH')}
                                                </span>
                                            </div>
                                            <div className="flex h-36 w-full flex-col justify-end">
                                                <div
                                                    className={`w-full min-h-0 rounded-t-lg transition-all duration-700 ${i === 5 ? 'bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.35)]' : 'bg-emerald-100 group-hover:bg-emerald-200'}`}
                                                    style={{ height: `${barPct}%` }}
                                                />
                                            </div>
                                            <span className={`shrink-0 text-[10px] font-black ${i === 5 ? 'text-emerald-700' : 'text-slate-600'}`}>
                                                {data.month}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* ── Electricity Usage History (Full Width) ── */}
                        <div className="bg-white rounded-[1.5rem] p-5 border-2 border-gray-50 shadow-sm">
                            <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2">
                                <BoltIcon className="w-4 h-4 text-amber-500" />
                                การใช้ไฟฟ้า (หน่วย/บาท) (6 เดือนล่าสุด)
                            </h3>
                            <div className="flex justify-between gap-1.5 px-1 pt-1 sm:gap-3 sm:px-2">
                                {overviewData.historicalUtilities.map((data, i) => {
                                    const maxVal = Math.max(...overviewData.historicalUtilities.map(h => h.electricity), 1);
                                    const pct = (data.electricity / maxVal) * 100;
                                    const barPct = Math.max(pct, data.electricity > 0 ? 8 : 4);
                                    const amt = Number(data.electricityAmount) || 0;
                                    return (
                                        <div key={i} className="group flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1">
                                            <div className="flex min-h-[2.75rem] w-full flex-col items-center justify-end gap-0.5 px-0.5 text-center">
                                                <span
                                                    className={`max-w-full truncate text-[8px] font-black tabular-nums leading-tight sm:text-[9px] ${i === 5 ? 'text-amber-700' : 'text-slate-700'}`}
                                                    title={`${data.electricity.toLocaleString('th-TH')} หน่วย`}
                                                >
                                                    {data.electricity.toLocaleString('th-TH')} หน่วย
                                                </span>
                                                <span
                                                    className={`max-w-full truncate text-[8px] font-black tabular-nums leading-tight sm:text-[9px] ${i === 5 ? 'text-amber-600' : 'text-slate-600'}`}
                                                    title={`฿${amt.toLocaleString('th-TH')}`}
                                                >
                                                    ฿{amt.toLocaleString('th-TH')}
                                                </span>
                                            </div>
                                            <div className="flex h-36 w-full flex-col justify-end">
                                                <div
                                                    className={`w-full min-h-0 rounded-t-lg transition-all duration-700 ${i === 5 ? 'bg-amber-500' : 'bg-amber-100 group-hover:bg-amber-200'}`}
                                                    style={{ height: `${barPct}%` }}
                                                />
                                            </div>
                                            <span className={`shrink-0 text-[10px] font-black ${i === 5 ? 'text-amber-600' : 'text-slate-600'}`}>
                                                {data.month}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* ── Water Usage History (Full Width) ── */}
                        <div className="bg-white rounded-[1.5rem] p-5 border-2 border-gray-50 shadow-sm">
                            <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2">
                                <ArrowPathIcon className="w-4 h-4 text-blue-500" />
                                การใช้น้ำ (หน่วย/บาท) (6 เดือนล่าสุด)
                            </h3>
                            <div className="flex justify-between gap-1.5 px-1 pt-1 sm:gap-3 sm:px-2">
                                {overviewData.historicalUtilities.map((data, i) => {
                                    const maxVal = Math.max(...overviewData.historicalUtilities.map(h => h.water), 1);
                                    const pct = (data.water / maxVal) * 100;
                                    const barPct = Math.max(pct, data.water > 0 ? 8 : 4);
                                    const amt = Number(data.waterAmount) || 0;
                                    return (
                                        <div key={i} className="group flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1">
                                            <div className="flex min-h-[2.75rem] w-full flex-col items-center justify-end gap-0.5 px-0.5 text-center">
                                                <span
                                                    className={`max-w-full truncate text-[8px] font-black tabular-nums leading-tight sm:text-[9px] ${i === 5 ? 'text-blue-800' : 'text-slate-700'}`}
                                                    title={`${data.water.toLocaleString('th-TH')} หน่วย`}
                                                >
                                                    {data.water.toLocaleString('th-TH')} หน่วย
                                                </span>
                                                <span
                                                    className={`max-w-full truncate text-[8px] font-black tabular-nums leading-tight sm:text-[9px] ${i === 5 ? 'text-blue-600' : 'text-slate-600'}`}
                                                    title={`฿${amt.toLocaleString('th-TH')}`}
                                                >
                                                    ฿{amt.toLocaleString('th-TH')}
                                                </span>
                                            </div>
                                            <div className="flex h-36 w-full flex-col justify-end">
                                                <div
                                                    className={`w-full min-h-0 rounded-t-lg transition-all duration-700 ${i === 5 ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-blue-100 group-hover:bg-blue-200'}`}
                                                    style={{ height: `${barPct}%` }}
                                                />
                                            </div>
                                            <span className={`shrink-0 text-[10px] font-black ${i === 5 ? 'text-blue-600' : 'text-slate-600'}`}>
                                                {data.month}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StatsTab
