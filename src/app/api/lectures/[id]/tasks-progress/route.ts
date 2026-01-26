import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await context.params;
    const progress = await prisma.lectureTaskProgress.findMany({
      where: { userId: user.id, lectureId: params.id },
      select: { taskId: true }
    });

    return NextResponse.json({
      completedTaskIds: progress.map((item) => item.taskId)
    });
  } catch (error) {
    console.error('Error fetching task progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await context.params;
    const body = await req.json();
    const taskId = typeof body?.taskId === 'string' ? body.taskId.trim() : '';
    const completed = body?.completed;

    if (!taskId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (completed) {
      await prisma.lectureTaskProgress.upsert({
        where: {
          userId_lectureId_taskId: {
            userId: user.id,
            lectureId: params.id,
            taskId
          }
        },
        update: { completedAt: new Date() },
        create: { userId: user.id, lectureId: params.id, taskId }
      });
    } else {
      await prisma.lectureTaskProgress.deleteMany({
        where: { userId: user.id, lectureId: params.id, taskId }
      });
    }

    return NextResponse.json({ taskId, completed });
  } catch (error) {
    console.error('Error updating task progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
