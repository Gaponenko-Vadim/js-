import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req: Request, { user, params }) => {
  try {
    const resolvedParams = await params;
    const progress = await prisma.lectureTaskProgress.findMany({
      where: { userId: user.id, lectureId: resolvedParams.id },
      select: { taskId: true }
    });

    return NextResponse.json({
      completedTaskIds: progress.map((item) => item.taskId)
    });
  } catch (error) {
    console.error('Error fetching task progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, { user, params }) => {
  try {
    const resolvedParams = await params;
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
            lectureId: resolvedParams.id,
            taskId
          }
        },
        update: { completedAt: new Date() },
        create: { userId: user.id, lectureId: resolvedParams.id, taskId }
      });
    } else {
      await prisma.lectureTaskProgress.deleteMany({
        where: { userId: user.id, lectureId: resolvedParams.id, taskId }
      });
    }

    return NextResponse.json({ taskId, completed });
  } catch (error) {
    console.error('Error updating task progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
