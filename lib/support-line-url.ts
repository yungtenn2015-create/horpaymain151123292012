/**
 * ลิงก์ให้ผู้ใช้กดแอด LINE / เปิดแชท
 * - manager.line.biz = หลังบ้านเจ้าของ OA (ไม่ใช่ลิงก์แอดเพื่อน)
 * - OA: https://line.me/R/ti/p/@basicId
 * - LINE ID ส่วนตัว: https://line.me/ti/p/~lineId
 */
export function getSupportLineAddFriendUrl(): string {
    const full = process.env.NEXT_PUBLIC_SUPPORT_LINE_URL?.trim()
    if (full) return full

    const raw = (process.env.NEXT_PUBLIC_SUPPORT_LINE_ID?.trim() || '@258wjngh')
    if (/^https?:\/\//i.test(raw)) return raw

    if (raw.startsWith('@')) {
        const basic = raw.slice(1)
        return `https://line.me/R/ti/p/@${basic}`
    }

    return `https://line.me/ti/p/~${encodeURIComponent(raw)}`
}
