# Руководство по работе с БД

Цель: безопасно добавлять, менять и получать данные через скрипты, без ручных правок в таблицах.

## Общий принцип

- **Чтение** можно делать через SQL/Prisma.
- **Запись** — только через скрипты в `scripts/`, чтобы не ломать связи.

## Получение данных

### Быстрые SQL‑запросы
```sql
-- Лекция по названию
SELECT id, title FROM "Lecture" WHERE title ILIKE '%Конфликты%';

-- Тест по названию
SELECT id, title FROM "Test" WHERE title ILIKE '%MoSCoW%';

-- Вопросы теста
SELECT q.id, q.question
FROM "TestQuestion" tq
JOIN "Question" q ON q.id = tq."questionId"
WHERE tq."testId" = '<TEST_ID>'
ORDER BY tq."order";
```

### Prisma
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

## Добавление/обновление лекций

Используйте скрипты вида `scripts/create-*-lecture.ts`.

Шаги:
1) Найти тест по названию
2) Подготовить `lectureContent` и при необходимости `scenariosContent`, `exampleContent`, `tasksContent`
3) Создать или обновить `Lecture`
4) Привязать все вопросы теста к `lectureId`

Мини‑шаблон:
```ts
const existing = await prisma.lecture.findFirst({
  where: { title: 'Название лекции' }
});

const lecture = existing
  ? await prisma.lecture.update({
      where: { id: existing.id },
      data: { title, topic, content: lectureContent, scenariosContent, exampleContent, tasksContent }
    })
  : await prisma.lecture.create({
      data: { title, topic, content: lectureContent, scenariosContent, exampleContent, tasksContent }
    });
```

Запуск:
```bash
npx tsx scripts/create-<topic>-lecture.ts
```

Примеры скриптов:
- `scripts/create-conflicts-lecture.ts`
- `scripts/create-security-requirements-lecture.ts`
- `scripts/create-http-basics-lecture.ts`

## Добавление/обновление тестов и вопросов

- Используйте скрипты вида `scripts/create-*-test*.ts`.
- Вопросы добавляются в `Question`, а связь и порядок — через `TestQuestion`.

Мини‑шаблон создания связи:
```ts
await prisma.testQuestion.create({
  data: { testId, questionId, order }
});
```

## Обновление связей

- **Вопрос → лекция**: `Question.lectureId`
- **Тест → категория**: `category_tests`
- **Тест → коллекция**: `collection_tests`

## Проверки целостности (быстро)

```sql
-- Вопросы без лекции
SELECT q.id FROM "Question" q WHERE q."lectureId" IS NULL;

-- Тесты без вопросов
SELECT t.id FROM "Test" t
LEFT JOIN "TestQuestion" tq ON tq."testId" = t.id
WHERE tq.id IS NULL;

-- Вопросы без тестов
SELECT q.id FROM "Question" q
LEFT JOIN "TestQuestion" tq ON tq."questionId" = q.id
WHERE tq.id IS NULL;
```

## Полезные команды

```bash
npx prisma studio
npx tsx scripts/<script>.ts
```
