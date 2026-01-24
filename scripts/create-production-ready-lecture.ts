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

const lectureContent = `# Нефункциональные требования: Production-ready системы

## Введение: Самолет vs Production система

Представьте два самолета:
- ✈️ **Самолет A**: Летает отлично, но нет систем мониторинга, черный ящик отсутствует, при поломке никто не знает что случилось
- ✈️ **Самолет B**: Летает + 1000 датчиков, черный ящик, система предупреждения, автоматическая диагностика

**Какой безопаснее?** Конечно B!

> 💡 **Аналогия**: Production-ready система — это не просто "работает", а **работает надежно с полным контролем**: мониторинг, логирование, алертинг, graceful degradation, возможность быстро найти и исправить проблему.

**Факт**: По данным Google SRE, 80% инцидентов в production происходят из-за отсутствия observability (мониторинга и логирования).

В этой лекции вы узнаете:
- ✅ Что такое Production-ready система
- ✅ Observability (Наблюдаемость): логи, метрики, трейсы
- ✅ Мониторинг и алертинг
- ✅ Deployment стратегии (Blue-Green, Canary, Rolling)
- ✅ Health checks и graceful shutdown
- ✅ Disaster recovery и rollback

---

## Что такое Production-ready система?

### Определение

> "Production-ready система — система, которая **готова к использованию реальными пользователями в production**: надежная, мониторится, логируется, может быть быстро восстановлена при сбое"

### Критерии Production-ready

**Checklist:**
\`\`\`
☑ Observability:
  ☐ Логирование всех критичных операций
  ☐ Метрики производительности
  ☐ Distributed tracing (для микросервисов)

☑ Monitoring & Alerting:
  ☐ Dashboards для ключевых метрик
  ☐ Алерты при проблемах
  ☐ On-call rotation setup

☑ Reliability:
  ☐ Health checks
  ☐ Graceful shutdown
  ☐ Circuit breakers
  ☐ Retry logic

☑ Deployment:
  ☐ Automated deployment pipeline
  ☐ Zero-downtime deployment
  ☐ Rollback capability

☑ Security:
  ☐ HTTPS everywhere
  ☐ Secrets management
  ☐ Security scanning

☑ Documentation:
  ☐ Runbook (что делать при инцидентах)
  ☐ Architecture diagram
  ☐ API documentation
\`\`\`

---

## Observability (Наблюдаемость)

### Три столпа Observability

> "Observability = способность понять внутреннее состояние системы по внешним outputs"

#### 1. Logs (Логи)

**ЧТО:** Записи событий, происходящих в системе

**Уровни логирования:**
\`\`\`
ERROR   - Ошибки (требуют немедленного внимания)
WARN    - Предупреждения (что-то не так, но не критично)
INFO    - Информационные сообщения (важные события)
DEBUG   - Отладочная информация (для разработки)
TRACE   - Детальная трассировка (очень подробно)
\`\`\`

**Structured Logging (JSON):**
\`\`\`json
{
  "timestamp": "2024-03-15T10:30:45.123Z",
  "level": "ERROR",
  "service": "payment-service",
  "requestId": "abc-123-def",
  "userId": "user-456",
  "message": "Payment failed",
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "amount": 1000,
    "balance": 500
  },
  "stack": "Error: Insufficient funds\\n  at processPayment..."
}
\`\`\`

**Best Practices:**
\`\`\`typescript
// ✅ Правильно: Structured logging
logger.error('Payment failed', {
  requestId: req.id,
  userId: user.id,
  amount: payment.amount,
  errorCode: 'INSUFFICIENT_FUNDS'
});

// ❌ Неправильно: Plain text
console.log('Payment failed for user ' + user.id);
\`\`\`

#### 2. Metrics (Метрики)

**ЧТО:** Числовые показатели состояния системы

**Типы метрик:**

**RED метрики (для сервисов):**
- **R**ate - количество запросов в секунду
- **E**rrors - процент ошибок
- **D**uration - время ответа

**USE метрики (для ресурсов):**
- **U**tilization - использование ресурса (CPU, Memory)
- **S**aturation - насыщенность (очередь запросов)
- **E**rrors - ошибки

**Примеры метрик:**
\`\`\`
http_requests_total{method="GET", endpoint="/api/users", status="200"} 15234
http_request_duration_seconds{endpoint="/api/users", quantile="0.95"} 0.234
database_connections_active 45
database_connections_max 100
memory_usage_bytes 2147483648
cpu_usage_percent 65.5
\`\`\`

**Инструменты:** Prometheus, Grafana, CloudWatch

#### 3. Traces (Трассировка)

**ЧТО:** Путь запроса через систему (особенно важно для микросервисов)

**Пример трассировки:**
\`\`\`
Request ID: abc-123-def

1. API Gateway       [0ms - 5ms]    (5ms)
   ↓
2. Auth Service      [5ms - 25ms]   (20ms) - Validate JWT
   ↓
3. User Service      [25ms - 80ms]  (55ms)
   ├─ Database Query [30ms - 70ms]  (40ms)
   └─ Cache Check    [25ms - 30ms]  (5ms)
   ↓
4. Payment Service   [80ms - 200ms] (120ms)
   ├─ Stripe API     [90ms - 180ms] (90ms) ⚠️ SLOW
   └─ Database       [180ms - 195ms](15ms)
   ↓
5. Response          [200ms]

Total: 200ms
Bottleneck: Stripe API (90ms)
\`\`\`

**Инструменты:** Jaeger, Zipkin, OpenTelemetry

---

## Monitoring (Мониторинг)

### Что мониторить?

**1. Application Metrics**
\`\`\`
- Request rate (RPS)
- Error rate (%)
- Response time (P50, P95, P99)
- Active users
- Queue length
\`\`\`

**2. Infrastructure Metrics**
\`\`\`
- CPU usage (%)
- Memory usage (%)
- Disk I/O
- Network bandwidth
\`\`\`

**3. Business Metrics**
\`\`\`
- Successful transactions
- Revenue per hour
- Conversion rate
- User signups
\`\`\`

### Dashboards

**Example: Service Dashboard**
\`\`\`
┌─────────────────────────────────────┐
│  Payment Service Dashboard          │
├─────────────────────────────────────┤
│ Request Rate:  1,234 RPS            │
│ Error Rate:    0.5%        ✅       │
│ P95 Latency:   234ms       ✅       │
│ P99 Latency:   567ms       ⚠️       │
├─────────────────────────────────────┤
│ [Graph: Request Rate over time]     │
│ [Graph: Error Rate over time]       │
│ [Graph: Latency Distribution]       │
├─────────────────────────────────────┤
│ Database Connections: 45/100        │
│ Memory Usage: 65%          ✅       │
│ CPU Usage: 78%             ⚠️       │
└─────────────────────────────────────┘
\`\`\`

---

## Alerting (Алертинг)

### Когда алертить?

**Golden Signals (Google SRE):**

**1. Latency (Задержка)**
\`\`\`
Alert: P95 latency > 500ms for 5 minutes
Action: Check slow queries, scaling
\`\`\`

**2. Traffic (Трафик)**
\`\`\`
Alert: Traffic dropped by 50% in 5 minutes
Action: Check if service down, DNS issue
\`\`\`

**3. Errors (Ошибки)**
\`\`\`
Alert: Error rate > 5% for 5 minutes
Action: Check logs, rollback if needed
\`\`\`

**4. Saturation (Насыщенность)**
\`\`\`
Alert: CPU > 85% for 10 minutes
Action: Scale up, investigate memory leak
\`\`\`

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P1 (Critical)** | Service down | Immediate | 500 errors on main endpoint |
| **P2 (High)** | Degraded performance | < 1 hour | P95 latency 2x normal |
| **P3 (Medium)** | Warning, not user-facing | < 4 hours | Disk usage > 80% |
| **P4 (Low)** | Informational | Next business day | New deployment |

### Alert Fatigue Prevention

❌ **Плохо:**
\`\`\`
Alert every time CPU > 50% → 100 alerts/day → ignore
\`\`\`

✅ **Хорошо:**
\`\`\`
Alert if CPU > 85% for 10+ minutes → 2-3 alerts/week → action
\`\`\`

**Правило:** Алерт должен требовать действия. Если нет действия → не алертить.

---

## Deployment Стратегии

### 1. Blue-Green Deployment

**ЧТО:** Две идентичные среды (Blue = текущая, Green = новая)

**Процесс:**
\`\`\`
Step 1: Blue environment (v1.0) handles 100% traffic
Step 2: Deploy v1.1 to Green environment
Step 3: Test Green environment
Step 4: Switch traffic to Green (v1.1)
Step 5: Blue becomes standby (for rollback)

Traffic: Blue 100% → Blue 0%, Green 100%
Rollback: Switch back to Blue (instant)
\`\`\`

**Преимущества:**
- ✅ Zero downtime
- ✅ Instant rollback
- ✅ Полное тестирование перед switch

**Недостатки:**
- ❌ 2x infrastructure cost (две среды)

### 2. Canary Deployment

**ЧТО:** Постепенное раскатывание на процент пользователей

**Процесс:**
\`\`\`
Step 1: v1.0 serves 100% users
Step 2: Deploy v1.1, route 5% traffic to v1.1
Step 3: Monitor metrics (errors, latency)
Step 4: If OK → increase to 25%
Step 5: If OK → increase to 50%
Step 6: If OK → increase to 100%

If issues at any step → rollback
\`\`\`

**Пример:**
\`\`\`
v1.0: ████████████████████ 95%
v1.1: █                    5%

↓ After 1 hour, no issues

v1.0: ███████████████      75%
v1.1: █████                25%

↓ After 1 hour, no issues

v1.0:                      0%
v1.1: ████████████████████ 100%
\`\`\`

**Преимущества:**
- ✅ Риск затрагивает только % пользователей
- ✅ Раннее обнаружение проблем

### 3. Rolling Deployment

**ЧТО:** Постепенная замена серверов один за другим

**Процесс:**
\`\`\`
Servers: [v1.0] [v1.0] [v1.0] [v1.0]

Step 1: [v1.1] [v1.0] [v1.0] [v1.0]
Step 2: [v1.1] [v1.1] [v1.0] [v1.0]
Step 3: [v1.1] [v1.1] [v1.1] [v1.0]
Step 4: [v1.1] [v1.1] [v1.1] [v1.1]

Done!
\`\`\`

**Преимущества:**
- ✅ Zero downtime
- ✅ Не требует 2x infrastructure

---

## Health Checks

### Типы Health Checks

#### 1. Liveness Probe

**ЧТО:** Жива ли application?

**Endpoint:** \`GET /health/live\`

**Response:**
\`\`\`json
{
  "status": "UP",
  "timestamp": "2024-03-15T10:30:45Z"
}
\`\`\`

**Когда fails:** Kubernetes перезапускает pod

#### 2. Readiness Probe

**ЧТО:** Готова ли application принимать трафик?

**Endpoint:** \`GET /health/ready\`

**Response:**
\`\`\`json
{
  "status": "UP",
  "checks": {
    "database": "UP",
    "redis": "UP",
    "external-api": "UP"
  }
}
\`\`\`

**Когда fails:** Load balancer убирает из rotation

#### 3. Startup Probe

**ЧТО:** Завершена ли инициализация?

Важно для медленно стартующих приложений (Java, ML models)

### Graceful Shutdown

**ЧТО:** Корректное завершение работы без потери запросов

**Процесс:**
\`\`\`
1. Receive SIGTERM signal
2. Stop accepting new requests
3. Wait for active requests to complete (max 30s)
4. Close database connections
5. Exit

During shutdown:
- New requests → 503 Service Unavailable
- Active requests → complete normally
\`\`\`

**Код:**
\`\`\`typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');

  // Stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Wait for active requests (max 30s)
  await waitForActiveRequests({ timeout: 30000 });

  // Close database
  await database.close();

  process.exit(0);
});
\`\`\`

---

## Disaster Recovery

### Backup Strategy

**3-2-1 Rule:**
- **3** copies of data
- **2** different media types
- **1** offsite backup

**Example:**
\`\`\`
Copy 1: Production database (primary)
Copy 2: Daily backup to S3 (same region)
Copy 3: Weekly backup to S3 (different region)

Retention:
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months
\`\`\`

### RTO and RPO

**RTO (Recovery Time Objective):**
> "Как быстро нужно восстановить систему?"

**RPO (Recovery Point Objective):**
> "Сколько данных можно потерять?"

**Example:**
\`\`\`
E-commerce site:
- RTO: 1 hour (max downtime)
- RPO: 5 minutes (max data loss)

Strategy:
- Database replication: Master → Slave (lag < 5 min)
- If master fails → promote slave to master
- Estimated recovery time: 15 minutes
\`\`\`

### Rollback Strategy

**Требования к rollback:**
\`\`\`
1. Fast: < 5 minutes
2. Automated: One-click rollback
3. Tested: Regular rollback drills
4. Database compatible: No breaking schema changes
\`\`\`

**Database Migrations:**
\`\`\`
✅ Safe migration (можно rollback):
- Add column (nullable)
- Add index

❌ Dangerous migration (сложно rollback):
- Drop column (data loss!)
- Rename column (breaks old code)

Solution: Multi-step migration
Step 1: Add new column (both columns exist)
Step 2: Migrate data
Step 3: Deploy code using new column
Step 4: Drop old column (later)
\`\`\`

---

## Практические сценарии

### Сценарий 1: Настройка Observability для нового сервиса

**Задача:** Запускаем новый payment service

**Решение:**
\`\`\`typescript
// 1. Structured Logging
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

app.post('/payments', async (req, res) => {
  const requestId = generateId();

  logger.info('Payment request received', {
    requestId,
    userId: req.user.id,
    amount: req.body.amount
  });

  try {
    const payment = await processPayment(req.body);

    logger.info('Payment successful', {
      requestId,
      paymentId: payment.id,
      duration: Date.now() - startTime
    });

    return res.json(payment);
  } catch (error) {
    logger.error('Payment failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({ error: 'Payment failed' });
  }
});

// 2. Metrics (Prometheus)
import client from 'prom-client';

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const paymentsTotal = new client.Counter({
  name: 'payments_total',
  help: 'Total number of payments',
  labelNames: ['status']
});

// 3. Health Checks
app.get('/health/live', (req, res) => {
  res.json({ status: 'UP' });
});

app.get('/health/ready', async (req, res) => {
  const dbOk = await checkDatabase();
  const redisOk = await checkRedis();

  if (dbOk && redisOk) {
    return res.json({ status: 'UP', checks: { database: 'UP', redis: 'UP' } });
  }

  return res.status(503).json({ status: 'DOWN' });
});
\`\`\`

### Сценарий 2: Настройка алертинга

**Задача:** Настроить алерты для критичных метрик

**Prometheus Alerts:**
\`\`\`yaml
groups:
  - name: payment_service
    rules:
      # Alert 1: High error rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m])
          /
          rate(http_requests_total[5m])
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # Alert 2: High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency > 500ms"

      # Alert 3: Service down
      - alert: ServiceDown
        expr: up{job="payment-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Payment service is down!"
\`\`\`

### Сценарий 3: Canary Deployment

**Задача:** Раскатить новую версию через canary

**Nginx config:**
\`\`\`nginx
upstream payment_service_v1 {
    server 10.0.1.1:8080 weight=95;
}

upstream payment_service_v2_canary {
    server 10.0.1.2:8080 weight=5;
}

server {
    location /api/payments {
        # 95% to v1, 5% to v2
        proxy_pass http://payment_service_v1;

        # Canary logic
        if ($request_id ~ "^[0-4]") {
            proxy_pass http://payment_service_v2_canary;
        }
    }
}
\`\`\`

**Kubernetes (Argo Rollouts):**
\`\`\`yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service
spec:
  strategy:
    canary:
      steps:
      - setWeight: 5
      - pause: {duration: 1h}
      - setWeight: 25
      - pause: {duration: 1h}
      - setWeight: 50
      - pause: {duration: 1h}
      - setWeight: 100
\`\`\`

### Сценарий 4: Incident Response

**Ситуация:** Пришел алерт "High error rate"

**Runbook:**
\`\`\`markdown
# Runbook: High Error Rate

## Симптомы
- Error rate > 5% for 5 minutes
- Alert fired: HighErrorRate

## Диагностика

### Step 1: Check Dashboard
URL: https://grafana.company.com/payment-service
Look for:
- Spike in error rate
- Which endpoints affected
- Status codes (500, 503, etc.)

### Step 2: Check Logs
\`\`\`bash
kubectl logs -f deployment/payment-service --tail=100 | grep ERROR
\`\`\`

Common errors:
- "Database connection timeout" → Database issue
- "Payment gateway timeout" → External API issue
- "Out of memory" → Memory leak

### Step 3: Check Dependencies
- Database: SELECT 1; (response time < 100ms?)
- Redis: PING (response time < 10ms?)
- Payment gateway: Check status page

## Actions

### If Database Issue:
1. Check connection pool: Are connections exhausted?
2. Check slow queries: Is there a slow query blocking?
3. Scale database if needed

### If External API Issue:
1. Check API status page
2. Enable circuit breaker (temporary)
3. Notify external vendor

### If Memory Leak:
1. Check memory usage: kubectl top pods
2. Restart affected pods
3. Investigate leak (heap dump)

## Escalation
- If can't resolve in 15 min → Page senior engineer
- If revenue impact > $10K → Page engineering director
\`\`\`
\`\`\`

---

## Best Practices

### 1. Observability First

✅ **Что делать:** Добавлять логи, метрики, трейсы с первого дня

> 💡 **Совет:** "You can't fix what you can't see"

### 2. Automate Everything

✅ **Что делать:** CI/CD, automated tests, automated rollback

### 3. Test Failure Scenarios

✅ **Что делать:** Chaos engineering (Netflix Chaos Monkey)

**Примеры тестов:**
- Отключить database → система деградирует gracefully?
- Убить случайный pod → трафик переключается автоматически?
- Перегрузить CPU → алерты срабатывают?

### 4. Документируйте Runbooks

✅ **Что делать:** Runbook для каждого алерта

### 5. Practice Incident Response

✅ **Что делать:** Регулярные fire drills

---

## Заключение

Production-ready система — это не "работает на моей машине", а **работает надежно для миллионов пользователей 24/7**.

### Ключевые моменты

🎯 **Observability**: Логи (что произошло), Метрики (как работает), Трейсы (где тормозит)

🎯 **Monitoring**: Dashboards + Алерты = понимание состояния системы

🎯 **Deployment**: Blue-Green, Canary, Rolling для zero-downtime

🎯 **Reliability**: Health checks, graceful shutdown, disaster recovery

🎯 **Incident Response**: Runbooks, on-call rotation, post-mortems

> 💡 **Помните:** Production-ready — это не одноразовая задача, а continuous process!
`;

async function createProductionReadyLecture() {
  try {
    console.log('🚀 Создание лекции "NFR: Production-ready системы"...\n');

    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'Production-ready' }
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "NFR: Production-ready системы" не найден!');
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    const lecture = await prisma.lecture.create({
      data: {
        title: 'Нефункциональные требования: Production-ready системы',
        topic: 'Требования к ПО',
        content: lectureContent
      }
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    let updatedCount = 0;
    for (const tq of test.questions) {
      await prisma.question.update({
        where: { id: tq.questionId },
        data: { lectureId: lecture.id }
      });
      updatedCount++;
    }

    console.log(`✅ Лекция привязана к ${updatedCount} вопросам\n`);
    console.log('🎉 Готово! Лекция "NFR: Production-ready системы" создана.');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createProductionReadyLecture();
