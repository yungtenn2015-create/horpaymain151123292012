import { Noto_Sans_Thai } from 'next/font/google'
import type { ReactNode } from 'react'

const notoSansThai = Noto_Sans_Thai({
    subsets: ['thai', 'latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
    variable: '--font-setup-dorm',
})

export default function SetupDormLayout({ children }: { children: ReactNode }) {
    return (
        <div
            className={`${notoSansThai.className} ${notoSansThai.variable} min-h-screen antialiased [text-rendering:optimizeLegibility]`}
        >
            {children}
        </div>
    )
}
