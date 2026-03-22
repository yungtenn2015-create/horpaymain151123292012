'use client'

import { forwardRef } from 'react'
import { format } from 'date-fns'

// Helper function for Thai Baht Text
export function bahtText(amount: number): string {
    const numbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
    const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

    if (amount === 0) return 'ศูนย์บาทถ้วน'

    let res = ''
    const str = Math.floor(amount).toString()
    for (let i = 0; i < str.length; i++) {
        const d = parseInt(str[i])
        const unit = units[str.length - i - 1]
        if (d !== 0) {
            if (unit === 'สิบ' && d === 1 && i === str.length - 2) res += ''
            else if (unit === 'สิบ' && d === 2 && i === str.length - 2) res += 'ยี่'
            else if (unit === '' && d === 1 && str.length > 1) res += 'เอ็ด'
            else res += numbers[d]
            res += unit
        }
    }
    return res + 'บาทถ้วน'
}

interface ReceiptViewProps {
    data: {
        receiptId: string;
        date: string;
        month: string;
        dueDate: string;
        dormName: string;
        address: string;
        dormPhone: string;
        roomNumber: string;
        tenantName: string;
        bankName: string;
        bankNo: string;
        bankAccount: string;
        items: Array<{ name: string; amount: number; detail?: string }>;
        total: number;
    };
    slipUrl?: string | null;
}

const ReceiptView = forwardRef<HTMLDivElement, ReceiptViewProps>(({ data, slipUrl }, ref) => {
    if (!data) return null;

    return (
        <div
            ref={ref}
            className="max-w-xl mx-auto bg-white sm:rounded-[2.5rem] shadow-2xl shadow-gray-200/50 overflow-hidden relative print:shadow-none print:rounded-none"
        >
            {/* Decoration Circles (Ticket Style) */}
            <div className="absolute top-1/2 -left-4 w-8 h-8 bg-gray-100/50 rounded-full z-10 print:hidden" />
            <div className="absolute top-1/2 -right-4 w-8 h-8 bg-gray-100/50 rounded-full z-10 print:hidden" />

            <div className="p-6 sm:p-8">
                <div className="text-center mb-10 pt-0">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{data.dormName}</h2>
                    <p className="text-[13px] text-gray-600 font-extrabold max-w-[340px] mx-auto leading-relaxed mb-4">
                        {data.address} {data.dormPhone && `| โทร: ${data.dormPhone}`}
                    </p>
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                        <span className="text-base font-black text-emerald-600">ใบเสร็จประจำเดือน</span>
                        <span className="text-base font-black text-emerald-600">{data.month}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4 pb-3 border-b border-dashed border-gray-100">
                    <div>
                        <p className="text-[12px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1.5">เลขที่ใบเสร็จ</p>
                        <p className="text-base font-black text-gray-800 leading-none">{data.receiptId}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1.5">วันที่ออกบิล</p>
                        <p className="text-base font-black text-gray-800 leading-none">{data.date}</p>
                    </div>
                </div>

                {/* Compact Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 font-black text-base shadow-sm ring-1 ring-gray-100/50 flex-shrink-0">#</div>
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-1">ห้องพัก</p>
                            <p className="text-xl font-black text-gray-800 leading-none">{data.roomNumber}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 font-black text-base shadow-sm ring-1 ring-gray-100/50 flex-shrink-0">👤</div>
                        <div className="truncate">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-1">ผู้เช่า</p>
                            <p className="text-lg font-black text-gray-800 truncate leading-none">{data.tenantName}</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="space-y-2 mb-4 bg-gray-50/50 rounded-3xl p-4 border border-gray-100/50">
                    {data.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-0.5">
                            <div>
                                <p className="text-[15px] font-black text-gray-800">{item.name}</p>
                                {item.detail && <p className="text-[12px] font-bold text-gray-400 mt-0.5">{item.detail}</p>}
                            </div>
                            <p className="text-[15px] font-black text-gray-900">฿{(Number(item.amount) || 0).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="bg-emerald-500 rounded-2xl p-4 mb-4 text-white shadow-xl shadow-emerald-100 flex items-center justify-between">
                    <div>
                        <p className="text-[12px] font-black text-emerald-100 uppercase tracking-widest mb-1">ยอดรวมสุทธิ</p>
                        <p className="text-sm font-bold leading-tight italic opacity-95">{bahtText(Number(data.total) || 0)}</p>
                    </div>
                    <p className="text-3xl font-black">฿{(Number(data.total) || 0).toLocaleString()}</p>
                </div>

                {/* Payment Info */}
                <div className="bg-emerald-50/50 rounded-[2rem] p-4 border border-emerald-100 flex flex-col items-center">
                    <p className="text-[12px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">ช่องทางการชำระเงิน / โอนเข้าบัญชี</p>

                    <div className="text-center mb-4">
                        <p className="text-2xl font-black text-emerald-600 uppercase tracking-widest leading-tight mb-2">{data.bankName}</p>
                        <h3 className="text-xl font-black text-emerald-600 tracking-tight leading-none">ชื่อบัญชี : {data.bankAccount}</h3>
                    </div>

                    <div className="w-full bg-white rounded-2xl p-4 border border-emerald-100 flex flex-col items-center shadow-sm">
                        <p className="text-2xl font-black text-emerald-600 tracking-widest sm:text-3xl font-mono leading-none py-1">
                            {data.bankNo}
                        </p>
                    </div>
                </div>

                {/* Slip Proof Section (Only if slipUrl exists) */}
                {slipUrl && (
                    <div className="mt-8 pt-8 border-t border-dashed border-gray-200">
                        <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 justify-center">
                            <span className="w-8 h-[1px] bg-gray-100" />
                            หลักฐานการชำระเงิน (สลิป)
                            <span className="w-8 h-[1px] bg-gray-100" />
                        </p>
                        <div className="bg-gray-50 rounded-3xl p-2 border border-gray-100 group relative overflow-hidden">
                            <img 
                                src={slipUrl} 
                                alt="Payment Slip" 
                                className="w-full h-auto rounded-2xl shadow-sm transition-transform group-hover:scale-[1.02]" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Message */}
            <div className="bg-gray-50/50 p-4 text-center border-t border-gray-100">
                <p className="text-lg text-red-500 underline underline-offset-4 decoration-red-500">
                    กรุณาชำระเงินภายในวันที่ <span className="text-lg text-red-500 underline underline-offset-4 decoration-red-500">{data.dueDate}</span>
                </p>
                <p className="text-[10px] font-bold text-gray-300 italic uppercase">Powered by HorPay - Smart Dorm Management</p>
            </div>
        </div>
    )
})

ReceiptView.displayName = 'ReceiptView'

export default ReceiptView
