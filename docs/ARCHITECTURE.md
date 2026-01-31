# Архитектура REST API Trainer

> **Версия документа:** 1.0
> **Дата:** 2026-01-28
> **Для:** Разработчиков и AI-ассистентов

Этот документ описывает полную архитектуру приложения REST API Trainer: структуру проекта, паттерны проектирования, технологический стек и принципы разработки.

---

## 📋 Содержание

1. [Технологический стек](#технологический-стек)
2. [Структура проекта](#структура-проекта)
3. [Архитектурные паттерны](#архитектурные-паттерны)
4. [Модели данных](#модели-данных)
5. [Аутентификация и авторизация](#аутентификация-и-авторизация)
6. [State Management](#state-management)
7. [Стилизация](#стилизация)
8. [API Routes](#api-routes)
9. [Система тестирования](#система-тестирования)

---

## 🛠 Технологический стек

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript (strict mode)
- **Styling:** CSS Modules + SCSS
- **State Management:** Redux Toolkit (Pomodoro) + useState/useContext

### Backend
- **Runtime:** Next.js API Routes (Node.js)
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 5
- **Authentication:** NextAuth.js v4
- **Password Hashing:** bcryptjs

### Development Tools
- **Package Manager:** npm
- **Linting:** ESLint
- **Database GUI:** Prisma Studio
- **Scripts:** TypeScript (tsx)

---

## 📁 Структура проекта

```
rest-api-trainer/
├── src/
│   ├── app/                          # Next.js 16 App Router
│   │   ├── (auth)/                   # Route Group: публичные страницы
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Страница входа
│   │   │   └── register/
│   │   │       └── page.tsx          # Страница регистрации
│   │   │
│   │   ├── (dashboard)/              # Route Group: защищенные страницы
│   │   │   ├── layout.tsx            # Shared layout с DashboardHeader
│   │   │   ├── dashboard/            # Главная страница
│   │   │   ├── tests/                # Список тестов и прохождение
│   │   │   │   ├── page.tsx          # Список тестов (Server Component)
│   │   │   │   ├── TestsPageContent.tsx  # Client Component
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Test wrapper (Server)
│   │   │   │       └── TestPageContent.tsx  # Client Component
│   │   │   ├── combined-test/        # Комбинированные тесты
│   │   │   ├── lectures/             # Список лекций
│   │   │   ├── results/              # История результатов
│   │   │   ├── pomodoro/             # Страница Pomodoro таймера
│   │   │   └── my-lists/             # Пользовательские списки
│   │   │
│   │   ├── api/                      # API Routes (Backend)
│   │   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   │   ├── register/             # POST /api/register
│   │   │   ├── tests/                # CRUD тестов
│   │   │   │   ├── route.ts          # GET /api/tests
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET /api/tests/[id]
│   │   │   │       └── submit/
│   │   │   │           └── route.ts  # POST /api/tests/[id]/submit
│   │   │   ├── results/              # История тестов
│   │   │   ├── lectures/             # API лекций
│   │   │   ├── categories/           # API категорий
│   │   │   ├── pomodoro/             # Сохранение Pomodoro сессий
│   │   │   └── user-lists/           # CRUD пользовательских списков
│   │   │
│   │   ├── layout.tsx                # Root layout (Providers)
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Глобальные стили
│   │
│   ├── components/                   # React компоненты
│   │   ├── auth/                     # LoginForm, RegisterForm
│   │   ├── layout/                   # DashboardHeader, Navigation
│   │   ├── pomodoro/                 # PomodoroTimer, PomodoroWidget
│   │   ├── lecture/                  # LectureModal
│   │   ├── lists/                    # AddToListModal
│   │   ├── providers/                # SessionProvider, ReduxProvider
│   │   └── ui/                       # Button, Input, Card (UI Kit)
│   │
│   ├── features/                     # Feature-based modules (NEW!)
│   │   └── tests/                    # Тестирование (Feature)
│   │       ├── api/                  # RTK Query API
│   │       │   └── testsApi.ts
│   │       ├── components/           # UI компоненты feature
│   │       │   ├── TestHeader/
│   │       │   ├── TestQuestion/
│   │       │   ├── TestNavigation/
│   │       │   ├── TestModeSelector/
│   │       │   ├── TestRestoreDialog/
│   │       │   ├── TestResults/
│   │       │   └── ExamExitConfirmModal/
│   │       ├── hooks/                # Custom hooks
│   │       │   ├── useTestTimer.ts
│   │       │   ├── useTestProgress.ts
│   │       │   └── useTestSubmit.ts
│   │       ├── types/                # TypeScript типы
│   │       │   └── index.ts
│   │       ├── utils/                # Утилиты
│   │       │   └── calculateCombinedTestScores.ts
│   │       └── index.ts              # Barrel export
│   │
│   ├── store/                        # Redux Toolkit
│   │   ├── store.ts                  # Конфигурация store
│   │   ├── pomodoroSlice.ts          # Pomodoro state
│   │   ├── userListsSlice.ts         # Пользовательские списки
│   │   ├── hooks.ts                  # useAppDispatch, useAppSelector
│   │   └── localStorage.ts           # Persistence
│   │
│   ├── contexts/                     # React Context
│   │   └── PomodoroContext.tsx       # Синхронизация между вкладками
│   │
│   ├── lib/                          # Утилиты и конфигурации
│   │   ├── prisma.ts                 # Singleton Prisma Client
│   │   ├── auth.ts                   # NextAuth конфигурация
│   │   ├── bcrypt.ts                 # hashPassword, verifyPassword
│   │   └── utils.ts                  # shuffleArray, shuffleOptions
│   │
│   ├── types/                        # Глобальные TypeScript типы
│   │   ├── index.ts
│   │   └── next-auth.d.ts            # Расширение NextAuth типов
│   │
│   ├── styles/                       # Глобальные стили
│   │   ├── tokens.scss               # Design tokens (цвета, шрифты)
│   │   └── utilities.scss            # Миксины и утилиты
│   │
│   └── middleware.ts                 # NextAuth middleware
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Seed скрипт
│
├── scripts/                          # TypeScript скрипты (40+)
│   ├── create-profession-marathons.ts
│   ├── create-example-collections.ts
│   └── ...
│
├── docs/                             # Документация
│   ├── ARCHITECTURE.md               # 👈 Этот документ
│   ├── FEATURE_DEVELOPMENT_GUIDE.md  # Руководство по добавлению фич
│   ├── DATABASE_COMPLETE_GUIDE.md    # Работа с БД
│   ├── LECTURE_CREATION_GUIDE.md     # Создание лекций
│   └── QUESTION_CREATION_GUIDE.md    # Создание вопросов
│
├── public/                           # Статические файлы
│   └── sounds/                       # Звуки для Pomodoro
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env                              # Environment variables (не в git)
└── CLAUDE.md                         # Инструкции для Claude Code
```

---

## 🏛 Архитектурные паттерны

### 1. Next.js App Router (File-based Routing)

**Route Groups** используются для организации страниц:

```typescript
// (auth) - публичные страницы БЕЗ DashboardHeader
app/(auth)/
  ├── login/page.tsx      → /login
  └── register/page.tsx   → /register

// (dashboard) - защищенные страницы С DashboardHeader
app/(dashboard)/
  ├── layout.tsx          → Shared layout
  ├── dashboard/page.tsx  → /dashboard
  └── tests/page.tsx      → /tests
```

**Server vs Client Components:**

```typescript
// ❌ НЕ ПРАВИЛЬНО: страница напрямую использует useState
export default function TestsPage() {
  const [filter, setFilter] = useState('');  // Ошибка!
}

// ✅ ПРАВИЛЬНО: Server Component → Client Component
// page.tsx (Server Component)
export default function TestsPage() {
  return <TestsPageContent />;  // Client Component
}

// TestsPageContent.tsx (Client Component)
'use client';
export function TestsPageContent() {
  const [filter, setFilter] = useState('');
}
```

### 2. Feature-Based Architecture (FSD-inspired)

Новые фичи организуются по папкам:

```
features/tests/
  ├── api/           # RTK Query endpoints
  ├── components/    # UI компоненты
  ├── hooks/         # Custom hooks
  ├── types/         # TypeScript типы
  ├── utils/         # Утилиты
  └── index.ts       # Barrel export
```

**Принципы:**
- ✅ Инкапсуляция: вся логика фичи в одной папке
- ✅ Переиспользование: экспорт через barrel file
- ✅ Тестируемость: изолированные модули

### 3. Many-to-Many Database Relations

**Junction Tables** для гибкости:

```prisma
// Test ↔ Question (Many-to-Many)
model TestQuestion {
  testId     String
  questionId String
  order      Int      // Порядок вопроса в тесте

  test       Test     @relation(...)
  question   Question @relation(...)
}

// Category ↔ Test (Many-to-Many)
model CategoryTest {
  categoryId String
  testId     String
  order      Int      // Порядок теста в категории

  category   Category @relation(...)
  test       Test     @relation(...)
}
```

**Преимущества:**
- Один вопрос в нескольких тестах (без дублирования)
- Один тест в нескольких категориях
- Кастомный порядок для каждой связи

### 4. CSS Modules Pattern

```typescript
// Component.tsx
import styles from './Component.module.scss';

export function Component() {
  return (
    <div className={styles.container}>
      <button className={styles.primaryButton}>Click</button>
    </div>
  );
}
```

```scss
// Component.module.scss
@use '@/styles/tokens.scss' as *;

.container {
  padding: $spacing-lg;
  background: $color-background;
}

.primaryButton {
  background: $color-primary;
  color: white;
  border-radius: $border-radius-md;
}
```

### 5. API Routes Authentication Pattern

```typescript
// api/some-endpoint/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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

  // 3. Бизнес-логика
  const data = await prisma.someModel.findMany({
    where: { userId: user.id }
  });

  return NextResponse.json(data);
}
```

---

## 🗄 Модели данных

### Основные модели

```prisma
model User {
  id               String   @id @default(cuid())
  email            String   @unique
  password         String
  name             String?
  skipTasksWarning Boolean  @default(false)

  // Relations
  testResults         TestResult[]
  pomodoroSessions    PomodoroSession[]
  testLists           UserTestList[]
  combinedTestResults CombinedTestResult[]
  taskProgress        LectureTaskProgress[]
}

model Category {
  id          String @id @default(cuid())
  name        String @unique
  slug        String @unique
  description String
  icon        String
  order       Int

  // Иерархия (опционально)
  parentId String?
  parent   Category?  @relation("CategoryHierarchy", ...)
  children Category[] @relation("CategoryHierarchy")

  // Many-to-Many с тестами
  tests CategoryTest[]
}

model Test {
  id          String     @id @default(cuid())
  title       String
  description String
  difficulty  Difficulty  // ENUM: beginner | intermediate | advanced
  tags        String[]    // ["system-analyst", "qa-engineer", ...]

  // Many-to-Many связи
  categories  CategoryTest[]
  collections CollectionTest[]
  questions   TestQuestion[]
  results     TestResult[]
  userLists   UserTestListItem[]
}

model Question {
  id            String   @id @default(cuid())
  question      String
  options       Json      // ["Option A", "Option B", ...]
  correctAnswer Int       // Index правильного ответа
  explanation   String
  lectureId     String?
  lecture       Lecture? @relation(...)

  tests         TestQuestion[]
}

model Lecture {
  id               String  @id @default(cuid())
  title            String
  topic            String
  content          String  @db.Text  // Markdown
  scenariosContent String? @db.Text  // Markdown (вкладка)
  exampleContent   String? @db.Text  // Markdown (вкладка)
  tasksContent     String? @db.Text  // Markdown (вкладка)

  questions    Question[]
  taskProgress LectureTaskProgress[]
}
```

### Junction Tables

```prisma
// Test ↔ Question
model TestQuestion {
  id         String @id @default(cuid())
  testId     String
  questionId String
  order      Int

  test     Test     @relation(...)
  question Question @relation(...)

  @@unique([testId, questionId])
  @@index([testId, order])
}

// Category ↔ Test
model CategoryTest {
  id         String @id @default(cuid())
  categoryId String
  testId     String
  order      Int

  category Category @relation(...)
  test     Test     @relation(...)

  @@unique([categoryId, testId])
  @@index([categoryId, order])
}

// Collection ↔ Test (для коллекций тестов)
model CollectionTest {
  id           String  @id @default(cuid())
  collectionId String
  testId       String
  order        Int
  isRequired   Boolean @default(true)

  collection Collection @relation(...)
  test       Test       @relation(...)

  @@unique([collectionId, testId])
  @@index([collectionId, order])
}

// UserTestList ↔ Test (для пользовательских списков)
model UserTestListItem {
  id     String @id @default(cuid())
  listId String
  testId String
  order  Int

  list UserTestList @relation(...)
  test Test         @relation(...)

  @@unique([listId, testId])
  @@index([listId, order])
}
```

### Результаты тестов

```prisma
model TestResult {
  id          String   @id @default(cuid())
  userId      String
  testId      String
  answers     Json      // [0, 2, 1, ...] - индексы выбранных ответов
  score       Int       // 0-100
  mode        TestMode  // ENUM: learning | exam
  completedAt DateTime @default(now())

  user User @relation(...)
  test Test @relation(...)

  @@index([userId])
  @@index([userId, completedAt])
  @@index([testId, score])
}

model CombinedTestResult {
  id       String @id @default(cuid())
  userId   String
  listName String
  testIds  String[]  // ["test-id-1", "test-id-2", ...]

  totalScore     Int
  totalQuestions Int
  correctAnswers Int

  // Детализация по тестам
  testScores Json  // { "testId": { "score": 85, "correct": 17, "total": 20 } }

  completedAt DateTime @default(now())
  user        User     @relation(...)
}
```

---

## 🔐 Аутентификация и авторизация

### NextAuth.js Configuration

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 1. Проверка credentials
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Введите email и пароль');
        }

        // 2. Поиск пользователя
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Пользователь не найден');
        }

        // 3. Проверка пароля
        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error('Неверный пароль');
        }

        // 4. Возврат user объекта
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',  // JWT токены (без БД)
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Добавляем user.id в JWT токен
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Добавляем id в session.user
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### Middleware Protection

```typescript
// src/middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tests/:path*',
    '/results/:path*',
    '/pomodoro/:path*',
    '/lectures/:path*',
    '/my-lists/:path*'
  ]
};
```

### Client-side Session

```typescript
'use client';
import { useSession } from 'next-auth/react';

export function ProtectedComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Загрузка...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Доступ запрещен</div>;
  }

  return <div>Привет, {session?.user?.name}!</div>;
}
```

---

## 🔄 State Management

### Redux Toolkit (Глобальное состояние)

Используется для:
- ⏱️ Pomodoro таймер
- 📝 Пользовательские списки (кэш)

```typescript
// store/pomodoroSlice.ts
interface PomodoroState {
  mode: 'work' | 'short_break' | 'long_break';
  timeLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
  endTime: number | null;
}

export const pomodoroSlice = createSlice({
  name: 'pomodoro',
  initialState,
  reducers: {
    startTimer: (state) => {
      state.isRunning = true;
      state.endTime = Date.now() + state.timeLeft * 1000;
    },
    pauseTimer: (state) => {
      state.isRunning = false;
      state.endTime = null;
    },
    tick: (state) => {
      if (state.isRunning && state.endTime) {
        const remaining = Math.max(
          0,
          Math.ceil((state.endTime - Date.now()) / 1000)
        );
        state.timeLeft = remaining;
      }
    },
    // ...
  },
});
```

**Typed Hooks:**

```typescript
// store/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

**Usage:**

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { startTimer, pauseTimer } from '@/store/pomodoroSlice';

export function PomodoroTimer() {
  const dispatch = useAppDispatch();
  const { timeLeft, isRunning } = useAppSelector((state) => state.pomodoro);

  const handleStart = () => dispatch(startTimer());
  const handlePause = () => dispatch(pauseTimer());

  return (
    <div>
      <div>{timeLeft}s</div>
      <button onClick={isRunning ? handlePause : handleStart}>
        {isRunning ? 'Пауза' : 'Старт'}
      </button>
    </div>
  );
}
```

### useState + sessionStorage (Локальное состояние)

Используется для:
- 📚 Прогресс теста
- 📖 Состояние лекций

```typescript
// Автосохранение в sessionStorage
useEffect(() => {
  if (testStarted && testId && !showResults) {
    const testState = {
      userAnswers,
      currentQuestionIndex,
      selectedAnswer,
      testMode,
      timeLeft,
      endTime
    };
    sessionStorage.setItem(`test_${testId}_state`, JSON.stringify(testState));
  }
}, [testStarted, userAnswers, currentQuestionIndex, testMode, timeLeft]);

// Восстановление при монтировании
useEffect(() => {
  if (testId && !testStarted) {
    const savedStateStr = sessionStorage.getItem(`test_${testId}_state`);
    if (savedStateStr) {
      const state = JSON.parse(savedStateStr);
      // Восстановление состояния...
    }
  }
}, [testId]);
```

---

## 🎨 Стилизация

### Design Tokens

```scss
// src/styles/tokens.scss

// Colors
$color-primary: #667eea;
$color-primary-dark: #5568d3;
$color-primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

$color-success: #10b981;
$color-error: #ef4444;
$color-warning: #f59e0b;
$color-info: #3b82f6;

$color-text-primary: #111827;
$color-text-secondary: #6b7280;
$color-background: #ffffff;
$color-background-secondary: #f9fafb;
$color-border: #e5e7eb;

// Spacing
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px

// Typography
$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px
$font-size-xl: 1.5rem;     // 24px
$font-size-2xl: 2rem;      // 32px

$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

// Border Radius
$border-radius-sm: 4px;
$border-radius-md: 8px;
$border-radius-lg: 12px;
$border-radius-xl: 16px;
$border-radius-circle: 50%;

// Shadows
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

// Transitions
$transition-fast: 0.15s ease;
$transition-base: 0.2s ease;
$transition-slow: 0.3s ease;
```

### Utilities Mixins

```scss
// src/styles/utilities.scss
@use './tokens.scss' as *;

// Flexbox
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

// Button Base
@mixin button-base {
  padding: $spacing-md $spacing-lg;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  border: none;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-base;
}

// Responsive
@mixin mobile {
  @media (max-width: 768px) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: 769px) and (max-width: 1024px) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: 1025px) {
    @content;
  }
}
```

### Component Example

```scss
// Component.module.scss
@use '@/styles/tokens.scss' as *;
@use '@/styles/utilities.scss' as *;

.container {
  @include flex-column;
  gap: $spacing-lg;
  padding: $spacing-xl;
  background: $color-background;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;

  @include mobile {
    padding: $spacing-md;
  }
}

.button {
  @include button-base;
  background: $color-primary-gradient;
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

---

## 🔌 API Routes

### REST API Conventions

```
GET    /api/tests           # Получить список тестов
GET    /api/tests/[id]      # Получить тест по ID
POST   /api/tests/[id]/submit  # Отправить результат теста
GET    /api/results         # Получить историю результатов
POST   /api/register        # Регистрация пользователя
GET    /api/lectures        # Получить список лекций
```

### Example: GET /api/tests/[id]

```typescript
// app/api/tests/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shuffleArray, shuffleOptions } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Получение теста из БД
    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        },
        categories: {
          include: { category: true }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // 3. Перемешивание вопросов и ответов
    const questions = test.questions.map((tq) => {
      const { question } = tq;
      const { options, correctAnswer } = shuffleOptions(
        question.options as string[],
        question.correctAnswer
      );
      return {
        id: question.id,
        question: question.question,
        options,
        correctAnswer,
        explanation: question.explanation,
      };
    });

    const shuffledQuestions = shuffleArray(questions);

    // 4. Формирование ответа
    return NextResponse.json({
      id: test.id,
      title: test.title,
      description: test.description,
      difficulty: test.difficulty,
      questions: shuffledQuestions,
      categories: test.categories.map((ct) => ({
        id: ct.category.id,
        name: ct.category.name,
        slug: ct.category.slug,
      })),
    });

  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Example: POST /api/tests/[id]/submit

```typescript
// app/api/tests/[id]/submit/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // 2. Парсинг body
    const { answers, mode } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Invalid answers format' },
        { status: 400 }
      );
    }

    // 3. Получение теста для проверки
    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // 4. Подсчет правильных ответов
    let correctCount = 0;
    test.questions.forEach((tq, index) => {
      if (answers[index] === tq.question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / test.questions.length) * 100);

    // 5. Сохранение результата (только для exam mode)
    if (mode === 'exam') {
      await prisma.testResult.create({
        data: {
          userId: user.id,
          testId: test.id,
          answers,
          score,
          mode,
        }
      });
    }

    // 6. Возврат результата
    return NextResponse.json({
      score,
      correctCount,
      totalQuestions: test.questions.length,
    });

  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Система тестирования

### Два режима прохождения

**Learning Mode (Режим обучения):**
- ⏱️ Без ограничения по времени
- 📚 Доступ к лекциям во время теста
- ❌ Результаты НЕ сохраняются в БД
- ✅ Автосохранение прогресса (sessionStorage)
- ✅ Можно продолжить после перезагрузки (с диалогом)

**Exam Mode (Режим экзамена):**
- ⏱️ **20 секунд на каждый вопрос**
- ❌ Нет доступа к лекциям
- ✅ Результаты сохраняются в БД
- ✅ Автосохранение прогресса (sessionStorage)
- ✅ Автоматическое продолжение при перезагрузке (без диалога)
- ⚠️ Модал подтверждения при попытке выхода

### Timer Pattern (endTime approach)

```typescript
// При старте таймера
const examDuration = test.questions.length * 20; // секунды
const endTime = Date.now() + examDuration * 1000;
setEndTime(endTime);

// При каждом tick
useEffect(() => {
  if (testMode === 'exam' && testStarted && !showResults) {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = endTime
        ? Math.max(0, Math.ceil((endTime - now) / 1000))
        : 0;

      setTimeLeft(remaining);

      if (remaining === 0) {
        // Время истекло - автосабмит
        submitTest(userAnswers);
      }
    }, 1000);

    return () => clearInterval(interval);
  }
}, [testMode, testStarted, showResults, endTime]);
```

**Преимущества endTime:**
- ✅ Нет drift (точность)
- ✅ Работает при перезагрузке страницы
- ✅ Синхронизация между вкладками

### Progress Auto-save

```typescript
// Автосохранение
useEffect(() => {
  if (testStarted && testId && !showResults) {
    const testState = {
      userAnswers,
      currentQuestionIndex,
      selectedAnswer,
      testMode,
      timeLeft,
      endTime
    };
    sessionStorage.setItem(`test_${testId}_state`, JSON.stringify(testState));
  }
}, [testStarted, userAnswers, currentQuestionIndex, testMode, timeLeft]);

// Восстановление (learning mode - показать диалог)
useEffect(() => {
  if (testId && !testStarted && !showRestoreDialog) {
    const savedStateStr = sessionStorage.getItem(`test_${testId}_state`);

    if (savedStateStr) {
      const state = JSON.parse(savedStateStr);

      if (state.testMode === 'learning') {
        setSavedState(state);
        setShowRestoreDialog(true);  // Показать диалог
      } else if (state.testMode === 'exam') {
        // Проверка времени
        const remaining = state.endTime
          ? Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000))
          : 0;

        if (remaining > 0) {
          setSavedState(state);
          // НЕ показываем диалог - авто-восстановление
        } else {
          sessionStorage.removeItem(`test_${testId}_state`);
        }
      }
    }
  }
}, [testId, testStarted, showRestoreDialog]);

// Автовосстановление exam mode
useEffect(() => {
  if (savedState && savedState.testMode === 'exam' && !testStarted) {
    restoreProgress();
    setTestMode(savedState.testMode);
    setTestStarted(true);
    if (savedState.endTime) {
      setEndTime(savedState.endTime);
    }
  }
}, [savedState, testStarted]);
```

### Question and Options Shuffling

```typescript
// src/lib/utils.ts

// Fisher-Yates Shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Shuffle options + adjust correctAnswer index
export function shuffleOptions(
  options: string[],
  correctAnswer: number
): { options: string[]; correctAnswer: number } {
  const correctOption = options[correctAnswer];
  const shuffled = shuffleArray(options);
  const newCorrectIndex = shuffled.indexOf(correctOption);

  return {
    options: shuffled,
    correctAnswer: newCorrectIndex,
  };
}
```

---

## 📝 Заключение

Эта архитектура обеспечивает:

✅ **Масштабируемость** - Feature-based структура
✅ **Производительность** - Server Components + Client Components разделение
✅ **Безопасность** - NextAuth + Middleware protection
✅ **Гибкость** - Many-to-Many relations
✅ **Поддерживаемость** - TypeScript + четкие паттерны

**Следующий шаг:** [FEATURE_DEVELOPMENT_GUIDE.md](./FEATURE_DEVELOPMENT_GUIDE.md) - как добавлять новые фичи

---

**Документ обновлен:** 2026-01-28
**Версия:** 1.0
