import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req: Request, { user }) => {
  try {
    const { duration, type } = await req.json();

    if (!duration || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
});

export const GET = withAuth(async (_req: Request, { user }) => {
  try {
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
});
