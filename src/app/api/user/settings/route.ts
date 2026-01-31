import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req: Request, { user }) => {
  try {
    const userSettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: { skipTasksWarning: true }
    });

    if (!userSettings) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ skipTasksWarning: userSettings.skipTasksWarning });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, { user }) => {
  try {
    const body = await req.json();
    const skipTasksWarning = body?.skipTasksWarning;

    if (typeof skipTasksWarning !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { skipTasksWarning },
      select: { skipTasksWarning: true }
    });

    return NextResponse.json({ skipTasksWarning: updatedUser.skipTasksWarning });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
