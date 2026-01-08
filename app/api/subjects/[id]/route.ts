import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { name, color, icon } = await request.json();

        const subject = await prisma.subject.updateMany({
            where: {
                id,
                userId: (session.user as { id: string }).id,
            },
            data: { name, color, icon },
        });

        if (subject.count === 0) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating subject:', error);
        return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        const subject = await prisma.subject.deleteMany({
            where: {
                id,
                userId: (session.user as { id: string }).id,
            },
        });

        if (subject.count === 0) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting subject:', error);
        return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
    }
}
