import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { access_token } = await req.json()

        if (!access_token) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 400 })
        }

        const response = await fetch('https://api.line.me/v2/bot/info', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })

        const data = await response.json()

        if (response.ok) {
            return NextResponse.json({ 
                success: true, 
                bot: {
                    userId: data.userId,
                    displayName: data.displayName,
                    pictureUrl: data.pictureUrl
                } 
            })
        } else {
            return NextResponse.json({ 
                success: false, 
                error: data.message || 'Invalid token or API error' 
            }, { status: response.status })
        }
    } catch (error: any) {
        console.error('Test connection error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
