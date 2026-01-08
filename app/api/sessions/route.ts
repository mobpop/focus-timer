import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const userId = (session.user as { id: string }).id;

        const whereClause: {
            userId: string;
            startTime?: { gte?: Date; lte?: Date };
        } = { userId };

        if (from || to) {
            whereClause.startTime = {};
            if (from) whereClause.startTime.gte = new Date(from);
            if (to) whereClause.startTime.lte = new Date(to);
        }

        const sessions = await prisma.session.findMany({
            where: whereClause,
            include: {
                subject: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy: { startTime: 'desc' },
        });

        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { subjectId, startTime, endTime, duration, notes } = await request.json();

        if (!subjectId || !startTime || !endTime || duration === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const userId = (session.user as { id: string }).id;

        // Verify subject belongs to user
        const subject = await prisma.subject.findFirst({
            where: { id: subjectId, userId },
        });

        if (!subject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        const newSession = await prisma.session.create({
            data: {
                userId,
                subjectId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration,
                notes: notes || null,
            },
        });

        return NextResponse.json(newSession);
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}
