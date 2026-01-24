import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function cleanContent(content: string): string {
  return content
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

const lectureContentRaw = `
# Batching Requests в REST API

## Введение

Представьте, что вам нужно купить 50 продуктов в супермаркете. Вместо того чтобы 50 раз подходить к кассе (по одному товару), вы кладете все в корзину и оплачиваете один раз. REST API batching работает так же: вместо 50 отдельных HTTP запросов клиент отправляет один запрос с массивом операций. Это экономит время, снижает latency и уменьшает нагрузку на сервер.

## Что такое Request Batching?

**Batching** - отправка нескольких операций в одном HTTP запросе.

### Проблема: множество мелких запросов

**Без batching:**
\`\`\`javascript
await fetch('/api/users/1');
await fetch('/api/users/2');
await fetch('/api/users/3');
// ... 50 запросов
\`\`\`

**Проблемы:**
- 50 × (TCP handshake + TLS handshake + HTTP overhead)
- 50 × latency (roundtrip time)
- 50 × server processing overhead
- Rate limiting быстро исчерпывается

**С batching:**
\`\`\`javascript
await fetch('/api/batch', {
  method: 'POST',
  body: JSON.stringify([
    { method: 'GET', url: '/users/1' },
    { method: 'GET', url: '/users/2' },
    { method: 'GET', url: '/users/3' }
    // ... 50 операций
  ])
});
\`\`\`

**Результат:** 1 × HTTP overhead, 1 × latency, эффективнее.

---

## Преимущества Batching

### 1. Снижение HTTP overhead

**HTTP overhead на запрос:**
- TCP handshake: 1 RTT (round-trip time)
- TLS handshake: 2 RTT
- HTTP headers: ~500-1000 bytes

**Пример:**
\`\`\`
50 запросов без batching:
- 50 × 3 RTT = 150 RTT
- 50 × 1KB headers = 50KB overhead

1 batch запрос:
- 1 × 3 RTT = 3 RTT
- 1 × 1KB headers = 1KB overhead

Экономия: ~98% RTT, ~98% header overhead
\`\`\`

### 2. Меньше latency

**Mobile 3G (150ms latency):**
\`\`\`
50 запросов: 50 × 150ms = 7500ms (7.5 секунд)
1 batch: 1 × 150ms = 150ms

Ускорение: 50x
\`\`\`

### 3. Rate limiting экономия

\`\`\`
Rate limit: 100 запросов/минуту

Без batching: 50 запросов → 50% лимита
С batching: 1 запрос → 1% лимита
\`\`\`

### 4. Атомарность (опционально)

Можно выполнить несколько операций в транзакции:
\`\`\`
Создать пользователя + создать профиль + отправить email
Все успешно или rollback
\`\`\`

---

## Реализация Batch Endpoint

### Базовый синтаксис

**Endpoint:** \`POST /batch\`

**Request:**
\`\`\`json
POST /api/batch
Content-Type: application/json

{
  "operations": [
    {
      "id": "op1",
      "method": "GET",
      "url": "/users/123"
    },
    {
      "id": "op2",
      "method": "POST",
      "url": "/users",
      "body": { "name": "John Doe" }
    },
    {
      "id": "op3",
      "method": "DELETE",
      "url": "/users/456"
    }
  ]
}
\`\`\`

**Response:**
\`\`\`json
HTTP/1.1 207 Multi-Status
Content-Type: application/json

{
  "results": [
    {
      "id": "op1",
      "status": 200,
      "body": { "id": 123, "name": "Alice" }
    },
    {
      "id": "op2",
      "status": 201,
      "body": { "id": 789, "name": "John Doe" }
    },
    {
      "id": "op3",
      "status": 404,
      "error": "User not found"
    }
  ]
}
\`\`\`

### Ключевые элементы

**\`id\`** - идентификатор операции для сопоставления запроса и ответа

**\`method\`** - HTTP метод (GET, POST, PUT, PATCH, DELETE)

**\`url\`** - относительный URL endpoint (без базового URL)

**\`body\`** - тело запроса (для POST/PUT/PATCH)

**\`status\`** - HTTP статус код для каждой операции

---

## Статус коды для Batch

### 207 Multi-Status (рекомендуется)

**RFC 4918 (WebDAV):**
\`\`\`
HTTP/1.1 207 Multi-Status
\`\`\`

Означает: ответ содержит множество статусов (смесь успехов и ошибок).

**Когда использовать:**
- Batch запрос выполнен (валидный)
- Внутри batch есть и успешные, и неуспешные операции

### 200 OK

\`\`\`
HTTP/1.1 200 OK
\`\`\`

**Когда использовать:**
- Все операции успешны
- Или если ваш API не использует 207

### 400 Bad Request

\`\`\`
HTTP/1.1 400 Bad Request
{
  "error": "Invalid batch format"
}
\`\`\`

**Когда использовать:**
- Сам batch запрос невалидный (синтаксис JSON, отсутствует required поле)
- До выполнения операций

### 500 Internal Server Error

\`\`\`
HTTP/1.1 500 Internal Server Error
\`\`\`

**Когда использовать:**
- Сервер упал при обработке batch
- Невозможно вернуть частичные результаты

### Рекомендация

**Всегда используйте 207 Multi-Status** для batch с смешанными результатами.

---

## Обработка ошибок в Batch

### Стратегия 1: Continue on error (рекомендуется)

**Концепция:** Выполнить все операции, вернуть ошибки для failed.

\`\`\`json
{
  "results": [
    { "id": "op1", "status": 200, "body": {...} },
    { "id": "op2", "status": 404, "error": "Not found" },
    { "id": "op3", "status": 200, "body": {...} }
  ]
}
\`\`\`

**Плюсы:**
✅ Максимальная полезность - получаем успешные результаты
✅ Клиент сам решает что делать с ошибками
✅ Меньше повторных запросов

**Минусы:**
❌ Может создать inconsistent state если операции зависимы

### Стратегия 2: Atomic (all-or-nothing)

**Концепция:** Если одна операция failed - rollback всего batch.

\`\`\`json
POST /api/batch
{
  "atomic": true,
  "operations": [...]
}
\`\`\`

**Response если одна операция failed:**
\`\`\`json
HTTP/1.1 400 Bad Request
{
  "error": "Batch failed",
  "failed_operation": "op2",
  "reason": "User not found"
}
\`\`\`

**Плюсы:**
✅ Consistency - либо все успешно, либо ничего
✅ Подходит для транзакций (создание связанных сущностей)

**Минусы:**
❌ Меньше полезной работы - один failed прерывает все
❌ Сложнее реализация (требует транзакции/rollback)

### Стратегия 3: Stop on first error

**Концепция:** Прервать выполнение при первой ошибке, вернуть частичные результаты.

\`\`\`json
{
  "stopOnError": true,
  "operations": [...]
}
\`\`\`

**Response:**
\`\`\`json
{
  "results": [
    { "id": "op1", "status": 200, "body": {...} },
    { "id": "op2", "status": 404, "error": "Not found" }
    // op3, op4, op5... не выполнены
  ],
  "stopped": true
}
\`\`\`

### Выбор стратегии

| Сценарий | Стратегия |
|----------|-----------|
| Независимые операции (bulk GET) | Continue on error |
| Транзакция (создание order + items) | Atomic |
| Ранний exit важен | Stop on first error |

**Default:** Continue on error (наиболее универсальная).

---

## Зависимости между операциями

### Проблема

Операция 2 зависит от результата операции 1:

\`\`\`
1. Создать пользователя (получить ID)
2. Создать профиль для этого пользователя (нужен ID из шага 1)
\`\`\`

### Решение 1: Последовательный порядок

**Концепция:** Гарантировать выполнение операций по порядку.

\`\`\`json
{
  "sequential": true,
  "operations": [
    {
      "id": "op1",
      "method": "POST",
      "url": "/users",
      "body": { "name": "John" }
    },
    {
      "id": "op2",
      "method": "POST",
      "url": "/profiles",
      "body": { "userId": "{op1.body.id}", "bio": "..." }
    }
  ]
}
\`\`\`

**\`{op1.body.id}\`** - ссылка на результат предыдущей операции.

### Решение 2: Explicit dependencies

\`\`\`json
{
  "operations": [
    {
      "id": "op1",
      "method": "POST",
      "url": "/users",
      "body": { "name": "John" }
    },
    {
      "id": "op2",
      "dependsOn": ["op1"],
      "method": "POST",
      "url": "/profiles",
      "body": { "userId": "$op1.body.id", "bio": "..." }
    }
  ]
}
\`\`\`

Сервер выполняет \`op2\` только после успеха \`op1\`.

### Решение 3: Два batch запроса

Если dependency сложная - разбейте на два batch:

\`\`\`javascript
// Batch 1: создать пользователей
const result1 = await fetch('/batch', { ... });
const userIds = result1.results.map(r => r.body.id);

// Batch 2: создать профили с полученными IDs
await fetch('/batch', {
  operations: userIds.map(id => ({
    method: 'POST',
    url: '/profiles',
    body: { userId: id, ... }
  }))
});
\`\`\`

---

## Ограничение размера Batch

### Зачем ограничивать?

❌ **Проблемы больших batch:**
1. **Memory exhaustion** - обработка 10,000 операций съедает RAM
2. **Timeout** - выполнение занимает > request timeout
3. **Unfair usage** - один batch блокирует сервер
4. **Error handling** - сложно обрабатывать огромные ответы

### Рекомендуемые лимиты

\`\`\`
Консервативный: 10-50 операций
Умеренный: 100 операций
Максимальный: 500 операций
\`\`\`

### Реализация

\`\`\`javascript
app.post('/batch', (req, res) => {
  const operations = req.body.operations;

  if (operations.length > 100) {
    return res.status(400).json({
      error: 'Batch too large',
      max: 100,
      actual: operations.length
    });
  }

  // Обработка
});
\`\`\`

### Документация

Явно укажите лимит в API docs:
\`\`\`
POST /batch
Maximum operations: 100
\`\`\`

---

## Multipart/Mixed Batching

**Концепция:** Batch через multipart HTTP (как email attachments).

### Синтаксис

\`\`\`
POST /batch
Content-Type: multipart/mixed; boundary=batch_boundary

--batch_boundary
Content-Type: application/http

GET /users/123 HTTP/1.1
Host: api.example.com

--batch_boundary
Content-Type: application/http

POST /users HTTP/1.1
Host: api.example.com
Content-Type: application/json

{"name": "John Doe"}

--batch_boundary--
\`\`\`

### Response

\`\`\`
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=batch_response

--batch_response
Content-Type: application/http

HTTP/1.1 200 OK
Content-Type: application/json

{"id": 123, "name": "Alice"}

--batch_response
Content-Type: application/http

HTTP/1.1 201 Created
Content-Type: application/json

{"id": 789, "name": "John Doe"}

--batch_response--
\`\`\`

### Плюсы

✅ **Стандарт** - часть HTTP спецификации
✅ **Полная HTTP семантика** - сохраняются все заголовки

### Минусы

❌ **Сложный парсинг** - multipart формат громоздкий
❌ **Редко используется** - JSON батчинг популярнее

**Используется в:** Google APIs (некоторые), OData.

---

## JSON-RPC Batch

**JSON-RPC 2.0** поддерживает batching нативно.

### Синтаксис

\`\`\`json
POST /rpc
Content-Type: application/json

[
  {
    "jsonrpc": "2.0",
    "method": "getUser",
    "params": { "id": 123 },
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "method": "createUser",
    "params": { "name": "John" },
    "id": 2
  }
]
\`\`\`

### Response

\`\`\`json
[
  {
    "jsonrpc": "2.0",
    "result": { "id": 123, "name": "Alice" },
    "id": 1
  },
  {
    "jsonrpc": "2.0",
    "result": { "id": 789, "name": "John" },
    "id": 2
  }
]
\`\`\`

### Преимущества JSON-RPC

✅ **Встроенный batching** - не нужно изобретать формат
✅ **Простой** - массив запросов → массив ответов
✅ **Спецификация** - стандартизированный формат

**Используется в:** Ethereum JSON-RPC, Bitcoin RPC, многие blockchain APIs.

---

## GraphQL Batching

### Проблема N+1

\`\`\`javascript
// Без batching: N+1 запросов
const users = await getUsers(); // 1 запрос
for (const user of users) {
  user.avatar = await getAvatar(user.id); // N запросов
}
\`\`\`

### DataLoader (Facebook)

\`\`\`javascript
const DataLoader = require('dataloader');

const avatarLoader = new DataLoader(async (userIds) => {
  // Batch запрос: получить аватары для всех userIds сразу
  const avatars = await db.avatars.findAll({ userId: userIds });
  return userIds.map(id => avatars.find(a => a.userId === id));
});

// Использование
const user1Avatar = await avatarLoader.load(1);
const user2Avatar = await avatarLoader.load(2);
// DataLoader автоматически объединяет в один запрос
\`\`\`

### Query Batching

\`\`\`json
POST /graphql
[
  { "query": "{ user(id: 1) { name } }" },
  { "query": "{ user(id: 2) { name } }" },
  { "query": "{ posts { title } }" }
]
\`\`\`

**Response:**
\`\`\`json
[
  { "data": { "user": { "name": "Alice" } } },
  { "data": { "user": { "name": "Bob" } } },
  { "data": { "posts": [...] } }
]
\`\`\`

**Используется в:** Apollo Client, Relay.

---

## Facebook Batch API

**Концепция:** Батчинг через относительные URLs.

### Синтаксис

\`\`\`json
POST https://graph.facebook.com/
{
  "batch": [
    { "method": "GET", "relative_url": "me" },
    { "method": "GET", "relative_url": "me/friends?limit=10" },
    { "method": "POST", "relative_url": "me/feed", "body": "message=Hello" }
  ]
}
\`\`\`

### Response

\`\`\`json
[
  {
    "code": 200,
    "headers": [...],
    "body": "{\"id\":\"123\",\"name\":\"John\"}"
  },
  {
    "code": 200,
    "headers": [...],
    "body": "{\"data\":[...]}"
  },
  {
    "code": 200,
    "body": "{\"id\":\"post_456\"}"
  }
]
\`\`\`

### Особенности

- \`relative_url\` вместо полного URL
- \`body\` как URL-encoded string для POST
- Каждый ответ - отдельный объект с \`code\`, \`headers\`, \`body\`

**Используется в:** Facebook Graph API.

---

## Bulk Operations vs Batching

### Bulk Operation

**Концепция:** Одна операция над множеством ресурсов.

\`\`\`json
POST /users/bulk-delete
{
  "ids": [1, 2, 3, 4, 5]
}
\`\`\`

**Характеристики:**
- Одно действие (delete)
- Множество ресурсов (ids)
- Атомарная или нет (depends)

### Batching

**Концепция:** Множество разных операций.

\`\`\`json
POST /batch
{
  "operations": [
    { "method": "DELETE", "url": "/users/1" },
    { "method": "POST", "url": "/users", "body": {...} },
    { "method": "GET", "url": "/products/10" }
  ]
}
\`\`\`

**Характеристики:**
- Разные действия (GET, POST, DELETE)
- Разные ресурсы (users, products)
- Обычно не атомарная

### Когда использовать что?

| Сценарий | Подход |
|----------|--------|
| Удалить 100 пользователей | Bulk: \`POST /users/bulk-delete\` |
| Получить данные 10 разных ресурсов | Batching: \`POST /batch\` |
| Создать 50 постов | Bulk: \`POST /posts/bulk-create\` |
| Создать user + profile + send email | Batching (или transaction) |

**Резюме:** Bulk для однотипных операций, Batching для разнородных.

---

## Транзакционный Batch

### Флаг atomic

\`\`\`json
POST /batch
{
  "atomic": true,
  "operations": [
    { "method": "POST", "url": "/orders", "body": {...} },
    { "method": "POST", "url": "/payments", "body": {...} }
  ]
}
\`\`\`

**Поведение:**
- Все операции выполняются в БД транзакции
- Если одна failed → ROLLBACK всего batch
- Если все success → COMMIT

### Реализация

\`\`\`javascript
app.post('/batch', async (req, res) => {
  const { atomic, operations } = req.body;

  if (atomic) {
    return await db.transaction(async (trx) => {
      const results = [];

      for (const op of operations) {
        try {
          const result = await executeOperation(op, trx);
          results.push(result);
        } catch (error) {
          // В транзакции: rollback автоматически
          throw error;
        }
      }

      return results;
    });
  } else {
    // Non-atomic: продолжаем даже при ошибках
    const results = [];
    for (const op of operations) {
      try {
        results.push(await executeOperation(op));
      } catch (error) {
        results.push({ status: 500, error: error.message });
      }
    }
    return results;
  }
});
\`\`\`

### Когда использовать

✅ **Транзакционный batch:**
- Создание связанных сущностей (order + items)
- Финансовые операции (transfer = debit + credit)
- Consistency критична

❌ **Non-transactional batch:**
- Независимые операции (bulk GET)
- Partial success приемлем

---

## Логирование Batch операций

### Проблема

Один batch запрос = множество операций. Как логировать?

### Стратегия 1: Логировать весь batch

\`\`\`
[INFO] Batch request: 10 operations
[INFO] Batch completed: 8 success, 2 failed
\`\`\`

**Плюсы:**
✅ Компактные логи
✅ Легко видеть batch-level метрики

**Минусы:**
❌ Нет деталей по операциям
❌ Сложно debug конкретную операцию

### Стратегия 2: Логировать каждую операцию

\`\`\`
[INFO] Batch started: request_id=abc123, operations=10
[INFO] op1: GET /users/1 → 200 OK (50ms)
[INFO] op2: POST /users → 201 Created (120ms)
[ERROR] op3: DELETE /users/999 → 404 Not Found
...
[INFO] Batch completed: request_id=abc123, duration=500ms
\`\`\`

**Плюсы:**
✅ Полная audit trail
✅ Легко debug
✅ Можно анализировать performance отдельных операций

**Минусы:**
❌ Много логов (10x volume)

### Рекомендация

**Production:** Логировать каждую операцию для audit и debugging.

**Structured logging (JSON):**
\`\`\`json
{
  "level": "info",
  "batch_id": "abc123",
  "operation_id": "op2",
  "method": "POST",
  "url": "/users",
  "status": 201,
  "duration_ms": 120
}
\`\`\`

---

## Batch GET запросов

### Проблема

GET обычно не имеет body, но batch нужно передать параметры.

### Решение 1: POST /batch (рекомендуется)

\`\`\`json
POST /batch
{
  "operations": [
    { "method": "GET", "url": "/users/1" },
    { "method": "GET", "url": "/users/2" },
    { "method": "GET", "url": "/users/3" }
  ]
}
\`\`\`

Технически это POST, но внутри GET операции.

### Решение 2: GET с IDs в query

\`\`\`
GET /users?ids=1,2,3,4,5
\`\`\`

**Проблемы:**
- Ограничение длины URL (~2000 символов)
- Не гибкий (только для одного ресурса)

### Решение 3: POST /users/batch-get

\`\`\`json
POST /users/batch-get
{
  "ids": [1, 2, 3, 4, 5]
}
\`\`\`

Специальный endpoint для batch GET одного типа ресурсов.

### Рекомендация

Используйте **POST /batch** для универсальности.

---

## Практическая реализация

### Задача 1: Базовый batch endpoint

\`\`\`javascript
app.post('/batch', async (req, res) => {
  const { operations } = req.body;

  if (!Array.isArray(operations)) {
    return res.status(400).json({ error: 'operations must be array' });
  }

  if (operations.length > 100) {
    return res.status(400).json({ error: 'Max 100 operations' });
  }

  const results = [];

  for (const op of operations) {
    try {
      const result = await executeOperation(op);
      results.push({
        id: op.id,
        status: result.status,
        body: result.body
      });
    } catch (error) {
      results.push({
        id: op.id,
        status: error.status || 500,
        error: error.message
      });
    }
  }

  res.status(207).json({ results });
});

async function executeOperation(op) {
  // Simulate routing
  const handler = routes[op.method + ' ' + op.url];
  if (!handler) {
    throw { status: 404, message: 'Endpoint not found' };
  }

  return await handler(op.body);
}
\`\`\`

### Задача 2: Транзакционный batch

\`\`\`javascript
app.post('/batch', async (req, res) => {
  const { atomic, operations } = req.body;

  if (atomic) {
    try {
      const results = await db.transaction(async (trx) => {
        const res = [];
        for (const op of operations) {
          res.push(await executeOperation(op, trx));
        }
        return res;
      });

      return res.status(200).json({ results });
    } catch (error) {
      return res.status(400).json({
        error: 'Batch transaction failed',
        reason: error.message
      });
    }
  }

  // Non-atomic (continue on error)
  const results = [];
  for (const op of operations) {
    try {
      results.push(await executeOperation(op));
    } catch (error) {
      results.push({ id: op.id, status: 500, error: error.message });
    }
  }

  res.status(207).json({ results });
});
\`\`\`

### Задача 3: Зависимости между операциями

\`\`\`javascript
app.post('/batch', async (req, res) => {
  const { operations } = req.body;
  const results = {};
  const queue = [...operations];

  while (queue.length > 0) {
    const op = queue.shift();

    // Проверить зависимости
    if (op.dependsOn) {
      const ready = op.dependsOn.every(depId => results[depId]);
      if (!ready) {
        queue.push(op); // Вернуть в очередь
        continue;
      }
    }

    // Заменить переменные
    let body = JSON.stringify(op.body);
    for (const [key, value] of Object.entries(results)) {
      body = body.replace(new RegExp(\`\\$\${key}\\\\.(.*?)\`, 'g'), (match, path) => {
        return getNestedValue(value.body, path);
      });
    }
    op.body = JSON.parse(body);

    // Выполнить операцию
    results[op.id] = await executeOperation(op);
  }

  res.status(207).json({ results: Object.values(results) });
});
\`\`\`

---

## Best Practices

### 1. Ограничивайте размер batch

\`\`\`javascript
if (operations.length > 100) {
  return res.status(400).json({ error: 'Max 100 operations' });
}
\`\`\`

### 2. Всегда возвращайте ID операции

\`\`\`json
{
  "results": [
    { "id": "op1", "status": 200, ... },
    { "id": "op2", "status": 404, ... }
  ]
}
\`\`\`

Клиент должен знать какой результат к какой операции относится.

### 3. Используйте 207 Multi-Status

\`\`\`
HTTP/1.1 207 Multi-Status
\`\`\`

Явно указывает на mixed results.

### 4. Документируйте все параметры

- \`atomic\` флаг
- \`sequential\` флаг
- \`stopOnError\` поведение
- Максимальный размер batch
- Зависимости между операциями

### 5. Логируйте каждую операцию

Для audit и debugging.

### 6. Поддерживайте частичный успех

По умолчанию используйте "continue on error", а не "stop on first error".

### 7. Rate limiting на batch

\`\`\`javascript
// Batch считается как N запросов для rate limiting
const cost = operations.length;
if (!rateLimiter.consume(userId, cost)) {
  return res.status(429).json({ error: 'Rate limit exceeded' });
}
\`\`\`

---

## Сравнительная таблица подходов

| Подход | Формат | Сложность | Стандарт | Use Case |
|--------|--------|-----------|----------|----------|
| **JSON Batch** | Custom JSON | ✅ Простой | ❌ Нет | REST API |
| **Multipart/Mixed** | HTTP multipart | ❌ Сложный | ✅ HTTP стандарт | Legacy systems |
| **JSON-RPC** | JSON-RPC 2.0 | ✅ Простой | ✅ Спецификация | RPC APIs |
| **GraphQL** | GraphQL queries | ⚠️ Средний | ✅ GraphQL spec | GraphQL APIs |
| **Bulk Operation** | Custom | ✅ Простой | ❌ Нет | Однотипные операции |

---

## Заключение

**Ключевые принципы Batching:**

1. **POST /batch** - универсальный endpoint
2. **207 Multi-Status** - для mixed results
3. **Continue on error** - default стратегия
4. **Ограничение размера** - защита сервера (100 max)
5. **ID для каждой операции** - сопоставление запрос/ответ
6. **Логирование** - каждая операция отдельно
7. **Atomic флаг** - опционально для транзакций

**Когда использовать Batching:**

✅ **Mobile приложения** - снижение latency критично
✅ **Bulk operations** - множество похожих запросов
✅ **Initialization** - загрузка данных при старте приложения
✅ **Rate limiting** - экономия лимитов

❌ **Не используйте если:**
- Один-два запроса (overhead не оправдан)
- Streaming нужен (WebSocket лучше)
- Real-time критично (каждый запрос срочный)

**Практические советы:**

- Начните с простого JSON batch
- Добавляйте atomic только если нужно
- Мониторьте размер batch requests
- Документируйте все поведение
- Тестируйте частичные успехи/failures

Batching - мощная оптимизация для сценариев с множеством запросов. Используйте разумно, не усложняйте без необходимости.
`;

const lectureContent = cleanContent(lectureContentRaw);

async function createLecture() {
  try {
    console.log('🔧 Создание лекции "Batching requests"...\n');

    const lecture = await prisma.lecture.create({
      data: {
        title: 'Batching Requests в REST API',
        topic: 'Batching requests',
        content: lectureContent,
      },
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    const test = await prisma.test.findFirst({
      where: {
        OR: [
          { title: { contains: 'Batching' } },
          { title: { contains: 'batch' } }
        ]
      },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!test) {
      console.log('❌ Тест "Batching" не найден');
      return;
    }

    console.log(`📝 Найден тест: ${test.title}`);
    console.log(`❓ Количество вопросов: ${test.questions.length}\n`);

    const questionIds = test.questions.map((tq) => tq.questionId);

    const updateResult = await prisma.question.updateMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      data: {
        lectureId: lecture.id,
      },
    });

    console.log(`✅ Обновлено вопросов: ${updateResult.count}`);
    console.log(`✅ Все вопросы теста "${test.title}" связаны с лекцией!\n`);

    const verification = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        lectureId: lecture.id,
      },
    });

    console.log('📊 Проверка покрытия:');
    console.log(`   Всего вопросов в тесте: ${questionIds.length}`);
    console.log(`   Связано с лекцией: ${verification.length}`);
    console.log(
      `   Покрытие: ${((verification.length / questionIds.length) * 100).toFixed(1)}%`
    );
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLecture();
