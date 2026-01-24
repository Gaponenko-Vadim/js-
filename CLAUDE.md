# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Основные команды

### Разработка
```bash
npm run dev          # Запуск dev сервера на http://localhost:3000
npm run build        # Production сборка
npm run start        # Запуск production сервера
npm run lint         # ESLint проверка
```

### База данных (Prisma + PostgreSQL)
```bash
npx prisma migrate dev           # Создать и применить миграции
npx prisma db push              # Синхронизировать схему с БД (без миграций)
npx prisma generate             # Регенерировать Prisma Client после изменения schema
npx prisma studio               # Визуальный редактор БД на http://localhost:5555
npm run seed                    # Заполнить БД начальными данными (тестами)
```

### Скрипты для работы с контентом
```bash
# Примеры скриптов в scripts/ (40 шт., используются как шаблоны)
npx tsx scripts/create-profession-marathons.ts    # Создать марафоны для профессий
npx tsx scripts/create-example-collections.ts     # Создать коллекции тестов
npx tsx scripts/create-categories-and-requirements.ts  # Настроить категории

# Шаблоны для создания контента (см. docs/)
# - LECTURE_CREATION_GUIDE.md - как создавать лекции
# - QUESTION_CREATION_GUIDE.md - как создавать вопросы и тесты
# - MANY_TO_MANY_USAGE.md - работа с Many-to-Many связями
```

## Архитектура проекта

### Технологический стек
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** CSS Modules + SCSS
- **State Management:** Redux Toolkit (Pomodoro) + Context API
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js (Credentials provider) + bcryptjs

### Структура директорий

```
src/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Route group: незащищенные страницы (login, register)
│   ├── (dashboard)/          # Route group: защищенные страницы (dashboard, tests, pomodoro, results)
│   ├── api/                  # API Routes
│   │   ├── auth/             # NextAuth endpoints
│   │   ├── tests/            # CRUD для тестов
│   │   ├── results/          # Результаты тестов
│   │   ├── pomodoro/         # Сохранение Pomodoro сессий
│   │   └── lectures/         # Получение лекций по вопросам
│   ├── layout.tsx            # Корневой layout с провайдерами
│   └── page.tsx              # Landing page (/)
├── components/
│   ├── auth/                 # LoginForm, RegisterForm
│   ├── layout/               # DashboardHeader с навигацией
│   ├── pomodoro/             # PomodoroTimer, PomodoroWidget, PomodoroTitleUpdater
│   ├── lecture/              # LectureModal для отображения теории
│   ├── providers/            # SessionProvider, ReduxProvider
│   └── ui/                   # Button, Input, Card
├── store/                    # Redux Toolkit store
│   ├── store.ts              # Конфигурация store с localStorage sync
│   ├── pomodoroSlice.ts      # Pomodoro state (mode, timeLeft, isRunning, completedPomodoros)
│   ├── hooks.ts              # Typed useAppDispatch, useAppSelector
│   └── localStorage.ts       # Сохранение/загрузка Redux state в localStorage
├── contexts/                 # PomodoroContext для синхронизации между вкладками
├── lib/                      # Утилиты
│   ├── prisma.ts             # Singleton Prisma Client
│   ├── auth.ts               # NextAuth authOptions configuration
│   ├── bcrypt.ts             # hashPassword, verifyPassword
│   └── utils.ts              # shuffleArray, shuffleOptions (Fisher-Yates)
├── types/
│   ├── index.ts              # Общие типы
│   └── next-auth.d.ts        # Расширение NextAuth типов
└── middleware.ts             # withAuth middleware (защита /dashboard, /tests, /pomodoro, /results)
```

### Ключевые архитектурные паттерны

#### 1. Many-to-Many связь Test ↔ Question
**Таблицы:**
- `Test` - тесты по темам REST API
- `Question` - уникальные вопросы (383 шт)
- `TestQuestion` - junction table со связями testId + questionId + order

**Зачем:** Один вопрос может использоваться в нескольких тестах без дублирования. Марафонский тест включает все 383 уникальных вопроса.

**Prisma запрос:**
```typescript
const test = await prisma.test.findUnique({
  where: { id },
  include: {
    questions: {
      include: { question: true },
      orderBy: { order: 'asc' }
    }
  }
});
```

#### 1.1. Many-to-Many архитектура для Category ↔ Test ↔ Collection

**ВАЖНО:** Проект использует Many-to-Many архитектуру для связи тестов с категориями и коллекциями.

**Таблицы:**
- `Category` - категории тестов (REST API, Требования к ПО)
- `Test` - тесты
- `CategoryTest` - junction table (categoryId, testId, order)
- `Collection` - коллекции (программы обучения для разных профессий)
- `CollectionTest` - junction table (collectionId, testId, order, isRequired)

**Преимущества:**
- ✅ Один тест может быть в нескольких категориях
- ✅ Тесты можно группировать в коллекции (например, "Всё для системного аналитика")
- ✅ Порядок тестов настраивается индивидуально для каждой категории/коллекции
- ✅ Нет дублирования данных

**Prisma запросы:**
```typescript
// Получить тесты категории с сортировкой
const categoryTests = await prisma.categoryTest.findMany({
  where: { categoryId: category.id },
  include: {
    test: {
      include: {
        categories: {
          include: {
            category: { select: { id: true, slug: true, name: true, icon: true } }
          }
        }
      }
    }
  },
  orderBy: { order: 'asc' }
});

// Получить категории теста
const test = await prisma.test.findUnique({
  where: { id },
  include: {
    categories: {
      include: { category: true }
    }
  }
});
```

**Документация:** См. `docs/MANY_TO_MANY_USAGE.md` для подробных примеров и best practices.

#### 2. Перемешивание вопросов и ответов (src/lib/utils.ts)
- Каждый раз при загрузке теста порядок вопросов и вариантов ответов перемешивается
- Используется Fisher-Yates shuffle algorithm
- `shuffleOptions()` корректирует индекс правильного ответа после перемешивания
- `shuffleArray()` перемешивает массив вопросов

#### 3. NextAuth с Credentials Provider (src/lib/auth.ts)
- JWT strategy (сессии не хранятся в БД)
- Пароли хешируются через bcryptjs (10 rounds)
- Callbacks: `jwt()` добавляет user.id в token, `session()` добавляет id в session.user

#### 4. Middleware защита (src/middleware.ts)
```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/pomodoro/:path*', '/tests/:path*', '/results/:path*']
};
```
Все защищенные маршруты требуют авторизации, иначе редирект на `/login`.

#### 5. Redux Toolkit для управления состоянием (src/store/)

**ВАЖНО:** В проекте настроен и доступен Redux Toolkit. Можно использовать для управления глобальным состоянием где это необходимо.

**Текущее использование:**
- ⏱️ **Pomodoro таймер** - единственная часть приложения на Redux

**Redux Store структура:**
- **State:** mode (work/short_break/long_break), timeLeft, isRunning, completedPomodoros, endTime
- **Actions:** startTimer, pauseTimer, tick, resetTimer, switchMode, completeTimer
- **Persistence:** localStorage sync через middleware (src/store/localStorage.ts)
- **Синхронизация:** PomodoroContext + BroadcastChannel для синхронизации между вкладками

**Где НЕ используется Redux (локальное состояние через useState):**
- 📚 Тесты - состояние управляется через `useState` + sessionStorage
- 📖 Лекции - состояние управляется через `useState`
- ✅ Прогресс теста - сохраняется в sessionStorage

**Если нужно добавить новое глобальное состояние:**
1. Создать новый slice в `src/store/` (например, `testsSlice.ts`)
2. Добавить reducer в `src/store/store.ts`
3. Использовать typed hooks: `useAppDispatch`, `useAppSelector` из `src/store/hooks.ts`
4. Опционально: настроить localStorage persistence (см. `src/store/localStorage.ts`)

**endTime pattern (для таймеров):**
При старте таймера устанавливается `endTime = Date.now() + timeLeft * 1000`. При каждом tick вычисляется реальное оставшееся время: `remaining = Math.max(0, Math.ceil((endTime - now) / 1000))`. Это предотвращает drift и гарантирует точность таймера.

#### 6. Lecture System (Feature: Теоретические материалы)
- Модель `Lecture` содержит markdown-контент теории
- Связь Question → Lecture (опциональная)
- `LectureModal` рендерит markdown через react-markdown + remark-gfm
- API: `/api/lectures/by-question/[questionId]` возвращает связанную лекцию

### API Endpoints Authentication Pattern

**Все защищенные endpoints:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Получение userId из email:**
```typescript
const user = await prisma.user.findUnique({
  where: { email: session.user.email }
});
```

### Database Models

**User** → testResults[], pomodoroSessions[]
**Test** → results[], questions[] (через TestQuestion)
**Question** → tests[] (через TestQuestion), lecture (опционально)
**TestQuestion** → test, question (junction table с полем order)
**TestResult** → user, test (answers: Json, score: Int)
**PomodoroSession** → user (duration: Int, type: String)
**Lecture** → questions[] (title, topic, content: Text)

### CSS Modules Pattern
- Каждый компонент имеет `.module.scss` файл
- Import: `import styles from './Component.module.scss'`
- Usage: `<div className={styles.container}>`

### Environment Variables
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rest_api_trainer"
NEXTAUTH_SECRET="..." # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

### Документация проекта
- **README.md** - описание платформы, быстрый старт, структура контента
- **docs/LECTURE_CREATION_GUIDE.md** - правила создания лекций (302 строки)
- **docs/QUESTION_CREATION_GUIDE.md** - правила создания вопросов и тестов (330 строк)
- **docs/MANY_TO_MANY_USAGE.md** - архитектура БД и примеры запросов (457 строк)
- **scripts/** - 40 рабочих скриптов-шаблонов для создания контента

## Важные паттерны при работе с кодом

### При изменении Prisma схемы
1. Обновить `prisma/schema.prisma`
2. Запустить `npx prisma migrate dev --name migration_name`
3. Prisma Client регенерируется автоматически

### При добавлении новых вопросов и лекций

**Обязательно следовать документации:**
- `docs/QUESTION_CREATION_GUIDE.md` - полное руководство по созданию вопросов
- `docs/LECTURE_CREATION_GUIDE.md` - полное руководство по созданию лекций
- `docs/LECTURE_CHECKLIST.md` - чек-лист качества лекции перед созданием
- Использовать скрипты из `scripts/` как шаблоны (60+ примеров)
- Проверять на дублирование по тексту вопроса
- Создавать TestQuestion связь с динамическим order (не хардкод)

**Важные принципы создания лекций:**
1. **Одна лекция = один тест** - каждая лекция покрывает вопросы одного конкретного теста
2. **Полное покрытие** - лекция должна давать знания для ответов на ВСЕ вопросы теста
3. **Не давать прямые ответы** - объясняйте концепции через практические сценарии, а не копируйте вопросы
4. **Структура лекции**: Введение (10-15%) → Базовые концепции (15-20%) → Детальный разбор (50-60%) → Практические сценарии (10-15%) → Типичные ошибки (5-10%) → Best Practices (5-10%) → Заключение (3-5%)
5. **Объем**: 500-800 строк markdown

**Шаблон скрипта создания лекции:**
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const lectureContent = `# Название лекции
[... markdown контент ...]
`;

async function createLecture() {
  const test = await prisma.test.findFirst({
    where: { title: { contains: 'Название теста' } },
    include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } }
  });

  const lecture = await prisma.lecture.create({
    data: { title: 'Название лекции', topic: 'Категория', content: lectureContent }
  });

  for (const tq of test.questions) {
    await prisma.question.update({
      where: { id: tq.questionId },
      data: { lectureId: lecture.id }
    });
  }
}
```

### При работе с Redux state
- Всегда использовать typed hooks: `useAppDispatch`, `useAppSelector` из `src/store/hooks.ts`
- Redux DevTools доступны в development
- State автоматически синхронизируется с localStorage

### Защита API endpoints
- Всегда проверять `session` через `getServerSession(authOptions)`
- Возвращать 401 Unauthorized если сессии нет
- Получать userId из user.email через Prisma lookup

### Работа с Route Groups
- `(auth)` - страницы без layout, доступные без авторизации
- `(dashboard)` - защищенные страницы с DashboardHeader

## Система тестирования

### Два режима прохождения тестов

**Режим обучения (Learning Mode):**
- 📚 Доступ к лекциям во время теста
- ⏱️ Без ограничения по времени
- ❌ Результаты не сохраняются в базу
- ✅ Автосохранение прогресса в sessionStorage
- ✅ Можно продолжить после перезагрузки страницы

**Режим экзамена (Exam Mode):**
- 🎯 Ограничение по времени: **20 секунд на каждый вопрос**
- ❌ Нет доступа к лекциям
- ✅ Результаты сохраняются в базу данных
- ✅ Засчитывается в статистику пользователя
- ✅ Автовосстановление при перезагрузке (если время не истекло)

**ВАЖНО: Расчет времени для экзамена**
```typescript
const examDuration = (test?.questions.length || 0) * 20; // секунды
```
Примеры:
- Тест из 24 вопросов = 480 сек = 8 минут
- Марафон из 483 вопросов = 9660 сек = 161 минута = 2 часа 41 минута

### Структура контента

**Уровни сложности:**
- **Beginner:** 6 тестов (HTTP методы, статус коды, Content-Type, URL структура, Query params, HTTP и HTTPS)
- **Intermediate:** 6 тестов (Ошибки, Authorization, CRUD, Идемпотентность, Pagination, Фильтрация)
- **Advanced:** 13 тестов (Naming, Версионирование, HATEOAS, Кеширование, Rate Limiting, Batching, CORS, WebSockets, Webhooks, OpenAPI, OAuth/JWT)

**Система профессий (Profession Tags):**
- 📊 **Системный аналитик:** 16 тестов (4 beginner, 7 intermediate, 4 advanced + 1 марафон)
- 🧪 **QA Engineer:** 17 тестов (5 beginner, 8 intermediate, 3 advanced + 1 марафон)
- 💻 **Frontend:** 15 тестов (5 beginner, 6 intermediate, 3 advanced + 1 марафон)
- ⚙️ **Backend:** 25 тестов - все тесты (5 beginner, 9 intermediate, 10 advanced + 1 марафон)
- 🌐 **Fullstack:** 25 тестов - все тесты (5 beginner, 9 intermediate, 10 advanced + 1 марафон)

**Марафоны по профессиям (создаются через `scripts/create-profession-marathons.ts`):**
- 📊 Марафон: Системный аналитик - 413 вопросов (все вопросы из 16 тестов для аналитиков)
- 🧪 Марафон: QA Engineer - 453 вопроса (все вопросы из 17 тестов для QA)
- 💻 Марафон: Frontend Developer - 458 вопросов (все вопросы из 15 тестов для frontend)
- ⚙️ Марафон: Backend Developer - 483 вопроса (все вопросы из 25 тестов для backend)
- 🌐 Марафон: Fullstack Developer - 483 вопроса (все вопросы из 25 тестов для fullstack)

**Марафоны отображаются на странице `/tests` в отдельной вкладке "🏃 Марафоны"**

### Логика прохождения теста

1. GET `/api/tests` - список тестов
2. GET `/api/tests/[id]` - тест с перемешанными вопросами/ответами
3. Пользователь выбирает режим (обучение или экзамен)
4. POST `/api/tests/[id]/submit` - отправка answers[], получение score
5. Результат сохраняется в TestResult (только для режима экзамена)
6. GET `/api/results` - история пользователя

### Автосохранение прогресса

**sessionStorage Pattern:**
- Состояние теста сохраняется в sessionStorage при каждом изменении (НО ТОЛЬКО если `!showResults`)
- Ключ: `test_${testId}_state` или `test_${combinedTestId}_state`
- Восстанавливается при перезагрузке страницы или переключении вкладок

**Для режима экзамена:**
- Автоматически восстанавливается если время не истекло
- Проверка: `remaining = Math.max(0, Math.ceil((endTime - now) / 1000))`
- Если время истекло - сохранение удаляется

**Для режима обучения:**
- Показывается диалог восстановления с выбором: "Продолжить" или "Начать заново"
- Восстановление всегда доступно (нет ограничения по времени)

**КРИТИЧНО: Очистка после завершения теста**
```typescript
// В useEffect для сохранения состояния ОБЯЗАТЕЛЬНА проверка !showResults
if (testStarted && testId && !showResults) {
  sessionStorage.setItem(`test_${testId}_state`, JSON.stringify(testState));
}

// В submitTest() очистка происходит сразу после setShowResults(true)
sessionStorage.removeItem(`test_${testId}_state`);
```

### Комбинированные тесты (Combined Tests)

**Страница:** `/combined-test?tests=id1,id2,id3&listName=Название`

**Особенности:**
- Объединение нескольких тестов в один
- Вопросы перемешиваются из всех тестов
- Каждый вопрос помнит свой sourceTestId для статистики
- Результаты сохраняются в `CombinedTestResult` с детализацией по тестам
- Работает аналогично обычным тестам (два режима, автосохранение, таймер)

## Подключение к БД

PostgreSQL должен быть запущен на localhost:5432. При первом запуске:
```bash
npx prisma migrate dev   # Применить миграции
npm run seed            # Заполнить БД тестами
```

Если БД пустая, seed скрипт создаст 18 тестов + все вопросы + TestQuestion связи.
