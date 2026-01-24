import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL не загружен');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function cleanContent(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

const lectureContent = cleanContent(`# Асинхронные операции и Webhooks

## Введение: Когда задача требует времени ⏳

### Аналогия с рестораном 🍽️

Представьте, что вы заказываете еду в ресторане. Есть два варианта работы:

**Синхронный подход (как фаст-фуд):**
- Вы подходите к стойке
- Делаете заказ
- **СТОИТЕ И ЖДЕТЕ** пока приготовят бургер
- Только после этого можете сделать следующий заказ
- Все клиенты за вами тоже стоят и ждут

**Асинхронный подход (современный ресторан):**
- Вы делаете заказ
- Получаете номерок
- **ИДЕТЕ СИДЕТЬ ЗА СТОЛИК** и занимаетесь своими делами
- Когда заказ готов, вас **ВЫЗЫВАЮТ ПО НОМЕРУ** или **ПРИНОСЯТ К СТОЛУ**
- Другие клиенты могут спокойно делать заказы

В REST API это работает точно так же:
- **Синхронный запрос**: клиент отправляет запрос и **блокируется**, ждет ответа
- **Асинхронный запрос**: клиент отправляет запрос, получает подтверждение и **продолжает работу**. Когда задача выполнена, сервер **сам сообщает** результат через webhook

### Зачем нужны асинхронные операции?

Представьте такие задачи:
- 📹 **Обработка видео**: конвертация 4K видео может занять 30 минут
- 📊 **Генерация отчета**: анализ миллионов записей занимает 10 минут
- 📧 **Массовая рассылка**: отправка 100,000 писем занимает час
- 🖼️ **Обработка изображений**: создание превью для 1000 фото

Если использовать синхронный подход:
- ❌ Клиент должен держать соединение открытым 30 минут
- ❌ Если соединение оборвется, результат потеряется
- ❌ HTTP timeout обычно 30-60 секунд максимум
- ❌ Сервер блокирует ресурсы на одного клиента

С асинхронным подходом:
- ✅ Клиент получает мгновенный ответ (202 Accepted)
- ✅ Может закрыть соединение и заниматься другими задачами
- ✅ Сервер сам сообщит когда задача выполнена
- ✅ Сервер эффективно распределяет ресурсы между задачами

---

## Что такое асинхронные операции в REST API?

**Асинхронная операция** — это паттерн, когда:

1. **Клиент отправляет запрос** на выполнение долгой задачи
2. **Сервер немедленно отвечает** (обычно \`202 Accepted\`), что задача принята в обработку
3. **Сервер возвращает ссылку** для проверки статуса задачи
4. **Клиент может периодически проверять** статус (polling)
5. **ИЛИ сервер сам уведомляет** клиента когда задача готова (webhook)

### Пример жизненного цикла

\`\`\`
1. POST /api/videos (загрузка видео)
   ← 202 Accepted
   {
     "task_id": "task_abc123",
     "status": "pending",
     "status_url": "/api/tasks/task_abc123"
   }

2. Сервер начинает обработку в фоне

3. Клиент проверяет статус:
   GET /api/tasks/task_abc123
   ← 200 OK
   {
     "task_id": "task_abc123",
     "status": "processing",
     "progress": 45
   }

4. Задача завершена:
   GET /api/tasks/task_abc123
   ← 200 OK
   {
     "task_id": "task_abc123",
     "status": "completed",
     "result_url": "/api/videos/video_xyz789"
   }
\`\`\`

---

## Что такое Webhook? 🪝

**Webhook** (веб-крючок) — это механизм, когда **сервер сам отправляет HTTP-запрос клиенту** при наступлении определенного события.

### Отличие от обычного API

**Обычный REST API (клиент инициирует):**
\`\`\`
Клиент → GET /api/orders/123/status → Сервер
        ← 200 OK {status: "paid"}   ←
\`\`\`

**Webhook (сервер инициирует):**
\`\`\`
Сервер → POST https://client.com/webhooks/order-paid → Клиент
       ← 200 OK                                        ←
\`\`\`

### Аналогия с уведомлениями 📱

- **Обычный API** = вы постоянно обновляете ленту новостей (pull)
- **Webhook** = вам приходит push-уведомление (push)

### Типичный сценарий: оплата заказа

**Без webhook (polling):**
\`\`\`
1. Клиент создает заказ: POST /api/orders → {id: 123, status: "pending"}
2. Клиент каждые 5 секунд проверяет: GET /api/orders/123/status
3. Через 3 минуты: {status: "paid"}
4. = 36 ненужных запросов
\`\`\`

**С webhook:**
\`\`\`
1. Клиент создает заказ: POST /api/orders → {id: 123, status: "pending"}
2. Клиент регистрирует webhook: POST /api/webhooks {url: "https://myapp.com/payment-notify"}
3. Когда оплата прошла → Сервер сам вызывает: POST https://myapp.com/payment-notify
4. = 0 ненужных запросов, мгновенное уведомление
\`\`\`

---

## Структура Webhook запроса

Когда сервер отправляет webhook, он делает обычный HTTP POST запрос:

\`\`\`http
POST https://client.com/webhooks/order-paid HTTP/1.1
Host: client.com
Content-Type: application/json
X-Webhook-Signature: sha256=abc123def456...
X-Webhook-Event: order.paid
X-Webhook-ID: evt_abc123

{
  "event": "order.paid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "order_123",
    "amount": 9999,
    "currency": "USD",
    "payment_method": "card"
  }
}
\`\`\`

### Важные элементы:

**1. URL endpoint клиента**
- Клиент должен предоставить публичный HTTPS URL
- Пример: \`https://myapp.com/api/webhooks/payment\`

**2. Payload (тело запроса)**
- Данные о событии в JSON формате
- Содержит всю информацию о произошедшем событии

**3. Signature (подпись)**
- HMAC подпись для проверки подлинности
- Защита от поддельных запросов
- Клиент проверяет подпись с помощью секретного ключа

**4. Event type (тип события)**
- Идентификатор события: \`order.paid\`, \`video.processed\`, \`user.registered\`
- Позволяет обрабатывать разные типы событий на одном endpoint

**5. Идемпотентность**
- \`X-Webhook-ID\`: уникальный ID события
- Клиент может сохранить ID и игнорировать дубликаты

---

## Регистрация Webhook

Клиент должен **заранее сообщить серверу**, куда отправлять уведомления:

\`\`\`http
POST /api/webhooks HTTP/1.1
Content-Type: application/json

{
  "url": "https://myapp.com/api/webhooks/orders",
  "events": ["order.created", "order.paid", "order.cancelled"],
  "active": true
}
\`\`\`

**Ответ:**
\`\`\`json
{
  "id": "webhook_abc123",
  "url": "https://myapp.com/api/webhooks/orders",
  "events": ["order.created", "order.paid", "order.cancelled"],
  "active": true,
  "secret": "whsec_xyz789abc456",
  "created_at": "2024-01-15T10:00:00Z"
}
\`\`\`

### Параметры регистрации:

| Параметр | Описание | Пример |
|----------|----------|--------|
| \`url\` | HTTPS endpoint клиента | \`https://myapp.com/webhooks\` |
| \`events\` | Типы событий для подписки | \`["order.paid", "order.refunded"]\` |
| \`active\` | Активен ли webhook | \`true\` / \`false\` |
| \`secret\` | Секретный ключ для подписи | \`whsec_abc123...\` (сервер генерирует) |

---

## Polling vs Webhooks: сравнение подходов

### Polling (опрос)

Клиент периодически проверяет статус задачи:

\`\`\`javascript
// Клиентский код
async function pollTaskStatus(taskId) {
  while (true) {
    const response = await fetch(\`/api/tasks/\${taskId}\`);
    const task = await response.json();

    if (task.status === 'completed') {
      console.log('Задача выполнена!', task.result);
      break;
    } else if (task.status === 'failed') {
      console.error('Ошибка:', task.error);
      break;
    }

    // Ждем 5 секунд перед следующим запросом
    await sleep(5000);
  }
}
\`\`\`

**Плюсы polling:**
- ✅ Простая реализация
- ✅ Не требует публичного URL у клиента
- ✅ Работает за файрволами и NAT
- ✅ Клиент контролирует частоту проверок

**Минусы polling:**
- ❌ Неэффективно: много ненужных запросов
- ❌ Задержка: клиент узнает о готовности с задержкой до интервала опроса
- ❌ Нагрузка на сервер: тысячи клиентов = тысячи повторяющихся запросов
- ❌ Сложно масштабировать

### Webhooks

Сервер отправляет уведомление клиенту:

\`\`\`javascript
// Серверный код клиента (например, Express.js)
app.post('/api/webhooks/task-completed', async (req, res) => {
  const { task_id, status, result } = req.body;

  // Проверка подписи (важно!)
  if (!verifyWebhookSignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  // Обработка события
  if (status === 'completed') {
    console.log('Задача выполнена!', result);
    await processTaskResult(task_id, result);
  }

  // Важно: вернуть 200 быстро
  res.status(200).send('OK');
});
\`\`\`

**Плюсы webhooks:**
- ✅ Эффективно: только один запрос при событии
- ✅ Мгновенно: клиент узнает сразу
- ✅ Масштабируемость: сервер не обрабатывает polling запросы
- ✅ Экономия ресурсов клиента

**Минусы webhooks:**
- ❌ Сложнее реализация
- ❌ Требуется публичный HTTPS endpoint у клиента
- ❌ Проблемы с файрволами, NAT
- ❌ Нужна обработка retry логики
- ❌ Безопасность: нужна проверка подписи

### Сравнительная таблица

| Критерий | Polling | Webhooks |
|----------|---------|----------|
| **Задержка уведомления** | 5-60 секунд (интервал опроса) | < 1 секунда (мгновенно) |
| **Количество запросов** | Много (каждые N секунд) | Минимум (только при событии) |
| **Нагрузка на сервер** | Высокая (тысячи polling запросов) | Низкая |
| **Сложность реализации** | Простая | Средняя |
| **Требования к клиенту** | Ничего | Публичный HTTPS endpoint |
| **Работа за NAT/файрволом** | ✅ Да | ❌ Нет (нужен публичный IP) |
| **Масштабируемость** | ❌ Плохая | ✅ Отличная |
| **Надежность** | ✅ Клиент контролирует | ⚠️ Нужна retry логика |

### Когда использовать что?

**Используйте Polling:**
- Клиент за NAT/файрволом без публичного IP
- Простой MVP/прототип
- События редкие (раз в час)
- Клиент — мобильное приложение или браузер

**Используйте Webhooks:**
- Server-to-server интеграция
- Много событий (десятки в минуту)
- Критична скорость уведомления
- Нужна масштабируемость

**Используйте оба (гибридный подход):**
- Webhooks как primary метод
- Polling как fallback (на случай если webhook failed)
- Клиент может периодически проверять статус даже с webhook

---

## Безопасность Webhooks 🔒

### Проблема: как проверить что запрос от легитимного сервера?

Любой может отправить POST запрос на ваш webhook endpoint:

\`\`\`bash
# Злоумышленник может подделать запрос:
curl -X POST https://myapp.com/webhooks \\
  -H "Content-Type: application/json" \\
  -d '{"event":"order.paid","order_id":"fake123","amount":0}'
\`\`\`

### Решение: HMAC Signature

**HMAC** (Hash-based Message Authentication Code) — криптографическая подпись сообщения.

#### Как работает:

**На стороне сервера (отправитель webhook):**

\`\`\`javascript
const crypto = require('crypto');

const secret = 'whsec_abc123def456'; // Секретный ключ
const payload = JSON.stringify({ event: 'order.paid', order_id: '123' });

// Генерация подписи
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

// Отправка с подписью в заголовке
fetch('https://client.com/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': \`sha256=\${signature}\`
  },
  body: payload
});
\`\`\`

**На стороне клиента (получатель webhook):**

\`\`\`javascript
const crypto = require('crypto');

app.post('/webhooks', (req, res) => {
  const secret = 'whsec_abc123def456'; // Тот же секрет
  const receivedSignature = req.headers['x-webhook-signature'].replace('sha256=', '');
  const payload = JSON.stringify(req.body);

  // Вычисление ожидаемой подписи
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Сравнение подписей
  if (receivedSignature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  // Подпись верна → обрабатываем webhook
  console.log('Webhook verified:', req.body);
  res.status(200).send('OK');
});
\`\`\`

### Дополнительные меры безопасности

**1. Timestamp защита от replay атак:**

\`\`\`javascript
// Сервер отправляет timestamp
headers: {
  'X-Webhook-Timestamp': '1673784000'
}

// Клиент проверяет что webhook свежий
const timestamp = parseInt(req.headers['x-webhook-timestamp']);
const now = Math.floor(Date.now() / 1000);

if (Math.abs(now - timestamp) > 300) { // 5 минут
  return res.status(401).send('Webhook too old');
}
\`\`\`

**2. IP Whitelist:**

Разрешить запросы только с IP адресов сервера:

\`\`\`javascript
const allowedIPs = ['203.0.113.1', '203.0.113.2'];

app.post('/webhooks', (req, res) => {
  const clientIP = req.ip;

  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).send('Forbidden');
  }

  // Обработка webhook...
});
\`\`\`

**3. HTTPS обязательно:**

- ❌ \`http://myapp.com/webhooks\` — небезопасно, данные передаются открыто
- ✅ \`https://myapp.com/webhooks\` — безопасно, данные зашифрованы

**4. Rate Limiting:**

Защита от DDoS:

\`\`\`javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 100 // максимум 100 запросов
});

app.post('/webhooks', webhookLimiter, (req, res) => {
  // Обработка webhook...
});
\`\`\`

---

## Retry Logic (повторные попытки) 🔁

### Проблема: что если webhook не доставлен?

Клиент может быть временно недоступен:
- Сервер перезагружается
- Сетевой сбой
- Endpoint возвращает 5xx ошибку

### Решение: Exponential Backoff

Сервер автоматически повторяет отправку с возрастающим интервалом:

\`\`\`
Попытка 1: сразу        → FAIL (503)
Попытка 2: через 1 сек  → FAIL (timeout)
Попытка 3: через 2 сек  → FAIL (503)
Попытка 4: через 4 сек  → FAIL (timeout)
Попытка 5: через 8 сек  → SUCCESS (200)
\`\`\`

#### Реализация на сервере:

\`\`\`javascript
async function sendWebhook(url, payload, attempt = 1, maxAttempts = 5) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 5000
    });

    // Успех: 2xx статус
    if (response.ok) {
      console.log('Webhook delivered successfully');
      return true;
    }

    // Клиент ошибка (4xx) → не повторяем
    if (response.status >= 400 && response.status < 500) {
      console.error('Client error, not retrying:', response.status);
      return false;
    }

    // Сервер ошибка (5xx) → повторяем
    throw new Error(\`Server error: \${response.status}\`);

  } catch (error) {
    if (attempt >= maxAttempts) {
      console.error('Max retry attempts reached');
      return false;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.pow(2, attempt - 1) * 1000;
    console.log(\`Retrying in \${delay}ms (attempt \${attempt + 1}/\${maxAttempts})\`);

    await sleep(delay);
    return sendWebhook(url, payload, attempt + 1, maxAttempts);
  }
}
\`\`\`

### Какие статусы требуют retry?

| Статус код | Retry? | Причина |
|------------|--------|---------|
| **200 OK** | ❌ Нет | Успех |
| **201 Created** | ❌ Нет | Успех |
| **400 Bad Request** | ❌ Нет | Невалидные данные, повтор не поможет |
| **401 Unauthorized** | ❌ Нет | Проблема с аутентификацией |
| **404 Not Found** | ❌ Нет | Endpoint не существует |
| **429 Too Many Requests** | ✅ Да | Rate limit, повторить позже |
| **500 Internal Server Error** | ✅ Да | Временная проблема сервера |
| **502 Bad Gateway** | ✅ Да | Прокси проблема |
| **503 Service Unavailable** | ✅ Да | Сервис перегружен |
| **504 Gateway Timeout** | ✅ Да | Таймаут |
| **Timeout** | ✅ Да | Нет ответа |

---

## Идемпотентность Webhooks 🎯

### Проблема: дублирование событий

Webhook может быть доставлен **несколько раз**:
- Retry логика (если первый раз клиент не ответил вовремя)
- Проблемы с сетью (запрос отправлен, но подтверждение потеряно)
- Сбои на стороне сервера

\`\`\`
Сервер → POST /webhooks {order_id: 123, event: "paid"} → Клиент
        ← (response lost)

Сервер видит timeout → повторяет:
Сервер → POST /webhooks {order_id: 123, event: "paid"} → Клиент

Итог: клиент получил webhook дважды!
\`\`\`

### Решение: Event ID и дедупликация

Каждый webhook имеет уникальный \`event_id\`:

\`\`\`json
{
  "event_id": "evt_abc123def456",
  "event": "order.paid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "order_123",
    "amount": 9999
  }
}
\`\`\`

**Клиент сохраняет обработанные event_id:**

\`\`\`javascript
const processedEvents = new Set(); // В продакшене: Redis или БД

app.post('/webhooks', async (req, res) => {
  const { event_id, event, data } = req.body;

  // Проверка дубликата
  if (processedEvents.has(event_id)) {
    console.log('Duplicate webhook ignored:', event_id);
    return res.status(200).send('OK'); // ✅ Всё равно вернуть 200!
  }

  // Обработка события
  await handleEvent(event, data);

  // Сохранение event_id
  processedEvents.add(event_id);

  res.status(200).send('OK');
});
\`\`\`

**Важно:**
- ✅ Сохранять \`event_id\` **ПЕРЕД** началом обработки
- ✅ Возвращать \`200 OK\` даже для дубликатов
- ✅ Использовать персистентное хранилище (БД/Redis), не память
- ✅ Очищать старые event_id (старше 7-30 дней)

---

## Решение типичных задач

### Задача 1: Создание асинхронной операции обработки файла

**Вопрос теста:** Как правильно создать асинхронную операцию в REST API?

**Решение:**

\`\`\`javascript
// POST /api/files/process - загрузка файла на обработку
app.post('/api/files/process', async (req, res) => {
  const { file_url, operation } = req.body;

  // 1. Валидация входных данных
  if (!file_url || !operation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 2. Создание задачи в БД
  const task = await db.tasks.create({
    id: generateTaskId(), // task_abc123
    type: 'file_processing',
    status: 'pending',
    input: { file_url, operation },
    created_at: new Date()
  });

  // 3. Запуск обработки в фоне (worker/queue)
  await jobQueue.add('process-file', {
    task_id: task.id,
    file_url,
    operation
  });

  // 4. ✅ Немедленный ответ 202 Accepted
  return res.status(202).json({
    task_id: task.id,
    status: 'pending',
    status_url: \`/api/tasks/\${task.id}\`,
    message: 'File processing started'
  });
});

// GET /api/tasks/:id - проверка статуса
app.get('/api/tasks/:id', async (req, res) => {
  const task = await db.tasks.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.status(200).json({
    task_id: task.id,
    status: task.status, // pending, processing, completed, failed
    progress: task.progress, // 0-100
    result_url: task.status === 'completed' ? task.result_url : null,
    error: task.status === 'failed' ? task.error : null
  });
});
\`\`\`

**Ключевые моменты:**
- ✅ Статус код \`202 Accepted\` (не 200)
- ✅ Возвращаем \`task_id\` и \`status_url\`
- ✅ Обработка запускается в фоне (не блокирует ответ)
- ✅ Предоставляем endpoint для проверки статуса

---

### Задача 2: Регистрация Webhook endpoint

**Вопрос теста:** Как зарегистрировать webhook для получения уведомлений?

**Решение:**

\`\`\`javascript
// POST /api/webhooks - регистрация webhook
app.post('/api/webhooks', async (req, res) => {
  const { url, events } = req.body;

  // 1. Валидация URL
  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({
      error: 'URL must be HTTPS'
    });
  }

  // 2. Валидация событий
  const validEvents = ['task.completed', 'task.failed', 'file.processed'];
  const invalidEvents = events.filter(e => !validEvents.includes(e));

  if (invalidEvents.length > 0) {
    return res.status(400).json({
      error: 'Invalid events',
      invalid: invalidEvents,
      valid_events: validEvents
    });
  }

  // 3. Генерация секретного ключа
  const secret = \`whsec_\${crypto.randomBytes(32).toString('hex')}\`;

  // 4. Сохранение webhook в БД
  const webhook = await db.webhooks.create({
    id: generateWebhookId(),
    user_id: req.user.id,
    url,
    events,
    secret,
    active: true,
    created_at: new Date()
  });

  // 5. (Опционально) Тестовая отправка
  try {
    await sendTestWebhook(url, secret);
  } catch (error) {
    console.warn('Test webhook failed:', error.message);
  }

  // 6. Ответ с secret (показываем только один раз!)
  return res.status(201).json({
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    secret: webhook.secret, // ⚠️ Сохраните! Больше не покажем
    active: webhook.active,
    created_at: webhook.created_at
  });
});
\`\`\`

**Что должен сделать клиент:**
1. Сохранить \`secret\` в безопасном месте
2. Создать endpoint \`https://myapp.com/webhooks\`
3. Проверять подпись в каждом webhook запросе

---

### Задача 3: Проверка HMAC подписи webhook

**Вопрос теста:** Как проверить что webhook запрос легитимный?

**Решение:**

\`\`\`javascript
const crypto = require('crypto');

// Middleware для проверки webhook подписи
function verifyWebhookSignature(req, res, next) {
  const secret = process.env.WEBHOOK_SECRET; // whsec_abc123...
  const signature = req.headers['x-webhook-signature'];

  // 1. Проверка наличия подписи
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  // 2. Извлечение хеша (формат: "sha256=abc123...")
  const [algorithm, receivedHash] = signature.split('=');

  if (algorithm !== 'sha256') {
    return res.status(401).json({ error: 'Unsupported algorithm' });
  }

  // 3. Вычисление ожидаемой подписи
  const payload = JSON.stringify(req.body);
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // 4. Сравнение подписей (timing-safe comparison)
  const isValid = crypto.timingSafeEqual(
    Buffer.from(receivedHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // ✅ Подпись верна
  next();
}

// Использование
app.post('/webhooks', verifyWebhookSignature, async (req, res) => {
  const { event, data } = req.body;

  console.log('Verified webhook received:', event);
  await handleWebhookEvent(event, data);

  res.status(200).send('OK');
});
\`\`\`

**Важные детали:**
- ✅ Использовать \`crypto.timingSafeEqual\` для защиты от timing атак
- ✅ Проверять подпись **ДО** обработки данных
- ✅ Возвращать 401 при невалидной подписи

---

### Задача 4: Реализация retry логики для webhook отправки

**Вопрос теста:** Как обеспечить надежную доставку webhook при временных сбоях?

**Решение:**

\`\`\`javascript
async function sendWebhookWithRetry(webhookUrl, payload, options = {}) {
  const {
    maxAttempts = 5,
    initialDelay = 1000,
    maxDelay = 60000,
    secret
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Генерация подписи
      const signature = generateSignature(payload, secret);

      // 2. Отправка запроса
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': \`sha256=\${signature}\`,
          'X-Webhook-Attempt': attempt.toString(),
          'X-Webhook-ID': payload.event_id
        },
        body: JSON.stringify(payload),
        timeout: 10000 // 10 секунд
      });

      // 3. Успех: 2xx статус
      if (response.ok) {
        console.log(\`Webhook delivered (attempt \${attempt})\`);
        return { success: true, attempt };
      }

      // 4. Client error (4xx) → не повторяем
      if (response.status >= 400 && response.status < 500) {
        console.error(\`Client error \${response.status}, not retrying\`);
        return { success: false, reason: 'client_error', status: response.status };
      }

      // 5. Server error (5xx) → повторяем
      console.warn(\`Server error \${response.status}, will retry\`);
      throw new Error(\`Server error: \${response.status}\`);

    } catch (error) {
      console.error(\`Webhook attempt \${attempt} failed:\`, error.message);

      // Последняя попытка → прекращаем
      if (attempt === maxAttempts) {
        console.error('Max retry attempts reached');
        await logFailedWebhook(webhookUrl, payload, error);
        return { success: false, reason: 'max_attempts', error: error.message };
      }

      // Exponential backoff с jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      );

      console.log(\`Retrying in \${Math.round(delay)}ms...\`);
      await sleep(delay);
    }
  }
}

// Использование
const result = await sendWebhookWithRetry(
  'https://client.com/webhooks',
  {
    event_id: 'evt_abc123',
    event: 'task.completed',
    data: { task_id: 'task_xyz', result_url: '/results/xyz' }
  },
  {
    maxAttempts: 5,
    secret: 'whsec_secret_key'
  }
);

if (!result.success) {
  // Webhook failed after retries → manual intervention needed
  await notifyAdmin('Webhook delivery failed', result);
}
\`\`\`

**Стратегия retry:**
- Попытка 1: сразу
- Попытка 2: через ~1 секунду
- Попытка 3: через ~2 секунды
- Попытка 4: через ~4 секунды
- Попытка 5: через ~8 секунд

**Jitter** (случайная добавка) предотвращает "thundering herd" эффект.

---

### Задача 5: Идемпотентная обработка webhooks

**Вопрос теста:** Как избежать дублирования действий при повторной доставке webhook?

**Решение:**

\`\`\`javascript
const Redis = require('redis');
const redis = Redis.createClient();

app.post('/webhooks/order-paid', async (req, res) => {
  const { event_id, event, data } = req.body;
  const { order_id, amount } = data;

  // 1. Проверка подписи (см. задачу 3)
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Проверка дубликата через Redis
  const key = \`webhook:processed:\${event_id}\`;
  const exists = await redis.get(key);

  if (exists) {
    console.log(\`Duplicate webhook \${event_id}, ignoring\`);
    return res.status(200).send('OK'); // ✅ Всё равно 200!
  }

  // 3. Пометить как обрабатываемый (lock)
  await redis.setex(key, 86400, 'processing'); // TTL 24 часа

  try {
    // 4. Обработка события (идемпотентно!)
    await db.transaction(async (trx) => {
      // Проверка что заказ ещё не оплачен
      const order = await trx('orders')
        .where({ id: order_id })
        .forUpdate() // Блокировка строки
        .first();

      if (order.status === 'paid') {
        console.log(\`Order \${order_id} already paid, skipping\`);
        return;
      }

      // Обновление статуса заказа
      await trx('orders')
        .where({ id: order_id })
        .update({ status: 'paid', paid_at: new Date() });

      // Отправка email (идемпотентно через message_id)
      await sendEmail({
        message_id: event_id, // Используем event_id как message_id
        to: order.customer_email,
        subject: 'Payment confirmed',
        body: \`Your order #\${order_id} has been paid.\`
      });
    });

    // 5. Пометить как обработанный
    await redis.setex(key, 86400 * 30, 'completed'); // TTL 30 дней

    console.log(\`Webhook \${event_id} processed successfully\`);
    return res.status(200).send('OK');

  } catch (error) {
    // 6. Ошибка → удалить lock, чтобы можно было повторить
    await redis.del(key);

    console.error(\`Error processing webhook \${event_id}:\`, error);
    return res.status(500).send('Processing error');
  }
});
\`\`\`

**Ключевые принципы идемпотентности:**
- ✅ Проверять \`event_id\` перед обработкой
- ✅ Использовать database locks (\`forUpdate\`) для критичных операций
- ✅ Проверять текущее состояние перед изменением
- ✅ Всегда возвращать \`200 OK\` даже для дубликатов

---

### Задача 6: Отслеживание статуса асинхронной задачи (polling)

**Вопрос теста:** Как клиент может отслеживать статус долгой операции?

**Решение на клиенте (JavaScript):**

\`\`\`javascript
async function submitTaskAndWait(taskData) {
  // 1. Создание задачи
  const createResponse = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });

  if (createResponse.status !== 202) {
    throw new Error('Failed to create task');
  }

  const { task_id, status_url } = await createResponse.json();
  console.log(\`Task created: \${task_id}\`);

  // 2. Polling со смарт-интервалом
  let pollInterval = 1000; // Начинаем с 1 секунды
  const maxInterval = 10000; // Максимум 10 секунд

  while (true) {
    // 3. Проверка статуса
    const statusResponse = await fetch(status_url);
    const task = await statusResponse.json();

    console.log(\`Task \${task_id} status: \${task.status} (\${task.progress}%)\`);

    // 4. Обработка финальных статусов
    if (task.status === 'completed') {
      console.log('Task completed!', task.result_url);
      return {
        success: true,
        result_url: task.result_url,
        result: task.result
      };
    }

    if (task.status === 'failed') {
      console.error('Task failed:', task.error);
      return {
        success: false,
        error: task.error
      };
    }

    // 5. Adaptive polling: увеличиваем интервал со временем
    await sleep(pollInterval);
    pollInterval = Math.min(pollInterval * 1.5, maxInterval);
  }
}

// Использование
try {
  const result = await submitTaskAndWait({
    type: 'video_processing',
    video_url: 'https://example.com/video.mp4',
    operations: ['transcode', 'thumbnail']
  });

  if (result.success) {
    window.location.href = result.result_url;
  }
} catch (error) {
  alert('Task failed: ' + error.message);
}
\`\`\`

**Оптимизации:**
- ✅ Adaptive polling: интервал увеличивается со временем (1s → 1.5s → 2.25s → 3.4s → 5s → 7.5s → 10s)
- ✅ Прекращаем polling при финальных статусах
- ✅ Показываем прогресс пользователю

---

### Задача 7: Webhook endpoint с graceful degradation

**Вопрос теста:** Как обработать webhook если какой-то сервис недоступен?

**Решение:**

\`\`\`javascript
app.post('/webhooks/task-completed', async (req, res) => {
  const { event_id, data } = req.body;
  const { task_id, result_url } = data;

  // 1. Быстро вернуть 200 (не блокируем webhook sender)
  res.status(200).send('OK');

  // 2. Асинхронная обработка
  setImmediate(async () => {
    try {
      // Критичная операция: обновление БД
      await db.tasks.update(task_id, {
        status: 'notified',
        result_url,
        notified_at: new Date()
      });

      // Некритичная операция 1: отправка email
      try {
        await sendEmail({
          to: task.owner_email,
          subject: 'Task completed',
          body: \`Your task is ready: \${result_url}\`
        });
      } catch (emailError) {
        // Email failed → не критично, логируем и продолжаем
        console.error('Email send failed:', emailError);
        await scheduleRetry('email', { task_id, result_url });
      }

      // Некритичная операция 2: уведомление в Slack
      try {
        await notifySlack({
          channel: '#notifications',
          text: \`Task \${task_id} completed: \${result_url}\`
        });
      } catch (slackError) {
        // Slack failed → не критично
        console.warn('Slack notification failed:', slackError);
      }

      // Некритичная операция 3: аналитика
      try {
        await trackEvent('task_completed', { task_id, duration: task.duration });
      } catch (analyticsError) {
        // Analytics failed → совсем не критично
        console.warn('Analytics failed:', analyticsError);
      }

      console.log(\`Webhook \${event_id} processed successfully\`);

    } catch (criticalError) {
      // Критичная ошибка (БД недоступна) → нужно ручное вмешательство
      console.error('CRITICAL: Webhook processing failed:', criticalError);
      await alertAdmin({
        severity: 'critical',
        message: \`Failed to process webhook \${event_id}\`,
        error: criticalError
      });

      // Сохраняем webhook в dead letter queue для повторной обработки
      await deadLetterQueue.add({ event_id, data });
    }
  });
});
\`\`\`

**Принципы graceful degradation:**
- ✅ Быстро возвращаем \`200 OK\` серверу (< 1 секунды)
- ✅ Обработка в фоне через \`setImmediate\`
- ✅ Разделяем критичные и некритичные операции
- ✅ Некритичные ошибки → логируем, но продолжаем
- ✅ Критичные ошибки → dead letter queue + admin alert

---

### Задача 8: Long Polling для real-time уведомлений

**Вопрос теста:** Как реализовать альтернативу webhooks для клиентов без публичного URL?

**Решение: Long Polling**

Long polling — клиент делает запрос и сервер **держит соединение открытым** до появления события:

**Серверная часть (Node.js):**

\`\`\`javascript
const eventEmitter = new EventEmitter();
const maxWaitTime = 30000; // 30 секунд

app.get('/api/events/poll', async (req, res) => {
  const userId = req.user.id;
  const lastEventId = req.query.last_event_id;

  // 1. Проверка есть ли новые события в БД
  const newEvents = await db.events
    .where('user_id', userId)
    .where('id', '>', lastEventId || '0')
    .orderBy('created_at')
    .limit(10);

  if (newEvents.length > 0) {
    // Есть новые события → немедленно возвращаем
    return res.json({
      events: newEvents,
      last_event_id: newEvents[newEvents.length - 1].id
    });
  }

  // 2. Нет событий → ждем новых
  const timeout = setTimeout(() => {
    cleanup();
    res.json({ events: [], last_event_id: lastEventId });
  }, maxWaitTime);

  const handler = (event) => {
    if (event.user_id === userId) {
      cleanup();
      res.json({
        events: [event],
        last_event_id: event.id
      });
    }
  };

  eventEmitter.on('new_event', handler);

  const cleanup = () => {
    clearTimeout(timeout);
    eventEmitter.off('new_event', handler);
  };

  // 3. Обработка закрытия соединения клиентом
  req.on('close', cleanup);
});

// Когда происходит событие
async function emitUserEvent(userId, eventType, data) {
  const event = await db.events.create({
    user_id: userId,
    type: eventType,
    data,
    created_at: new Date()
  });

  // Уведомляем всех слушателей
  eventEmitter.emit('new_event', event);
}
\`\`\`

**Клиентская часть:**

\`\`\`javascript
async function startLongPolling() {
  let lastEventId = null;

  while (true) {
    try {
      const response = await fetch(
        \`/api/events/poll?last_event_id=\${lastEventId || ''}\`,
        { timeout: 35000 } // Чуть больше server timeout
      );

      const { events, last_event_id } = await response.json();

      // Обработка событий
      for (const event of events) {
        console.log('New event:', event.type, event.data);
        handleEvent(event);
      }

      // Обновляем last_event_id
      if (last_event_id) {
        lastEventId = last_event_id;
      }

      // Немедленно делаем следующий запрос
      await sleep(100);

    } catch (error) {
      console.error('Long polling error:', error);
      // При ошибке ждем перед повтором
      await sleep(5000);
    }
  }
}

// Запуск при загрузке страницы
startLongPolling();
\`\`\`

**Преимущества Long Polling:**
- ✅ Работает за NAT/файрволом
- ✅ Не требует публичного URL
- ✅ Малая задержка (~100ms vs 5-30s при обычном polling)
- ✅ Меньше запросов чем обычный polling

**Недостатки:**
- ❌ Держит соединение открытым (расход ресурсов)
- ❌ Сложнее масштабировать чем webhooks
- ❌ Проблемы с прокси/балансировщиками (timeout)

---

### Задача 9: Тестирование webhook endpoint

**Вопрос теста:** Как протестировать что webhook endpoint работает корректно?

**Решение: Unit тесты + интеграционные тесты**

**Unit тест (проверка signature verification):**

\`\`\`javascript
const crypto = require('crypto');
const request = require('supertest');
const app = require('./app');

describe('Webhook signature verification', () => {
  const secret = 'whsec_test_secret';
  const payload = { event: 'test.event', data: { foo: 'bar' } };

  function generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  test('should accept webhook with valid signature', async () => {
    const signature = generateSignature(payload, secret);

    const response = await request(app)
      .post('/webhooks')
      .set('X-Webhook-Signature', \`sha256=\${signature}\`)
      .send(payload);

    expect(response.status).toBe(200);
  });

  test('should reject webhook with invalid signature', async () => {
    const response = await request(app)
      .post('/webhooks')
      .set('X-Webhook-Signature', 'sha256=invalid')
      .send(payload);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid signature');
  });

  test('should reject webhook without signature', async () => {
    const response = await request(app)
      .post('/webhooks')
      .send(payload);

    expect(response.status).toBe(401);
  });
});
\`\`\`

**Интеграционный тест (end-to-end):**

\`\`\`javascript
describe('Webhook delivery end-to-end', () => {
  let webhookServer;
  let receivedWebhooks = [];

  beforeAll(() => {
    // Запускаем тестовый webhook receiver
    webhookServer = express();
    webhookServer.use(express.json());

    webhookServer.post('/test-webhook', (req, res) => {
      receivedWebhooks.push(req.body);
      res.status(200).send('OK');
    });

    webhookServer.listen(4000);
  });

  afterAll(() => {
    webhookServer.close();
  });

  test('should deliver webhook on task completion', async () => {
    // 1. Регистрация webhook
    const webhookRes = await request(app)
      .post('/api/webhooks')
      .send({
        url: 'http://localhost:4000/test-webhook',
        events: ['task.completed']
      });

    expect(webhookRes.status).toBe(201);

    // 2. Создание задачи
    const taskRes = await request(app)
      .post('/api/tasks')
      .send({ type: 'test', data: { foo: 'bar' } });

    const { task_id } = taskRes.body;

    // 3. Имитация завершения задачи
    await completeTask(task_id, { result: 'success' });

    // 4. Ждем доставки webhook (с таймаутом)
    await waitFor(() => receivedWebhooks.length > 0, 5000);

    // 5. Проверка
    expect(receivedWebhooks.length).toBe(1);
    expect(receivedWebhooks[0].event).toBe('task.completed');
    expect(receivedWebhooks[0].data.task_id).toBe(task_id);
  });
});
\`\`\`

**Ручное тестирование с webhook.site:**

\`\`\`bash
# 1. Создать временный webhook URL на https://webhook.site

# 2. Зарегистрировать webhook
curl -X POST http://localhost:3000/api/webhooks \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://webhook.site/your-unique-id",
    "events": ["task.completed"]
  }'

# 3. Триггерить событие
curl -X POST http://localhost:3000/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"type": "test", "data": {}}'

# 4. Проверить на webhook.site что запрос пришел
\`\`\`

---

### Задача 10: Мониторинг webhook delivery rate

**Вопрос теста:** Как отслеживать надежность доставки webhooks?

**Решение: Метрики и алерты**

\`\`\`javascript
const prometheus = require('prom-client');

// Метрики
const webhookCounter = new prometheus.Counter({
  name: 'webhooks_sent_total',
  help: 'Total number of webhooks sent',
  labelNames: ['event_type', 'status']
});

const webhookDuration = new prometheus.Histogram({
  name: 'webhook_delivery_duration_seconds',
  help: 'Webhook delivery duration',
  labelNames: ['event_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const webhookRetries = new prometheus.Counter({
  name: 'webhook_retries_total',
  help: 'Total number of webhook retries',
  labelNames: ['event_type', 'attempt']
});

async function sendWebhookWithMetrics(url, payload, secret) {
  const startTime = Date.now();
  const eventType = payload.event;

  try {
    const result = await sendWebhookWithRetry(url, payload, {
      secret,
      maxAttempts: 5,
      onRetry: (attempt) => {
        // Трекинг retry
        webhookRetries.inc({ event_type: eventType, attempt });
      }
    });

    const duration = (Date.now() - startTime) / 1000;

    if (result.success) {
      webhookCounter.inc({ event_type: eventType, status: 'success' });
      webhookDuration.observe({ event_type: eventType }, duration);
    } else {
      webhookCounter.inc({ event_type: eventType, status: 'failed' });

      // Критический алерт если много неудач
      await checkFailureRate(eventType);
    }

    return result;

  } catch (error) {
    webhookCounter.inc({ event_type: eventType, status: 'error' });
    throw error;
  }
}

// Проверка failure rate
async function checkFailureRate(eventType) {
  const metrics = await prometheus.register.getMetricsAsJSON();
  const webhookMetrics = metrics.find(m => m.name === 'webhooks_sent_total');

  const successCount = webhookMetrics.values
    .find(v => v.labels.event_type === eventType && v.labels.status === 'success')
    ?.value || 0;

  const failedCount = webhookMetrics.values
    .find(v => v.labels.event_type === eventType && v.labels.status === 'failed')
    ?.value || 0;

  const total = successCount + failedCount;
  const failureRate = total > 0 ? failedCount / total : 0;

  // Алерт если > 10% неудач
  if (failureRate > 0.1 && total > 10) {
    await alertAdmin({
      severity: 'warning',
      message: \`High webhook failure rate for \${eventType}: \${(failureRate * 100).toFixed(1)}%\`,
      metrics: { total, failed: failedCount, success: successCount }
    });
  }
}

// Endpoint для Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
\`\`\`

**Grafana Dashboard запросы:**

\`\`\`promql
# Webhook success rate
sum(rate(webhooks_sent_total{status="success"}[5m]))
/
sum(rate(webhooks_sent_total[5m]))

# P95 delivery latency
histogram_quantile(0.95, webhook_delivery_duration_seconds_bucket)

# Retry rate
sum(rate(webhook_retries_total[5m])) by (event_type)
\`\`\`

---

## Best Practices — Лучшие практики 🎯

### 1. Асинхронные операции: когда использовать

**✅ Используйте async для:**
- Операций > 5 секунд
- Обработки файлов (видео, изображения, документы)
- Генерации больших отчетов
- Массовых операций (рассылки, batch обновления)
- Интеграций с медленными внешними API

**❌ НЕ используйте async для:**
- Простых CRUD операций (< 1 секунды)
- Чтения данных
- Валидации
- Аутентификации

**Пример:**
\`\`\`javascript
// ✅ Хорошо: асинхронная обработка видео
POST /api/videos → 202 Accepted {task_id: "..."}

// ❌ Плохо: асинхронное получение пользователя
GET /api/users/123 → 202 Accepted {task_id: "..."}
// Зачем? Просто верните данные сразу:
GET /api/users/123 → 200 OK {id: 123, name: "John"}
\`\`\`

---

### 2. Webhooks: безопасность превыше всего

**✅ DO:**
- Всегда проверяйте HMAC подпись
- Требуйте HTTPS (не HTTP)
- Используйте timestamp защиту от replay атак
- Применяйте rate limiting
- Логируйте все webhook запросы

**❌ DON'T:**
- Не доверяйте webhook без проверки подписи
- Не обрабатывайте webhook синхронно
- Не отправляйте чувствительные данные в webhook (используйте ID, клиент запросит детали)

\`\`\`javascript
// ❌ Плохо: отправка пароля в webhook
{
  "event": "user.created",
  "data": {
    "user_id": 123,
    "email": "user@example.com",
    "password": "plaintext123" // НИКОГДА!
  }
}

// ✅ Хорошо: только ID
{
  "event": "user.created",
  "data": {
    "user_id": 123
  }
}
// Клиент сделает: GET /api/users/123
\`\`\`

---

### 3. Идемпотентность обязательна

**✅ DO:**
- Всегда проверяйте \`event_id\` перед обработкой
- Сохраняйте обработанные ID в Redis/БД
- Возвращайте \`200 OK\` даже для дубликатов
- Используйте database transactions для критичных операций

**❌ DON'T:**
- Не полагайтесь на "однократную доставку" (её не существует)
- Не возвращайте ошибку для дубликатов

\`\`\`javascript
// ❌ Плохо: НЕ идемпотентная обработка
app.post('/webhooks/payment', async (req, res) => {
  const { order_id, amount } = req.body;

  // Прямое зачисление без проверок
  await db.accounts.increment({ balance: amount });
  await db.orders.update({ status: 'paid' });

  res.send('OK');
});
// Проблема: если webhook доставлен дважды, деньги зачислятся дважды!

// ✅ Хорошо: идемпотентная обработка
app.post('/webhooks/payment', async (req, res) => {
  const { event_id, order_id, amount } = req.body;

  // 1. Проверка дубликата
  if (await redis.get(\`processed:\${event_id}\`)) {
    return res.send('OK');
  }

  // 2. Transaction с проверкой состояния
  await db.transaction(async trx => {
    const order = await trx('orders').where({ id: order_id }).first();

    if (order.status === 'paid') {
      return; // Уже оплачен
    }

    await trx('accounts').increment({ balance: amount });
    await trx('orders').update({ status: 'paid' });
  });

  // 3. Сохранить event_id
  await redis.setex(\`processed:\${event_id}\`, 86400, '1');

  res.send('OK');
});
\`\`\`

---

### 4. Быстрый ответ на webhook

**✅ DO:**
- Отвечать \`200 OK\` максимум за 1-2 секунды
- Обрабатывать webhook асинхронно (queue, background job)
- Сохранять webhook в БД для аудита

**❌ DON'T:**
- Не делать долгие операции перед ответом
- Не ждать внешних API

\`\`\`javascript
// ❌ Плохо: медленная обработка блокирует ответ
app.post('/webhooks/order', async (req, res) => {
  const { order_id } = req.body;

  // Долгие операции (10+ секунд)
  await generateInvoicePDF(order_id); // 5 сек
  await sendEmail(order_id);           // 3 сек
  await updateAnalytics(order_id);     // 2 сек

  res.send('OK'); // Только через 10 секунд!
});
// Сервер подумает что webhook failed и повторит

// ✅ Хорошо: быстрый ответ, async обработка
app.post('/webhooks/order', async (req, res) => {
  const { event_id, order_id } = req.body;

  // 1. Сохранить в БД
  await db.webhooks.create({
    event_id,
    type: 'order.created',
    payload: req.body,
    status: 'pending'
  });

  // 2. Добавить в queue
  await jobQueue.add('process-order-webhook', { event_id, order_id });

  // 3. Быстрый ответ (< 1 сек)
  res.send('OK');
});

// Background worker обрабатывает queue
worker.process('process-order-webhook', async (job) => {
  const { event_id, order_id } = job.data;

  await generateInvoicePDF(order_id);
  await sendEmail(order_id);
  await updateAnalytics(order_id);

  await db.webhooks.update(event_id, { status: 'processed' });
});
\`\`\`

---

### 5. Мониторинг и алерты

**✅ DO:**
- Трекать webhook delivery rate
- Алерты при failure rate > 10%
- Логировать все failed webhooks в отдельную таблицу
- Dashboard с метриками (Grafana, Datadog)

**❌ DON'T:**
- Не игнорировать failed webhooks
- Не полагаться что "всё работает"

\`\`\`javascript
// ✅ Хорошо: сохранение failed webhooks
async function sendWebhook(url, payload) {
  const result = await sendWebhookWithRetry(url, payload);

  if (!result.success) {
    // Сохранить в dead letter queue
    await db.failed_webhooks.create({
      webhook_url: url,
      payload,
      error: result.error,
      attempts: result.attempts,
      failed_at: new Date()
    });

    // Алерт если много неудач
    const recentFailures = await db.failed_webhooks
      .where('created_at', '>', Date.now() - 3600000)
      .count();

    if (recentFailures > 10) {
      await alertAdmin('High webhook failure rate: ' + recentFailures);
    }
  }
}
\`\`\`

---

## Заключение: Асинхронность как ключ к масштабируемости 🚀

### Ключевые выводы

**1. Асинхронные операции для долгих задач:**
- Немедленный ответ \`202 Accepted\` с \`task_id\`
- Клиент проверяет статус через polling
- Или сервер уведомляет через webhook

**2. Webhooks для push уведомлений:**
- Сервер сам вызывает HTTP endpoint клиента
- Эффективнее polling (нет ненужных запросов)
- Требует HMAC signature для безопасности

**3. Идемпотентность критична:**
- Webhook может быть доставлен несколько раз
- Используйте \`event_id\` для дедупликации
- Всегда проверяйте текущее состояние перед изменением

**4. Retry логика обязательна:**
- Exponential backoff с jitter
- До 5 попыток
- Только для 5xx ошибок и timeouts

**5. Быстрый ответ на webhook:**
- Отвечать \`200 OK\` за < 1-2 секунды
- Обработка в background queue
- Не блокировать ответ долгими операциями

### Паттерны которые вы должны знать

| Паттерн | Когда использовать | Пример |
|---------|-------------------|--------|
| **Async + Polling** | Клиент без публичного URL | Мобильное приложение |
| **Async + Webhook** | Server-to-server | Интеграция между сервисами |
| **Long Polling** | Real-time без WebSocket | Chat, уведомления |
| **Hybrid (Webhook + Polling)** | Надежность critical | Платежи, заказы |

### Что дальше изучать?

- **WebSockets**: для real-time двухстороннего общения
- **Server-Sent Events (SSE)**: для one-way streaming от сервера
- **Message Queues (RabbitMQ, Redis)**: для async обработки
- **Event-Driven Architecture**: микросервисы на событиях

---

**🎯 Практическое задание:**

Реализуйте систему обработки изображений:

1. \`POST /api/images\` — загрузка изображения → \`202 Accepted\` с \`task_id\`
2. Сервер обрабатывает изображение в фоне (ресайз, watermark, thumbnail)
3. \`GET /api/tasks/:id\` — проверка статуса
4. При завершении → webhook на \`https://client.com/image-ready\`
5. Webhook должен:
   - Иметь HMAC подпись
   - Быть идемпотентным
   - Иметь retry логику (3 попытки)

**Критерии успеха:**
- ✅ Async обработка не блокирует API
- ✅ Webhook доставляется даже при сбоях
- ✅ Повторная доставка не дублирует действия
- ✅ Клиент может проверить статус в любой момент

---

💡 **Помните:** Асинхронность — это не усложнение, а способ сделать API масштабируемым и надежным. Webhook — это push-уведомления для API!
`);

async function createWebhooksLecture() {
  console.log('🚀 Создание лекции "Асинхронные операции и Webhooks"...');

  try {
    // 1. Удаляем старую лекцию если существует
    const oldLecture = await prisma.lecture.findFirst({
      where: {
        title: {
          contains: 'Асинхронные операции'
        }
      }
    });

    if (oldLecture) {
      console.log(`🗑️  Удаляем старую лекцию: ${oldLecture.id}`);
      await prisma.lecture.delete({
        where: { id: oldLecture.id }
      });
    }

    // 2. Находим тест по заголовку
    const test = await prisma.test.findFirst({
      where: {
        title: {
          contains: 'Асинхронные операции'
        }
      },
      include: {
        questions: {
          include: {
            question: true
          }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "Асинхронные операции и Webhooks" не найден!');
    }

    console.log(`✅ Найден тест: ${test.title} (${test.questions.length} вопросов)`);

    // 3. Создаем новую лекцию
    const lecture = await prisma.lecture.create({
      data: {
        title: 'Асинхронные операции и Webhooks',
        topic: 'REST API асинхронность и интеграции',
        content: lectureContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Создана лекция: ${lecture.id}`);

    // 4. Привязываем только вопросы этого теста
    console.log(`🔗 Привязываем ${test.questions.length} вопросов к лекции...`);

    for (const tq of test.questions) {
      await prisma.question.update({
        where: { id: tq.question.id },
        data: { lectureId: lecture.id }
      });
    }

    console.log('✅ Все вопросы привязаны к лекции');

    // 5. Статистика
    const stats = {
      lectureId: lecture.id,
      title: lecture.title,
      contentLength: lecture.content.length,
      linkedQuestions: test.questions.length,
      testId: test.id,
      testTitle: test.title
    };

    console.log('\n📊 Статистика:');
    console.log(`   Lecture ID: ${stats.lectureId}`);
    console.log(`   Название: ${stats.title}`);
    console.log(`   Размер: ${stats.contentLength} символов (~${Math.round(stats.contentLength / 5)} слов)`);
    console.log(`   Привязано вопросов: ${stats.linkedQuestions}`);
    console.log(`   К тесту: ${stats.testTitle} (${stats.testId})`);

    console.log('\n✨ Лекция "Асинхронные операции и Webhooks" успешно создана!');

    return stats;

  } catch (error) {
    console.error('❌ Ошибка при создании лекции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск
createWebhooksLecture()
  .then(() => {
    console.log('\n🎉 Скрипт завершен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Скрипт завершен с ошибкой:', error);
    process.exit(1);
  });
