import { NextResponse } from 'next/server';
import { withOptionalAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

export const GET = withOptionalAuth(async () => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { tests: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
