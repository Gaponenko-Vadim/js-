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

const lectureContent = `# Требования к интеграциям и API

## Введение: Переводчик между системами

Представьте международную конференцию, где люди говорят на разных языках:
- 🇷🇺 Русский спикер
- 🇬🇧 Английский слушатель
- 🇨🇳 Китайский участник

Без переводчика они не смогут общаться. **API — это переводчик** между программными системами.

> 💡 **Аналогия**: Интеграция — это способность систем **разговаривать друг с другом**, обмениваться данными и координировать действия. API (Application Programming Interface) — это язык и правила этого общения.

**Реальные примеры:**
- 💳 Оплата через Stripe: ваш магазин → Stripe API → банк
- 📧 Отправка email через SendGrid: ваше приложение → SendGrid API → почтовый сервер
- 🗺️ Карты на сайте: ваш сайт → Google Maps API → карта

В этой лекции вы узнаете:
- ✅ Что такое требования к интеграциям
- ✅ API contracts и OpenAPI спецификации
- ✅ Синхронные vs асинхронные интеграции
- ✅ Webhooks для реального времени
- ✅ Error handling и retry logic
- ✅ Безопасность интеграций (API keys, OAuth)
- ✅ Rate limiting и мониторинг

---

## Что такое требования к интеграциям?

### Определение

> "Требования к интеграциям (Integration Requirements) — это **описание того, как система должна взаимодействовать с внешними системами и сервисами**, включая протоколы, форматы данных, способы аутентификации и обработку ошибок"

### Простыми словами

**Требования к интеграциям отвечают на вопросы:**
- 🔌 С какими системами нужно интегрироваться?
- 📡 Как передавать данные (REST, GraphQL, gRPC, webhooks)?
- 🔐 Как аутентифицироваться (API ключи, OAuth, JWT)?
- ⚠️ Что делать при ошибках (retry, fallback)?
- ⏱️ Какие требования к скорости ответа?

### Типы интеграций

| Тип | Описание | Пример |
|-----|----------|--------|
| **Синхронная** | Запрос → ожидание → ответ | REST API, GraphQL |
| **Асинхронная** | Отправка сообщения → продолжение работы | Message Queue, Events |
| **Webhook** | Событие → уведомление по HTTP | Payment callback |
| **Batch** | Периодическая передача пакета данных | Ночная синхронизация |

---

## API Contracts (Контракты API)

### Определение

> "API Contract — это **формальное соглашение** между producer (поставщиком API) и consumer (потребителем API) о том, как API работает: endpoints, методы, форматы запросов/ответов, коды ошибок"

### Почему важны контракты?

**Без контракта:**
- ❌ Frontend не знает, какие поля вернет backend
- ❌ При изменении API все ломается
- ❌ Нет автоматической валидации

**С контрактом:**
- ✅ Все знают, что ожидать
- ✅ Изменения контролируются (breaking changes)
- ✅ Автогенерация кода (SDK, types)
- ✅ Автоматическое тестирование

### OpenAPI (Swagger) спецификация

**Пример контракта для REST API:**
\`\`\`yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

paths:
  /users/{id}:
    get:
      summary: Получить пользователя
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Успешный ответ
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: integer
                    example: 123
                  name:
                    type: string
                    example: "Иван Иванов"
                  email:
                    type: string
                    format: email
                    example: "ivan@example.com"
        '404':
          description: Пользователь не найден
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: "User not found"
\`\`\`

**Преимущества:**
- 📄 Документация генерируется автоматически
- 🛠️ Генерация TypeScript типов: \`openapi-typescript\`
- ✅ Валидация запросов/ответов
- 🧪 Автоматическое тестирование контракта

### GraphQL Schema

**Альтернатива REST:**
\`\`\`graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
}

type Mutation {
  createUser(name: String!, email: String!): User!
  updateUser(id: ID!, name: String, email: String): User!
}
\`\`\`

**Преимущества GraphQL:**
- ✅ Клиент запрашивает только нужные поля
- ✅ Один endpoint для всех запросов
- ✅ Строгая типизация из коробки

---

## Синхронные интеграции

### Что это?

> "Синхронная интеграция — клиент **ждет** ответа от сервера перед продолжением работы"

### REST API

**Типичный сценарий:**
\`\`\`typescript
// Клиент делает запрос и ждет ответа
async function getUser(userId: number): Promise<User> {
  const response = await fetch(\`https://api.example.com/users/\${userId}\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  return response.json();
}

// Использование
const user = await getUser(123); // ⏱️ ЖДЕМ ответа
console.log(user.name);
\`\`\`

### Когда использовать синхронные интеграции?

✅ **Хорошо для:**
- Чтение данных (GET запросы)
- Операции, требующие немедленного ответа
- Простые CRUD операции

❌ **Плохо для:**
- Долгих операций (> 30 секунд)
- Операций с внешними зависимостями (email, push-уведомления)
- Массовых операций

### Требования к синхронным API

**1. Response Time (Время ответа)**
\`\`\`
GET /users/:id → < 200ms (быстро)
POST /orders → < 500ms (приемлемо)
POST /reports/generate → ❌ 30 секунд (слишком долго, нужен async)
\`\`\`

**2. Timeout настройки**
\`\`\`typescript
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000) // 5 секунд максимум
});
\`\`\`

**3. Retry logic**
\`\`\`typescript
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
\`\`\`

---

## Асинхронные интеграции

### Что это?

> "Асинхронная интеграция — клиент **не ждет** завершения операции, продолжает работу, получит результат позже"

### Message Queue (Очередь сообщений)

**Примеры:** RabbitMQ, AWS SQS, Apache Kafka

**Сценарий: Отправка email после регистрации**
\`\`\`typescript
// Producer (отправитель)
async function registerUser(email: string, password: string) {
  const user = await createUser(email, password);

  // Отправить сообщение в очередь (не ждем отправки email)
  await messageQueue.publish('user.registered', {
    userId: user.id,
    email: user.email
  });

  return user; // ✅ Быстрый ответ клиенту
}

// Consumer (обработчик)
messageQueue.subscribe('user.registered', async (message) => {
  const { userId, email } = message.data;

  // Отправить welcome email (может занять 5 секунд)
  await emailService.sendWelcomeEmail(email);

  // Создать профиль в CRM
  await crmService.createContact(userId, email);
});
\`\`\`

**Преимущества:**
- ✅ Быстрый ответ пользователю
- ✅ Retry при ошибках (автоматически)
- ✅ Масштабируемость (несколько workers)
- ✅ Декаплинг систем

### Когда использовать асинхронные интеграции?

✅ **Хорошо для:**
- Долгих операций (обработка видео, генерация отчетов)
- Отправка email/SMS/push
- Интеграции с медленными системами
- Background jobs (очистка кеша, агрегация данных)

❌ **Плохо для:**
- Операций, требующих немедленного результата
- Простых CRUD запросов

---

## Webhooks (Вебхуки)

### Что это?

> "Webhook — это **обратный вызов по HTTP**, когда сервер уведомляет клиента о событии"

### Как работают webhooks

**Традиционный polling (неэффективно):**
\`\`\`
Клиент каждые 5 секунд:
  → "Заказ готов?"
  ← "Нет"
  → "А сейчас?"
  ← "Нет"
  → "А сейчас?"
  ← "Да!"
\`\`\`

**Webhook (эффективно):**
\`\`\`
Клиент → регистрирует webhook URL
Сервер → работает...
Сервер → "Готово!" → POST https://client.com/webhook
Клиент ← получает уведомление
\`\`\`

### Пример: Payment webhook от Stripe

**1. Регистрация webhook:**
\`\`\`typescript
// В Stripe Dashboard: https://your-app.com/webhooks/stripe
\`\`\`

**2. Обработка webhook:**
\`\`\`typescript
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // Проверка подписи (безопасность!)
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Обработка события
  switch (event.type) {
    case 'payment_intent.succeeded':
      const payment = event.data.object;
      await handleSuccessfulPayment(payment);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handleFailedPayment(failedPayment);
      break;
  }

  // ✅ ВАЖНО: Ответить быстро (< 5 секунд)
  res.json({ received: true });

  // Долгая обработка — в background job
  await jobQueue.add('process-payment', { paymentId: payment.id });
});
\`\`\`

### Требования к webhook endpoints

**1. Idempotency (Идемпотентность)**
- Webhook может прийти дважды
- Обработка должна быть идемпотентной

\`\`\`typescript
async function handlePaymentWebhook(paymentId: string) {
  // Проверить, не обработали ли уже
  const existing = await db.processedWebhooks.findOne({ paymentId });
  if (existing) {
    console.log('Webhook already processed');
    return;
  }

  // Обработать
  await processPayment(paymentId);

  // Сохранить, что обработали
  await db.processedWebhooks.create({ paymentId, processedAt: new Date() });
}
\`\`\`

**2. Fast response (Быстрый ответ)**
- Ответить в течение 5 секунд
- Долгую обработку — в фоне

\`\`\`typescript
app.post('/webhook', async (req, res) => {
  // ✅ Быстрый ответ
  res.json({ received: true });

  // ⏱️ Долгая обработка в фоне
  await jobQueue.add('process-webhook', req.body);
});
\`\`\`

**3. Security (Безопасность)**
- Проверка подписи webhook
- Использование HTTPS

\`\`\`typescript
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
\`\`\`

---

## Error Handling (Обработка ошибок)

### Типы ошибок в интеграциях

#### 1. Network Errors (Сетевые ошибки)
- Timeout (превышено время ожидания)
- Connection refused (сервер недоступен)
- DNS resolution failed (не удалось найти сервер)

**Как обрабатывать:**
\`\`\`typescript
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
} catch (error) {
  if (error.name === 'AbortError') {
    // Timeout
    console.error('Request timed out');
  } else if (error.code === 'ECONNREFUSED') {
    // Сервер недоступен
    console.error('Server is down');
  } else {
    // Другие сетевые ошибки
    console.error('Network error:', error);
  }
}
\`\`\`

#### 2. HTTP Errors (Ошибки HTTP)

| Код | Значение | Действие |
|-----|----------|----------|
| 400 | Bad Request | ❌ НЕ повторять, исправить запрос |
| 401 | Unauthorized | 🔑 Обновить токен |
| 403 | Forbidden | ❌ НЕ повторять, нет прав |
| 404 | Not Found | ❌ НЕ повторять, ресурс не существует |
| 429 | Too Many Requests | ⏱️ Повторить с задержкой |
| 500 | Internal Server Error | ♻️ Повторить позже |
| 503 | Service Unavailable | ♻️ Повторить позже |

**Обработка:**
\`\`\`typescript
async function makeRequest(url: string) {
  const response = await fetch(url);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    await sleep(parseInt(retryAfter) * 1000);
    return makeRequest(url); // Retry
  }

  if (response.status >= 500) {
    // Server error, можем повторить
    throw new RetryableError('Server error, will retry');
  }

  if (response.status >= 400) {
    // Client error, не повторяем
    throw new NonRetryableError('Client error, will not retry');
  }

  return response.json();
}
\`\`\`

#### 3. Business Logic Errors (Бизнес-ошибки)
- Недостаточно средств на счете
- Пользователь не найден
- Товар out of stock

**Обработка:**
\`\`\`typescript
const response = await paymentAPI.charge({
  amount: 1000,
  cardId: 'card_123'
});

if (response.status === 'insufficient_funds') {
  // Показать пользователю сообщение
  throw new PaymentError('Недостаточно средств на карте');
}
\`\`\`

### Retry Strategy (Стратегия повтора)

**1. Exponential Backoff (Экспоненциальная задержка)**
\`\`\`typescript
async function fetchWithExponentialBackoff(
  url: string,
  maxRetries = 5
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Задержка: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
    }
  }
}
\`\`\`

**2. Jitter (Джиттер — добавление случайности)**
\`\`\`typescript
function calculateBackoff(attempt: number): number {
  const baseDelay = Math.pow(2, attempt) * 1000;
  const jitter = Math.random() * 1000; // 0-1000ms случайно
  return baseDelay + jitter;
}
\`\`\`

**Зачем jitter?** Если 1000 клиентов одновременно делают retry → сервер падает снова

**3. Circuit Breaker (Автоматический выключатель)**
\`\`\`typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Проверить, прошло ли 60 секунд
      if (Date.now() - this.lastFailureTime!.getTime() > 60000) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // Успех → сбросить счетчик
      this.failures = 0;
      this.state = 'closed';

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = new Date();

      // После 5 ошибок → открыть circuit
      if (this.failures >= 5) {
        this.state = 'open';
      }

      throw error;
    }
  }
}

// Использование
const breaker = new CircuitBreaker();
const data = await breaker.execute(() => fetch(url));
\`\`\`

---

## Практические сценарии

### Сценарий 1: Интеграция с платежной системой

**Ситуация**: Интернет-магазин интегрируется со Stripe

**Требования:**
1. Синхронная оплата (клиент ждет подтверждения)
2. Webhook для обновления статуса (асинхронно)
3. Retry при ошибках сети
4. Idempotency keys для безопасных повторов

**Решение:**
\`\`\`typescript
class PaymentService {
  async createPayment(orderId: string, amount: number): Promise<Payment> {
    // Idempotency key (защита от дублей)
    const idempotencyKey = \`order-\${orderId}-\${Date.now()}\`;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // В центах
        currency: 'rub',
        metadata: { orderId }
      }, {
        idempotencyKey // Stripe не создаст дубликат
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      if (error.type === 'StripeConnectionError') {
        // Network error → retry
        throw new RetryableError('Stripe connection error');
      }
      throw error;
    }
  }

  // Webhook от Stripe
  async handleWebhook(event: StripeEvent): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.markOrderPaid(event.data.object.metadata.orderId);
        break;

      case 'payment_intent.payment_failed':
        await this.markOrderFailed(event.data.object.metadata.orderId);
        break;
    }
  }
}
\`\`\`

> 💡 **Вывод**: Синхронная оплата + асинхронные webhook для обновлений

### Сценарий 2: Интеграция с CRM (Salesforce)

**Ситуация**: После регистрации пользователя создать контакт в CRM

**Требования:**
1. Асинхронная интеграция (не блокировать регистрацию)
2. Retry при ошибках
3. Fallback если CRM недоступен
4. Синхронизация изменений (webhook от CRM)

**Решение:**
\`\`\`typescript
// 1. При регистрации → отправить в очередь
async function registerUser(email: string): Promise<User> {
  const user = await db.users.create({ email });

  // Асинхронно создать в CRM (не ждем)
  await queue.publish('crm.create_contact', {
    userId: user.id,
    email: user.email
  });

  return user;
}

// 2. Worker обрабатывает очередь
queue.subscribe('crm.create_contact', async (message) => {
  const { userId, email } = message.data;

  try {
    const crmContact = await salesforce.createContact({
      email,
      source: 'Web Registration'
    });

    // Сохранить CRM ID
    await db.users.update({
      where: { id: userId },
      data: { crmContactId: crmContact.id }
    });

  } catch (error) {
    if (error.statusCode === 503) {
      // CRM недоступен → retry через 5 минут
      await queue.scheduleRetry(message, { delay: 300000 });
    } else {
      // Другая ошибка → записать в лог, не падать
      console.error('Failed to create CRM contact:', error);
    }
  }
});

// 3. Webhook от CRM (обновление контакта)
app.post('/webhooks/salesforce', async (req, res) => {
  const { contactId, email, phone } = req.body;

  // Обновить локальные данные
  await db.users.update({
    where: { crmContactId: contactId },
    data: { phone }
  });

  res.json({ received: true });
});
\`\`\`

> 💡 **Вывод**: Асинхронная интеграция + retry + двунаправленная синхронизация

### Сценарий 3: Агрегация данных из нескольких API

**Ситуация**: Dashboard показывает данные из 3 API (аналитика, продажи, инвентарь)

**Требования:**
1. Загрузить данные параллельно (не последовательно)
2. Timeout 5 секунд на каждый API
3. Показать частичные данные если один API упал
4. Кеширование результатов (5 минут)

**Решение:**
\`\`\`typescript
interface DashboardData {
  analytics?: AnalyticsData;
  sales?: SalesData;
  inventory?: InventoryData;
  errors: string[];
}

async function getDashboardData(userId: string): Promise<DashboardData> {
  const cacheKey = \`dashboard:\${userId}\`;

  // Проверить кеш
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Загрузить параллельно (Promise.allSettled)
  const results = await Promise.allSettled([
    fetchAnalytics(userId),
    fetchSales(userId),
    fetchInventory(userId)
  ]);

  const data: DashboardData = { errors: [] };

  // Analytics
  if (results[0].status === 'fulfilled') {
    data.analytics = results[0].value;
  } else {
    data.errors.push('Analytics API unavailable');
  }

  // Sales
  if (results[1].status === 'fulfilled') {
    data.sales = results[1].value;
  } else {
    data.errors.push('Sales API unavailable');
  }

  // Inventory
  if (results[2].status === 'fulfilled') {
    data.inventory = results[2].value;
  } else {
    data.errors.push('Inventory API unavailable');
  }

  // Кешировать на 5 минут
  await redis.setex(cacheKey, 300, JSON.stringify(data));

  return data;
}

async function fetchAnalytics(userId: string): Promise<AnalyticsData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(\`https://analytics.api/users/\${userId}\`, {
      signal: controller.signal
    });
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}
\`\`\`

> 💡 **Вывод**: Параллельная загрузка + fallback + кеширование

### Сценарий 4: Background Job — генерация отчета

**Ситуация**: Пользователь запрашивает отчет за год (генерация 2 минуты)

**Требования:**
1. Асинхронная генерация (не блокировать UI)
2. Webhook/WebSocket для уведомления о готовности
3. Retry при ошибках
4. Автоматическая очистка старых отчетов

**Решение:**
\`\`\`typescript
// 1. Запрос отчета
app.post('/reports', async (req, res) => {
  const { userId, year } = req.body;

  // Создать задачу
  const report = await db.reports.create({
    userId,
    year,
    status: 'pending'
  });

  // Добавить в очередь
  await queue.add('generate-report', {
    reportId: report.id,
    userId,
    year
  });

  // Быстрый ответ
  res.json({
    reportId: report.id,
    status: 'pending',
    message: 'Отчет генерируется, вы получите уведомление'
  });
});

// 2. Worker генерирует отчет
queue.process('generate-report', async (job) => {
  const { reportId, userId, year } = job.data;

  try {
    // Обновить статус
    await db.reports.update({
      where: { id: reportId },
      data: { status: 'processing' }
    });

    // Генерация (2 минуты)
    const data = await generateReportData(userId, year);
    const pdf = await createPDF(data);
    const url = await uploadToS3(pdf, \`reports/\${reportId}.pdf\`);

    // Готово
    await db.reports.update({
      where: { id: reportId },
      data: {
        status: 'completed',
        url,
        completedAt: new Date()
      }
    });

    // Уведомить пользователя
    await notificationService.sendReportReady(userId, url);

  } catch (error) {
    await db.reports.update({
      where: { id: reportId },
      data: { status: 'failed', error: error.message }
    });

    throw error; // Job queue сделает retry
  }
});

// 3. Webhook/SSE для реального времени
app.get('/reports/:id/status', async (req, res) => {
  const report = await db.reports.findUnique({
    where: { id: req.params.id }
  });

  res.json({
    status: report.status,
    url: report.url,
    progress: report.progress // 0-100%
  });
});
\`\`\`

> 💡 **Вывод**: Асинхронная обработка + уведомления + retry

### Сценарий 5: Интеграция с внешним инвентарем (синхронизация)

**Ситуация**: Интернет-магазин получает товары от поставщика через API

**Требования:**
1. Синхронизация каждые 10 минут (cron job)
2. Обновление только измененных товаров (delta sync)
3. Webhook от поставщика при изменении
4. Rate limiting (не более 100 запросов/минуту)

**Решение:**
\`\`\`typescript
class InventorySyncService {
  // 1. Cron job — каждые 10 минут
  @Cron('*/10 * * * *')
  async syncInventory() {
    const lastSyncedAt = await this.getLastSyncTime();

    // Получить измененные товары (delta)
    const changes = await supplierAPI.getChanges({
      since: lastSyncedAt,
      limit: 100
    });

    for (const item of changes.items) {
      await this.updateProduct(item);
    }

    await this.saveLastSyncTime(new Date());
  }

  // 2. Webhook от поставщика (real-time)
  async handleSupplierWebhook(event: SupplierEvent) {
    if (event.type === 'product.updated') {
      const product = await supplierAPI.getProduct(event.productId);
      await this.updateProduct(product);
    }

    if (event.type === 'product.out_of_stock') {
      await db.products.update({
        where: { supplierProductId: event.productId },
        data: { inStock: false }
      });
    }
  }

  // 3. Rate limiting
  private rateLimiter = new RateLimiter({
    maxRequests: 100,
    perMilliseconds: 60000 // 100 req/min
  });

  async fetchFromSupplier(endpoint: string) {
    await this.rateLimiter.wait(); // Подождать, если лимит превышен
    return fetch(\`https://supplier.api/\${endpoint}\`);
  }
}
\`\`\`

> 💡 **Вывод**: Scheduled sync + webhooks + rate limiting

---

## Типичные ошибки

### Ошибка 1: Нет timeout для запросов

❌ **Неправильно**:
\`\`\`typescript
const response = await fetch(url); // Может висеть бесконечно
\`\`\`

**Проблема**: Если API медленный, запрос висит минутами

✅ **Правильно**:
\`\`\`typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  return response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timeout');
  }
  throw error;
} finally {
  clearTimeout(timeout);
}
\`\`\`

> 💡 **Совет**: Всегда устанавливайте timeout (5-10 секунд для API)

### Ошибка 2: Синхронная обработка долгих операций

❌ **Неправильно**:
\`\`\`typescript
app.post('/send-email', async (req, res) => {
  await emailService.send(req.body.email); // 5 секунд
  res.json({ sent: true });
});
\`\`\`

**Проблема**: Клиент ждет 5 секунд

✅ **Правильно**:
\`\`\`typescript
app.post('/send-email', async (req, res) => {
  await queue.add('send-email', req.body); // Быстро добавить в очередь
  res.json({ queued: true });
});
\`\`\`

> 💡 **Совет**: Операции > 1 секунда → в background queue

### Ошибка 3: Отсутствие idempotency в webhooks

❌ **Неправильно**:
\`\`\`typescript
app.post('/webhook', async (req, res) => {
  const { orderId, amount } = req.body;

  // Добавить кредиты (может выполниться дважды!)
  await addCredits(orderId, amount);

  res.json({ ok: true });
});
\`\`\`

**Проблема**: Webhook приходит дважды → дубликат кредитов

✅ **Правильно**:
\`\`\`typescript
app.post('/webhook', async (req, res) => {
  const { orderId, amount } = req.body;

  // Проверить, не обработали ли уже
  const existing = await db.processedWebhooks.findOne({ orderId });
  if (existing) {
    return res.json({ ok: true });
  }

  await addCredits(orderId, amount);

  // Сохранить факт обработки
  await db.processedWebhooks.create({ orderId, processedAt: new Date() });

  res.json({ ok: true });
});
\`\`\`

> 💡 **Совет**: Webhooks всегда идемпотентны

### Ошибка 4: Игнорирование rate limiting

❌ **Неправильно**:
\`\`\`typescript
for (const user of users) {
  await externalAPI.sendNotification(user.id); // 1000 запросов
}
\`\`\`

**Проблема**: API вернет 429 Too Many Requests

✅ **Правильно**:
\`\`\`typescript
const limiter = new RateLimiter({ maxPerSecond: 10 });

for (const user of users) {
  await limiter.wait();
  await externalAPI.sendNotification(user.id);
}
\`\`\`

> 💡 **Совет**: Соблюдайте rate limits внешних API

### Ошибка 5: Хранение API ключей в коде

❌ **Неправильно**:
\`\`\`typescript
const STRIPE_KEY = 'sk_live_abc123'; // В коде
\`\`\`

**Проблема**: Ключ попадет в Git, его украдут

✅ **Правильно**:
\`\`\`typescript
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY; // В .env файле
\`\`\`

> 💡 **Совет**: API ключи только в environment variables

---

## Best Practices

### 1. Используйте API contracts (OpenAPI/GraphQL schema)

✅ **Что делать**: Описывайте API в OpenAPI спецификации

**Преимущества:**
- Автогенерация документации
- Автогенерация клиентских SDK
- Валидация запросов/ответов
- Contract testing

### 2. Реализуйте retry logic с exponential backoff

✅ **Что делать**: Повторяйте запросы с увеличивающейся задержкой

\`\`\`typescript
const delays = [1000, 2000, 4000, 8000]; // ms

for (let i = 0; i < delays.length; i++) {
  try {
    return await fetch(url);
  } catch (error) {
    if (i === delays.length - 1) throw error;
    await sleep(delays[i]);
  }
}
\`\`\`

### 3. Используйте Circuit Breaker для защиты

✅ **Что делать**: Автоматически "отключайте" падающие сервисы

**Библиотеки:** \`opossum\`, \`cockatiel\`

### 4. Мониторинг интеграций

✅ **Что делать**: Отслеживайте метрики

**Ключевые метрики:**
- Response time (P50, P95, P99)
- Error rate (% неуспешных запросов)
- Timeout rate
- Circuit breaker status

### 5. Версионирование API

✅ **Что делать**: Используйте версии в URL или headers

\`\`\`
GET /v1/users/:id
GET /v2/users/:id
\`\`\`

### 6. Логирование всех внешних запросов

✅ **Что делать**: Логируйте request/response

\`\`\`typescript
console.log({
  type: 'external_api_call',
  service: 'stripe',
  method: 'POST',
  endpoint: '/payment_intents',
  requestId: uuid(),
  duration: 234,
  statusCode: 200
});
\`\`\`

---

## Заключение

Требования к интеграциям определяют, как ваша система взаимодействует с внешним миром. Правильная архитектура интеграций — это баланс между скоростью, надежностью и простотой.

### Ключевые моменты

🎯 **API Contracts**: Формальные соглашения о формате данных (OpenAPI, GraphQL)

🎯 **Синхронные vs Асинхронные**: Синхронные для быстрых операций, асинхронные для долгих

🎯 **Webhooks**: Real-time уведомления, требуют idempotency

🎯 **Error Handling**: Retry logic, exponential backoff, circuit breaker

🎯 **Security**: API keys в env, проверка подписей webhooks, HTTPS

> 💡 **Помните**: Интеграции — самая хрупкая часть системы. Внешние сервисы падают, сеть нестабильна. Проектируйте с учетом сбоев!
`;

async function createIntegrationRequirementsLecture() {
  try {
    console.log('🚀 Создание лекции "Требования к интеграциям и API"...\n');

    // Найти тест
    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'Требования к интеграциям и API' }
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "Требования к интеграциям и API" не найден!');
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    // Создать лекцию
    const lecture = await prisma.lecture.create({
      data: {
        title: 'Требования к интеграциям и API',
        topic: 'Требования к ПО',
        content: lectureContent
      }
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    // Привязать лекцию ко всем вопросам теста
    let updatedCount = 0;
    for (const tq of test.questions) {
      await prisma.question.update({
        where: { id: tq.questionId },
        data: { lectureId: lecture.id }
      });
      updatedCount++;
    }

    console.log(`✅ Лекция привязана к ${updatedCount} вопросам\n`);
    console.log('🎉 Готово! Лекция "Требования к интеграциям и API" создана.');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createIntegrationRequirementsLecture();
