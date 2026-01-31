import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

// DELETE /api/user-lists/[id]/tests/[testId] - Удалить тест из списка
export const DELETE = withAuth(async (request: Request, { user, params }) => {
  try {
    const resolvedParams = await params;

    // Проверяем что список принадлежит пользователю
    const list = await prisma.userTestList.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Удаляем тест из списка
    const result = await prisma.userTestListItem.deleteMany({
      where: {
        listId: resolvedParams.id,
        testId: resolvedParams.testId,
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
});
