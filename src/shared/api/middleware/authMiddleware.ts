/**
 * Auth Middleware - REST API Trainer
 *
 * Централизованная обработка авторизации для API routes
 * Устраняет дублирование getServerSession в 17 API routes
 */

import { NextResponse } from 'next/server';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

// ============================================
// TYPES
// ============================================

/**
 * Контекст авторизованного запроса
 */
export interface AuthContext {
  /** Авторизованный пользователь из БД */
  user: User;
  /** NextAuth сессия */
  session: Session;
  /** Route params (для dynamic routes) */
  params?: any;
}

/**
 * Handler функция с авторизацией
 */
export type AuthHandler = (
  req: Request,
  context: AuthContext
) => Promise<Response>;

/**
 * Опции для Auth Middleware
 */
export interface AuthMiddlewareOptions {
  /** Требуется ли admin права (для будущего расширения) */
  requireAdmin?: boolean;
  /** Кастомная проверка доступа */
  customCheck?: (user: User) => boolean | Promise<boolean>;
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

/**
 * Middleware для защиты API routes авторизацией
 *
 * @example
 * ```typescript
 * // app/api/tests/route.ts
 * export const GET = withAuth(async (req, { user }) => {
 *   const tests = await prisma.test.findMany({
 *     where: { userId: user.id }
 *   });
 *   return NextResponse.json(tests);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // app/api/tests/[id]/route.ts
 * export const GET = withAuth(async (req, { user, params }) => {
 *   const test = await prisma.test.findUnique({
 *     where: { id: params.id }
 *   });
 *   return NextResponse.json(test);
 * });
 * ```
 */
export function withAuth(
  handler: AuthHandler,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: Request, routeContext: any = {}) => {
    try {
      // 1. Проверяем сессию
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Вы не авторизованы' },
          { status: 401 }
        );
      }

      // 2. Получаем пользователя из БД
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found', message: 'Пользователь не найден' },
          { status: 404 }
        );
      }

      // 3. Кастомная проверка доступа (если есть)
      if (options.customCheck) {
        const hasAccess = await options.customCheck(user);
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Доступ запрещён' },
            { status: 403 }
          );
        }
      }

      // 4. Вызываем handler с контекстом
      return handler(req, {
        user,
        session,
        params: routeContext.params
      });

    } catch (error) {
      console.error('Auth Middleware Error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  };
}

// ============================================
// OPTIONAL AUTH (для публичных endpoints с опциональной авторизацией)
// ============================================

/**
 * Optional Auth Context - user может быть null
 */
export interface OptionalAuthContext {
  user: User | null;
  session: Session | null;
  params?: any;
}

export type OptionalAuthHandler = (
  req: Request,
  context: OptionalAuthContext
) => Promise<Response>;

/**
 * Middleware для endpoints где авторизация опциональна
 *
 * @example
 * ```typescript
 * // app/api/tests/public/route.ts
 * export const GET = withOptionalAuth(async (req, { user }) => {
 *   // Если user есть - показываем персонализированные данные
 *   // Если нет - показываем публичные данные
 *   const tests = await prisma.test.findMany({
 *     where: user ? { userId: user.id } : { isPublic: true }
 *   });
 *   return NextResponse.json(tests);
 * });
 * ```
 */
export function withOptionalAuth(handler: OptionalAuthHandler) {
  return async (req: Request, routeContext: any = {}) => {
    try {
      const session = await getServerSession(authOptions);

      let user: User | null = null;

      if (session?.user?.email) {
        user = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
      }

      return handler(req, {
        user,
        session,
        params: routeContext.params
      });

    } catch (error) {
      console.error('Optional Auth Middleware Error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  };
}

// ============================================
// HELPER UTILITIES
// ============================================

/**
 * Проверка владения ресурсом
 *
 * @example
 * ```typescript
 * export const DELETE = withAuth(async (req, { user, params }) => {
 *   const test = await prisma.test.findUnique({
 *     where: { id: params.id }
 *   });
 *
 *   if (!checkOwnership(user.id, test?.userId)) {
 *     return unauthorizedResponse('Вы не владелец этого теста');
 *   }
 *
 *   await prisma.test.delete({ where: { id: params.id } });
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function checkOwnership(userId: string, resourceOwnerId?: string): boolean {
  if (!resourceOwnerId) return false;
  return userId === resourceOwnerId;
}

/**
 * Стандартный ответ для неавторизованных запросов
 */
export function unauthorizedResponse(message: string = 'Доступ запрещён') {
  return NextResponse.json(
    { error: 'Forbidden', message },
    { status: 403 }
  );
}

/**
 * Стандартный ответ для несуществующих ресурсов
 */
export function notFoundResponse(message: string = 'Ресурс не найден') {
  return NextResponse.json(
    { error: 'Not Found', message },
    { status: 404 }
  );
}

/**
 * Стандартный ответ для ошибок валидации
 */
export function validationErrorResponse(message: string, errors?: any) {
  return NextResponse.json(
    { error: 'Validation Error', message, errors },
    { status: 400 }
  );
}
