import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return new NextResponse('DEBUG HOOK ACTIVE', { status: 200 });
}

export async function POST(req: Request) {
    const body = await req.json();
    console.log('Debug Hook Received:', body);
    return new NextResponse('OK', { status: 200 });
}
