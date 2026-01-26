# Руководство по базе данных

Цель: быстро находить данные, добавлять контент и безопасно менять связи.

## Где схема

- Prisma схема: `prisma/schema.prisma`
- Подключение: `DATABASE_URL` в `.env`
- Визуально: `npx prisma studio`

## Снимок структуры БД (по факту базы)

### Таблицы (16)
- `Category`
- `Collection`
- `Lecture`
- `LectureTaskProgress`
- `PomodoroSession`
- `Question`
- `Test`
- `TestQuestion`
- `TestResult`
- `User`
- `_prisma_migrations`
- `category_tests`
- `collection_tests`
- `combined_test_results`
- `user_test_list_items`
- `user_test_lists`

### Внешние ключи (FK)
- `Category.parentId -> Category.id`
- `PomodoroSession.userId -> User.id`
- `Question.lectureId -> Lecture.id`
- `LectureTaskProgress.userId -> User.id`
- `LectureTaskProgress.lectureId -> Lecture.id`
- `TestQuestion.questionId -> Question.id`
- `TestQuestion.testId -> Test.id`
- `TestResult.testId -> Test.id`
- `TestResult.userId -> User.id`
- `category_tests.categoryId -> Category.id`
- `category_tests.testId -> Test.id`
- `collection_tests.collectionId -> Collection.id`
- `collection_tests.testId -> Test.id`
- `combined_test_results.userId -> User.id`
- `user_test_list_items.listId -> user_test_lists.id`
- `user_test_list_items.testId -> Test.id`
- `user_test_lists.userId -> User.id`

## Ключевые сущности и связи

- **User** → результаты тестов, помодоро, списки, комбинированные результаты
- **Test** ↔ **Question** через **TestQuestion** (с `order`)
- **Lecture** ↔ **Question** (у `Question` есть `lectureId`)
  - Лекция состоит из четырёх частей: основной текст, сценарии, пример и задания
  - `Lecture.content` — основной текст лекции
  - `Lecture.scenariosContent` — сценарии (опционально)
  - `Lecture.exampleContent` — пример (опционально)
  - `Lecture.tasksContent` — задания (опционально)
- **LectureTaskProgress** — прогресс по заданиям
  - `LectureTaskProgress.userId` → `User.id`
  - `LectureTaskProgress.lectureId` → `Lecture.id`
  - `LectureTaskProgress.taskId` — идентификатор задания (например, `task-1`)
- **Category** ↔ **Test** через **CategoryTest**
- **Collection** ↔ **Test** через **CollectionTest**
- **UserTestList** ↔ **Test** через **UserTestListItem**

## ER‑схема (текст)

```
User 1 ── * TestResult * ── 1 Test
User 1 ── * PomodoroSession
User 1 ── * UserTestList 1 ── * UserTestListItem * ── 1 Test
User 1 ── * CombinedTestResult

Test 1 ── * TestQuestion * ── 1 Question
Question * ── 0..1 Lecture

Lecture 1 ── * LectureTaskProgress * ── 1 User

Category 1 ── * CategoryTest * ── 1 Test
Collection 1 ── * CollectionTest * ── 1 Test

Category 1 ── * Category (parent/children)
```

## Быстрый поиск

### Найти лекцию по названию
```sql
SELECT id, title
FROM "Lecture"
WHERE title ILIKE '%Конфликты%';
```

### Лекции со сценариями
```sql
SELECT id, title
FROM "Lecture"
WHERE "scenariosContent" IS NOT NULL AND "scenariosContent" <> '';
```

### Лекции с примером
```sql
SELECT id, title
FROM "Lecture"
WHERE "exampleContent" IS NOT NULL AND "exampleContent" <> '';
```

### Лекции с заданиями
```sql
SELECT id, title
FROM "Lecture"
WHERE "tasksContent" IS NOT NULL AND "tasksContent" <> '';
```

### Найти тест по названию
```sql
SELECT id, title
FROM "Test"
WHERE title ILIKE '%HTTP методы%';
```

### Найти вопросы теста
```sql
SELECT q.id, q.question
FROM "TestQuestion" tq
JOIN "Question" q ON q.id = tq."questionId"
WHERE tq."testId" = '<TEST_ID>'
ORDER BY tq."order";
```

### Найти лекцию по вопросу
```sql
SELECT l.id, l.title
FROM "Question" q
JOIN "Lecture" l ON l.id = q."lectureId"
WHERE q.id = '<QUESTION_ID>';
```

## Создание и привязка лекции

### Шаблон через Prisma (скрипт)
1) Найти тест  
2) Создать `Lecture`  
3) Привязать все вопросы теста к `lectureId`

Примерный алгоритм (см. `scripts/`):
```ts
const test = await prisma.test.findFirst({
  where: { title: { contains: 'Название теста' } },
  include: { questions: { orderBy: { order: 'asc' } } }
});

const lecture = await prisma.lecture.create({
  data: {
    title: 'Название лекции',
    topic: 'Тема',
    content: lectureContent,
    scenariosContent,
    exampleContent,
    tasksContent
  }
});

for (const tq of test.questions) {
  await prisma.question.update({
    where: { id: tq.questionId },
    data: { lectureId: lecture.id }
  });
}
```

## Типовые запросы (SQL)

### Тесты категории
```sql
SELECT t.id, t.title, ct."order"
FROM "category_tests" ct
JOIN "Test" t ON t.id = ct."testId"
JOIN "Category" c ON c.id = ct."categoryId"
WHERE c.slug = 'rest-api'
ORDER BY ct."order";
```

### Вопросы теста с текстом лекции
```sql
SELECT q.id, q.question, l.title AS lecture_title
FROM "TestQuestion" tq
JOIN "Question" q ON q.id = tq."questionId"
LEFT JOIN "Lecture" l ON l.id = q."lectureId"
WHERE tq."testId" = '<TEST_ID>'
ORDER BY tq."order";
```

### Коллекции и их тесты
```sql
SELECT col.name, t.title, ct."order", ct."isRequired"
FROM "collection_tests" ct
JOIN "Collection" col ON col.id = ct."collectionId"
JOIN "Test" t ON t.id = ct."testId"
ORDER BY col.name, ct."order";
```

## Типовые запросы (Prisma)

### Тест с вопросами в порядке
```ts
const test = await prisma.test.findUnique({
  where: { id: testId },
  include: {
    questions: {
      include: { question: true },
      orderBy: { order: 'asc' }
    }
  }
});
```

### Лекция по questionId
```ts
const question = await prisma.question.findUnique({
  where: { id: questionId },
  include: { lecture: true }
});
```

### Категория с тестами
```ts
const category = await prisma.category.findUnique({
  where: { slug: 'rest-api' },
  include: {
    tests: {
      include: { test: true },
      orderBy: { order: 'asc' }
    }
  }
});
```

## Добавление вопросов в тест

1) Создать вопросы в `Question`  
2) Привязать к тесту через `TestQuestion`  
3) `order` вычислять динамически

## Частые проверки целостности

### Вопросы без лекции
```sql
SELECT q.id, q.question
FROM "Question" q
WHERE q."lectureId" IS NULL;
```

### Вопросы теста без лекции
```sql
SELECT q.id, q.question
FROM "TestQuestion" tq
JOIN "Question" q ON q.id = tq."questionId"
WHERE tq."testId" = '<TEST_ID>' AND q."lectureId" IS NULL;
```

### Тесты без вопросов
```sql
SELECT t.id, t.title
FROM "Test" t
LEFT JOIN "TestQuestion" tq ON tq."testId" = t.id
WHERE tq.id IS NULL;
```

### Вопросы без тестов
```sql
SELECT q.id, q.question
FROM "Question" q
LEFT JOIN "TestQuestion" tq ON tq."questionId" = q.id
WHERE tq.id IS NULL;
```

### Тесты без категорий (новая связь)
```sql
SELECT t.id, t.title
FROM "Test" t
LEFT JOIN "category_tests" ct ON ct."testId" = t.id
WHERE ct.id IS NULL;
```

### Коллекции без тестов
```sql
SELECT c.id, c.name
FROM "Collection" c
LEFT JOIN "CollectionTest" ct ON ct."collectionId" = c.id
WHERE ct.id IS NULL;
```

### Тесты без связей с коллекциями
```sql
SELECT t.id, t.title
FROM "Test" t
LEFT JOIN "collection_tests" ct ON ct."testId" = t.id
WHERE ct.id IS NULL;
```

## Важные примечания

- Не используйте старое поле `Test.categoryId` (deprecated).
- Для контента всегда предпочитайте скрипты в `scripts/` — они сохраняют правильные связи.
- Лекции читаются в UI по `Question.lectureId`, поэтому важна корректная привязка.
- Вкладка «Сценарии» показывается только если `Lecture.scenariosContent` не пустой.
- Вкладка «Пример» показывается только если `Lecture.exampleContent` не пустой.
- Вкладка «Задания» показывается только если `Lecture.tasksContent` не пустой.

## Полезные команды

```bash
npx prisma studio       # GUI для БД
npx prisma db push      # Синхронизировать схему без миграций
npx prisma migrate dev  # Миграции
```
