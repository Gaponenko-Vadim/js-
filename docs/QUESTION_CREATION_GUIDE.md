# Руководство по созданию вопросов

## Структура вопроса

```prisma
model Question {
  id            String         @id @default(cuid())
  question      String         // Текст вопроса
  options       Json           // Массив вариантов (string[])
  correctAnswer Int            // Индекс правильного ответа (0-based)
  explanation   String         // Объяснение
  lectureId     String?        // Связь с лекцией (опционально)
  tests         TestQuestion[] // Many-to-Many с тестами
}
```

**Пример**:
```json
{
  "question": "Какой HTTP метод используется для получения данных?",
  "options": ["GET", "POST", "PUT", "DELETE"],
  "correctAnswer": 0,
  "explanation": "GET метод используется для получения данных. Он безопасен и идемпотентен."
}
```

---

## Архитектура: Many-to-Many

```
Question ↔ TestQuestion ↔ Test
```

**Преимущества**:
- Один вопрос можно использовать в нескольких тестах
- Нет дублирования данных
- Легко обновлять вопрос для всех тестов

---

## 🎯 Главные правила

**Важно**: вопросы создаются по лекции. Если ответа нет в лекции — сначала допишите лекцию, потом формулируйте вопрос.

### 1. Полный охват темы
**Вопросы должны охватывать ВСЮ тему теста, не часть**

**Как обеспечить**:
1. Составьте карту темы по лекции (все ключевые концепции)
2. Создайте минимум 1-2 вопроса для каждой концепции
3. Проверьте покрытие - нет перекоса в сторону одной концепции

**Рекомендуемое количество**:
- Beginner: 15-25 вопросов
- Intermediate: 25-35 вопросов
- Advanced: 35-50 вопросов

### 2. Ясность и однозначность

✅ **Хорошо**:
```
Вопрос: Какой статус код возвращается при успешном создании ресурса?
Варианты: 200 OK, 201 Created, 204 No Content, 202 Accepted
```

❌ **Плохо**:
```
Вопрос: Какой статус правильный?
Варианты: 200, 201, 204, 202
```

### 3. Один правильный ответ
Если несколько вариантов правильны → объедините их:
```javascript
{
  options: ["200 OK или 207 Multi-Status", "201 Created", "204 No Content"],
  correctAnswer: 0
}
```

### 4. Качественное объяснение
Объяснение должно:
- Объяснять **почему** ответ правильный
- Объяснять **почему** другие неправильны
- Давать примеры
- Быть достаточно подробным, чтобы после теста студент понял логику ответа

**Пример**:
```javascript
explanation: "PUT идемпотентен — повторный вызов даёт тот же результат.
POST НЕ идемпотентен — каждый POST /users создаёт нового пользователя."
```

### 5. Реалистичные дистракторы
Неправильные варианты должны быть:
- Правдоподобными (не очевидно неправильными)
- Связанными с темой
- Отражающими типичные ошибки

✅ **Хорошо**: `application/json`, `application/x-www-form-urlencoded`, `text/json`
❌ **Плохо**: `application/json`, `image/png`, `video/mp4`

---

### 6. Правдоподобные варианты и отсутствие маркеров

**Цель**: вопрос проверяет понимание концепции, а не интуитивное угадывание.

1) **Все варианты правдоподобны**
- Каждый вариант — типичная ошибка/полуправда/заблуждение новичков, которые «почти поняли».
- Нельзя делать варианты глупыми или очевидно неправильными.

2) **Правильный ответ не выделяется**
- Запрещено делать его самым длинным/коротким, самым «осторожным», самым «профессиональным».
- Все варианты одной тональности и примерно одной длины (ориентир: 10–20 слов).

3) **Неправильные варианты близки к правде**
- Они должны быть логичны без лекции и легко выбираемы тем, кто недопонял тему.

4) **Без лекции правильный не очевиден**
- Человек на «здравом смысле» может ошибиться.
- Точно выбрать правильный должен тот, кто понял лекцию.

5) **Без маркеров правильного ответа**
- Слова «всегда/никогда/только» — только если это 100% правда.
- Избегайте «самый правильный/самый безопасный/единственно верный».

**Пример (хорошо)**
Когда допустимо обойти формальный Change Management процесс?
A) Если задача небольшая и её сделают за 1 день
B) Если senior‑разработчик уверен, что всё под контролем
C) Только для критических production‑breaking багов с одобрения senior‑руководства
D) Никогда нельзя обходить, даже в критических ситуациях

**Пример (плохо)**
Когда допустимо обойти формальный Change Management процесс?
A) Когда очень хочется
B) Никогда
C) Всегда
D) Только в случае критических production‑breaking багов с одобрения senior‑руководства и с последующей документацией

**Золотое правило**: варианты должны быть правдоподобными, похожими по стилю и длине. Правильный не должен выглядеть «самым правильным» или «самым безопасным».
## Типы вопросов

1. **Фактологические**: Что такое? Какой код?
2. **Концептуальные**: Что означает идемпотентность?
3. **Ситуационные**: Клиент пытается создать ресурс без аутентификации - какой код?
4. **Сравнительные**: В чём отличие PUT от PATCH?
5. **Best Practices**: Какой URL правильнее?

---

## Шаблон скрипта добавления

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

async function addQuestions() {
  try {
    // 1. Найти тест
    const test = await prisma.test.findFirst({
      where: { title: 'Название теста' }
    });

    if (!test) throw new Error('Тест не найден');

    // 2. Определить вопросы по лекции
    const questions = [
      {
        question: "Какой HTTP метод для создания ресурса?",
        options: ["GET", "POST", "PUT", "DELETE"],
        correctAnswer: 1,
        explanation: "POST создаёт новый ресурс. Сервер генерирует ID и возвращает 201 Created."
      },
      // ... другие вопросы
    ];

    // 3. Получить текущий максимальный order
    const maxOrder = await prisma.testQuestion.findFirst({
      where: { testId: test.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    let nextOrder = (maxOrder?.order || 0) + 1;

    // 4. Добавить каждый вопрос
    for (const q of questions) {
      // Проверка на дубликат
      const existing = await prisma.question.findFirst({
        where: { question: q.question }
      });

      let questionId: string;

      if (existing) {
        console.log(`⚠️  Вопрос существует: ${q.question}`);
        questionId = existing.id;
      } else {
        const newQuestion = await prisma.question.create({ data: q });
        questionId = newQuestion.id;
        console.log(`✅ Создан: ${q.question}`);
      }

      // Привязать к тесту
      const linkExists = await prisma.testQuestion.findFirst({
        where: { testId: test.id, questionId }
      });

      if (!linkExists) {
        await prisma.testQuestion.create({
          data: {
            testId: test.id,
            questionId,
            order: nextOrder++
          }
        });
        console.log(`🔗 Привязан с order ${nextOrder - 1}\n`);
      }
    }

    console.log('🎉 Готово!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

addQuestions();
```

**Запуск**: `npx tsx scripts/add-questions.ts`

---

## Частые ошибки

### ❌ Неправильный индекс correctAnswer
```javascript
options: ["GET", "POST", "PUT", "DELETE"]
correctAnswer: 1  // POST (0-based: GET=0, POST=1, PUT=2, DELETE=3)
```

Проверка: `console.log(options[1]); // "POST" ✅`

### ❌ Невалидный JSON
```javascript
// ❌ Одинарные кавычки
options: ['Option 1', 'Option 2']

// ✅ Двойные кавычки
options: ["Option 1", "Option 2"]
```

### ❌ Хардкод order
```typescript
// ❌ НЕПРАВИЛЬНО
order: 1  // Может перезаписать!

// ✅ ПРАВИЛЬНО
const maxOrder = await prisma.testQuestion.findFirst({
  where: { testId },
  orderBy: { order: 'desc' }
});
const nextOrder = (maxOrder?.order || 0) + 1;
```

### ❌ Плохое объяснение
```javascript
// ❌ Плохо
explanation: "201 правильный"

// ✅ Хорошо
explanation: "201 Created при успешном создании ресурса. Сервер возвращает Location с URL нового ресурса."
```

---

## Чеклист перед добавлением

### Содержание
- [ ] Вопрос ясен и однозначен
- [ ] Вопрос основан на материале лекции (есть ответ в лекции)
- [ ] Ровно 4 варианта ответа
- [ ] correctAnswer правильный (проверить индекс 0-based)
- [ ] Объяснение качественное (минимум 2 предложения)
- [ ] Дистракторы правдоподобны
- [ ] Нет дублирования

### Технические
- [ ] Вопрос привязан к тесту через TestQuestion
- [ ] order вычислен динамически
- [ ] Вопрос соответствует уровню теста (beginner/intermediate/advanced)
- [ ] Связь с лекцией указана (если есть)

### Охват темы
- [ ] Составлена карта всех концепций темы
- [ ] Каждая концепция имеет минимум 1 вопрос
- [ ] Нет перекоса (все концепции представлены равномерно)
- [ ] Охвачены все уровни: определения, назначение, применение, сравнение, best practices, ошибки

---

## Редактирование вопросов

### Изменить текст
```typescript
await prisma.question.update({
  where: { id: 'question_id' },
  data: { question: "Новый текст" }
});
```

### Изменить варианты
```typescript
await prisma.question.update({
  where: { id: 'question_id' },
  data: {
    options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    correctAnswer: 0  // Обновить индекс!
  }
});
```

### Улучшить объяснение
```typescript
await prisma.question.update({
  where: { question: { contains: "идемпотентен" } },
  data: {
    explanation: "PUT идемпотентен — повторные вызовы дают тот же результат. POST НЕ идемпотентен."
  }
});
```

---

## Связь с лекциями

```typescript
await prisma.question.update({
  where: { id: 'question_id' },
  data: { lectureId: 'lecture_id' }
});
```

**Зачем**: В UI появляется кнопка "📚 Изучить теорию" → открывает модальное окно с лекцией

**Важно**: для новых вопросов связь с лекцией обязательна.

---

## Полезные команды

```bash
npx prisma studio              # GUI для БД
npx tsx scripts/add-questions.ts   # Запуск скрипта
npm run seed                   # Заполнить БД
```



