# 🗄️ Полное руководство по работе с базой данных REST API Trainer

**Версия:** 2.0 (обновлено 2026-01-26)
**Цель:** Безопасно работать с базой данных через скрипты, понимать структуру и связи

---

## 📋 Содержание

1. [Общие принципы](#общие-принципы)
2. [ENUM типы](#enum-типы)
3. [Структура базы данных](#структура-базы-данных)
4. [Иерархия и связи](#иерархия-и-связи)
5. [Таблицы с полным описанием](#таблицы-с-полным-описанием)
6. [Шаблоны скриптов CRUD](#шаблоны-скриптов-crud)
7. [Many-to-Many связи](#many-to-many-связи)
8. [Проверки целостности](#проверки-целостности)
9. [Best Practices](#best-practices)

---

## 🎯 Общие принципы

### Золотые правила работы с БД:

1. ✅ **Чтение** можно делать через SQL/Prisma напрямую
2. ✅ **Запись** только через скрипты в `scripts/`
3. ❌ **Никогда не редактировать данные вручную** в Prisma Studio
4. ✅ Всегда проверять на дубликаты перед созданием
5. ✅ Использовать транзакции для связанных операций
6. ✅ Удалять через Prisma (каскадное удаление работает автоматически)

### Подключение к БД в скриптах:

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

async function main() {
  try {
    // Ваш код здесь
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
```

---

## 🏷️ ENUM типы

### Difficulty (Сложность)
```typescript
enum Difficulty {
  beginner      // Начинающий
  intermediate  // Средний
  advanced      // Продвинутый
}
```

**Используется в:**
- `Test.difficulty` - сложность теста
- `Collection.level` - уровень коллекции (опционально)

**Примеры использования:**
```typescript
// Создание
const test = await prisma.test.create({
  data: {
    difficulty: 'beginner' // или Difficulty.beginner
  }
});

// Поиск
const beginnerTests = await prisma.test.findMany({
  where: { difficulty: 'beginner' }
});
```

---

### TestMode (Режим теста)
```typescript
enum TestMode {
  learning  // Режим обучения (результаты не сохраняются)
  exam      // Режим экзамена (результаты сохраняются)
}
```

**Используется в:**
- `TestResult.mode` - режим прохождения теста

**Примеры использования:**
```typescript
// Создание результата
const result = await prisma.testResult.create({
  data: {
    userId: 'user_id',
    testId: 'test_id',
    mode: 'exam', // или TestMode.exam
    score: 85
  }
});

// Фильтрация только экзаменов
const examResults = await prisma.testResult.findMany({
  where: {
    userId: 'user_id',
    mode: 'exam'
  }
});
```

---

### PomodoroType (Тип Pomodoro сессии)
```typescript
enum PomodoroType {
  work         // Рабочая сессия (25 мин)
  short_break  // Короткий перерыв (5 мин)
  long_break   // Длинный перерыв (15 мин)
}
```

**Используется в:**
- `PomodoroSession.type` - тип сессии

**Примеры использования:**
```typescript
// Создание сессии
const session = await prisma.pomodoroSession.create({
  data: {
    userId: 'user_id',
    type: 'work',
    duration: 1500 // секунды
  }
});
```

---

### CollectionType (Тип коллекции)
```typescript
enum CollectionType {
  profession    // Коллекция для профессии
  learning_path // Образовательный трек
  custom        // Пользовательская коллекция
}
```

**Используется в:**
- `Collection.type` - тип коллекции

**Примеры использования:**
```typescript
// Создание коллекции
const collection = await prisma.collection.create({
  data: {
    name: 'Всё для системного аналитика',
    slug: 'system-analyst-full',
    type: 'profession',
    targetRole: 'system-analyst'
  }
});
```

---

## 🗂️ Структура базы данных

### Диаграмма связей

```
┌─────────────────────────────────────────────────────────────────┐
│                     CORE ENTITIES                                │
└─────────────────────────────────────────────────────────────────┘

User (Пользователи)
├── testResults[] ────────────→ TestResult
├── pomodoroSessions[] ───────→ PomodoroSession
├── testLists[] ──────────────→ UserTestList
├── combinedTestResults[] ────→ CombinedTestResult
└── taskProgress[] ───────────→ LectureTaskProgress

Category (Категории)
├── parent ──────→ Category (self-relation)
├── children[] ──→ Category[]
└── tests[] ─────→ CategoryTest[] ─→ Test

Test (Тесты)
├── categories[] ─→ CategoryTest[] ─→ Category
├── collections[] → CollectionTest[] → Collection
├── questions[] ──→ TestQuestion[] ──→ Question
├── results[] ────→ TestResult
└── userLists[] ──→ UserTestListItem[] → UserTestList

Question (Вопросы)
├── tests[] ──────→ TestQuestion[] ──→ Test
└── lecture ──────→ Lecture (optional)

Lecture (Лекции)
├── questions[] ──→ Question[]
└── taskProgress[] → LectureTaskProgress[]

Collection (Коллекции)
└── tests[] ──────→ CollectionTest[] ──→ Test

UserTestList (Пользовательские списки)
└── items[] ──────→ UserTestListItem[] ──→ Test

┌─────────────────────────────────────────────────────────────────┐
│                   JUNCTION TABLES (M2M)                          │
└─────────────────────────────────────────────────────────────────┘

TestQuestion      → Test + Question + order
CategoryTest      → Category + Test + order
CollectionTest    → Collection + Test + order + isRequired
UserTestListItem  → UserTestList + Test + order
```

---

## 📊 Таблицы с полным описанием

### User (Пользователи)

**Назначение:** Хранение пользователей системы

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID (cuid) |
| `email` | String | ✅ | Email пользователя (unique) |
| `password` | String | ✅ | Хэш пароля (bcrypt) |
| `name` | String? | ❌ | Имя пользователя |
| `skipTasksWarning` | Boolean | ✅ | Пропускать предупреждение о задачах (default: false) |
| `createdAt` | DateTime | ✅ | Дата создания |
| `updatedAt` | DateTime | ✅ | Дата обновления |

**Связи:**
- `testResults` → TestResult[] (результаты тестов)
- `pomodoroSessions` → PomodoroSession[] (Pomodoro сессии)
- `testLists` → UserTestList[] (пользовательские списки)
- `combinedTestResults` → CombinedTestResult[] (результаты комбо-тестов)
- `taskProgress` → LectureTaskProgress[] (прогресс задач)

**Индексы:**
- `email` (unique)

---

### Category (Категории)

**Назначение:** Организация тестов по категориям с поддержкой иерархии

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `name` | String | ✅ | Название (unique) |
| `slug` | String | ✅ | URL-friendly имя (unique) |
| `description` | String | ✅ | Описание категории |
| `icon` | String | ✅ | Emoji иконка (📡, 📋) |
| `order` | Int | ✅ | Порядок отображения (default: 0) |
| `parentId` | String? | ❌ | ID родительской категории |
| `createdAt` | DateTime | ✅ | Дата создания |
| `updatedAt` | DateTime | ✅ | Дата обновления |

**Связи:**
- `parent` → Category (родительская категория)
- `children` → Category[] (дочерние категории)
- `tests` → CategoryTest[] (тесты через junction table)

**Индексы:**
- `slug` (unique)
- `parentId`
- `order`

**Примеры:**
- REST API (parent: null)
  - HTTP Basics (parent: REST API)
  - Authentication (parent: REST API)
- Requirements (parent: null)

---

### Test (Тесты)

**Назначение:** Хранение тестов

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `title` | String | ✅ | Название теста |
| `description` | String | ✅ | Описание теста |
| `difficulty` | Difficulty | ✅ | Сложность (enum) |
| `tags` | String[] | ✅ | Теги профессий (default: []) |
| `createdAt` | DateTime | ✅ | Дата создания |
| `updatedAt` | DateTime | ✅ | Дата обновления |

**Связи:**
- `categories` → CategoryTest[] (категории)
- `collections` → CollectionTest[] (коллекции)
- `questions` → TestQuestion[] (вопросы)
- `results` → TestResult[] (результаты)
- `userLists` → UserTestListItem[] (пользовательские списки)

**Индексы:**
- `difficulty`
- `title`

**Теги (tags):**
- `system-analyst` - Системный аналитик
- `qa-engineer` - QA Engineer
- `frontend` - Frontend Developer
- `backend` - Backend Developer
- `fullstack` - Fullstack Developer

---

### Question (Вопросы)

**Назначение:** Хранение вопросов для тестов

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `question` | String | ✅ | Текст вопроса |
| `options` | Json | ✅ | Варианты ответов Array<string> |
| `correctAnswer` | Int | ✅ | Индекс правильного ответа (0-based) |
| `explanation` | String | ✅ | Объяснение ответа |
| `lectureId` | String? | ❌ | ID связанной лекции |
| `createdAt` | DateTime | ✅ | Дата создания |

**Связи:**
- `tests` → TestQuestion[] (тесты)
- `lecture` → Lecture (лекция)

**Индексы:**
- `lectureId`

**Структура options:**
```json
["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"]
```

---

### TestQuestion (Junction: Test ↔ Question)

**Назначение:** Связь тестов с вопросами + порядок

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `testId` | String | ✅ | ID теста |
| `questionId` | String | ✅ | ID вопроса |
| `order` | Int | ✅ | Порядок вопроса в тесте |

**Связи:**
- `test` → Test
- `question` → Question

**Индексы:**
- `[testId, order]` (композитный)

**Уникальные ограничения:**
- `[testId, questionId]` (один вопрос в тесте один раз)

---

### TestResult (Результаты тестов)

**Назначение:** Хранение результатов прохождения тестов

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `userId` | String | ✅ | ID пользователя |
| `testId` | String | ✅ | ID теста |
| `answers` | Json | ✅ | Ответы пользователя Array<number> |
| `score` | Int | ✅ | Баллы (0-100) |
| `mode` | TestMode | ✅ | Режим (learning/exam) |
| `completedAt` | DateTime | ✅ | Дата прохождения |

**Связи:**
- `user` → User
- `test` → Test

**Индексы:**
- `userId`
- `testId`
- `[userId, completedAt]` (композитный)
- `[testId, score]` (композитный для лидербордов)
- `[userId, mode]` (фильтрация по режиму)

**Структура answers:**
```json
[0, 2, 1, 3, 0]  // индексы выбранных ответов
```

---

### PomodoroSession (Pomodoro сессии)

**Назначение:** Хранение Pomodoro сессий пользователя

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `userId` | String | ✅ | ID пользователя |
| `duration` | Int | ✅ | Длительность (секунды) |
| `type` | PomodoroType | ✅ | Тип сессии (enum) |
| `completedAt` | DateTime | ✅ | Дата завершения |

**Связи:**
- `user` → User

**Индексы:**
- `userId`
- `[userId, completedAt]` (композитный)
- `type`

---

### CombinedTestResult (Результаты комбинированных тестов)

**Назначение:** Результаты прохождения комбинированных тестов из пользовательских списков

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `userId` | String | ✅ | ID пользователя |
| `listName` | String | ✅ | Название списка |
| `testIds` | String[] | ✅ | Массив ID тестов |
| `totalScore` | Int | ✅ | Общий процент (0-100) |
| `totalQuestions` | Int | ✅ | Всего вопросов |
| `correctAnswers` | Int | ✅ | Правильных ответов |
| `testScores` | Json | ✅ | Детальные результаты |
| `completedAt` | DateTime | ✅ | Дата завершения |

**Связи:**
- `user` → User

**Индексы:**
- `userId`
- `completedAt`

**Структура testScores:**
```json
{
  "test_id_1": {
    "score": 85,
    "correct": 17,
    "total": 20,
    "title": "HTTP Методы"
  },
  "test_id_2": {
    "score": 90,
    "correct": 18,
    "total": 20,
    "title": "Статус коды"
  }
}
```

---

### Lecture (Лекции)

**Назначение:** Хранение теоретических материалов

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `title` | String | ✅ | Название лекции |
| `topic` | String | ✅ | Тема |
| `content` | String (Text) | ✅ | Основное содержимое (Markdown) |
| `scenariosContent` | String? (Text) | ❌ | Сценарии (Markdown) |
| `exampleContent` | String? (Text) | ❌ | Примеры (Markdown) |
| `tasksContent` | String? (Text) | ❌ | Задания (Markdown) |
| `createdAt` | DateTime | ✅ | Дата создания |
| `updatedAt` | DateTime | ✅ | Дата обновления |

**Связи:**
- `questions` → Question[] (связанные вопросы)
- `taskProgress` → LectureTaskProgress[] (прогресс задач)

---

### LectureTaskProgress (Прогресс задач лекций)

**Назначение:** Отслеживание выполненных задач в лекциях

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `userId` | String | ✅ | ID пользователя |
| `lectureId` | String | ✅ | ID лекции |
| `taskId` | String | ✅ | ID задачи (из markdown) |
| `completedAt` | DateTime | ✅ | Дата выполнения |

**Связи:**
- `user` → User
- `lecture` → Lecture

**Индексы:**
- `userId`
- `lectureId`

**Уникальные ограничения:**
- `[userId, lectureId, taskId]` (одна задача выполняется один раз)

---

### CategoryTest (Junction: Category ↔ Test)

**Назначение:** Many-to-Many связь категорий с тестами

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `categoryId` | String | ✅ | ID категории |
| `testId` | String | ✅ | ID теста |
| `order` | Int | ✅ | Порядок в категории (default: 0) |
| `createdAt` | DateTime | ✅ | Дата создания |

**Связи:**
- `category` → Category
- `test` → Test

**Индексы:**
- `[categoryId, order]` (композитный для сортировки)

**Уникальные ограничения:**
- `[categoryId, testId]` (тест в категории один раз)

---

### Collection (Коллекции)

**Назначение:** Сборные программы обучения для профессий

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `name` | String | ✅ | Название (unique) |
| `slug` | String | ✅ | URL-friendly имя (unique) |
| `description` | String | ✅ | Описание |
| `icon` | String | ✅ | Emoji иконка |
| `type` | CollectionType | ✅ | Тип (enum) |
| `targetRole` | String? | ❌ | Целевая роль |
| `estimatedHours` | Int? | ❌ | Примерное время (часы) |
| `level` | Difficulty? | ❌ | Уровень сложности |
| `order` | Int | ✅ | Порядок отображения |
| `isPublished` | Boolean | ✅ | Опубликовано |
| `createdAt` | DateTime | ✅ | Дата создания |
| `updatedAt` | DateTime | ✅ | Дата обновления |

**Связи:**
- `tests` → CollectionTest[] (тесты)

**Индексы:**
- `slug` (unique)
- `type`
- `targetRole`

---

### CollectionTest (Junction: Collection ↔ Test)

**Назначение:** Many-to-Many связь коллекций с тестами

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `collectionId` | String | ✅ | ID коллекции |
| `testId` | String | ✅ | ID теста |
| `order` | Int | ✅ | Порядок в программе (default: 0) |
| `isRequired` | Boolean | ✅ | Обязательный тест (default: true) |
| `createdAt` | DateTime | ✅ | Дата создания |

**Связи:**
- `collection` → Collection
- `test` → Test

**Индексы:**
- `[collectionId, order]` (композитный)

**Уникальные ограничения:**
- `[collectionId, testId]` (тест в коллекции один раз)

---

### UserTestList (Пользовательские списки)

**Назначение:** Пользовательские списки тестов (плейлисты)

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `userId` | String | ✅ | ID пользователя |
| `name` | String | ✅ | Название списка |
| `description` | String? | ❌ | Описание |
| `icon` | String | ✅ | Emoji иконка (default: "📋") |
| `color` | String | ✅ | Цвет (default: "#667eea") |
| `isPublic` | Boolean | ✅ | Публичный (default: false) |
| `createdAt` | DateTime | ✅ | Дата создания |
| `updatedAt` | DateTime | ✅ | Дата обновления |

**Связи:**
- `user` → User
- `items` → UserTestListItem[] (тесты в списке)

**Индексы:**
- `userId`

---

### UserTestListItem (Junction: UserTestList ↔ Test)

**Назначение:** Many-to-Many связь пользовательских списков с тестами

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | String | ✅ | Уникальный ID |
| `listId` | String | ✅ | ID списка |
| `testId` | String | ✅ | ID теста |
| `order` | Int | ✅ | Порядок в списке (default: 0) |
| `addedAt` | DateTime | ✅ | Дата добавления |

**Связи:**
- `list` → UserTestList
- `test` → Test

**Индексы:**
- `[listId, order]` (композитный)

**Уникальные ограничения:**
- `[listId, testId]` (тест в списке один раз)

---

## 📝 Шаблоны скриптов CRUD

### CREATE: Создание теста с вопросами

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

async function createTest() {
  try {
    console.log('🎯 Создание теста...\n');

    // 1. Проверка на дубликаты
    const existingTest = await prisma.test.findFirst({
      where: { title: 'Название теста' }
    });

    if (existingTest) {
      console.log('⚠️  Тест уже существует:', existingTest.id);
      return;
    }

    // 2. Создание теста
    const test = await prisma.test.create({
      data: {
        title: 'Название теста',
        description: 'Описание теста',
        difficulty: 'beginner', // или 'intermediate', 'advanced'
        tags: ['frontend', 'backend'] // опционально
      }
    });

    console.log('✅ Тест создан:', test.id);

    // 3. Создание вопросов
    const questions = [
      {
        question: 'Что такое REST API?',
        options: ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Вариант 4'],
        correctAnswer: 0,
        explanation: 'Объяснение правильного ответа'
      },
      // ... другие вопросы
    ];

    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];

      // Проверка на дубликат вопроса
      const existingQuestion = await prisma.question.findFirst({
        where: { question: questionData.question }
      });

      const question = existingQuestion || await prisma.question.create({
        data: questionData
      });

      // Создание связи TestQuestion
      await prisma.testQuestion.create({
        data: {
          testId: test.id,
          questionId: question.id,
          order: i // важно: динамический порядок
        }
      });

      console.log(`✅ Вопрос ${i + 1}/${questions.length} добавлен`);
    }

    console.log('\n🎉 Тест успешно создан!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createTest();
```

---

### CREATE: Создание лекции и связь с вопросами

```typescript
async function createLecture() {
  try {
    console.log('📚 Создание лекции...\n');

    // 1. Найти тест по названию
    const test = await prisma.test.findFirst({
      where: { title: { contains: 'HTTP методы' } },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      console.error('❌ Тест не найден');
      return;
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`   Вопросов: ${test.questions.length}`);

    // 2. Markdown контент
    const lectureContent = `# HTTP методы и основы

## Введение

...содержимое лекции...
`;

    const scenariosContent = `# Практические сценарии

...сценарии использования...
`;

    const tasksContent = `# Задания для практики

1. Задание 1
2. Задание 2
`;

    // 3. Проверка существования лекции
    const existingLecture = await prisma.lecture.findFirst({
      where: { title: 'HTTP методы и основы' }
    });

    // 4. Создание или обновление
    const lecture = existingLecture
      ? await prisma.lecture.update({
          where: { id: existingLecture.id },
          data: {
            content: lectureContent,
            scenariosContent,
            tasksContent
          }
        })
      : await prisma.lecture.create({
          data: {
            title: 'HTTP методы и основы',
            topic: 'HTTP Basics',
            content: lectureContent,
            scenariosContent,
            tasksContent
          }
        });

    console.log(`✅ Лекция ${existingLecture ? 'обновлена' : 'создана'}: ${lecture.id}`);

    // 5. Связать все вопросы теста с лекцией
    for (const tq of test.questions) {
      await prisma.question.update({
        where: { id: tq.questionId },
        data: { lectureId: lecture.id }
      });
    }

    console.log(`✅ Связано ${test.questions.length} вопросов с лекцией`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
```

---

### CREATE: Добавление теста в категорию

```typescript
async function addTestToCategory() {
  try {
    // 1. Найти категорию
    const category = await prisma.category.findFirst({
      where: { slug: 'rest-api' }
    });

    if (!category) {
      console.error('❌ Категория не найдена');
      return;
    }

    // 2. Найти тест
    const test = await prisma.test.findFirst({
      where: { title: { contains: 'HTTP методы' } }
    });

    if (!test) {
      console.error('❌ Тест не найден');
      return;
    }

    // 3. Проверка существования связи
    const existingLink = await prisma.categoryTest.findUnique({
      where: {
        categoryId_testId: {
          categoryId: category.id,
          testId: test.id
        }
      }
    });

    if (existingLink) {
      console.log('⚠️  Тест уже в категории');
      return;
    }

    // 4. Получить следующий порядок
    const lastOrder = await prisma.categoryTest.findFirst({
      where: { categoryId: category.id },
      orderBy: { order: 'desc' }
    });

    const nextOrder = lastOrder ? lastOrder.order + 1 : 0;

    // 5. Создать связь
    await prisma.categoryTest.create({
      data: {
        categoryId: category.id,
        testId: test.id,
        order: nextOrder
      }
    });

    console.log(`✅ Тест добавлен в категорию с порядком ${nextOrder}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
```

---

### READ: Получение теста со всеми данными

```typescript
async function getTestWithAllData(testId: string) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        // Категории
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        // Вопросы
        questions: {
          include: {
            question: {
              include: {
                lecture: {
                  select: {
                    id: true,
                    title: true,
                    topic: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        // Результаты (последние 10)
        results: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: { completedAt: 'desc' },
          take: 10
        },
        // Коллекции
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!test) {
      console.log('❌ Тест не найден');
      return null;
    }

    console.log('📊 Тест:', test.title);
    console.log('   Сложность:', test.difficulty);
    console.log('   Вопросов:', test.questions.length);
    console.log('   Категорий:', test.categories.length);
    console.log('   Результатов:', test.results.length);

    return test;

  } catch (error) {
    console.error('❌ Ошибка:', error);
    return null;
  }
}
```

---

### READ: Получение всех тестов категории

```typescript
async function getTestsByCategory(categorySlug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        tests: {
          include: {
            test: {
              include: {
                questions: true,
                _count: {
                  select: { results: true }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!category) {
      console.log('❌ Категория не найдена');
      return [];
    }

    console.log(`📚 Категория: ${category.name}`);
    console.log(`   Тестов: ${category.tests.length}`);

    const tests = category.tests.map(ct => ({
      ...ct.test,
      orderInCategory: ct.order,
      questionCount: ct.test.questions.length,
      resultsCount: ct.test._count.results
    }));

    return tests;

  } catch (error) {
    console.error('❌ Ошибка:', error);
    return [];
  }
}
```

---

### UPDATE: Обновление порядка вопросов в тесте

```typescript
async function reorderQuestions(testId: string, newOrder: string[]) {
  try {
    console.log('🔄 Изменение порядка вопросов...\n');

    // Используем транзакцию для атомарности
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < newOrder.length; i++) {
        const questionId = newOrder[i];

        await tx.testQuestion.updateMany({
          where: {
            testId,
            questionId
          },
          data: {
            order: i
          }
        });
      }
    });

    console.log('✅ Порядок обновлен');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
```

---

### UPDATE: Обновление теста

```typescript
async function updateTest(testId: string) {
  try {
    const test = await prisma.test.update({
      where: { id: testId },
      data: {
        title: 'Новое название',
        description: 'Новое описание',
        difficulty: 'intermediate',
        tags: ['system-analyst', 'qa-engineer']
      }
    });

    console.log('✅ Тест обновлен:', test.id);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
```

---

### DELETE: Удаление теста (каскадное)

```typescript
async function deleteTest(testId: string) {
  try {
    console.log('🗑️  Удаление теста...\n');

    // Prisma автоматически удалит связанные записи благодаря onDelete: Cascade:
    // - TestQuestion (связи с вопросами)
    // - CategoryTest (связи с категориями)
    // - CollectionTest (связи с коллекциями)
    // - UserTestListItem (связи с пользовательскими списками)
    // - TestResult (результаты тестов)

    const test = await prisma.test.delete({
      where: { id: testId }
    });

    console.log('✅ Тест удален:', test.title);
    console.log('   Все связанные данные также удалены');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
```

⚠️ **ВНИМАНИЕ:** Вопросы (Question) НЕ удаляются при удалении теста, так как они могут использоваться в других тестах!

---

### DELETE: Удаление вопроса из теста (не удаляя сам вопрос)

```typescript
async function removeQuestionFromTest(testId: string, questionId: string) {
  try {
    // Удаляем только связь TestQuestion
    await prisma.testQuestion.deleteMany({
      where: {
        testId,
        questionId
      }
    });

    console.log('✅ Вопрос удален из теста');
    console.log('   Сам вопрос остался в базе');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
```

---

## 🔗 Many-to-Many связи: Детальное руководство

### Паттерн 1: Test ↔ Question через TestQuestion

**Зачем:** Один вопрос может использоваться в нескольких тестах

**Создание связи:**
```typescript
await prisma.testQuestion.create({
  data: {
    testId: 'test_id_here',
    questionId: 'question_id_here',
    order: 0 // порядок вопроса
  }
});
```

**Получение теста с вопросами:**
```typescript
const test = await prisma.test.findUnique({
  where: { id: testId },
  include: {
    questions: {
      include: { question: true },
      orderBy: { order: 'asc' }
    }
  }
});

// Доступ к вопросам:
test.questions.forEach(tq => {
  console.log(tq.order, tq.question.question);
});
```

**Удаление связи:**
```typescript
await prisma.testQuestion.delete({
  where: {
    testId_questionId: {
      testId: 'test_id',
      questionId: 'question_id'
    }
  }
});
```

---

### Паттерн 2: Category ↔ Test через CategoryTest

**Зачем:** Один тест может быть в нескольких категориях

**Создание связи:**
```typescript
await prisma.categoryTest.create({
  data: {
    categoryId: 'category_id',
    testId: 'test_id',
    order: 0 // порядок в категории
  }
});
```

**Получение категории с тестами:**
```typescript
const category = await prisma.category.findUnique({
  where: { slug: 'rest-api' },
  include: {
    tests: {
      include: { test: true },
      orderBy: { order: 'asc' }
    }
  }
});

// Доступ к тестам:
category.tests.forEach(ct => {
  console.log(ct.order, ct.test.title);
});
```

**Изменение порядка:**
```typescript
await prisma.categoryTest.update({
  where: {
    categoryId_testId: {
      categoryId: 'category_id',
      testId: 'test_id'
    }
  },
  data: { order: 5 }
});
```

---

### Паттерн 3: Collection ↔ Test через CollectionTest

**Зачем:** Коллекции объединяют тесты в программы обучения

**Создание связи:**
```typescript
await prisma.collectionTest.create({
  data: {
    collectionId: 'collection_id',
    testId: 'test_id',
    order: 0,
    isRequired: true // обязательный или опциональный
  }
});
```

**Получение коллекции с тестами:**
```typescript
const collection = await prisma.collection.findUnique({
  where: { slug: 'system-analyst-full' },
  include: {
    tests: {
      include: { test: true },
      orderBy: { order: 'asc' }
    }
  }
});

// Фильтрация обязательных тестов:
const requiredTests = collection.tests.filter(ct => ct.isRequired);
```

---

### Паттерн 4: UserTestList ↔ Test через UserTestListItem

**Зачем:** Пользователи создают свои плейлисты тестов

**Создание пользовательского списка:**
```typescript
const userList = await prisma.userTestList.create({
  data: {
    userId: 'user_id',
    name: 'Повторить перед собеседованием',
    description: 'Важные темы для собеседования',
    icon: '🎯',
    color: '#FF6B6B'
  }
});
```

**Добавление теста в список:**
```typescript
// Получить следующий порядок
const lastItem = await prisma.userTestListItem.findFirst({
  where: { listId: userList.id },
  orderBy: { order: 'desc' }
});

const nextOrder = lastItem ? lastItem.order + 1 : 0;

// Добавить тест
await prisma.userTestListItem.create({
  data: {
    listId: userList.id,
    testId: 'test_id',
    order: nextOrder
  }
});
```

**Получение списка с тестами:**
```typescript
const userList = await prisma.userTestList.findUnique({
  where: { id: listId },
  include: {
    items: {
      include: { test: true },
      orderBy: { order: 'asc' }
    }
  }
});
```

---

## 🔍 Проверки целостности

### Проверка 1: Вопросы без лекций

```sql
SELECT q.id, q.question
FROM "Question" q
WHERE q."lectureId" IS NULL;
```

или через Prisma:
```typescript
const questionsWithoutLecture = await prisma.question.findMany({
  where: { lectureId: null }
});
```

---

### Проверка 2: Тесты без вопросов

```sql
SELECT t.id, t.title, COUNT(tq.id) as question_count
FROM "Test" t
LEFT JOIN "TestQuestion" tq ON tq."testId" = t.id
GROUP BY t.id, t.title
HAVING COUNT(tq.id) = 0;
```

или через Prisma:
```typescript
const testsWithoutQuestions = await prisma.test.findMany({
  where: {
    questions: {
      none: {}
    }
  }
});
```

---

### Проверка 3: Вопросы без тестов (orphaned)

```sql
SELECT q.id, q.question
FROM "Question" q
LEFT JOIN "TestQuestion" tq ON tq."questionId" = q.id
WHERE tq.id IS NULL;
```

или через Prisma:
```typescript
const orphanedQuestions = await prisma.question.findMany({
  where: {
    tests: {
      none: {}
    }
  }
});
```

---

### Проверка 4: Дубликаты вопросов

```sql
SELECT question, COUNT(*) as count
FROM "Question"
GROUP BY question
HAVING COUNT(*) > 1;
```

или через Prisma:
```typescript
const questions = await prisma.question.groupBy({
  by: ['question'],
  _count: { id: true },
  having: {
    id: { _count: { gt: 1 } }
  }
});
```

---

### Проверка 5: Тесты без категорий

```sql
SELECT t.id, t.title
FROM "Test" t
LEFT JOIN category_tests ct ON ct."testId" = t.id
WHERE ct.id IS NULL;
```

или через Prisma:
```typescript
const testsWithoutCategory = await prisma.test.findMany({
  where: {
    categories: {
      none: {}
    }
  }
});
```

---

### Проверка 6: Orphaned CategoryTest записи

```sql
SELECT ct.id
FROM category_tests ct
LEFT JOIN "Test" t ON ct."testId" = t.id
LEFT JOIN "Category" c ON ct."categoryId" = c.id
WHERE t.id IS NULL OR c.id IS NULL;
```

---

### Проверка 7: Статистика БД

```typescript
async function getDatabaseStats() {
  const stats = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    tests: await prisma.test.count(),
    questions: await prisma.question.count(),
    testResults: await prisma.testResult.count(),
    lectures: await prisma.lecture.count(),
    collections: await prisma.collection.count(),

    // Many-to-Many связи
    testQuestions: await prisma.testQuestion.count(),
    categoryTests: await prisma.categoryTest.count(),
    collectionTests: await prisma.collectionTest.count(),

    // Вопросы с лекциями
    questionsWithLectures: await prisma.question.count({
      where: { lectureId: { not: null } }
    })
  };

  console.log('📊 Статистика БД:');
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  return stats;
}
```

---

## ✅ Best Practices

### 1. Всегда проверять на дубликаты

```typescript
// ❌ ПЛОХО
const test = await prisma.test.create({
  data: { title: 'HTTP методы', /* ... */ }
});

// ✅ ХОРОШО
const existing = await prisma.test.findFirst({
  where: { title: 'HTTP методы' }
});

if (existing) {
  console.log('Тест уже существует');
  return;
}

const test = await prisma.test.create({
  data: { title: 'HTTP методы', /* ... */ }
});
```

---

### 2. Использовать транзакции для связанных операций

```typescript
// ❌ ПЛОХО - если что-то упадет, данные будут несогласованы
const test = await prisma.test.create({ /* ... */ });
const question = await prisma.question.create({ /* ... */ });
await prisma.testQuestion.create({ /* ... */ });

// ✅ ХОРОШО - все или ничего
await prisma.$transaction(async (tx) => {
  const test = await tx.test.create({ /* ... */ });
  const question = await tx.question.create({ /* ... */ });
  await tx.testQuestion.create({
    data: { testId: test.id, questionId: question.id, order: 0 }
  });
});
```

---

### 3. Динамический order вместо хардкода

```typescript
// ❌ ПЛОХО
await prisma.testQuestion.create({
  data: { testId, questionId, order: 0 } // хардкод
});

// ✅ ХОРОШО
const lastQuestion = await prisma.testQuestion.findFirst({
  where: { testId },
  orderBy: { order: 'desc' }
});

const nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

await prisma.testQuestion.create({
  data: { testId, questionId, order: nextOrder }
});
```

---

### 4. Использовать ENUM вместо строк

```typescript
// ❌ ПЛОХО
const test = await prisma.test.create({
  data: {
    difficulty: 'Beginner' // опечатка + неправильный регистр
  }
});

// ✅ ХОРОШО - TypeScript не даст ошибиться
const test = await prisma.test.create({
  data: {
    difficulty: 'beginner' // автокомплит + валидация
  }
});
```

---

### 5. Включать только нужные данные

```typescript
// ❌ ПЛОХО - загружает ВСЕ связанные данные
const test = await prisma.test.findUnique({
  where: { id },
  include: {
    questions: {
      include: {
        question: {
          include: {
            lecture: true,
            tests: {
              include: {
                test: true
              }
            }
          }
        }
      }
    }
  }
});

// ✅ ХОРОШО - только то, что нужно
const test = await prisma.test.findUnique({
  where: { id },
  include: {
    questions: {
      include: {
        question: {
          select: {
            id: true,
            question: true,
            options: true
          }
        }
      },
      orderBy: { order: 'asc' }
    }
  }
});
```

---

### 6. Обрабатывать ошибки правильно

```typescript
try {
  await prisma.test.create({ /* ... */ });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    console.error('Запись уже существует');
  } else if (error.code === 'P2003') {
    // Foreign key constraint violation
    console.error('Связанная запись не найдена');
  } else {
    console.error('Неизвестная ошибка:', error);
  }
} finally {
  await prisma.$disconnect();
  await pool.end();
}
```

**Коды ошибок Prisma:**
- `P2002` - Unique constraint (дубликат)
- `P2003` - Foreign key constraint (нет связанной записи)
- `P2025` - Record not found (запись не найдена)

---

### 7. Логировать прогресс в длинных скриптах

```typescript
console.log('🎯 Создание теста...\n');

const test = await prisma.test.create({ /* ... */ });
console.log('✅ Тест создан:', test.id);

for (let i = 0; i < questions.length; i++) {
  // ... создание вопроса
  console.log(`✅ Вопрос ${i + 1}/${questions.length} добавлен`);
}

console.log('\n🎉 Готово!');
```

---

### 8. Использовать select для оптимизации

```typescript
// ❌ ПЛОХО - загружает все поля (включая content на 50kb)
const lectures = await prisma.lecture.findMany();

// ✅ ХОРОШО - только нужные поля
const lectures = await prisma.lecture.findMany({
  select: {
    id: true,
    title: true,
    topic: true,
    // НЕ загружаем content, scenariosContent, etc.
  }
});
```

---

## 🛠️ Полезные команды

### Prisma Studio (GUI для БД)
```bash
npx prisma studio
```

### Запуск скрипта
```bash
npx tsx scripts/your-script.ts
```

### Проверка схемы
```bash
npx prisma validate
```

### Форматирование схемы
```bash
npx prisma format
```

### Синхронизация с БД
```bash
npx prisma db push
```

### Создание миграции
```bash
npx prisma migrate dev --name migration_name
```

### Применение миграций
```bash
npx prisma migrate deploy
```

### Регенерация Prisma Client
```bash
npx prisma generate
```

### Просмотр статуса миграций
```bash
npx prisma migrate status
```

---

## 📚 Дополнительные ресурсы

### Документация проекта:
- `MANY_TO_MANY_USAGE.md` - детальное описание M2M связей
- `QUESTION_CREATION_GUIDE.md` - правила создания вопросов
- `LECTURE_CREATION_GUIDE.md` - правила создания лекций
- `DATABASE_ANALYSIS.md` - анализ структуры БД
- `DATABASE_GUIDE.md` - общее руководство

### Примеры скриптов:
- `scripts/create-*-test.ts` - создание тестов
- `scripts/create-*-lecture.ts` - создание лекций
- `scripts/check-db-status.ts` - проверка состояния БД
- `scripts/verify-category-migration.ts` - проверка миграции

---

**Версия документа:** 2.0
**Дата последнего обновления:** 2026-01-26
**Статус:** ✅ Актуально для production
