import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { skipTasksWarning: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ skipTasksWarning: user.skipTasksWarning });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const skipTasksWarning = body?.skipTasksWarning;

    if (typeof skipTasksWarning !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { skipTasksWarning },
      select: { skipTasksWarning: true }
    });

    return NextResponse.json({ skipTasksWarning: user.skipTasksWarning });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
