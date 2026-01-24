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

const lectureContent = `# Архитектурные требования и ограничения

## Введение: Фундамент дома определяет возможности

Представьте строительство дома:
- 🏠 **Деревянный каркас**: Быстро строить, дешево, но максимум 2 этажа
- 🏢 **Железобетон**: Дорого, долго, но можно 50 этажей

**Архитектурный выбор в начале определяет:**
- Сколько этажей можно построить
- Насколько быстро строить
- Сколько это стоит
- Можно ли потом перестроить

> 💡 **Аналогия**: Архитектурные требования — это **фундаментальные решения о структуре системы**, которые определяют, что возможно, а что нет. Изменить архитектуру потом = снести и построить заново.

**Факт**: По данным Martin Fowler, стоимость изменения архитектуры растет экспоненциально: в начале проекта — дни, через год — месяцы, через 3 года — невозможно без полного переписывания.

В этой лекции вы узнаете:
- ✅ Что такое архитектурные требования
- ✅ Типы архитектурных ограничений
- ✅ Выбор технологического стека
- ✅ Архитектурные паттерны (Monolith, Microservices, Serverless)
- ✅ Технический долг (Technical Debt)
- ✅ Trade-offs и архитектурные решения

---

## Что такое архитектурные требования?

### Определение

> "Архитектурные требования (Architectural Requirements) — требования, определяющие **структуру и фундаментальные технические решения** системы: платформа, технологии, паттерны, ограничения"

### Отличие от функциональных требований

| Критерий | Функциональные | Архитектурные |
|----------|----------------|---------------|
| **ЧТО** | Что система делает | Как система устроена |
| **Примеры** | "Пользователь может войти" | "Используем микросервисы" |
| **Изменить** | Относительно легко | Очень дорого |
| **Видимость** | Видно пользователю | Скрыто от пользователя |
| **Влияние** | На функциональность | На всю систему |

### Типы архитектурных требований

**1. Platform Requirements (Платформа)**
\`\`\`
- Web, Mobile (iOS, Android), Desktop
- Cloud provider (AWS, Azure, GCP)
- Operating system
\`\`\`

**2. Technology Stack**
\`\`\`
- Programming language (Node.js, Python, Java)
- Framework (React, Vue, Angular)
- Database (PostgreSQL, MongoDB, Redis)
\`\`\`

**3. Architectural Style**
\`\`\`
- Monolith vs Microservices
- REST vs GraphQL vs gRPC
- Event-driven vs Request-Response
\`\`\`

**4. Integration Constraints**
\`\`\`
- Must integrate with legacy system X
- Must use corporate SSO
- Cannot use external APIs
\`\`\`

---

## Архитектурные ограничения (Constraints)

### Определение

> "Архитектурное ограничение — **жесткое правило**, которое система ОБЯЗАНА соблюдать, без возможности выбора"

### Типы ограничений

#### 1. Technical Constraints (Технические)

**Примеры:**
\`\`\`
❌ "Нельзя использовать cloud (данные должны быть on-premise)"
❌ "Обязательно использовать Java (корпоративный стандарт)"
❌ "Должно работать в IE 11 (legacy users)"
❌ "Максимум 100MB RAM (embedded device)"
\`\`\`

**Почему возникают:**
- Корпоративные политики
- Регуляторные требования (compliance)
- Legacy инфраструктура
- Бюджетные ограничения

**Пример:**
\`\`\`
Constraint: "Система должна работать на серверах Windows Server 2012"

Impact:
- ❌ Нельзя использовать Docker (не поддерживается хорошо на Windows 2012)
- ❌ Некоторые open-source библиотеки не работают на Windows
- ⚠️ Усложняет deployment
\`\`\`

#### 2. Business Constraints (Бизнес-ограничения)

**Примеры:**
\`\`\`
❌ "Бюджет на инфраструктуру: $1,000/месяц"
❌ "Релиз через 3 месяца (фиксированная дата)"
❌ "Команда: 2 разработчика (не можем нанять больше)"
❌ "Данные нельзя хранить за пределами России (152-ФЗ)"
\`\`\`

#### 3. Organizational Constraints (Организационные)

**Примеры:**
\`\`\`
❌ "Используем только Microsoft технологии (контракт)"
❌ "Deployment только по пятницам (policy)"
❌ "Обязательно code review (process)"
\`\`\`

### Как работать с ограничениями?

**1. Identify (Выявить)**
\`\`\`
Интервью со stakeholders:
- Какие технологии запрещены?
- Какие обязательны?
- Какие бюджетные лимиты?
- Какие регуляторные требования?
\`\`\`

**2. Document (Документировать)**
\`\`\`
Architectural Constraints Document:

C-1: MUST use PostgreSQL (enterprise license available)
C-2: MUST NOT use public cloud (data residency law)
C-3: MUST integrate with Active Directory (corporate SSO)
C-4: MUST support IE 11 (20% users still use)
\`\`\`

**3. Validate (Проверить осуществимость)**
\`\`\`
Constraint: "MUST support 10,000 concurrent users"
Budget: "$500/month"

Analysis:
- AWS EC2 t3.large: $60/month (supports ~500 users)
- Need 20 instances: $1,200/month

Conflict: Constraint impossible with budget
Action: Negotiate with stakeholder (increase budget OR reduce users)
\`\`\`

---

## Выбор технологического стека

### Критерии выбора

**1. Team Expertise (Экспертиза команды)**
\`\`\`
Вопросы:
- Какие технологии команда знает?
- Сколько времени на обучение?
- Есть ли senior разработчики?

Example:
Team knows: JavaScript, React, Node.js
Option A: Continue with Node.js (fast start)
Option B: Switch to Go (3 months learning curve)

Decision: Option A (if time constraint exists)
\`\`\`

**2. Ecosystem (Экосистема)**
\`\`\`
- Наличие библиотек
- Community support
- Документация
- Third-party integrations

Example:
Need: Payment processing, Email sending, PDF generation

Node.js ecosystem:
✅ Stripe SDK (excellent)
✅ SendGrid SDK (excellent)
✅ PDFKit (good)

Go ecosystem:
✅ Stripe SDK (good)
⚠️ SendGrid (basic)
⚠️ PDF generation (limited options)

Winner: Node.js (better ecosystem for requirements)
\`\`\`

**3. Performance (Производительность)**
\`\`\`
Requirement: Handle 100,000 RPS

Benchmark (requests per second):
- Node.js: ~20,000 RPS (single instance)
- Go: ~50,000 RPS
- Rust: ~100,000 RPS

Analysis:
- Node.js: Need 5 instances
- Go: Need 2 instances
- Rust: Need 1 instance (but team doesn't know Rust)

Decision: Go (balance of performance + feasible learning curve)
\`\`\`

**4. Scalability (Масштабируемость)**
\`\`\`
Requirement: Scale from 100 to 1,000,000 users

Options:
A. Monolith + Vertical scaling
   - Simple
   - Limit: ~10,000 users per server

B. Microservices + Horizontal scaling
   - Complex
   - Unlimited scaling

Decision: Start with A (current: 100 users), migrate to B when > 10,000
\`\`\`

**5. Cost (Стоимость)**
\`\`\`
Total Cost of Ownership (TCO):

Option A: Managed service (AWS RDS)
- Easy setup
- Auto backups, monitoring
- Cost: $200/month

Option B: Self-hosted (EC2 + PostgreSQL)
- Manual setup and maintenance
- Cost: $50/month + 20 hours/month maintenance ($1000 eng time)
- Total: $1,050/month

Winner: Option A (cheaper TCO)
\`\`\`

### Decision Matrix

**Пример: Выбор базы данных**

| Критерий | PostgreSQL | MongoDB | DynamoDB |
|----------|------------|---------|----------|
| Team expertise | ✅ High | ⚠️ Medium | ❌ Low |
| ACID transactions | ✅ Yes | ⚠️ Limited | ❌ No |
| Scalability | ⚠️ Vertical | ✅ Horizontal | ✅ Unlimited |
| Cost (1M reads/month) | $50 | $80 | $25 |
| Query flexibility | ✅ SQL | ✅ Flexible | ❌ Limited |
| Ecosystem | ✅ Excellent | ✅ Good | ⚠️ AWS only |
| **Score** | **8/10** | **7/10** | **5/10** |

**Decision:** PostgreSQL (best fit for requirements)

---

## Архитектурные паттерны

### 1. Monolith (Монолит)

**ЧТО:** Одно приложение, все функции в одном codebase

**Структура:**
\`\`\`
┌─────────────────────────────┐
│      Monolith Application   │
│                             │
│  ┌────────┐  ┌────────┐    │
│  │ Auth   │  │ Orders │    │
│  └────────┘  └────────┘    │
│  ┌────────┐  ┌────────┐    │
│  │ Users  │  │ Payment│    │
│  └────────┘  └────────┘    │
│                             │
└──────────┬──────────────────┘
           │
    ┌──────▼──────┐
    │  Database   │
    └─────────────┘
\`\`\`

**Преимущества:**
- ✅ Простота разработки
- ✅ Простота deployment (один артефакт)
- ✅ Легко тестировать
- ✅ Нет сетевой латентности между модулями

**Недостатки:**
- ❌ Сложно масштабировать (только вертикально)
- ❌ Один bug → вся система падает
- ❌ Длительный CI/CD (большой codebase)
- ❌ Сложно обновлять технологии

**Когда использовать:**
- Маленькая команда (< 10 человек)
- MVP / Startup
- Простое приложение
- < 10,000 пользователей

### 2. Microservices (Микросервисы)

**ЧТО:** Множество независимых сервисов, каждый со своей БД

**Структура:**
\`\`\`
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Auth    │  │  Orders  │  │ Payment  │
│  Service │  │  Service │  │ Service  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
 ┌───▼───┐    ┌───▼───┐    ┌───▼───┐
 │ Auth  │    │Orders │    │Payment│
 │  DB   │    │  DB   │    │  DB   │
 └───────┘    └───────┘    └───────┘
\`\`\`

**Преимущества:**
- ✅ Независимый deployment
- ✅ Технологическая гибкость (каждый сервис = свой стек)
- ✅ Горизонтальное масштабирование
- ✅ Fault isolation (один упал → другие работают)

**Недостатки:**
- ❌ Сложность (distributed system)
- ❌ Сетевая латентность
- ❌ Сложность тестирования
- ❌ Data consistency challenges

**Когда использовать:**
- Большая команда (> 20 человек)
- Сложный домен
- Высокие требования к масштабированию
- > 100,000 пользователей

### 3. Serverless (Бессерверная архитектура)

**ЧТО:** Функции, запускаемые по событиям (AWS Lambda, Azure Functions)

**Структура:**
\`\`\`
API Gateway
    │
    ├─> Lambda: Auth
    ├─> Lambda: CreateOrder
    ├─> Lambda: ProcessPayment
    └─> Lambda: SendEmail
         │
    ┌────▼────┐
    │ DynamoDB│
    └─────────┘
\`\`\`

**Преимущества:**
- ✅ Auto-scaling (от 0 до миллионов)
- ✅ Pay-per-use (платишь за выполнение)
- ✅ Не нужно управлять серверами
- ✅ Быстрая разработка

**Недостатки:**
- ❌ Cold start (первый запуск ~1s)
- ❌ Vendor lock-in (AWS)
- ❌ Сложность debugging
- ❌ Ограничения (timeout 15 min, memory 10GB)

**Когда использовать:**
- Event-driven приложения
- Непредсказуемая нагрузка
- Microservices на steroids
- Быстрые прототипы

---

## Технический долг (Technical Debt)

### Определение

> "Технический долг (Technical Debt) — последствия быстрых решений, которые **упрощают сейчас**, но **усложняют в будущем**"

**Аналогия с финансовым долгом:**
\`\`\`
Взять кредит:
- Сейчас: Быстро получить деньги
- Потом: Платить проценты

Технический долг:
- Сейчас: Быстро выпустить фичу (копипаста, грязный код)
- Потом: Замедление разработки, баги
\`\`\`

### Типы технического долга

#### 1. Deliberate (Осознанный)

**ЧТО:** Сознательное решение для скорости

**Пример:**
\`\`\`
Decision: "Используем монолит вместо микросервисов (быстрее запустить MVP)"

Trade-off:
- Gain: Запуск через 3 месяца (вместо 6)
- Cost: Через год нужно будет рефакторить в микросервисы (+3 месяца)

Rationale: Скорость выхода на рынок критична для стартапа
\`\`\`

#### 2. Inadvertent (Непреднамеренный)

**ЧТО:** Ошибки из-за недостатка знаний

**Пример:**
\`\`\`
Mistake: Не использовали индексы в БД (не знали о performance)

Cost:
- Сейчас: Все работает (100 пользователей)
- Через год: Система тормозит (10,000 пользователей)
- Fix: 2 недели на добавление индексов + миграция
\`\`\`

### Управление техническим долгом

**1. Track (Отслеживать)**
\`\`\`
Tech Debt Register:

TD-1: Monolith architecture
  Priority: High
  Impact: Blocks scaling > 10K users
  Effort: 3 months
  Status: Planned for Q3

TD-2: No unit tests for PaymentService
  Priority: Medium
  Impact: Risk of bugs in payments
  Effort: 2 weeks
  Status: Backlog
\`\`\`

**2. Measure (Измерять)**
\`\`\`
Metrics:
- Code coverage: 40% (target: 80%)
- Code duplication: 15% (target: < 5%)
- Cyclomatic complexity: 25 (target: < 10)
\`\`\`

**3. Pay Down (Погашать)**
\`\`\`
Rule: 20% времени спринта на tech debt

Sprint Planning:
- 80% new features
- 20% tech debt (refactoring, tests, documentation)
\`\`\`

---

## Trade-offs (Компромиссы)

### Определение

> "Trade-off — ситуация, когда улучшение одного параметра **ухудшает другой**"

### Классические trade-offs

**1. Performance vs Maintainability**
\`\`\`
Option A: Highly optimized code (C++, manual memory management)
  Performance: ✅ Excellent
  Maintainability: ❌ Difficult

Option B: Clean, simple code (Python, auto GC)
  Performance: ⚠️ Good enough
  Maintainability: ✅ Excellent

Decision depends on: Is performance critical?
\`\`\`

**2. Speed vs Quality**
\`\`\`
Option A: Ship fast (3 months, minimal testing)
  Speed: ✅ Fast to market
  Quality: ⚠️ Bugs likely

Option B: Ship carefully (6 months, full testing)
  Speed: ❌ Slow
  Quality: ✅ Stable

Decision depends on: Is speed or quality more important?
\`\`\`

**3. Flexibility vs Simplicity**
\`\`\`
Option A: Highly configurable (supports all use cases)
  Flexibility: ✅ Handles edge cases
  Simplicity: ❌ Complex UI

Option B: Opinionated (80% use cases, simple)
  Flexibility: ⚠️ Doesn't handle edge cases
  Simplicity: ✅ Easy to use

Decision: 37signals philosophy - "Do less, but do it well"
\`\`\`

---

## Практические сценарии

### Сценарий 1: Выбор монолит vs микросервисы

**Контекст:** Стартап, новый продукт, команда 5 человек

**Анализ:**
\`\`\`
Requirements:
- Users: 1,000 (сейчас), 100,000 (через 2 года)
- Team: 5 engineers
- Time to market: 3 months (critical)
- Budget: Limited

Options:

A. Monolith
   Pros:
   ✅ Fast development (3 months)
   ✅ Simple deployment
   ✅ Team can handle

   Cons:
   ❌ Scaling limited (but 1K users OK)
   ❌ Need refactor later

B. Microservices
   Pros:
   ✅ Future-proof (scales to 100K+)

   Cons:
   ❌ Slow development (6+ months)
   ❌ Complex for small team
   ❌ Over-engineering

Decision: A (Monolith)

Rationale:
- Speed to market critical for startup
- 1,000 users → monolith sufficient
- Can refactor to microservices at 10,000+ users
- YAGNI principle (You Aren't Gonna Need It)
\`\`\`

### Сценарий 2: Платформа ограничения (Legacy system)

**Контекст:** Enterprise, нужно интегрироваться с legacy system (Java 6, SOAP)

**Constraint:**
\`\`\`
"MUST integrate with legacy CRM system"
- Technology: Java 6, SOAP API
- Cannot modify legacy system
- Data sync required in real-time
\`\`\`

**Solution:**
\`\`\`
Architecture: Anti-Corruption Layer

┌─────────────┐
│  New System │
│  (Node.js)  │
└──────┬──────┘
       │ REST
┌──────▼──────────────┐
│  Integration Layer  │ ← Anti-Corruption Layer
│  (Java 11)          │
└──────┬──────────────┘
       │ SOAP
┌──────▼──────┐
│Legacy CRM   │
│(Java 6)     │
└─────────────┘

Benefits:
- New system uses modern tech (Node.js)
- Integration layer handles legacy protocol (SOAP)
- Legacy constraint isolated
\`\`\`

---

## Best Practices

### 1. Document Architectural Decisions (ADR)

✅ **Что делать:** Записывать важные решения

**Template:**
\`\`\`markdown
# ADR-001: Use PostgreSQL for database

## Status
Accepted

## Context
Need to choose database for new project.
Requirements: ACID, complex queries, < $100/month

## Decision
Use PostgreSQL

## Consequences
Pros:
- Strong ACID guarantees
- Excellent SQL support
- Team expertise

Cons:
- Vertical scaling only
- More complex than NoSQL

## Alternatives Considered
- MongoDB: Rejected (no ACID)
- DynamoDB: Rejected (expensive, vendor lock-in)
\`\`\`

### 2. Start Simple, Evolve

✅ **Что делать:** Начинать с простого, усложнять по необходимости

### 3. Measure Technical Debt

✅ **Что делать:** Отслеживать метрики качества кода

### 4. Regular Architecture Reviews

✅ **Что делать:** Ежеквартальный обзор архитектуры

---

## Заключение

Архитектурные требования — это **фундамент системы**. Правильный выбор в начале определяет успех на годы вперед.

### Ключевые моменты

🎯 **Constraints**: Жесткие ограничения, которые нужно соблюдать

🎯 **Technology Stack**: Выбор на основе team expertise, ecosystem, performance, cost

🎯 **Patterns**: Monolith для старта, Microservices для scale, Serverless для events

🎯 **Technical Debt**: Отслеживать и погашать (20% времени)

🎯 **Trade-offs**: Нет идеальной архитектуры, всегда есть компромиссы

> 💡 **Помните:** "Architecture is about the important stuff, whatever that is" — Martin Fowler
`;

async function createArchitecturalRequirementsLecture() {
  try {
    console.log('🚀 Создание лекции "Архитектурные требования и ограничения"...\n');

    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'Архитектурные требования' }
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "Архитектурные требования и ограничения" не найден!');
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    const lecture = await prisma.lecture.create({
      data: {
        title: 'Архитектурные требования и ограничения',
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
    console.log('🎉 Готово! Лекция "Архитектурные требования и ограничения" создана.');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createArchitecturalRequirementsLecture();
