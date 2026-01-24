import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Отключаем кеширование для этого роута
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;

    // Находим вопрос с привязанной лекцией
    const question = await prisma.question.findUnique({
      where: { id: params.questionId },
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
}
