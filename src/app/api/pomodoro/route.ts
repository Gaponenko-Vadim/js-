import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { duration, type } = await req.json();

    if (!duration || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Создаем запись о помодоро сессии
    const pomodoroSession = await prisma.pomodoroSession.create({
      data: {
        userId: user.id,
        duration,
        type,
      },
    });

    return NextResponse.json(pomodoroSession, { status: 201 });
  } catch (error) {
    console.error('Error saving pomodoro session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sessions = await prisma.pomodoroSession.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
