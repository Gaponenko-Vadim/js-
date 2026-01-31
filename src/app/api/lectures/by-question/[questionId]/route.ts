import { NextResponse } from 'next/server';
import { withOptionalAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

// Отключаем кеширование для этого роута
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withOptionalAuth(async (req: Request, context) => {
  try {
    const resolvedParams = await context.params;

    // Находим вопрос с привязанной лекцией
    const question = await prisma.question.findUnique({
      where: { id: resolvedParams.questionId },
      include: {
        lecture: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (!question.lecture) {
      return NextResponse.json({ error: 'Lecture not found for this question' }, { status: 404 });
    }

    return NextResponse.json(question.lecture);
  } catch (error) {
    console.error('Error fetching lecture by question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
