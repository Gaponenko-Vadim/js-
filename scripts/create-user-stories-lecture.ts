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

const lectureContent = `# User Stories: Написание пользовательских историй

## Введение: История разработки через диалог

Представьте, что вы планируете семейный отпуск. Вы НЕ пишете 50-страничный документ с детальным расписанием каждой минуты. Вместо этого вы говорите: "Хочу отдохнуть на море, чтобы восстановить силы". Детали — когда лететь, какой отель, что брать — обсуждаются позже, по мере необходимости.

**User Stories** работают точно так же. Это краткие карточки желаний пользователя, которые запускают разговор между командой и Product Owner'ом. Не подробная спецификация, а приглашение к беседе.

> 💡 **Главное**: User Story — это обещание будущего разговора (promise of a conversation), а не законченный контракт.

В отличие от традиционных требований (Use Cases), User Stories фокусируются на **ЦЕННОСТИ** для пользователя, а не на технической реализации.

---

## Базовые концепции

### Что такое User Story?

**User Story** — краткое описание функциональности с точки зрения пользователя.

Стандартный формат:
\`\`\`
As a [Role]
I want [Feature/Goal]
So that [Benefit/Value]
\`\`\`

### Компоненты User Story

| Компонент | Описание | Пример |
|-----------|----------|--------|
| **Role** | Кто нуждается в функции | Customer, Admin, Guest User |
| **Goal** | Что хочет сделать пользователь | save items to wishlist |
| **Benefit** | Зачем, какая ценность | purchase them later conveniently |

### User Story vs Use Case vs Task

| Аспект | User Story | Use Case | Task |
|--------|------------|----------|------|
| **Уровень** | Высокий (бизнес-ценность) | Детальный (шаги) | Технический (реализация) |
| **Формат** | As-Want-SoThat | Structured document | Technical work item |
| **Объем** | 1-5 предложений | 2-10 страниц | Конкретная работа |
| **Детализация** | Минимум (детали в разговоре) | Максимум (все шаги) | Специфичная задача |
| **Методология** | Agile, Scrum | Waterfall, RUP | Agile (декомпозиция Story) |

---

## Формат User Story: As-Want-SoThat

### Анатомия User Story

\`\`\`
As a CUSTOMER
I want to SAVE ITEMS TO A WISHLIST
So that I can PURCHASE THEM LATER when I have budget
\`\`\`

### Почему именно этот формат?

**As a [Role]** — фокусирует на **КТО** нуждается в функции:
- Помогает понять контекст и permissions
- Разные роли → разные потребности
- Можно создавать Personas для ролей

**I want [Goal]** — описывает **ЧТО** хочет пользователь:
- Описывает action или capability
- НЕ технические детали (не "хочу REST endpoint")
- User-facing функциональность

**So that [Benefit]** — объясняет **ЗАЧЕМ** это нужно:
- ⚠️ **Самая важная часть!** Объясняет ценность
- Помогает приоритизации (высокая ценность = высокий приоритет)
- Позволяет искать альтернативные решения

### Примеры хороших User Stories

✅ **Хорошо**:
\`\`\`
As a shopper
I want to filter products by price range
So that I can find items within my budget quickly
\`\`\`

✅ **Хорошо**:
\`\`\`
As a content creator
I want to schedule posts for future publication
So that I can maintain consistent posting without manual work
\`\`\`

### Примеры плохих User Stories

❌ **Плохо** (нет benefit):
\`\`\`
As a user
I want a login button
\`\`\`
**Проблема**: Зачем? Не понятна ценность.

❌ **Плохо** (технические детали вместо пользовательской ценности):
\`\`\`
As a developer
I want to implement OAuth2 with JWT tokens
So that authentication is secure
\`\`\`
**Проблема**: Это Technical Task, не User Story. Правильная story: "As a user, I want to login with Google, so that I don't need to remember another password".

❌ **Плохо** (слишком широко):
\`\`\`
As a user
I want a great user experience
So that I enjoy using the app
\`\`\`
**Проблема**: Слишком расплывчато, нельзя оценить и реализовать.

---

## INVEST критерии качества User Story

**INVEST** (Bill Wake) — акроним для оценки качества User Story.

### I — Independent (Независимая)

Story не должна зависеть от других stories.

✅ **Правильно**:
- Story A: "Add item to cart"
- Story B: "Remove item from cart"
(Можно реализовать в любом порядке)

❌ **Неправильно**:
- Story A: "Create database table for users"
- Story B: "Implement user registration"
(B зависит от A — нарушение независимости)

**Как исправить**: Объединить зависимые stories или изменить разбиение на Vertical Slices.

### N — Negotiable (Обсуждаемая)

Story — это приглашение к диалогу, а НЕ жесткий контракт.

✅ **Правильно**: "As user, I want search functionality, so I can find products quickly"
- Детали обсуждаемы: autocomplete? filters? sorting?

❌ **Неправильно**: Детальная спецификация на 5 страниц, где все уже решено.

### V — Valuable (Ценная)

Story должна приносить ценность пользователю или бизнесу.

✅ **Ценная**: "As customer, I want to track my order, so I know when to expect delivery"

❌ **Не ценная**: "As developer, I want to refactor user service" (техническая задача, не user-facing value)

> 💡 Technical Debt items могут быть исключением, но их нужно минимизировать.

### E — Estimable (Оцениваемая)

Команда может оценить effort (Story Points или время).

✅ **Оцениваемая**: Команда понимает что делать, может оценить.

❌ **Неоцениваемая**: Слишком неопределенная ("Research новой технологии") → Нужен **Spike**.

### S — Small (Маленькая)

Story помещается в один спринт (обычно 1-2 недели).

✅ **Маленькая**: 1-5 Story Points, можно завершить за спринт.

❌ **Большая**: Epic ("Complete checkout experience") → Нужно разбить на smaller stories.

### T — Testable (Тестируемая)

Есть четкие критерии для проверки выполнения.

✅ **Тестируемая**: Есть Acceptance Criteria:
\`\`\`
Given user is on product page
When user clicks "Add to Cart"
Then item appears in cart with quantity 1
\`\`\`

❌ **Нетестируемая**: "Improve UX" (как проверить?)

---

## Acceptance Criteria: Определение "Готово"

### Что такое Acceptance Criteria (AC)?

**Acceptance Criteria** — конкретные, проверяемые условия, при которых User Story считается завершенной.

> AC отвечают на вопрос: "Как я узнаю, что это сделано?"

### Формат: Given-When-Then (Gherkin)

Структура из BDD (Behavior-Driven Development):

\`\`\`gherkin
Given [начальное состояние/контекст]
When [действие/событие]
Then [ожидаемый результат]
\`\`\`

### Примеры Acceptance Criteria

**User Story**: "As shopper, I want to add product to cart, so I can purchase it later"

**Acceptance Criteria**:
\`\`\`gherkin
AC1: Успешное добавление
Given user is on product details page
When user clicks "Add to Cart" button
Then product appears in shopping cart with quantity 1
And cart icon shows updated item count
And success message is displayed

AC2: Увеличение quantity
Given product already in cart
When user adds same product again
Then quantity increases by 1
And price is updated accordingly

AC3: Out of stock
Given product is out of stock
When user tries to add to cart
Then "Out of Stock" message is shown
And product is not added to cart
\`\`\`

### AC vs Definition of Done

| Aspect | Acceptance Criteria | Definition of Done |
|--------|--------------------|--------------------|
| **Scope** | Специфичны для каждой Story | Общие для ВСЕХ stories |
| **Кто пишет** | Product Owner + Team | Команда |
| **Что** | Функциональные требования | Качественные стандарты |
| **Пример** | "Cart shows item count" | "Code reviewed, tests passed, deployed" |

---

## Иерархия: Epic → User Story → Task

### Theme → Epic → User Story → Task

\`\`\`
Theme: E-commerce Platform
  └─ Epic: Shopping Experience
      ├─ User Story: Browse Products
      │   ├─ Task: Create product catalog API
      │   ├─ Task: Design product grid UI
      │   └─ Task: Implement search functionality
      ├─ User Story: Add to Cart
      └─ User Story: Checkout
\`\`\`

### Epic — Большая User Story

**Epic** — User Story, которая слишком велика для одного спринта (обычно >1 спринта работы).

**Пример Epic**: "As customer, I want complete checkout experience"

**Разбивается на Stories**:
1. "Review cart items"
2. "Enter shipping address"
3. "Select payment method"
4. "Apply discount code"
5. "Confirm and place order"

**Когда использовать Epic**:
- Roadmap planning (высокий уровень)
- Группировка связанных stories
- Tracking прогресса большой функциональности

### Task — Техническая декомпозиция Story

**Task** — конкретная техническая работа для реализации Story.

**User Story**: "As user, I want to reset password"

**Tasks** (создаются командой):
1. Create "Forgot Password" API endpoint
2. Design email template
3. Implement email sending service
4. Create UI form
5. Write unit tests
6. Update documentation

**Отличия Task от Story**:
- Task — technical, Story — user-facing
- Task estimated в hours, Story — в Story Points
- Task не видны stakeholders

---

## Story Points и Planning Poker

### Story Points — Относительная оценка

**Story Points** — относительная единица измерения сложности/effort Story.

Учитывают:
- Complexity (сложность логики)
- Amount of work (объем)
- Uncertainty (неопределенность)
- Risk (риски)

### Шкала Фибоначчи

Обычно используется: **1, 2, 3, 5, 8, 13, 21**

| Points | Описание | Пример |
|--------|----------|--------|
| **1** | Тривиально | Изменить текст на кнопке |
| **2** | Очень просто | Добавить validation на поле |
| **3** | Просто | Создать простую форму |
| **5** | Средняя сложность | CRUD для нового entity |
| **8** | Сложно | Интеграция с third-party API |
| **13** | Очень сложно | Complex reporting feature |
| **21** | Слишком большая | → Разбить на smaller stories |

> ⚠️ Story > 13 points обычно признак что нужен split.

### Planning Poker — Техника оценки

**Процесс**:
1. Product Owner читает User Story
2. Команда обсуждает, задает вопросы
3. Каждый втайне выбирает карту с оценкой (1,2,3,5,8,13,21)
4. Все одновременно показывают карты
5. Обсуждаются крайние оценки (min и max)
6. Повторять пока не достигнут консенсус

**Преимущества**:
- Учитывает мнения всех членов команды
- Предотвращает anchoring bias (влияние первого мнения)
- Стимулирует обсуждение неопределенностей
- Вовлекает всю команду

### Velocity — Скорость команды

**Velocity** = сумма Story Points завершенных stories за спринт.

**Пример**:
- Sprint 1: 23 points completed
- Sprint 2: 27 points completed
- Sprint 3: 25 points completed
- **Average Velocity**: ~25 points/sprint

Используется для **capacity planning** следующих спринтов.

---

## Definition of Done (DoD) и Definition of Ready (DoR)

### Definition of Done — Стандарты готовности

**DoD** — набор общих критериев качества для КАЖДОЙ Story.

**Пример DoD**:
- ✅ Code написан и соответствует coding standards
- ✅ Unit tests написаны (>80% coverage)
- ✅ Integration tests passed
- ✅ Code review пройден (минимум 1 reviewer)
- ✅ Documentation обновлена
- ✅ Deployed to staging environment
- ✅ QA testing passed
- ✅ Product Owner принял Story
- ✅ No critical bugs

> 💡 DoD применяется ко ВСЕМ stories. Acceptance Criteria специфичны для каждой story.

### Definition of Ready — Готовность к разработке

**DoR** — checklist готовности Story к включению в спринт.

**Пример DoR**:
- ✅ Story имеет четкое описание в формате As-Want-SoThat
- ✅ Acceptance Criteria определены (Given-When-Then)
- ✅ Dependencies identified и resolved
- ✅ Story estimable (команда может оценить)
- ✅ Story size <= спринт capacity (не Epic)
- ✅ UI mockups готовы (если применимо)
- ✅ Stakeholders доступны для вопросов
- ✅ Нет блокеров

**Зачем нужен DoR**:
- Предотвращает неготовые stories в спринте
- Снижает блокеры во время разработки
- Уменьшает uncertainty и waste

---

## Vertical Slice vs Horizontal Slice

### Vertical Slice — End-to-End ценность

**Vertical Slice** проходит через все слои архитектуры:

\`\`\`
Frontend (UI)
    ↓
Backend (API, Business Logic)
    ↓
Database (Data Layer)
\`\`\`

✅ **Пример Vertical Slice**:
"As user, I want to add item to cart"
- UI: "Add to Cart" button
- API: POST /cart/items endpoint
- Business Logic: Validate stock, calculate price
- Database: Insert into cart_items table

**Преимущества**:
- Доставляет работающую end-to-end функцию
- Можно демонстрировать stakeholders
- Можно тестировать integration
- Earlier feedback

### Horizontal Slice — Один слой (❌ Антипаттерн в Agile)

❌ **Пример Horizontal Slice**:
- Story 1: "Create all database tables"
- Story 2: "Build all API endpoints"
- Story 3: "Build all UI screens"

**Проблемы**:
- Ничего не работает end-to-end до завершения всех stories
- Нельзя демонстрировать ценность
- Высокий integration risk
- Поздний feedback

> 🎯 **Best Practice**: Всегда делайте Vertical Slices в Agile.

---

## Spike — Исследовательская работа

### Что такое Spike?

**Spike** — time-boxed исследование для снижения неопределенности.

НЕ доставляет production код, а дает:
- Знания
- POC (Proof of Concept)
- Recommendation

### Типы Spike

**1. Technical Spike** — исследование технологии:
\`\`\`
Spike: Research GraphQL vs REST for API
Time-box: 3 days
Outcome: Recommendation document with pros/cons
\`\`\`

**2. Functional Spike** — исследование требований:
\`\`\`
Spike: Research third-party payment gateways
Time-box: 2 days
Outcome: Comparison of Stripe, PayPal, Square
\`\`\`

### Когда нужен Spike?

- ✅ User Story неоцениваема из-за неопределенности
- ✅ Нужно сравнить несколько технологий
- ✅ Исследовать feasibility решения
- ✅ Изучить новый domain

**После Spike**: Story становится estimable и можно планировать реализацию.

---

## Three Cs: Card, Conversation, Confirmation

**Three Cs** (Ron Jeffries) — сущность User Story.

### 1. Card — Карточка

Story записана на карточке/тикете.

- **Краткая** (не полная спецификация)
- **Placeholder** для беседы
- Достаточно информации чтобы запомнить и приоритизировать

### 2. Conversation — Разговор

Детали обсуждаются между PO и командой **face-to-face**.

- НЕ все заранее документировано (в отличие от Waterfall)
- Ongoing dialogue во время разработки
- Уточнения, вопросы, корректировки

### 3. Confirmation — Подтверждение

Acceptance Criteria подтверждают понимание.

- Служат для тестирования
- Checklist завершенности
- Соглашение что именно будет сделано

> 💡 **Главная идея**: User Story ≠ requirements document, это **promise of conversation**.

---

## Story Splitting — Разбиение больших Stories

### Когда нужно разбивать?

- Story > 13 Story Points
- Story не влезает в спринт
- Story нарушает INVEST (слишком большая)

### Story Splitting Patterns

**1. Workflow Steps**

Epic: "Search products"
→ Split:
- "Basic keyword search"
- "Filter results by category"
- "Sort results by price"
- "Advanced filters (brand, rating)"

**2. Business Rule Variations**

Epic: "Apply discount"
→ Split:
- "10% discount for new customers"
- "15% discount for loyalty members"
- "Special promo code discounts"

**3. CRUD Operations**

Epic: "Manage users"
→ Split:
- "Create user"
- "View user profile"
- "Edit user details"
- "Delete user"

**4. Data Variations**

Epic: "Support payment methods"
→ Split:
- "Credit card payment"
- "PayPal payment"
- "Apple Pay"

**5. Simple/Complex versions**

Epic: "Product search"
→ Split:
- "Simple text search" (MVP)
- "Autocomplete suggestions" (enhancement)
- "Fuzzy matching" (advanced)

### Антипаттерн: Horizontal Split

❌ **Неправильно**:
- Story 1: "Build frontend for feature X"
- Story 2: "Build backend for feature X"
- Story 3: "Build database for feature X"

✅ **Правильно**: Каждая story — vertical slice через все слои.

---

## Technical Debt — Технический долг

### Что такое Technical Debt?

Метафора: **shortcuts в коде**, отложенный рефакторинг.

**Примеры**:
- Quick & dirty решение вместо правильного
- Отсутствие unit tests
- Hardcoded values вместо configuration
- Устаревшие зависимости
- Дублирование кода

### Накопление Technical Debt

**Причины**:
- Time pressure ("Нужно выпустить завтра!")
- Недостаток знаний
- Меняющиеся требования
- Отложенный рефакторинг

**Последствия**:
- Замедление разработки
- Больше багов
- Сложность изменений
- Снижение морали команды

### Управление Technical Debt

**1. Выделять capacity на Technical Debt**:
- 10-20% спринта на Tech Debt stories
- Примеры: "Refactor user service", "Add unit tests to checkout module"

**2. Tracking**:
- Tech Debt backlog
- Регулярный review
- Оценка impact и effort

**3. Балансировать**:
- Feature development vs Tech Debt
- Не копить до критической массы

> 💡 Martin Fowler: "Ship first time code, then refactor".

---

## Product Backlog и Sprint Backlog

### Product Backlog — Источник работы

**Product Backlog** — приоритизированный список всех User Stories, требований, улучшений, багфиксов.

**Характеристики**:
- **Prioritized**: Top = most valuable/urgent
- **Dynamic**: Постоянно evolving
- **Emergent**: Детали добавляются со временем
- **Owned by Product Owner**

**Содержит**:
- User Stories
- Epics
- Bugs
- Technical Debt items
- Spikes
- Improvements

**Product Backlog Refinement** (Grooming):
- Регулярная активность (обычно mid-sprint)
- Уточнение stories
- Splitting больших stories
- Re-prioritization
- Estimation

**Структура**:
- **Top items**: детализированы, ready для спринта
- **Middle items**: частично детализированы
- **Bottom items**: грубые (Epics, ideas)

### Sprint Backlog — План спринта

**Sprint Backlog** = Selected Stories + Tasks + Sprint Goal

**Формируется на Sprint Planning**:
1. Команда выбирает top stories из Product Backlog
2. Stories которые можно завершить за спринт (based on Velocity)
3. Decomposition stories на Tasks

**Owned by Development Team** (не PO).

**Можно изменять**:
- ✅ Добавлять tasks
- ✅ Уточнять детали
- ❌ Добавлять новые stories без agreement

**Visualization**:
- Sprint Taskboard: To Do → In Progress → Done
- Burndown Chart

---

## Приоритизация User Stories: MoSCoW

### MoSCoW Method

Техника категоризации stories по важности.

**M — Must have (Критично)**:
- Без этого release невозможен
- Legal/regulatory requirements
- Core функциональность

**Пример**: "As user, I want to login, so I can access my account"

**S — Should have (Важно)**:
- Важно, но есть workaround
- Можно отложить на следующий release если нужно

**Пример**: "As user, I want to reset password, so I can recover access"

**C — Could have (Желательно)**:
- Nice to have
- Если будет время и resources

**Пример**: "As user, I want dark mode, so app is comfortable at night"

**W — Won't have this time (Отложено)**:
- Точно не в этом release
- Maybe в будущем

**Пример**: "As user, I want multi-language support"

### Применение на Sprint Planning

1. Выбираем все **Must have** stories
2. Максимум **Should have** (capacity позволяет)
3. Если capacity остается → **Could have**
4. **Won't have** откладываем

**Преимущества**:
- Фокус на главном
- Управление scope
- Объяснение stakeholders

### Альтернативы MoSCoW

- **Kano Model**: классификация по customer satisfaction
- **Value vs Effort Matrix**: 2x2 матрица приоритизации
- **WSJF** (Weighted Shortest Job First): Cost of Delay / Duration

---

## Story Mapping — Визуализация User Journey

### Что такое Story Mapping?

**Story Mapping** (Jeff Patton) — 2D карта организации User Stories.

**Структура**:
- **Горизонталь** (top row): User Activities (user journey steps)
- **Вертикаль** (columns): User Stories под каждым activity, упорядочены по приоритету

\`\`\`
[Discover] → [Browse] → [Select] → [Purchase] → [Track]
    ↓          ↓          ↓          ↓            ↓
  Story 1   Story 4   Story 7    Story 10    Story 13
  Story 2   Story 5   Story 8    Story 11    Story 14
  Story 3   Story 6   Story 9    Story 12    Story 15
\`\`\`

**Horizontal Slices** (Releases):
- **Release 1 (MVP)**: Top stories из каждого столбца
- **Release 2**: Next layer stories
- **Release 3**: Enhancement stories

### Преимущества Story Mapping

- ✅ Big picture видение продукта
- ✅ Gap analysis (пропущенные stories)
- ✅ Release planning (какие stories в какой release)
- ✅ Shared understanding команды и stakeholders
- ✅ Выявление dependencies

### Когда использовать

- Product Backlog Refinement workshops
- Release planning
- Kickoff новых проектов
- Определение MVP scope

---

## Persona — Знакомство с пользователем

### Что такое Persona?

**Persona** — фикциональный, но реалистичный персонаж, представляющий сегмент пользователей.

**Включает**:
- Имя, фото
- Демография (возраст, профессия)
- Цели и мотивации
- Фрустрации и проблемы
- Поведение и паттерны
- Технологический уровень

### Пример Persona

\`\`\`
Имя: Sarah Johnson
Возраст: 35
Профессия: Busy working mom
Цели: Quick online grocery shopping without stress
Фрустрации: Complicated checkouts, long delivery times
Поведение: Shops on mobile during commute
Tech level: Intermediate (uses apps, not tech-savvy)
Quote: "I just want to order groceries in 5 minutes"
\`\`\`

### Использование Persona

**1. Написание User Stories**:
\`\`\`
As Sarah (busy mom)
I want one-click reorder of previous grocery list
So that I save time on recurring purchases
\`\`\`

**2. Приоритизация**:
- Какие фичи важнее для Sarah?
- Решение: функции экономии времени > персонализация

**3. Design UX**:
- Sarah использует mobile → mobile-first design
- Sarah торопится → минимум шагов в checkout

**Сколько Personas**: Обычно 3-7 для продукта.

> 💡 Personas основаны на User Research (интервью, аналитика, surveys).

---

## MVP — Minimal Viable Product

### Что такое MVP?

**MVP** — минимальный набор User Stories, достаточный для:
- Решения core проблемы пользователей
- Получения validated learning
- Запуска продукта на рынок

**MVP ≠ Все желаемые фичи**

**MVP = Минимум для ценности**

### Как определить MVP с помощью Story Mapping

1. Story Map все User Activities и Stories
2. Horizontal slice через top priority stories из каждого workflow step
3. Это и есть MVP

**Пример**:
\`\`\`
E-commerce MVP:
✅ Browse products (basic)
✅ Add to cart
✅ Checkout (credit card only)
✅ Track order (basic)

❌ NOT in MVP:
- Wishlist
- Product reviews
- Advanced filters
- Multiple payment methods
- Gift wrapping
\`\`\`

### Lean Startup подход

**Build → Measure → Learn → Iterate**

1. **Build** MVP
2. **Measure** metrics (conversions, usage)
3. **Learn** insights (что работает, что нет)
4. **Iterate** на основе feedback

### Антипаттерны MVP

❌ **Gold Plating**: Добавление "nice to have" фич в MVP
❌ **Scope Creep**: Постепенное раздувание MVP
❌ **Perfect MVP**: Попытка сделать всё идеально с первого раза

> 🎯 MVP должен быть "embarrassingly simple" — если не стыдно показывать, возможно он не minimal.

---

## BDD: Behavior-Driven Development

### Что такое BDD?

**BDD** (Dan North) — подход к разработке через описание поведения системы.

**Ключевая идея**: Acceptance Criteria User Stories пишутся в Given-When-Then формате (Gherkin), затем превращаются в automated tests.

### BDD и User Stories

**User Story**:
\`\`\`
As a customer
I want to add items to shopping cart
So that I can purchase multiple items together
\`\`\`

**Acceptance Criteria (Gherkin)**:
\`\`\`gherkin
Scenario: Add single item to empty cart
  Given user is on product details page
  And cart is empty
  When user clicks "Add to Cart" button
  Then item is added to cart
  And cart shows 1 item
  And success message "Item added to cart" is displayed

Scenario: Increase quantity of existing item
  Given user has "Laptop" in cart with quantity 1
  When user adds "Laptop" to cart again
  Then cart shows "Laptop" with quantity 2
  And total price is updated
\`\`\`

### От Acceptance Criteria к Automated Tests

Инструменты: **Cucumber** (Java, JS), **SpecFlow** (.NET), **Behat** (PHP)

Gherkin scenarios → автоматизированные acceptance tests.

**Преимущества BDD**:
- ✅ Living Documentation (AC = tests = docs)
- ✅ Collaboration (PO, Dev, QA пишут AC вместе)
- ✅ TDD на уровне behavior
- ✅ Executable specifications

---

## Измерение прогресса команды

### 1. Velocity — Скорость команды

**Velocity** = сумма Story Points завершенных stories за спринт.

**Пример**:
| Sprint | Completed SP |
|--------|-------------|
| Sprint 1 | 23 |
| Sprint 2 | 27 |
| Sprint 3 | 25 |
| Sprint 4 | 26 |
| **Avg** | **25** |

**Использование**:
- Capacity planning: "В следующий спринт возьмем ~25 SP"
- Прогнозирование: "100 SP в backlog / 25 SP/sprint = 4 спринта"

**Stabilization**: Velocity stabilizes через 3-5 спринтов.

### 2. Burndown Chart

График **оставшейся работы** (Story Points) vs время.

\`\`\`
SP ↑
   |
80 |●
   | ●
60 |  ●
   |   ●  (Ideal line)
40 |    ●●
   |      ●● (Actual)
20 |        ●●
   |          ●
 0 |___________●→ Days
    1  2  3  4  5  ...  10
\`\`\`

**Показывает**: Успеваем ли завершить спринт вовремя?

### 3. Burnup Chart

График **завершенной работы** (Story Points) нарастающим итогом.

\`\`\`
SP ↑
   |          ●
80 |         ●
   |        ●
60 |       ●
   |      ●  (Actual completed)
40 |     ●
   |    ●
20 |   ●
   |  ●
 0 |_●__________→ Days
\`\`\`

**Преимущество**: Видно добавление новых stories в backlog (scope changes).

### 4. Cumulative Flow Diagram

Распределение stories по статусам.

\`\`\`
Count ↑
      | [Done - зеленая область]
      | [In Progress - желтая область]
      | [To Do - серая область]
      |_________________________→ Time
\`\`\`

**Показывает**:
- WIP (Work In Progress)
- Bottlenecks (если In Progress растет)
- Flow эффективность

---

## Практические сценарии

### Сценарий 1: Разбиение большого Epic

**Ситуация**: Epic "Complete User Profile Management" оценен в 40 Story Points.

**Решение — Splitting по CRUD**:
1. "Create user profile" (5 SP)
2. "View user profile" (3 SP)
3. "Edit profile information" (5 SP)
4. "Upload profile picture" (8 SP)
5. "Delete account" (5 SP)

> 💡 Каждая story — vertical slice, доставляет end-to-end ценность.

### Сценарий 2: Writing Acceptance Criteria

**User Story**: "As user, I want email notifications for order updates"

**AC**:
\`\`\`gherkin
AC1: Order confirmation email
Given user placed an order
When order is confirmed
Then user receives email with order details and tracking link

AC2: Shipping notification
Given order is shipped
When shipping status updates
Then user receives email with carrier and tracking number

AC3: Delivery confirmation
Given order is delivered
When delivery confirmed
Then user receives email asking for feedback
\`\`\`

### Сценарий 3: Определение MVP через Story Mapping

**Product**: Task Management App

**User Activities**: Create Task → Organize → Track Progress → Collaborate

**MVP (Release 1 — horizontal slice through top stories)**:
- Create task with title and description
- Mark task as done
- View task list
- Basic filtering (by status)

**Release 2**:
- Assign tasks to team members
- Due dates
- Priority levels
- Task comments

### Сценарий 4: Planning Poker disagreement

**Story**: "Integrate payment gateway"

**Votes**: 3, 3, 8, 8, 13

**Discussion**:
- **3 SP voters**: "Мы уже интегрировали похожий API, просто скопировать"
- **13 SP voter**: "Нужна обработка webhook'ов, retry logic, тестирование с sandbox"

**Результат после discussion**: Consensus на **8 SP** (основная интеграция) + отдельная story **5 SP** (advanced error handling).

> 💡 Расхождения в оценках выявляют скрытые assumptions и риски.

### Сценарий 5: Technical Debt vs Feature Development

**Ситуация**: Product Owner хочет только новые features, накопился Technical Debt.

**Решение**:
- Соглашение: **20% capacity каждого спринта** на Tech Debt
- Команда создает Technical Debt User Stories:
  - "Refactor authentication module" (5 SP)
  - "Upgrade to latest React version" (8 SP)
  - "Add integration tests for checkout" (5 SP)
- PO видит ценность: меньше bugs, быстрее разработка future features

### Сценарий 6: Definition of Ready violation

**Sprint Planning**: Команда видит story "Implement social media sharing"

**Проверка DoR**:
- ✅ Описание есть
- ✅ AC определены
- ❌ No UI mockups (как должна выглядеть share кнопка?)
- ❌ Unclear: какие соц.сети? (Facebook, Twitter, LinkedIn?)

**Решение**: Story НЕ ready для спринта. PO уточняет детали, story берется в следующий спринт.

### Сценарий 7: Spike для снижения uncertainty

**Story**: "Implement real-time notifications"

**Проблема**: Команда не знает как выбрать между WebSockets, SSE, Long Polling.

**Решение — Spike**:
\`\`\`
Spike: Research real-time notification technologies
Time-box: 2 days
Deliverable: Document comparing WebSockets, SSE, Long Polling
  - Pros/cons каждого
  - Browser support
  - Scalability considerations
  - Recommendation
\`\`\`

**После Spike**: Story "Implement WebSockets for notifications" становится estimable (8 SP).

### Сценарий 8: Using Persona for prioritization

**2 Stories в backlog**:
1. "Advanced analytics dashboard" (для power users)
2. "One-click reorder" (для busy moms like Sarah)

**Persona анализ**:
- Primary persona: Sarah (busy mom, 60% users)
- Secondary persona: Data Analyst (10% users)

**Решение**: Приоритизируем #2 (one-click reorder) — выше impact для большинства users.

### Сценарий 9: Story violates INVEST — Not Independent

**Stories**:
- Story A: "Create order database schema"
- Story B: "Implement order creation API"

**Проблема**: B зависит от A → нарушение Independence.

**Решение**: Combine в одну Vertical Slice story:
"As customer, I want to create orders, so I can purchase products"
- Включает DB schema + API + minimal UI

### Сценарий 10: BDD Acceptance Criteria → Automated Test

**Story**: "Password reset functionality"

**AC (Gherkin)**:
\`\`\`gherkin
Scenario: Valid password reset request
  Given user is on login page
  When user clicks "Forgot Password"
  And enters valid email
  Then reset link is sent to email
  And "Check your email" message is displayed
\`\`\`

**Automated Test (Cucumber)**:
\`\`\`javascript
Given('user is on login page', async () => {
  await page.goto('/login');
});

When('user clicks "Forgot Password"', async () => {
  await page.click('#forgot-password-link');
});

When('enters valid email', async () => {
  await page.fill('#email', 'test@example.com');
  await page.click('#submit');
});

Then('reset link is sent to email', async () => {
  const email = await getLastEmail();
  expect(email.subject).toBe('Password Reset');
  expect(email.body).toContain('reset link');
});
\`\`\`

---

## Типичные ошибки

### Ошибка 1: User Story без "So that" (Benefit)

❌ **Неправильно**:
\`\`\`
As a user
I want a search feature
\`\`\`

**Проблема**: Зачем нужен search? Не понятна ценность → сложно приоритизировать.

✅ **Правильно**:
\`\`\`
As a customer
I want to search products by keyword
So that I can quickly find items I need without browsing all categories
\`\`\`

> 💡 Benefit объясняет ценность и помогает найти альтернативные решения.

### Ошибка 2: Technical Task вместо User Story

❌ **Неправильно**:
\`\`\`
As a developer
I want to implement caching layer with Redis
So that performance is improved
\`\`\`

**Проблема**: Это Technical Task, не user-facing story.

✅ **Правильно**:
\`\`\`
As a user
I want pages to load in under 2 seconds
So that I have smooth browsing experience
\`\`\`

*(Caching — это implementation detail, не пользовательская ценность)*

### Ошибка 3: Слишком большая Story (Epic в Sprint Backlog)

❌ **Неправильно**: Брать в спринт story "Complete e-commerce checkout experience" (30 SP).

**Проблема**: Не влезет в спринт, нарушение INVEST (Small).

✅ **Правильно**: Split на smaller stories:
- "Review cart items" (3 SP)
- "Enter shipping address" (5 SP)
- "Select payment method" (5 SP)
- "Apply discount code" (3 SP)
- "Confirm order" (5 SP)

### Ошибка 4: Horizontal Slice вместо Vertical

❌ **Неправильно**:
- Story 1: "Design all database tables"
- Story 2: "Create all API endpoints"
- Story 3: "Build UI screens"

**Проблема**: Ничего не работает end-to-end до завершения Story 3.

✅ **Правильно**: Vertical slices:
- "User registration" (DB + API + UI)
- "User login" (DB + API + UI)
- "User profile" (DB + API + UI)

### Ошибка 5: Acceptance Criteria = Implementation Details

❌ **Неправильно**:
\`\`\`
AC: Use React Context API for state management
AC: Store data in MongoDB
AC: Deploy to AWS Lambda
\`\`\`

**Проблема**: AC должны описывать поведение (behavior), не технологии.

✅ **Правильно**:
\`\`\`
AC: Given user logs in, Then user stays logged in across page refreshes
AC: Given user saves data, Then data persists after browser restart
AC: Given high traffic, Then system handles 1000 concurrent users
\`\`\`

### Ошибка 6: Нет Definition of Done

**Проблема**: Каждый разработчик понимает "готово" по-своему:
- Dev 1: "Код написан" = done
- Dev 2: "Код + tests" = done
- Dev 3: "Код + tests + deployed" = done

**Результат**: Inconsistent quality, технический долг.

✅ **Правильно**: Командный DoD:
- Code written & reviewed
- Unit tests (>80% coverage)
- Integration tests pass
- Deployed to staging
- QA testing done
- PO accepted

### Ошибка 7: Planning Poker — Anchoring Bias

❌ **Неправильно**: Product Owner или Tech Lead озвучивает оценку первым: "Думаю это 5 points".

**Проблема**: Команда anchor'ится к этому числу, не думает критически.

✅ **Правильно**: Все одновременно показывают карты → обсуждаются крайние оценки.

### Ошибка 8: Игнорирование Technical Debt

**Проблема**: PO всегда выбирает только новые features, игнорирует Tech Debt stories.

**Результат через 6 месяцев**:
- Velocity падает с 25 SP до 15 SP
- Каждая новая feature = больше bugs
- Команда фрустрирована

✅ **Правильно**: 10-20% capacity каждого спринта на Tech Debt.

---

## Best Practices

### 1. Всегда включайте "So that" (Benefit)

Объясняйте ценность в каждой story.

✅ **Хорошо**:
\`\`\`
As a mobile user
I want offline mode
So that I can use the app without internet connection
\`\`\`

### 2. Keep Stories Small (1-5 SP, max 8)

Small stories:
- Легче оценить
- Быстрее завершить
- Earlier feedback
- Меньше риск

### 3. Write Acceptance Criteria в Given-When-Then

Четкие, testable criteria.

### 4. Используйте Vertical Slices

Каждая story проходит через все слои архитектуры.

### 5. Регулярно Refine Product Backlog

Grooming session каждую неделю:
- Уточнение top stories
- Splitting больших stories
- Re-prioritization

### 6. Вовлекайте всю команду в estimation

Planning Poker вовлекает всех → better estimates, shared understanding.

### 7. Balance Feature Development и Technical Debt

Не игнорируйте Tech Debt, иначе velocity будет падать.

### 8. Используйте Personas для empathy

"As Sarah (busy mom)" лучше чем "As user" → думаем о реальных людях.

### 9. Definition of Done для consistency

Все stories проходят через одинаковые quality gates.

### 10. Celebrate Completed Stories

Sprint Review: демонстрируйте completed stories stakeholders → мотивация команды.

---

## Заключение

**User Stories** — сердце Agile разработки. Они помогают команде:
- Фокусироваться на **ценности для пользователя**
- **Общаться** между PO, Dev, QA через простой формат
- **Итеративно** доставлять функциональность
- **Измерять прогресс** через Story Points и Velocity

### 🎯 Ключевые принципы для запоминания

1. **As-Want-SoThat формат**: Кто → Что → Зачем (Benefit критичен!)
2. **INVEST criteria**: Independent, Negotiable, Valuable, Estimable, Small, Testable
3. **Three Cs**: Card (краткая), Conversation (детали в беседе), Confirmation (AC)
4. **Vertical Slices**: Каждая story проходит через все слои архитектуры
5. **Story Points**: Относительная оценка (Fibonacci), а не hours
6. **Definition of Done**: Общие стандарты качества для всех stories
7. **Acceptance Criteria**: Given-When-Then для каждой story
8. **Small & Focused**: 1-5 SP, влезает в спринт, доставляет ценность

> 💡 **Золотое правило**: User Story — это обещание разговора о ценности для пользователя, а не детальная спецификация.

Используйте User Stories чтобы строить продукт **вместе с командой и пользователями**, а не по заранее написанному плану.
`;

async function createUserStoriesLecture() {
  console.log('🚀 Создание лекции: User Stories...\n');

  try {
    // 1. Найти тест
    const test = await prisma.test.findFirst({
      where: { title: 'User Stories: Написание пользовательских историй' },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "User Stories: Написание пользовательских историй" не найден!');
    }

    console.log(`✅ Тест найден: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    // 2. Создать лекцию
    const lecture = await prisma.lecture.create({
      data: {
        title: 'User Stories: Написание пользовательских историй',
        topic: 'User Stories в Agile: формат As-Want-SoThat, INVEST критерии, Acceptance Criteria',
        content: lectureContent
      }
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    // 3. Привязать лекцию ко ВСЕМ вопросам теста
    console.log('📎 Привязка лекции к вопросам...');

    for (const tq of test.questions) {
      await prisma.question.update({
        where: { id: tq.questionId },
        data: { lectureId: lecture.id }
      });
      console.log(`   ✓ Вопрос ${tq.order}: ${tq.question.question.substring(0, 50)}...`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ГОТОВО!');
    console.log('='.repeat(70));
    console.log(`📚 Лекция: "${lecture.title}"`);
    console.log(`🔗 Привязана к ${test.questions.length} вопросам`);
    console.log(`📊 Объем лекции: ${lectureContent.split('\n').length} строк`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUserStoriesLecture();
