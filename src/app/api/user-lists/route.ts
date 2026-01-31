import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/user-lists - Получить все списки пользователя
export const GET = withAuth(async (req: Request, { user }) => {
  try {
    const lists = await prisma.userTestList.findMany({
      where: { userId: user.id },
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching user lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
});

// POST /api/user-lists - Создать новый список
export const POST = withAuth(async (request: Request, { user }) => {
  try {
    console.log('[API] POST /api/user-lists - Start');
    console.log('[API] User found:', user.id);

    const body = await request.json();
    console.log('[API] Request body:', body);
    const { name, description, icon, color } = body;

    if (!name || name.trim().length === 0) {
      console.log('[API] Name is empty - returning 400');
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    console.log('[API] Creating list...');
    const list = await prisma.userTestList.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim(),
        icon: icon || '📋',
        color: color || '#667eea',
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
        },
      },
    });
    console.log('[API] List created:', list.id);

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating user list:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create list' },
      { status: 500 }
    );
  }
});
