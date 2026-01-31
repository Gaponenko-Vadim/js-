import { NextResponse } from 'next/server';
import { withOptionalAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

// Отключаем кеширование для этого роута
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withOptionalAuth(async (req: Request, context) => {
  try {
    const resolvedParams = await context.params;
    const lecture = await prisma.lecture.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    return NextResponse.json(lecture);
  } catch (error) {
    console.error('Error fetching lecture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
