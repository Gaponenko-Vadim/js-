# Руководство по добавлению новых фич

> **Версия документа:** 1.0
> **Дата:** 2026-01-28
> **Для:** Разработчиков и AI-ассистентов

Это практическое руководство показывает, как добавлять новые фичи в проект REST API Trainer с примерами кода и step-by-step инструкциями.

---

## 📋 Содержание

1. [Добавление новой страницы](#добавление-новой-страницы)
2. [Добавление нового API endpoint](#добавление-нового-api-endpoint)
3. [Добавление новой модели БД](#добавление-новой-модели-бд)
4. [Создание нового компонента](#создание-нового-компонента)
5. [Добавление новой фичи (Feature-based)](#добавление-новой-фичи-feature-based)
6. [Добавление OAuth провайдера](#добавление-oauth-провайдера)
7. [Добавление Redux slice](#добавление-redux-slice)
8. [Best Practices](#best-practices)

---

## 🎯 Добавление новой страницы

### Пример: Добавить страницу "Статистика"

**Шаг 1: Создать Server Component**

```typescript
// src/app/(dashboard)/statistics/page.tsx
import { Metadata } from 'next';
import StatisticsContent from './StatisticsContent';

export const metadata: Metadata = {
  title: 'Статистика - REST API Trainer',
  description: 'Ваша статистика обучения',
};

export default function StatisticsPage() {
  return <StatisticsContent />;
}
```

**Шаг 2: Создать Client Component**

```typescript
// src/app/(dashboard)/statistics/StatisticsContent.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import styles from './statistics.module.scss';

interface StatisticsData {
  totalTests: number;
  averageScore: number;
  studyTime: number;
}

export default function StatisticsContent() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStatistics();
    }
  }, [status]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!stats) return <div>Нет данных</div>;

  return (
    <div className={styles.container}>
      <h1>Статистика</h1>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Пройдено тестов</h3>
          <p className={styles.statValue}>{stats.totalTests}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Средний балл</h3>
          <p className={styles.statValue}>{stats.averageScore}%</p>
        </div>
        <div className={styles.statCard}>
          <h3>Время обучения</h3>
          <p className={styles.statValue}>{stats.studyTime}ч</p>
        </div>
      </div>
    </div>
  );
}
```

**Шаг 3: Создать стили**

```scss
// src/app/(dashboard)/statistics/statistics.module.scss
@use '@/styles/tokens.scss' as *;
@use '@/styles/utilities.scss' as *;

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: $spacing-xl;

  @include mobile {
    padding: $spacing-md;
  }
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.statCard {
  @include flex-column;
  gap: $spacing-md;
  padding: $spacing-xl;
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;

  h3 {
    font-size: $font-size-base;
    color: $color-text-secondary;
    margin: 0;
  }
}

.statValue {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $color-primary;
  margin: 0;
}
```

**Шаг 4: Добавить ссылку в навигацию**

```typescript
// src/components/layout/DashboardHeader.tsx
const navigationLinks = [
  { href: '/dashboard', label: 'Главная' },
  { href: '/tests', label: 'Тесты' },
  { href: '/lectures', label: 'Лекции' },
  { href: '/results', label: 'Результаты' },
  { href: '/statistics', label: 'Статистика' },  // 👈 Добавили
  { href: '/pomodoro', label: 'Помодоро' },
  { href: '/my-lists', label: 'Мои списки' },
];
```

**Шаг 5: Обновить middleware (если нужна защита)**

```typescript
// src/middleware.ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tests/:path*',
    '/results/:path*',
    '/statistics/:path*',  // 👈 Добавили
    '/pomodoro/:path*',
    '/lectures/:path*',
    '/my-lists/:path*'
  ]
};
```

---

## 🔌 Добавление нового API endpoint

### Пример: GET /api/statistics

**Шаг 1: Создать route файл**

```typescript
// src/app/api/statistics/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Получение userId
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Получение данных
    const [totalTests, testResults, pomodoroSessions] = await Promise.all([
      prisma.testResult.count({
        where: { userId: user.id }
      }),
      prisma.testResult.findMany({
        where: { userId: user.id },
        select: { score: true }
      }),
      prisma.pomodoroSession.findMany({
        where: {
          userId: user.id,
          type: 'work'
        },
        select: { duration: true }
      })
    ]);

    // 4. Подсчет статистики
    const averageScore = testResults.length > 0
      ? Math.round(
          testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length
        )
      : 0;

    const studyTime = Math.round(
      pomodoroSessions.reduce((sum, s) => sum + s.duration, 0) / 3600
    );

    // 5. Возврат результата
    return NextResponse.json({
      totalTests,
      averageScore,
      studyTime
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Пример: POST /api/notes (создание ресурса)

```typescript
// src/app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Валидация через Zod
const createNoteSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Аутентификация
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Парсинг и валидация body
    const body = await request.json();
    const validationResult = createNoteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { title, content, tags } = validationResult.data;

    // 3. Создание записи
    const note = await prisma.note.create({
      data: {
        title,
        content,
        tags: tags || [],
        userId: user.id
      }
    });

    // 4. Возврат созданного ресурса
    return NextResponse.json(note, { status: 201 });

  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notes = await prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notes);

  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Пример: Dynamic route с параметрами

```typescript
// src/app/api/notes/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notes/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const note = await prisma.note.findFirst({
      where: {
        id: params.id,
        userId: user.id  // Проверка владельца
      }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);

  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/notes/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, tags } = body;

    // Проверка существования и владельца
    const existingNote = await prisma.note.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Обновление
    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(tags && { tags })
      }
    });

    return NextResponse.json(updatedNote);

  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Проверка существования и владельца
    const note = await prisma.note.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Удаление
    await prisma.note.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🗄 Добавление новой модели БД

### Пример: Добавить модель "Note" (заметки)

**Шаг 1: Обновить Prisma схему**

```prisma
// prisma/schema.prisma

model User {
  id               String   @id @default(cuid())
  email            String   @unique
  password         String
  name             String?
  // ... existing fields
  notes            Note[]   // 👈 Добавили связь
}

model Note {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title     String
  content   String   @db.Text
  tags      String[] @default([])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([createdAt])
}
```

**Шаг 2: Создать миграцию**

```bash
npx prisma migrate dev --name add_note_model
```

**Шаг 3: Регенерировать Prisma Client**

```bash
npx prisma generate
```

**Шаг 4: Проверить в Prisma Studio**

```bash
npx prisma studio
```

### Пример: Добавить Many-to-Many связь

```prisma
// Добавить модель Badge (значки достижений)

model User {
  id      String      @id @default(cuid())
  // ... existing fields
  badges  UserBadge[] // Many-to-Many через junction table
}

model Badge {
  id          String   @id @default(cuid())
  name        String   @unique
  description String
  icon        String
  condition   String   // Условие получения

  createdAt   DateTime @default(now())
  users       UserBadge[]
}

// Junction table: User ↔ Badge
model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String
  earnedAt  DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge     Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
  @@index([userId])
  @@index([badgeId])
}
```

---

## 🧩 Создание нового компонента

### Пример: Создать компонент Badge

**Шаг 1: Создать компонент**

```typescript
// src/components/ui/Badge/Badge.tsx
interface BadgeProps {
  /** Текст значка */
  label: string;
  /** Вариант цвета */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Размер */
  size?: 'sm' | 'md' | 'lg';
  /** Иконка (эмодзи или компонент) */
  icon?: React.ReactNode;
  /** Дополнительный CSS класс */
  className?: string;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  icon,
  className = ''
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {label}
    </span>
  );
}
```

**Шаг 2: Создать стили**

```scss
// src/components/ui/Badge/Badge.module.scss
@use '@/styles/tokens.scss' as *;
@use '@/styles/utilities.scss' as *;

.badge {
  @include flex-center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-full;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  white-space: nowrap;
  width: fit-content;
  transition: $transition-base;
}

// Variants
.default {
  background: $color-gray-200;
  color: $color-text-primary;
}

.success {
  background: lighten($color-success, 40%);
  color: darken($color-success, 20%);
}

.warning {
  background: lighten($color-warning, 40%);
  color: darken($color-warning, 20%);
}

.error {
  background: lighten($color-error, 40%);
  color: darken($color-error, 20%);
}

// Sizes
.sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.md {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.lg {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.icon {
  display: flex;
  align-items: center;
}
```

**Шаг 3: Создать barrel export**

```typescript
// src/components/ui/Badge/index.ts
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
```

**Шаг 4: Использовать компонент**

```typescript
import { Badge } from '@/components/ui/Badge';

export function UserProfile() {
  return (
    <div>
      <Badge label="Pro" variant="success" icon="⭐" />
      <Badge label="Beginner" variant="default" size="sm" />
      <Badge label="Warning" variant="warning" />
    </div>
  );
}
```

---

## 🎯 Добавление новой фичи (Feature-based)

### Пример: Добавить фичу "Badges" (система значков)

**Структура:**

```
src/features/badges/
  ├── api/
  │   └── badgesApi.ts        # RTK Query API
  ├── components/
  │   ├── BadgeCard/
  │   │   ├── BadgeCard.tsx
  │   │   └── BadgeCard.module.scss
  │   ├── BadgeList/
  │   │   ├── BadgeList.tsx
  │   │   └── BadgeList.module.scss
  │   └── BadgeProgress/
  │       ├── BadgeProgress.tsx
  │       └── BadgeProgress.module.scss
  ├── hooks/
  │   ├── useBadgeUnlock.ts
  │   └── useBadgeProgress.ts
  ├── types/
  │   └── index.ts
  ├── utils/
  │   └── checkBadgeCondition.ts
  └── index.ts                # Barrel export
```

**Шаг 1: Создать типы**

```typescript
// src/features/badges/types/index.ts

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  createdAt: string;
}

export interface UserBadge extends Badge {
  earnedAt: string;
}

export interface BadgeProgress {
  badgeId: string;
  current: number;
  required: number;
  percentage: number;
}
```

**Шаг 2: Создать RTK Query API**

```typescript
// src/features/badges/api/badgesApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Badge, UserBadge } from '../types';

export const badgesApi = createApi({
  reducerPath: 'badgesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Badges'],
  endpoints: (builder) => ({
    getUserBadges: builder.query<UserBadge[], void>({
      query: () => '/badges/user',
      providesTags: ['Badges'],
    }),
    getAllBadges: builder.query<Badge[], void>({
      query: () => '/badges',
      providesTags: ['Badges'],
    }),
    unlockBadge: builder.mutation<UserBadge, string>({
      query: (badgeId) => ({
        url: `/badges/${badgeId}/unlock`,
        method: 'POST',
      }),
      invalidatesTags: ['Badges'],
    }),
  }),
});

export const {
  useGetUserBadgesQuery,
  useGetAllBadgesQuery,
  useUnlockBadgeMutation,
} = badgesApi;
```

**Шаг 3: Добавить API в store**

```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { badgesApi } from '@/features/badges/api/badgesApi';

export const store = configureStore({
  reducer: {
    // ... existing reducers
    [badgesApi.reducerPath]: badgesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(badgesApi.middleware),
});
```

**Шаг 4: Создать компонент**

```typescript
// src/features/badges/components/BadgeCard/BadgeCard.tsx
import { UserBadge } from '../../types';
import styles from './BadgeCard.module.scss';

interface BadgeCardProps {
  badge: UserBadge;
  locked?: boolean;
}

export function BadgeCard({ badge, locked = false }: BadgeCardProps) {
  return (
    <div className={`${styles.card} ${locked ? styles.locked : ''}`}>
      <div className={styles.icon}>{badge.icon}</div>
      <h3 className={styles.name}>{badge.name}</h3>
      <p className={styles.description}>{badge.description}</p>
      {!locked && badge.earnedAt && (
        <div className={styles.earnedDate}>
          Получен: {new Date(badge.earnedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
```

**Шаг 5: Создать hook**

```typescript
// src/features/badges/hooks/useBadgeUnlock.ts
import { useEffect } from 'react';
import { useUnlockBadgeMutation } from '../api/badgesApi';
import { checkBadgeCondition } from '../utils/checkBadgeCondition';

export function useBadgeUnlock(userId: string) {
  const [unlockBadge] = useUnlockBadgeMutation();

  useEffect(() => {
    const checkBadges = async () => {
      // Логика проверки условий для разблокировки значков
      const unlockedBadges = await checkBadgeCondition(userId);

      for (const badgeId of unlockedBadges) {
        try {
          await unlockBadge(badgeId);
        } catch (error) {
          console.error('Error unlocking badge:', error);
        }
      }
    };

    checkBadges();
  }, [userId, unlockBadge]);
}
```

**Шаг 6: Barrel export**

```typescript
// src/features/badges/index.ts

// API
export { badgesApi, useGetUserBadgesQuery, useGetAllBadgesQuery } from './api/badgesApi';

// Components
export { BadgeCard } from './components/BadgeCard/BadgeCard';
export { BadgeList } from './components/BadgeList/BadgeList';

// Hooks
export { useBadgeUnlock } from './hooks/useBadgeUnlock';

// Types
export type { Badge, UserBadge, BadgeProgress } from './types';
```

---

## 🔐 Добавление OAuth провайдера

### Пример: Добавить VK OAuth

**Шаг 1: Обновить Prisma схему**

```prisma
// prisma/schema.prisma

model User {
  id       String  @id @default(cuid())
  email    String  @unique
  password String? // Теперь опциональный для OAuth
  name     String?
  image    String? // Аватар из OAuth

  // NextAuth OAuth
  accounts Account[]
  sessions Session[]

  // ... existing fields
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Шаг 2: Создать миграцию**

```bash
npx prisma migrate dev --name add_oauth_models
```

**Шаг 3: Установить провайдер**

```bash
npm install @auth/core
```

**Шаг 4: Обновить NextAuth конфигурацию**

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import VkProvider from 'next-auth/providers/vk';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Credentials (existing)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // ... existing logic
      },
    }),

    // VK OAuth (new)
    VkProvider({
      clientId: process.env.VK_CLIENT_ID!,
      clientSecret: process.env.VK_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

**Шаг 5: Обновить .env**

```env
# VK OAuth
VK_CLIENT_ID=your_vk_client_id
VK_CLIENT_SECRET=your_vk_client_secret
```

**Шаг 6: Добавить кнопку в UI**

```typescript
// src/components/auth/LoginForm.tsx
import { signIn } from 'next-auth/react';

export function LoginForm() {
  const handleVkLogin = () => {
    signIn('vk', { callbackUrl: '/dashboard' });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        {/* ... existing email/password fields */}

        <Button type="submit" fullWidth>
          Войти
        </Button>

        <div className={styles.divider}>или</div>

        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={handleVkLogin}
        >
          <VkIcon /> Войти через ВКонтакте
        </Button>
      </form>
    </Card>
  );
}
```

---

## 🔄 Добавление Redux slice

### Пример: Добавить Notifications slice

**Шаг 1: Создать slice**

```typescript
// src/store/notificationsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationsState {
  notifications: Notification[];
}

const initialState: NotificationsState = {
  notifications: [],
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = `${Date.now()}-${Math.random()}`;
      state.notifications.push({
        id,
        ...action.payload,
        duration: action.payload.duration || 5000,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearNotifications } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;
```

**Шаг 2: Добавить в store**

```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import pomodoroReducer from './pomodoroSlice';
import notificationsReducer from './notificationsSlice';

export const store = configureStore({
  reducer: {
    pomodoro: pomodoroReducer,
    notifications: notificationsReducer,
    // ... other reducers
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Шаг 3: Создать хелпер**

```typescript
// src/store/notificationsHelpers.ts
import { store } from './store';
import { addNotification } from './notificationsSlice';

export const notify = {
  success: (message: string) => {
    store.dispatch(addNotification({ type: 'success', message }));
  },
  error: (message: string) => {
    store.dispatch(addNotification({ type: 'error', message }));
  },
  info: (message: string) => {
    store.dispatch(addNotification({ type: 'info', message }));
  },
  warning: (message: string) => {
    store.dispatch(addNotification({ type: 'warning', message }));
  },
};
```

**Шаг 4: Создать компонент**

```typescript
// src/components/notifications/NotificationsProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeNotification } from '@/store/notificationsSlice';
import styles from './Notifications.module.scss';

export function NotificationsProvider() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.notifications);

  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]}`}
        >
          <span>{notification.message}</span>
          <button onClick={() => dispatch(removeNotification(notification.id))}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Шаг 5: Использовать**

```typescript
import { notify } from '@/store/notificationsHelpers';

export function TestResults() {
  const handleSave = async () => {
    try {
      await saveResults();
      notify.success('Результаты сохранены!');
    } catch (error) {
      notify.error('Ошибка сохранения');
    }
  };

  return <button onClick={handleSave}>Сохранить</button>;
}
```

---

## ✅ Best Practices

### 1. TypeScript

```typescript
// ✅ ХОРОШО: строгая типизация
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

function updateProfile(profile: UserProfile): Promise<void> {
  // ...
}

// ❌ ПЛОХО: any типы
function updateProfile(profile: any) {
  // ...
}
```

### 2. Error Handling

```typescript
// ✅ ХОРОШО: централизованная обработка ошибок
try {
  const data = await fetchData();
  return NextResponse.json(data);
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// ❌ ПЛОХО: игнорирование ошибок
const data = await fetchData();
return NextResponse.json(data);
```

### 3. React Hooks Dependencies

```typescript
// ✅ ХОРОШО: все зависимости указаны
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ❌ ПЛОХО: пропущены зависимости
useEffect(() => {
  fetchData(userId);
}, []); // userId не указан!
```

### 4. Component Structure

```typescript
// ✅ ХОРОШО: разделение на Server и Client
// page.tsx (Server Component)
export default function TestsPage() {
  return <TestsPageContent />;
}

// TestsPageContent.tsx (Client Component)
'use client';
export function TestsPageContent() {
  const [state, setState] = useState();
  // ...
}

// ❌ ПЛОХО: использование 'use client' в page.tsx
'use client';
export default function TestsPage() {
  const [state, setState] = useState();
  // ...
}
```

### 5. Database Queries

```typescript
// ✅ ХОРОШО: оптимизированный запрос с select
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    name: true
  }
});

// ❌ ПЛОХО: получение всех полей
const user = await prisma.user.findUnique({
  where: { email }
});
```

### 6. CSS Modules

```scss
// ✅ ХОРОШО: использование design tokens
.button {
  padding: $spacing-md;
  background: $color-primary;
  border-radius: $border-radius-md;
}

// ❌ ПЛОХО: хардкод значений
.button {
  padding: 16px;
  background: #667eea;
  border-radius: 8px;
}
```

---

## 📝 Чек-лист для новой фичи

Перед созданием Pull Request проверьте:

- [ ] TypeScript типы добавлены и корректны
- [ ] Prisma схема обновлена (если нужна новая модель)
- [ ] Миграции созданы и применены
- [ ] API endpoints защищены аутентификацией
- [ ] Обработка ошибок реализована
- [ ] CSS Modules используют design tokens
- [ ] Компоненты разделены на Server/Client
- [ ] Responsive дизайн реализован
- [ ] Barrel exports созданы (index.ts)
- [ ] Код следует существующим паттернам
- [ ] Консоль без ошибок и предупреждений
- [ ] Build проходит без ошибок (`npm run build`)

---

**Документ обновлен:** 2026-01-28
**Версия:** 1.0
