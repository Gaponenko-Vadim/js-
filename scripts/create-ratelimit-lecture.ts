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
# Rate Limiting в REST API

## Введение

Представьте бесплатную кофейню, где каждый может взять сколько угодно кофе. Через час толпа выпивает весь запас, кофемашина ломается от перегрузки, а настоящие клиенты уходят ни с чем. REST API без rate limiting - та же ситуация: один агрессивный клиент или DDoS атака могут обрушить сервис для всех. Rate limiting - это "правила кофейни": каждому клиенту максимум 5 чашек в час, после чего нужно подождать.

## Зачем нужен Rate Limiting?

### Проблемы без Rate Limiting

1. **DDoS атаки и злоупотребления**
   - Один клиент делает 10,000 запросов в секунду
   - Сервер не справляется с нагрузкой
   - Легитимные пользователи не могут получить доступ

2. **Перегрузка инфраструктуры**
   - База данных падает от количества запросов
   - Costs взлетают (AWS Lambda charges per request)
   - Сервис становится медленным для всех

3. **Scraping и парсинг**
   - Конкуренты копируют ваши данные
   - Боты индексируют API без ограничений
   - Bandwidth расходуется впустую

4. **Unfair usage**
   - Один пользователь потребляет 90% ресурсов
   - Остальные 99% пользователей страдают
   - Плохой UX для большинства

### Преимущества Rate Limiting

✅ **Защита от перегрузки** - сервер обрабатывает предсказуемое количество запросов
✅ **Fair usage** - ресурсы распределяются равномерно
✅ **Cost control** - предсказуемые расходы на инфраструктуру
✅ **QoS (Quality of Service)** - стабильная работа для всех
✅ **Monetization** - разные лимиты для бесплатных/платных тарифов
✅ **Security** - защита от brute-force, DDoS

---

## HTTP статус код 429 Too Many Requests

**Стандарт:** RFC 6585

### Синтаксис ответа

\`\`\`
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705315200
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "message": "You have exceeded your request quota. Try again in 60 seconds."
}
\`\`\`

### Ключевые заголовки

**\`X-RateLimit-Limit\`** - максимальное количество запросов в окне
\`\`\`
X-RateLimit-Limit: 100
\`\`\`

**\`X-RateLimit-Remaining\`** - сколько запросов осталось в текущем окне
\`\`\`
X-RateLimit-Remaining: 42
\`\`\`

**\`X-RateLimit-Reset\`** - Unix timestamp когда лимит сбросится
\`\`\`
X-RateLimit-Reset: 1705315200
\`\`\`

Клиент может вычислить секунды до сброса:
\`\`\`javascript
const secondsUntilReset = resetTimestamp - Math.floor(Date.now() / 1000);
\`\`\`

**\`Retry-After\`** - через сколько секунд повторить запрос
\`\`\`
Retry-After: 60
\`\`\`

**Примечание:** \`Retry-After\` - стандартный HTTP заголовок (RFC 7231), \`X-RateLimit-*\` - de facto стандарт (используется GitHub, Twitter, Stripe).

### Draft RFC: RateLimit Headers

**Новый стандарт (draft):**
\`\`\`
RateLimit-Limit: 100
RateLimit-Remaining: 42
RateLimit-Reset: 60
\`\`\`

Без префикса \`X-\`, но пока не финализирован.

---

## Стратегии Rate Limiting

### 1. По IP адресу

**Концепция**: Ограничение для каждого IP.

\`\`\`
IP 192.168.1.10: 100 запросов/час
IP 192.168.1.20: 100 запросов/час
\`\`\`

#### Плюсы

✅ **Простая реализация** - не требует аутентификации
✅ **Защита от анонимных атак** - DDoS с одного IP
✅ **Подходит для публичных API** - не требует регистрации

#### Минусы

❌ **Shared IP проблема** - корпоративные NAT, VPN
   - Офис на 1000 человек за одним IP
   - Один пользователь исчерпывает лимит для всех

❌ **Легко обойти** - VPN, proxy, ротация IP
❌ **IPv6 проблема** - огромное пространство адресов

#### Когда использовать

- Публичные endpoints без регистрации
- Первая линия защиты от DDoS
- В комбинации с другими стратегиями

---

### 2. По пользователю (User ID)

**Концепция**: Лимит для каждого авторизованного пользователя.

\`\`\`
User 123: 1000 запросов/час
User 456: 1000 запросов/час
\`\`\`

#### Плюсы

✅ **Fair per-user** - каждый пользователь имеет свой лимит
✅ **Нет shared IP проблемы**
✅ **Гибкие тарифы** - разные лимиты для бесплатных/платных

#### Минусы

❌ **Требует авторизацию** - не работает для публичных endpoints
❌ **Легко обойти** - создать много аккаунтов (sybil attack)

#### Когда использовать

- Авторизованные API
- SaaS продукты
- Когда нужны разные тарифные планы

---

### 3. По API ключу

**Концепция**: Лимит для каждого API ключа.

\`\`\`
GET /users
Authorization: Bearer sk_live_abc123

X-RateLimit-Limit: 5000
\`\`\`

#### Плюсы

✅ **Точный учет** - каждое приложение имеет свой ключ
✅ **Легко отозвать** - блокировка конкретного ключа
✅ **Monetization** - продажа ключей с разными лимитами
✅ **Analytics** - кто и как использует API

#### Минусы

❌ **Сложность управления** - нужна система генерации/управления ключами
❌ **Security risks** - утечка ключа = злоупотребление лимитом

#### Когда использовать

- Публичные API для разработчиков
- B2B интеграции
- API marketplaces (Stripe, GitHub)

**Используется в:** GitHub API, Stripe, Twitter API, Google Cloud.

---

### 4. Комбинированные стратегии

**Многоуровневая защита:**

\`\`\`
Уровень 1: IP - 200 запросов/минуту (DDoS защита)
Уровень 2: API key - 5000 запросов/час (основной лимит)
Уровень 3: User - 1000 запросов/час (per-user fairness)
\`\`\`

Клиент ограничен **наименьшим** доступным лимитом.

---

## Алгоритмы Rate Limiting

### 1. Fixed Window (фиксированное окно)

**Концепция**: Лимит на фиксированный временной интервал.

\`\`\`
00:00-00:59 → 100 запросов
01:00-01:59 → 100 запросов (счетчик сбрасывается)
\`\`\`

#### Пример реализации

\`\`\`javascript
const limits = {}; // { "user-123-2024-01-15-10": 42 }

function checkRateLimit(userId) {
  const now = new Date();
  const windowKey = \`\${userId}-\${now.getFullYear()}-\${now.getMonth()}-\${now.getDate()}-\${now.getHours()}\`;

  if (!limits[windowKey]) {
    limits[windowKey] = 0;
  }

  if (limits[windowKey] >= 100) {
    return false; // Лимит превышен
  }

  limits[windowKey]++;
  return true;
}
\`\`\`

#### Плюсы

✅ **Простая реализация** - инкремент счетчика
✅ **Эффективная** - O(1) операции
✅ **Предсказуемая** - четкие границы окон

#### Минусы

❌ **Burst problem** - можно обойти границу окна

**Проблема:**
\`\`\`
00:59:30 → 100 запросов (конец окна)
01:00:00 → 100 запросов (новое окно)

Итого: 200 запросов за 30 секунд! (вместо 100/час)
\`\`\`

---

### 2. Sliding Window Log (скользящее окно с логом)

**Концепция**: Хранить timestamp каждого запроса, считать за последний час.

#### Пример

\`\`\`javascript
const requestLog = []; // [timestamp1, timestamp2, ...]

function checkRateLimit(userId) {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  // Удалить старые запросы
  requestLog = requestLog.filter(timestamp => timestamp > oneHourAgo);

  if (requestLog.length >= 100) {
    return false;
  }

  requestLog.push(now);
  return true;
}
\`\`\`

#### Плюсы

✅ **Точный** - нет burst problem
✅ **Справедливый** - истинное скользящее окно

#### Минусы

❌ **Memory intensive** - хранение каждого timestamp
❌ **Медленный** - O(n) операции (фильтрация)

**Проблема масштаба:**
- 1M пользователей × 100 запросов = 100M timestamps в памяти
- Нереалистично для больших систем

---

### 3. Sliding Window Counter (скользящее окно со счетчиками)

**Концепция**: Гибрид Fixed Window и Sliding Log. Используем счетчики за предыдущие окна.

#### Формула

\`\`\`
Rate = (prev_window_count × overlap_percentage) + current_window_count
\`\`\`

#### Пример

Лимит: 100 запросов/час

\`\`\`
Текущее время: 10:30 (30 минут в текущем окне)
Окно 09:00-10:00: 80 запросов
Окно 10:00-11:00: 40 запросов (текущее)

overlap = 30 минут = 50% от часа
rate = (80 × 0.5) + 40 = 40 + 40 = 80

Можно еще 20 запросов.
\`\`\`

#### Плюсы

✅ **Эффективная** - O(1) операции, мало памяти
✅ **Хорошая точность** - лучше чем Fixed Window
✅ **Масштабируемая** - подходит для миллионов пользователей

#### Минусы

❌ **Приближенная** - не идеально точная
❌ **Сложнее реализация** чем Fixed Window

**Рекомендация:** Это оптимальный алгоритм для большинства случаев.

---

### 4. Token Bucket (ведро с токенами)

**Концепция**: У пользователя есть bucket с токенами. Каждый запрос = 1 токен. Токены пополняются с постоянной скоростью.

#### Параметры

- **Bucket capacity**: максимум токенов (например, 100)
- **Refill rate**: токены/секунду (например, 10/сек)

#### Пример

\`\`\`
Bucket capacity: 100 токенов
Refill rate: 10 токенов/сек

10:00:00 - 100 токенов (полное ведро)
10:00:01 - Сделано 15 запросов → 85 токенов
10:00:02 - +10 токенов → 95 токенов
10:00:03 - +10 токенов → 100 токенов (макс)
\`\`\`

#### Реализация

\`\`\`javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume(tokens = 1) {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }
}

const bucket = new TokenBucket(100, 10);
if (bucket.consume()) {
  // Запрос разрешен
}
\`\`\`

#### Плюсы

✅ **Smooth traffic** - равномерное распределение
✅ **Burst support** - может использовать накопленные токены
✅ **Flexible** - разные запросы могут стоить разное количество токенов

#### Минусы

❌ **Сложнее** чем Fixed Window
❌ **Требует хранение state** (tokens, lastRefill)

#### Когда использовать

- Когда нужен burst (короткие всплески)
- API с разной "стоимостью" endpoints (GET = 1 токен, POST = 5 токенов)

---

### 5. Leaky Bucket (дырявое ведро)

**Концепция**: Запросы добавляются в queue, обрабатываются с постоянной скоростью (ведро "протекает").

#### Параметры

- **Bucket capacity**: размер очереди
- **Leak rate**: запросов/секунду

#### Пример

\`\`\`
Capacity: 100 запросов
Leak rate: 10 запросов/сек

Queue: [req1, req2, req3, ...]
Обработка: каждые 0.1 сек вытаскивается 1 запрос
\`\`\`

#### Плюсы

✅ **Стабильная нагрузка** - строго постоянная скорость обработки
✅ **Smoothing** - сглаживает bursts

#### Минусы

❌ **Latency** - запросы ждут в очереди
❌ **Сложная реализация** - требует queue management

#### Token Bucket vs Leaky Bucket

| Аспект | Token Bucket | Leaky Bucket |
|--------|--------------|--------------|
| **Burst** | Разрешены | Сглаживаются |
| **Скорость обработки** | Мгновенная | Постоянная |
| **Latency** | Низкая | Может быть высокая |
| **Use case** | API | Traffic shaping |

**Рекомендация:** Token Bucket лучше для REST API, Leaky Bucket для network traffic shaping.

---

## Разные лимиты для разных endpoints

### Концепция

Дорогие операции должны иметь более строгие лимиты.

\`\`\`
GET  /users           → 1000 запросов/час
POST /users           → 100 запросов/час
POST /users/search    → 50 запросов/час
GET  /health          → без лимита
\`\`\`

### Примеры весов

\`\`\`javascript
const costs = {
  'GET /users': 1,
  'GET /users/:id': 1,
  'POST /users': 5,
  'DELETE /users/:id': 10,
  'POST /search': 3
};
\`\`\`

### Реализация

\`\`\`javascript
function getCost(method, path) {
  const key = \`\${method} \${path}\`;
  return costs[key] || 1;
}

app.use(rateLimiter({
  tokenBucket: true,
  getCost: (req) => getCost(req.method, req.path)
}));
\`\`\`

**Пример:**
- Bucket: 100 токенов
- \`GET /users\` (cost=1) → 100 запросов
- \`POST /users\` (cost=5) → 20 запросов
- \`DELETE /users/123\` (cost=10) → 10 запросов

---

## Burst Rate Limit

**Концепция**: Краткосрочный лимит для защиты от внезапных всплесков.

### Два уровня лимитов

\`\`\`
Burst limit: 100 запросов/минуту (защита от spike)
Sustained limit: 1000 запросов/час (обычный лимит)
\`\`\`

### Пример

\`\`\`
Клиент делает 150 запросов за 1 минуту:
- Burst limit (100/мин) превышен → 429 Too Many Requests

Клиент делает 80 запросов/мин равномерно в течение часа:
- Burst: OK (80 < 100)
- Sustained: OK (80×60 = 4800, но в час уложились в 1000)
\`\`\`

### Зачем нужен burst

✅ **Защита от spike** - внезапный всплеск не обрушит сервер
✅ **Fairness** - один пользователь не может "захватить" весь bandwidth на минуту
✅ **Detection** - burst violations могут сигнализировать о скрипте/боте

---

## Distributed Rate Limiting (распределенный)

### Проблема

В распределенной системе несколько серверов обрабатывают запросы:

\`\`\`
User → Load Balancer → Server 1, Server 2, Server 3

Лимит: 100 запросов/час
Проблема: каждый сервер считает отдельно
Результат: User делает 300 запросов (100 на каждый сервер)
\`\`\`

### Решение: Shared state (Redis)

\`\`\`javascript
const redis = require('redis');
const client = redis.createClient();

async function checkRateLimit(userId) {
  const key = \`ratelimit:\${userId}:hour\`;
  const count = await client.incr(key);

  if (count === 1) {
    await client.expire(key, 3600); // TTL 1 час
  }

  return count <= 100;
}
\`\`\`

#### Атомарность

Redis \`INCR\` - атомарная операция, гарантирует корректный счет в concurrent среде.

#### Альтернативы Redis

- **Memcached** - быстрый, но без TTL per-key
- **DynamoDB** - managed, но дороже
- **In-memory cache** - не работает в distributed

**Рекомендация:** Redis - de facto стандарт для distributed rate limiting.

---

## Quota (квота) vs Rate Limit

### Rate Limit - краткосрочный

\`\`\`
100 запросов/минуту
1000 запросов/час
\`\`\`

Защита от burst и перегрузки.

### Quota - долгосрочный

\`\`\`
1,000,000 запросов/месяц
10 GB трафика/месяц
\`\`\`

Billing и тарифные планы.

### Комбинация

\`\`\`
Free tier:
- Rate limit: 100/минуту
- Quota: 10,000/месяц

Pro tier:
- Rate limit: 1000/минуту
- Quota: 1,000,000/месяц
\`\`\`

### Заголовки для quota

\`\`\`
X-Quota-Limit: 1000000
X-Quota-Remaining: 542000
X-Quota-Reset: 2024-02-01T00:00:00Z
\`\`\`

---

## Разные лимиты для тарифов

### Пример: SaaS продукт

\`\`\`javascript
const rateLimits = {
  free: {
    requestsPerHour: 100,
    quotaPerMonth: 10000
  },
  basic: {
    requestsPerHour: 500,
    quotaPerMonth: 100000
  },
  pro: {
    requestsPerHour: 2000,
    quotaPerMonth: 1000000
  },
  enterprise: {
    requestsPerHour: 10000,
    quotaPerMonth: Infinity // unlimited
  }
};

function getRateLimit(user) {
  return rateLimits[user.tier] || rateLimits.free;
}
\`\`\`

### Премиум лимиты как monetization

✅ **Freemium model** - бесплатные пользователи имеют низкие лимиты
✅ **Upsell** - "хотите больше запросов? Upgrade!"
✅ **Revenue stream** - rate limits напрямую связаны с ценой

**Примеры:**
- GitHub API: 60 запросов/час (анонимные), 5000/час (authenticated)
- Stripe: лимиты зависят от account tier
- AWS API Gateway: разные throttle для разных API keys

---

## Обработка 429 на клиенте

### Exponential Backoff

**Концепция**: Увеличивать задержку экспоненциально после каждой ошибки.

\`\`\`javascript
async function fetchWithRetry(url, maxRetries = 3) {
  let retries = 0;

  while (retries < maxRetries) {
    const response = await fetch(url);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : Math.pow(2, retries) * 1000; // 1s, 2s, 4s, ...

      console.log(\`Rate limited. Retrying in \${delay}ms...\`);
      await sleep(delay);
      retries++;
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
\`\`\`

### Jitter (случайность)

Добавить случайную задержку чтобы избежать thundering herd:

\`\`\`javascript
const jitter = Math.random() * 1000; // 0-1000ms
const delay = baseDelay + jitter;
\`\`\`

### Respect Retry-After

\`\`\`javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    await sleep(parseInt(retryAfter) * 1000);
  }
}
\`\`\`

**Важно:** Хорошие клиенты соблюдают \`Retry-After\`, плохие игнорируют.

---

## Документирование Rate Limits

### В API документации

**Обязательно указать:**
1. **Лимиты для каждого тарифа**
2. **Временные окна** (минута, час, день)
3. **Заголовки ответа**
4. **Как обрабатывать 429**
5. **Burst limits** если есть

**Пример документации:**

\`\`\`markdown
## Rate Limits

### Free Tier
- 100 requests/hour
- 10,000 requests/month

### Pro Tier
- 1,000 requests/hour
- 1,000,000 requests/month

### Response Headers
- \`X-RateLimit-Limit\`: Maximum requests per window
- \`X-RateLimit-Remaining\`: Requests left
- \`X-RateLimit-Reset\`: Unix timestamp of reset

### Handling 429
When you exceed limits, you'll receive:
\\\`\\\`\\\`
HTTP/1.1 429 Too Many Requests
Retry-After: 60
\\\`\\\`\\\`

Wait for the \`Retry-After\` duration before retrying.
\`\`\`

---

## Практические реализации

### Задача 1: Fixed Window в памяти

\`\`\`javascript
const rateLimits = {}; // { "user-123-2024-01-15-10": 42 }

function rateLimitMiddleware(limit, windowMs) {
  return (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    const windowKey = \`\${userId}-\${Math.floor(now / windowMs)}\`;

    if (!rateLimits[windowKey]) {
      rateLimits[windowKey] = 0;
    }

    rateLimits[windowKey]++;

    const remaining = Math.max(0, limit - rateLimits[windowKey]);
    const resetTime = Math.ceil(now / windowMs) * windowMs;

    res.set({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': Math.floor(resetTime / 1000)
    });

    if (rateLimits[windowKey] > limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((resetTime - now) / 1000)
      });
    }

    next();
  };
}

app.use('/api', rateLimitMiddleware(100, 3600000)); // 100/час
\`\`\`

### Задача 2: Redis-based distributed

\`\`\`javascript
const redis = require('redis');
const client = redis.createClient();

async function checkRateLimit(userId, limit, windowSec) {
  const key = \`ratelimit:\${userId}:\${Math.floor(Date.now() / 1000 / windowSec)}\`;

  const count = await client.incr(key);

  if (count === 1) {
    await client.expire(key, windowSec);
  }

  const remaining = Math.max(0, limit - count);

  return {
    allowed: count <= limit,
    remaining,
    resetAt: Math.ceil(Date.now() / 1000 / windowSec) * windowSec
  };
}

app.use(async (req, res, next) => {
  const result = await checkRateLimit(req.user.id, 100, 3600);

  res.set({
    'X-RateLimit-Limit': 100,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': result.resetAt
  });

  if (!result.allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  next();
});
\`\`\`

### Задача 3: Token Bucket

\`\`\`javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume(tokens = 1) {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return { allowed: true, remaining: Math.floor(this.tokens) };
    }

    return { allowed: false, remaining: 0 };
  }
}

const buckets = new Map(); // userId → TokenBucket

function tokenBucketMiddleware(capacity, refillRate) {
  return (req, res, next) => {
    const userId = req.user.id;

    if (!buckets.has(userId)) {
      buckets.set(userId, new TokenBucket(capacity, refillRate));
    }

    const bucket = buckets.get(userId);
    const result = bucket.tryConsume();

    res.set({
      'X-RateLimit-Limit': capacity,
      'X-RateLimit-Remaining': result.remaining
    });

    if (!result.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    next();
  };
}

app.use('/api', tokenBucketMiddleware(100, 10)); // 100 токенов, 10/сек
\`\`\`

---

## Библиотеки для Rate Limiting

### Express Rate Limit (Node.js)

\`\`\`javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 100,
  message: 'Too many requests',
  standardHeaders: true, // X-RateLimit-*
  legacyHeaders: false
});

app.use('/api/', limiter);
\`\`\`

### Django Ratelimit (Python)

\`\`\`python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='100/h')
def my_view(request):
    return JsonResponse({'status': 'ok'})
\`\`\`

### Redis Rate Limiter (любой язык)

\`\`\`
EVAL "redis script for rate limiting"
\`\`\`

**GitHub:** много готовых Lua scripts для Redis.

---

## Best Practices

### 1. Всегда возвращайте заголовки

Даже если лимит не превышен:
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1705315200
\`\`\`

Клиент может адаптивно снизить частоту запросов.

### 2. Используйте Retry-After

\`\`\`
HTTP/1.1 429 Too Many Requests
Retry-After: 60
\`\`\`

Явно указать когда можно повторить.

### 3. Разные лимиты для разных операций

\`\`\`
GET  → дешево → высокий лимит
POST → дорого → низкий лимит
\`\`\`

### 4. Graceful degradation для authenticated

\`\`\`
Анонимные: 60 запросов/час
Authenticated: 5000 запросов/час
\`\`\`

Мотивирует регистрацию.

### 5. Мониторинг и алерты

Логируйте:
- Rate limit violations (429 responses)
- Top violators
- Usage patterns

Алерты:
- Spike в 429 ответах = возможная атака
- Один пользователь постоянно превышает = бот?

### 6. Whitelist для internal services

\`\`\`javascript
if (req.headers['x-internal-service'] === 'secret') {
  return next(); // Без лимита
}
\`\`\`

### 7. Документируйте все лимиты

Пользователи должны знать заранее.

---

## Сравнительная таблица алгоритмов

| Алгоритм | Точность | Память | CPU | Burst | Рекомендация |
|----------|----------|--------|-----|-------|--------------|
| **Fixed Window** | ❌ Низкая | ✅ Мало | ✅ Быстро | ❌ Burst problem | Простые случаи |
| **Sliding Log** | ✅ Высокая | ❌ Много | ❌ Медленно | ✅ Нет burst | Малые системы |
| **Sliding Counter** | ⚠️ Средняя | ✅ Мало | ✅ Быстро | ⚠️ Небольшой burst | **Рекомендуется** |
| **Token Bucket** | ✅ Высокая | ⚠️ Средне | ⚠️ Средне | ✅ Поддержка burst | Гибкие лимиты |
| **Leaky Bucket** | ✅ Высокая | ⚠️ Средне | ⚠️ Средне | ❌ Сглаживает | Traffic shaping |

---

## Заключение

**Ключевые принципы Rate Limiting:**

1. **429 Too Many Requests** - стандартный статус код
2. **X-RateLimit-*** заголовки - для информирования клиента
3. **Sliding Window Counter** - лучший баланс для большинства случаев
4. **Redis для distributed** - синхронизация между серверами
5. **Разные лимиты** - для тарифов и типов операций
6. **Retry-After** - помогите клиенту понять когда повторить
7. **Документация** - явно укажите все лимиты

**Практические советы:**

- Начните с консервативных лимитов (100/час)
- Мониторьте usage patterns
- Постепенно повышайте для authenticated пользователей
- Используйте rate limits как monetization lever
- Тестируйте с реальной нагрузкой

**Золотое правило:** Rate limiting - это баланс между защитой сервиса и UX. Слишком строгие лимиты раздражают пользователей, слишком мягкие не защищают от злоупотреблений. Мониторьте и адаптируйте.

Rate limiting - не опциональная фича, а критически важная часть production API. Инвестируйте время в правильную реализацию с самого начала.
`;

const lectureContent = cleanContent(lectureContentRaw);

async function createLecture() {
  try {
    console.log('🔧 Создание лекции "Rate Limiting"...\n');

    const lecture = await prisma.lecture.create({
      data: {
        title: 'Rate Limiting в REST API',
        topic: 'Rate Limiting',
        content: lectureContent,
      },
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    const test = await prisma.test.findFirst({
      where: {
        OR: [
          { title: { contains: 'Rate Limiting' } },
          { title: { contains: 'rate' } }
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
      console.log('❌ Тест "Rate Limiting" не найден');
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
