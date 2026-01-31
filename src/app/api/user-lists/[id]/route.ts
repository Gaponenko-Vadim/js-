import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/user-lists/[id] - Получить конкретный список
export const GET = withAuth(async (request: Request, { user, params }) => {
  try {
    const resolvedParams = await params;
    const list = await prisma.userTestList.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                difficulty: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch list' },
      { status: 500 }
    );
  }
});

// PUT /api/user-lists/[id] - Обновить список
export const PUT = withAuth(async (request: Request, { user, params }) => {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { name, description, icon, color } = body;

    const list = await prisma.userTestList.updateMany({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(icon && { icon }),
        ...(color && { color }),
      },
    });

    if (list.count === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const updatedList = await prisma.userTestList.findUnique({
      where: { id: resolvedParams.id },
      include: {
        items: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                difficulty: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json(
      { error: 'Failed to update list' },
      { status: 500 }
    );
  }
});

// DELETE /api/user-lists/[id] - Удалить список
export const DELETE = withAuth(async (request: Request, { user, params }) => {
  try {
    const resolvedParams = await params;
    const result = await prisma.userTestList.deleteMany({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { error: 'Failed to delete list' },
      { status: 500 }
    );
  }
});
