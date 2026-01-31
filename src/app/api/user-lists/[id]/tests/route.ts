import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

// POST /api/user-lists/[id]/tests - Добавить тест в список
export const POST = withAuth(async (request: Request, { user, params }) => {
  try {
    console.log('[API] POST /api/user-lists/[id]/tests - Start');
    const resolvedParams = await params;
    console.log('[API] Params:', resolvedParams);
    console.log('[API] User found:', user.id);

    const body = await request.json();
    console.log('[API] Request body:', body);
    const { testId } = body;

    if (!testId) {
      return NextResponse.json(
        { error: 'testId is required' },
        { status: 400 }
      );
    }

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

    // Проверяем что тест существует
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Проверяем что тест еще не в списке
    const existing = await prisma.userTestListItem.findUnique({
      where: {
        listId_testId: {
          listId: resolvedParams.id,
          testId: testId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Test is already in the list' },
        { status: 400 }
      );
    }

    // Получаем максимальный order для нового элемента
    const maxOrderItem = await prisma.userTestListItem.findFirst({
      where: { listId: resolvedParams.id },
      orderBy: { order: 'desc' },
    });

    const newOrder = (maxOrderItem?.order ?? -1) + 1;

    // Добавляем тест в список
    const item = await prisma.userTestListItem.create({
      data: {
        listId: resolvedParams.id,
        testId: testId,
        order: newOrder,
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });

    console.log('[API] Test added to list successfully:', item.id);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[API] Error adding test to list:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add test to list' },
      { status: 500 }
    );
  }
});
