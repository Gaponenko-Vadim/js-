import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
  }

  try {
    // Найти токен в БД
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=TokenNotFound', request.url));
    }

    // Проверить срок действия
    if (new Date() > verificationToken.expiresAt) {
      // Удалить просроченный токен
      await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.redirect(new URL('/login?error=TokenExpired', request.url));
    }

    // Проверить, не подтвержден ли уже email
    if (verificationToken.user.emailVerified) {
      await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.redirect(new URL('/login?success=AlreadyVerified', request.url));
    }

    // Подтвердить email
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    // Удалить использованный токен
    await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });

    return NextResponse.redirect(new URL('/login?success=EmailVerified', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/login?error=VerificationFailed', request.url));
  }
}
