import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = {
  params: Promise<{
    id: string;
    testId: string;
  }>;
};

// DELETE /api/user-lists/[id]/tests/[testId] - Удалить тест из списка
export async function DELETE(request: NextRequest, segmentData: Params) {
  const params = await segmentData.params;
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

    // Проверяем что список принадлежит пользователю
    const list = await prisma.userTestList.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Удаляем тест из списка
    const result = await prisma.userTestListItem.deleteMany({
      where: {
        listId: params.id,
        testId: params.testId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Test not found in list' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing test from list:', error);
    return NextResponse.json(
      { error: 'Failed to remove test from list' },
      { status: 500 }
    );
  }
}
