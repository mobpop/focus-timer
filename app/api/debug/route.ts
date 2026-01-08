import { NextResponse } from 'next/server';

export async function GET() {
    const url = process.env.DATABASE_URL;
    return NextResponse.json({
        exists: !!url,
        length: url ? url.length : 0,
        start: url ? url.substring(0, 10) : 'null',
        nodeEnv: process.env.NODE_ENV,
    });
}
