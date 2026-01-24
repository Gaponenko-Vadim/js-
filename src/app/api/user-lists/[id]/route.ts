import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/user-lists/[id] - Получить конкретный список
export async function GET(request: NextRequest, segmentData: Params) {
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

    const list = await prisma.userTestList.findFirst({
      where: {
        id: params.id,
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
}

// PUT /api/user-lists/[id] - Обновить список
export async function PUT(request: NextRequest, segmentData: Params) {
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

    const body = await request.json();
    const { name, description, icon, color } = body;

    const list = await prisma.userTestList.updateMany({
      where: {
        id: params.id,
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
      where: { id: params.id },
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
}

// DELETE /api/user-lists/[id] - Удалить список
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

    const result = await prisma.userTestList.deleteMany({
      where: {
        id: params.id,
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
}
