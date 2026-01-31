import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req: Request, { user }) => {
  try {
    const { testId, answers, score } = await req.json();

    if (!testId || !answers || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.testResult.create({
      data: {
        userId: user.id,
        testId,
        answers,
        score,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving test result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const GET = withAuth(async (req, { user }) => {
  try {
    const results = await prisma.testResult.findMany({
      where: { userId: user.id },
      include: { test: true },
      orderBy: { completedAt: 'desc' },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
