import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const subjects = await prisma.subject.findMany({
            where: { userId: (session.user as { id: string }).id },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, color, icon } = await request.json();

        if (!name) {
            return NextResponse.json({ error: '科目名を入力してください' }, { status: 400 });
        }

        const subject = await prisma.subject.create({
            data: {
                userId: (session.user as { id: string }).id,
                name,
                color: color || '#6366f1',
                icon: icon || null,
            },
        });

        return NextResponse.json(subject);
    } catch (error) {
        console.error('Error creating subject:', error);
        return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
    }
}
