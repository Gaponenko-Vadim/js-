import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/user-lists/[id]/tests - Добавить тест в список
export async function POST(request: NextRequest, segmentData: Params) {
  try {
    console.log('[API] POST /api/user-lists/[id]/tests - Start');
    const params = await segmentData.params;
    console.log('[API] Params:', params);
    const session = await getServerSession(authOptions);
    console.log('[API] Session:', session?.user?.email);

    if (!session?.user?.email) {
      console.log('[API] No session - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    console.log('[API] User found:', user?.id);

    if (!user) {
      console.log('[API] User not found - returning 404');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
        id: params.id,
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
          listId: params.id,
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
      where: { listId: params.id },
      orderBy: { order: 'desc' },
    });

    const newOrder = (maxOrderItem?.order ?? -1) + 1;

    // Добавляем тест в список
    const item = await prisma.userTestListItem.create({
      data: {
        listId: params.id,
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
}
