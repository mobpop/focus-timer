import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'メールアドレスとパスワードは必須です' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'このメールアドレスは既に登録されています' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
            },
        });

        // Create default subjects
        await prisma.subject.createMany({
            data: [
                { userId: user.id, name: '勉強', color: '#6366f1' },
                { userId: user.id, name: '仕事', color: '#22d3ee' },
                { userId: user.id, name: '読書', color: '#f472b6' },
            ],
        });

        return NextResponse.json({
            id: user.id,
            email: user.email,
            name: user.name,
        });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'アカウント作成に失敗しました' },
            { status: 500 }
        );
    }
}
