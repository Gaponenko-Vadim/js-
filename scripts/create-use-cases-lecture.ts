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

const lectureContent = `# Use Cases: Сценарии использования системы

## Введение: Детальная карта путешествия

Представьте, что вы планируете поездку в незнакомый город. У вас есть два варианта:

**Вариант 1**: Записка "Хочу посетить музеи" (это как User Story - пользовательская история)
**Вариант 2**: Детальный маршрут:
- 9:00 — Выход из отеля, взять с собой зонт
- 9:30 — Метро до станции "Площадь искусств"
- 10:00 — Вход в Эрмитаж (если закрыт → идти в Русский музей)
- 13:00 — Обед в кафе напротив
- Если дождь → вызвать такси, иначе → пешком

**Use Case (сценарий использования)** — это второй вариант. Детальное, пошаговое описание взаимодействия пользователя с системой для достижения конкретной цели.

> 💡 **Главное**: Use Case описывает **ВСЕ шаги** взаимодействия, включая альтернативные пути и обработку ошибок.

---

## Базовые концепции

### Что такое Use Case?

**Use Case** — формальное описание последовательности действий между Actor (актор) и System (система) для достижения цели актора.

### Ключевые элементы Use Case

| Элемент | Описание | Пример |
|---------|----------|--------|
| **Use Case Name** | Название (глагол + объект) | "Purchase Product" |
| **Actor** | Кто взаимодействует | Customer, Admin, Payment Gateway |
| **Goal** | Цель актора | Buy product and receive confirmation |
| **Preconditions** | Состояние перед началом | User is logged in, cart is not empty |
| **Postconditions** | Состояние после завершения | Order is created, payment processed |
| **Main Flow** | Основной сценарий ("happy path") | Шаги 1-10 без ошибок |
| **Alternative Flows** | Допустимые вариации | Pay with PayPal instead of card |
| **Exception Flows** | Обработка ошибок | Payment declined, out of stock |

### Use Case vs User Story

| Аспект | Use Case | User Story |
|--------|----------|------------|
| **Детализация** | Очень детальный (все шаги) | Краткий (карточка) |
| **Формат** | Structured document (2-10 страниц) | As-Want-SoThat (2-5 строк) |
| **Формальность** | Формальный | Неформальный |
| **Когда детали** | Все детали заранее | Детали через разговор |
| **Методология** | Waterfall, RUP | Agile, Scrum |
| **Фокус** | Взаимодействие система-актор | Ценность для пользователя |

> ⚠️ Можно использовать **оба**: User Story для инициации → Use Case для детализации сложных flows.

---

## Actor (Актор) — Кто взаимодействует с системой

### Что такое Actor?

**Actor** — роль пользователя или внешней системы, которая взаимодействует с системой.

⚠️ **Важно**: Actor — это **РОЛЬ**, а не конкретный человек.

### Примеры Actors

**Человеческие акторы**:
- Customer (покупатель)
- Administrator (администратор)
- Guest User (гость без регистрации)
- Content Manager (контент-менеджер)

**Системные акторы** (внешние системы):
- Payment Gateway (платежный шлюз)
- Email Service (сервис отправки email)
- Inventory System (система складского учета)
- SMS Provider (провайдер SMS)

### Primary Actor vs Secondary Actor

**Primary Actor (основной актор)**:
- Инициирует Use Case
- Заинтересован в результате
- Система существует, чтобы служить primary actors

**Пример**: В UC "Purchase Product" primary actor — **Customer** (покупатель).

**Secondary Actor (вспомогательный актор)**:
- Участвует, но НЕ инициирует
- Помогает достичь цели primary actor

**Пример**: В UC "Purchase Product" secondary actor — **Payment System** (помогает обработать оплату).

### Один человек — несколько ролей

Джон может быть:
- **Customer** (когда покупает)
- **Administrator** (когда управляет каталогом)

Это **разные акторы** в Use Case diagram.

---

## Preconditions и Postconditions

### Preconditions (Предусловия)

**Precondition** — состояние системы, которое ДОЛЖНО быть истинным перед началом Use Case.

✅ **Хорошие примеры Preconditions**:
- "User is logged in"
- "Shopping cart contains at least 1 item"
- "User has verified email address"
- "Product is in stock"

❌ **Это НЕ Preconditions**:
- "User clicks button" → Это Trigger (что инициирует UC)
- "System validates data" → Это шаг в Main Flow

### Postconditions (Постусловия)

**Postcondition** — состояние системы после **успешного** завершения Use Case.

✅ **Хорошие примеры Postconditions**:
- "Order is created in database"
- "Inventory is decremented"
- "Confirmation email is sent"
- "Payment is processed"
- "User receives order number"

**Важно**: Postconditions должны быть:
- ✅ Observable (наблюдаемы)
- ✅ Verifiable (проверяемы)

### Пример

**Use Case**: "Place Order"

**Preconditions**:
- User is authenticated
- Shopping cart is not empty
- User has valid shipping address

**Postconditions**:
- Order record created with status "Pending"
- Inventory reserved for order items
- Payment authorization obtained
- Confirmation email sent to user
- User's cart is cleared

---

## Main Flow (Основной сценарий)

### Что такое Main Flow?

**Main Flow** (Basic Flow, Happy Path) — последовательность шагов без ошибок и исключений.

> 🎯 Это "идеальный" сценарий, когда всё идет по плану.

### Структура Main Flow

**Формат**: Пронумерованные шаги (Actor action → System response)

### Пример: Use Case "Login"

**Main Success Scenario**:
1. User navigates to login page
2. System displays login form
3. User enters username and password
4. User clicks "Login" button
5. System validates credentials
6. System creates user session
7. System redirects to dashboard
8. System displays welcome message

### Правила написания шагов

✅ **Правильно**:
- Активный залог: "User enters email"
- Кто делает: "User clicks", "System validates"
- Конкретное действие

❌ **Неправильно**:
- Пассивный залог: "Email is entered"
- Неясно кто: "Password checked"
- Технические детали: "System executes SQL query"

---

## Alternative Flows (Альтернативные сценарии)

### Что такое Alternative Flow?

**Alternative Flow** — допустимая вариация main flow, которая всё еще достигает цели.

> 💡 Alternative Flow ≠ ошибка. Цель UC достигается, но другим путем.

### Примеры Alternative Flows

**Use Case**: "Checkout"

**Main Flow**: Pay with Credit Card

**Alternative Flows**:
- **Alt 1**: Pay with PayPal
  - At step 5, user selects "PayPal"
  - System redirects to PayPal
  - User authenticates with PayPal
  - System receives payment confirmation
  - Continue at step 7 of main flow

- **Alt 2**: Apply discount code
  - At step 3, user enters discount code
  - System validates and applies discount
  - System recalculates total
  - Continue at step 4 of main flow

- **Alt 3**: Use saved payment method
  - At step 5, user selects saved card
  - System retrieves stored payment details
  - Skip steps 6-7 (no need to enter card details)
  - Continue at step 8

### Отличие от Exception Flow

| Alternative Flow | Exception Flow |
|-----------------|----------------|
| **Цель достигнута** ✅ | **Цель НЕ достигнута** ❌ |
| Другой путь к успеху | Обработка ошибки |
| Pay with PayPal (успешная оплата) | Payment declined (нет оплаты) |

---

## Exception Flows (Исключительные сценарии)

### Что такое Exception Flow?

**Exception Flow** — обработка ошибок и исключительных ситуаций, когда **цель UC не достигается**.

### Формат записи Exception Flow

\`\`\`
Step X: [условие ошибки]
  Xa. [Что делает система]
  Xb. [Дальнейшие действия]
  Xc. Use Case ends / Returns to step Y
\`\`\`

### Примеры Exception Flows

**Use Case**: "Login"

**Exception Flows**:

**Exception 1: Invalid Credentials**
\`\`\`
At step 5: If credentials are invalid
  5a. System displays error message "Invalid username or password"
  5b. System logs failed login attempt
  5c. Return to step 2 (show login form again)
  5d. If 3 failed attempts → Lock account for 15 minutes
\`\`\`

**Exception 2: Account Locked**
\`\`\`
At step 5: If account is locked
  5a. System displays "Account locked due to multiple failed attempts"
  5b. System sends unlock email to registered address
  5c. Use Case ends
\`\`\`

**Exception 3: System Unavailable**
\`\`\`
At step 5: If authentication service is down
  5a. System displays "Service temporarily unavailable"
  5b. System logs error
  5c. Use Case ends
\`\`\`

### Типичные категории Exception Flows

- **Validation errors**: Invalid input, missing data
- **Business rule violations**: Insufficient funds, age restriction
- **Technical errors**: Service unavailable, timeout
- **Unauthorized access**: Insufficient permissions
- **Data not found**: Resource doesn't exist

---

## Extension Points и отношения <<include>>/<<extend>>

### Extension Points (Точки расширения)

**Extension Point** — именованное место в Use Case, куда может подключаться extending UC.

**Пример**:

**Base UC**: "Purchase Product"
- Extension Point: "after payment validation"

**Extending UC**: "Apply Loyalty Points"
- Вставляется в extension point через <<extend>>
- Выполняется ОПЦИОНАЛЬНО (только если есть loyalty points)

### Отношение <<include>> — Обязательное включение

**<<include>>** — базовый UC **всегда** вызывает included UC.

**Когда использовать**: Факторизация общей функциональности.

**Пример**:
\`\`\`
"Login" <<include>> "Validate Email Format"
"Register" <<include>> "Validate Email Format"
"Reset Password" <<include>> "Validate Email Format"
\`\`\`

Все три UC используют одну и ту же валидацию email.

### Отношение <<extend>> — Опциональное расширение

**<<extend>>** — extending UC опционально добавляет поведение в extension point базового UC.

**Когда использовать**: Дополнительное поведение, которое выполняется при определенных условиях.

**Пример**:
\`\`\`
"Process Order" ←--<<extend>>-- "Apply Discount Code"
                ←--<<extend>>-- "Send Gift Message"
                ←--<<extend>>-- "Apply Loyalty Rewards"
\`\`\`

Discount code, gift message, loyalty rewards — опциональные.

### <<include>> vs <<extend>>

| Аспект | <<include>> | <<extend>> |
|--------|------------|-----------|
| **Обязательность** | Mandatory (всегда) | Optional (при условии) |
| **Направление** | Base → Included | Extending → Base |
| **Цель** | Переиспользование кода | Добавление опций |
| **Пример** | Validate Email | Apply Discount |

---

## Trigger (Триггер) — Что запускает Use Case

### Что такое Trigger?

**Trigger** — событие или действие, которое инициирует выполнение Use Case.

### Типы Triggers

**1. User Action Trigger**:
- "Customer clicks 'Add to Cart' button"
- "Admin selects 'Generate Report'"
- "User submits contact form"

**2. Temporal Trigger** (по времени):
- "Every day at midnight"
- "Every Monday at 9:00 AM"
- "24 hours before appointment"

**3. Event-Driven Trigger**:
- "Payment received notification"
- "New order created in system"
- "Inventory level drops below threshold"
- "User session expires"

**4. System Trigger**:
- "System detects disk space < 10%"
- "CPU usage > 90% for 5 minutes"

### Trigger vs Precondition

| Trigger | Precondition |
|---------|-------------|
| **Событие** (что-то произошло) | **Состояние** (что-то истинно) |
| "User clicks button" | "User is logged in" |
| Действие, запускающее UC | Условие перед началом UC |

---

## Goal Level — Уровни абстракции Use Case

### Goal Levels по Alistair Cockburn

Use Cases можно классифицировать по уровню абстракции цели.

### 1. Summary Level (Cloud ☁️ — Высокий уровень)

**Описание**: Множество сессий, высокоуровневая бизнес-цель.

**Пример**: "Manage Online Store", "Run E-commerce Business"

**Характеристики**:
- Продолжительность: Недели/месяцы
- Включает множество user-goal UC
- Используется для: бизнес-моделирования, стратегического планирования

### 2. User-Goal Level (Sea 🌊 — Средний уровень) ⭐

**Описание**: Одна пользовательская сессия, завершенная задача.

**Пример**: "Purchase Product", "Create Blog Post", "Generate Monthly Report"

**Характеристики**:
- Продолжительность: 2-20 минут
- **ОПТИМАЛЬНЫЙ уровень** для большинства UC
- Доставляет ценность пользователю

> 🎯 **Best Practice**: Большинство Use Cases должны быть на Sea Level.

### 3. Subfunction Level (Fish 🐟 — Низкий уровень)

**Описание**: Часть пользовательской сессии, вспомогательная функция.

**Пример**: "Validate Credit Card", "Calculate Shipping Cost", "Format Phone Number"

**Характеристики**:
- Продолжительность: Секунды
- Обычно становятся included UC (через <<include>>)
- Не доставляют ценность сами по себе

### Как определить уровень?

**Вопрос**: "Если бы пользователь встал и попил кофе после этого, была бы задача завершена?"

- ☁️ Summary: Нет, слишком большая задача
- 🌊 User-Goal: **Да, задача завершена** ✅
- 🐟 Subfunction: Нет, это только часть задачи

---

## Use Case Diagram (UML)

### Что такое Use Case Diagram?

**Use Case Diagram** (UML) — визуализация акторов, Use Cases и их отношений.

**Элементы диаграммы**:
- **Actors** (фигуры человечков) — снаружи системы
- **Use Cases** (овалы) — внутри системы
- **System Boundary** (прямоугольник) — граница системы
- **Associations** (линии) — связь actor → UC
- **<<include>>** / **<<extend>>** (пунктирные стрелки)

### System Boundary (Граница системы)

**System Boundary** — прямоугольник, определяющий что **внутри** системы, что **снаружи**.

\`\`\`
┌────────────────────────────────────────┐
│      E-Commerce System                 │
│                                        │
│  (Browse Products)  (Add to Cart)     │
│                                        │
│  (Checkout)  (Track Order)            │
│                                        │
└────────────────────────────────────────┘
     ↑              ↑
  Customer    Payment Gateway
 (outside)      (outside)
\`\`\`

**Внутри**: Use Cases (функции системы)
**Снаружи**: Actors (пользователи и внешние системы)

### Generalization между Actors

**Generalization** — отношение наследования между акторами.

**Пример**:
\`\`\`
        User (general)
         ↑     ↑
         |     |
    Customer  Admin
   (specific) (specific)
\`\`\`

**Означает**: Admin и Customer могут делать всё что User + дополнительные UC.

**На UML**: Незаполненная стрелка от child к parent.

---

## Scenario (Сценарий) — Конкретная инстанция Use Case

### Что такое Scenario?

**Scenario** — конкретный путь выполнения Use Case с определенными значениями данных.

> Use Case = template (шаблон), Scenario = instance (экземпляр)

### Пример

**Use Case**: "Purchase Product" (общее описание процесса)

**Scenarios** (конкретные примеры):

**Scenario 1: Успешная покупка с кредитной картой**
\`\`\`
Actor: John Doe
Actions:
  - Selects "MacBook Pro" ($2499)
  - Adds to cart
  - Proceeds to checkout
  - Enters shipping: "123 Main St, New York"
  - Selects payment: Visa ending in 1234
  - Confirms order
Result: Order #12345 created, email sent
\`\`\`

**Scenario 2: Покупка с PayPal**
\`\`\`
Actor: Mary Smith
Actions:
  - Selects "Book: Clean Code" ($35)
  - Adds to cart
  - Proceeds to checkout
  - Enters shipping address
  - Selects PayPal payment
  - Authenticates with PayPal
  - Confirms order
Result: Order #12346 created
\`\`\`

**Scenario 3: Exception — Declined Payment**
\`\`\`
Actor: Alice Johnson
Actions:
  - Selects "Laptop" ($1200)
  - Adds to cart
  - Proceeds to checkout
  - Enters shipping
  - Enters credit card (expired)
  - System declines payment
Result: Error message, order not created
\`\`\`

### Зачем нужны Scenarios?

- ✅ Примеры в документации
- ✅ Создание test cases
- ✅ Демонстрация stakeholders
- ✅ Валидация Use Case

---

## Use Cases и тестирование

### Mapping Use Case → Test Cases

**Принцип**: Каждый flow Use Case должен быть покрыт тест-кейсами.

**Main Flow** → **Happy Path Tests**
- Тест проходит через основной сценарий без ошибок

**Alternative Flows** → **Alternative Scenario Tests**
- Тесты для каждого альтернативного пути

**Exception Flows** → **Negative Tests / Error Handling Tests**
- Тесты для каждого exception scenario

### Пример

**Use Case**: "Login"

**Test Cases**:
1. **TC001 — Main Flow**: Valid username and password → успешный login
2. **TC002 — Exception 1**: Invalid password → error message
3. **TC003 — Exception 2**: Locked account → lock message
4. **TC004 — Exception 3**: Empty username → validation error
5. **TC005 — Alternative**: Login with Google OAuth → успешный login

### Traceability Matrix

**Requirements Traceability Matrix (RTM)** связывает UC с тестами.

| Use Case ID | Use Case Name | Flow | Test Case ID | Test Result |
|-------------|--------------|------|--------------|-------------|
| UC-001 | Login | Main | TC-001 | Pass ✅ |
| UC-001 | Login | Exception 1 | TC-002 | Pass ✅ |
| UC-001 | Login | Exception 2 | TC-003 | Fail ❌ |

**Преимущества**:
- Видно покрытие (какие UC протестированы)
- Traceability (от требования к тесту)
- Gap analysis (что не покрыто тестами)

---

## Fully Dressed vs Brief Use Case

### Fully Dressed Use Case (Детальный)

**Fully Dressed** — подробная формальная спецификация со всеми секциями.

**Включает**:
- ✅ UC Name, UC ID
- ✅ Brief Description
- ✅ Primary Actor, Secondary Actors
- ✅ Preconditions, Trigger
- ✅ Main Success Scenario (детальные шаги)
- ✅ Extensions / Alternative Flows
- ✅ Exception Flows
- ✅ Postconditions
- ✅ Frequency of Use
- ✅ Business Rules
- ✅ Special Requirements (performance, security)
- ✅ Assumptions

**Когда использовать**:
- Критичные Use Cases
- Сложные flows с множеством вариаций
- Формальная документация
- Контракты с внешними подрядчиками

**Объем**: 3-10 страниц.

### Brief Use Case (Краткий)

**Brief** — краткое описание в виде одного параграфа.

**Включает**: Только main success scenario без деталей.

**Пример**:
\`\`\`
UC: Purchase Product

Customer browses product catalog, adds items to cart,
proceeds to checkout, enters shipping and payment details,
confirms order. System processes payment, creates order,
updates inventory, and sends confirmation email.
\`\`\`

**Когда использовать**:
- Ранние стадии проектирования
- Use Cases с низким риском
- Brainstorming, initial planning
- UC которые будут детализированы позже

**Объем**: 1 параграф (3-5 предложений).

---

## Stakeholder Interests — Интересы сторон

### Что такое Stakeholder Interests?

**Stakeholder Interests** документируют ожидания различных заинтересованных сторон от выполнения Use Case.

### Зачем нужно?

Убедиться что Use Case учитывает потребности **всех сторон**, не только primary actor.

### Пример: UC "Process Order"

**Stakeholders и их интересы**:

**Customer**:
- Получить товар быстро
- Безопасная оплата
- Прозрачность статуса доставки
- Легкий возврат если проблема

**Company (бизнес)**:
- Минимизировать fraud (мошенничество)
- Снизить ошибки доставки
- Собрать данные для аналитики
- Обеспечить customer satisfaction

**Supplier (поставщик)**:
- Получить точную информацию о заказе вовремя
- Минимизировать возвраты
- Прозрачность коммуникации

**Payment Processor**:
- Корректная обработка транзакций
- Соблюдение PCI DSS стандартов
- Минимизация chargebacks

**Tax Authority (налоговая)**:
- Правильный расчет налогов
- Прозрачная отчетность
- Соблюдение законодательства

> 💡 Use Case должен балансировать интересы всех stakeholders.

---

## Business Rules в Use Case

### Что такое Business Rules?

**Business Rules** — правила и политики бизнеса, которые ограничивают или определяют поведение Use Case.

### Примеры Business Rules

**Для e-commerce**:
- BR001: Discount cannot exceed 50% of product price
- BR002: Users under 18 cannot purchase alcohol
- BR003: Free shipping for orders over $50
- BR004: Refund allowed within 30 days of purchase
- BR005: Maximum 10 items per product in single order

**Для banking**:
- BR010: Daily withdrawal limit: $1000
- BR011: Transfer requires 2-factor authentication for amounts > $5000
- BR012: Account locked after 3 failed login attempts

### Как включать в Use Case?

**Вариант 1**: Отдельная секция "Business Rules"

**Вариант 2**: Referenced в шагах:
\`\`\`
Step 5: System validates discount code
  - Apply BR001: Discount max 50%
  - If discount > 50%, show error
\`\`\`

**Вариант 3**: Business Rules Catalog
- Централизованный документ со всеми BR
- Use Case ссылается по ID: "Apply BR001"

> 💡 Один Business Rule может влиять на множество Use Cases.

---

## Use Case Points — Оценка объема проекта

### Что такое Use Case Points (UCP)?

**UCP** — метод estimation размера проекта на основе Use Cases (аналог Function Points).

### Формула UCP

\`\`\`
UCP = (UUCP + UAWP) × TCF × ECF
\`\`\`

**Где**:
- **UUCP** = Unadjusted Use Case Points
- **UAWP** = Unadjusted Actor Weight Points
- **TCF** = Technical Complexity Factor
- **ECF** = Environmental Complexity Factor

### Шаг 1: Классификация Use Cases

| Тип | Критерии | Вес |
|-----|---------|-----|
| **Simple** | 3 или меньше transactions | 5 |
| **Average** | 4-7 transactions | 10 |
| **Complex** | > 7 transactions | 15 |

**Transaction** = interaction между actor и система (один шаг в flow).

### Шаг 2: Классификация Actors

| Тип | Критерии | Вес |
|-----|---------|-----|
| **Simple** | External system (API call) | 1 |
| **Average** | External system (protocol) | 2 |
| **Complex** | Human с GUI | 3 |

### Пример расчета

**Use Cases**:
- Login (Simple, 5)
- Browse Products (Average, 10)
- Checkout (Complex, 15)

**Actors**:
- Customer (Complex, 3)
- Payment Gateway (Simple, 1)

**UUCP** = 5 + 10 + 15 = 30
**UAWP** = 3 + 1 = 4

**Допустим**: TCF = 1.0, ECF = 1.0

**UCP** = (30 + 4) × 1.0 × 1.0 = **34 UCP**

**Effort** = 34 UCP × 20 hours/UCP = **680 hours**

> ⚠️ Productivity factor (hours/UCP) варьируется: 15-30 hours/UCP в зависимости от команды и технологий.

---

## System Use Case vs Business Use Case

### System Use Case (Уровень ПО)

**System UC** описывает взаимодействие актора с **конкретной software системой**.

**Пример**: "Create Employee Record in HR System"

**Характеристики**:
- Все шаги выполняются в software
- Actor взаимодействует с UI/API
- Used for: software requirements, development, testing

### Business Use Case (Уровень организации)

**Business UC** описывает **бизнес-процесс** на уровне организации.

**Пример**: "Hire Employee"

**Включает**:
- Интервью (не в системе, ручной процесс)
- Background check (частично система)
- Оформление документов (система)
- Подготовка рабочего места (не система)

**Характеристики**:
- Может включать ручные шаги
- Высокий уровень абстракции
- Used for: BPM (Business Process Management), optimization

### Связь Business UC и System UC

\`\`\`
Business UC: "Hire Employee"
    ├─ System UC: "Post Job Opening"
    ├─ (Manual): Interview candidates
    ├─ System UC: "Run Background Check"
    ├─ System UC: "Create Employee Record"
    └─ System UC: "Generate Offer Letter"
\`\`\`

**Обычно**: 1 Business UC → несколько System UC.

---

## Практические сценарии

### Сценарий 1: Написание Fully Dressed Use Case

**Задача**: Документировать "Login" Use Case.

**Решение**:
\`\`\`
UC-001: Login

Primary Actor: Registered User
Secondary Actors: Authentication Service

Preconditions:
  - User has registered account
  - User is on login page

Trigger: User clicks "Login" link

Main Success Scenario:
  1. User enters username
  2. User enters password
  3. User clicks "Login" button
  4. System validates credentials
  5. System creates session (30 min timeout)
  6. System logs successful login
  7. System redirects to dashboard
  8. System displays welcome message with user name

Extensions:
  4a. Invalid credentials:
    4a1. System shows "Invalid username or password"
    4a2. System logs failed attempt
    4a3. Return to step 1
    4a4. If 3 failed attempts → Lock account (see UC-005)

  4b. Account locked:
    4b1. System shows "Account locked. Check email for unlock instructions"
    4b2. Use Case ends

  5a. Session creation fails:
    5a1. System shows "Unable to login. Try again later"
    5a2. System logs error
    5a3. Use Case ends

Postconditions:
  - User session created in database
  - User authenticated for 30 minutes
  - Login success logged

Special Requirements:
  - Response time < 2 seconds
  - Password must be transmitted encrypted (HTTPS)
  - Support OAuth2 providers (Google, Facebook) - see UC-002

Frequency: 10,000 times per day
\`\`\`

### Сценарий 2: Определение Alternative vs Exception Flow

**Ситуация**: User может оплатить кредитной картой или PayPal.

**Вопрос**: Alternative или Exception?

**Анализ**:
- Цель достигается? **Да** (в обоих случаях оплата проходит)
- Это ошибка? **Нет**

**Ответ**: **Alternative Flow** (разные способы достичь цели)

---

**Ситуация**: Карта отклонена банком.

**Вопрос**: Alternative или Exception?

**Анализ**:
- Цель достигается? **Нет** (оплата не прошла)
- Это ошибка? **Да**

**Ответ**: **Exception Flow** (обработка ошибки)

### Сценарий 3: <<include>> vs <<extend>>

**Ситуация**: Нужно добавить email validation.

**Use Cases**: Login, Register, Reset Password — все требуют email validation.

**Решение**: **<<include>>** (обязательное включение общей функциональности)

\`\`\`
Login <<include>> Validate Email Format
Register <<include>> Validate Email Format
Reset Password <<include>> Validate Email Format
\`\`\`

---

**Ситуация**: Возможность отправки подарочного сообщения при заказе (опционально).

**Решение**: **<<extend>>** (опциональное расширение)

\`\`\`
Process Order ←--<<extend>>-- Send Gift Message
  (выполняется только если пользователь выбрал опцию)
\`\`\`

### Сценарий 4: Определение Goal Level

**Use Case**: "Validate Credit Card"

**Вопрос**: Какой Goal Level?

**Тест**: "Если бы пользователь встал и попил кофе после этого, была бы задача завершена?"

**Ответ**: **Нет** → 🐟 **Subfunction Level** (это часть большей задачи "Checkout")

---

**Use Case**: "Purchase Product"

**Тест**: "Если бы пользователь встал и попил кофе после этого, была бы задача завершена?"

**Ответ**: **Да, заказ оформлен** → 🌊 **User-Goal Level** ✅

### Сценарий 5: System Boundary на UC Diagram

**Вопрос**: Email Service — внутри или снаружи System Boundary?

**Анализ**: Email Service — это **внешняя система** (не часть нашего приложения).

**Ответ**: **Снаружи** (Secondary Actor).

\`\`\`
┌──────────────────────────────┐
│   Our E-commerce System       │
│                               │
│   (Register User)             │
│                               │
└──────────────────────────────┘
         ↑          ↓
      User    Email Service
    (outside)   (outside)
\`\`\`

### Сценарий 6: Precondition vs Trigger

**Use Case**: "Checkout"

**Вопрос**: "Cart is not empty" — это Precondition или Trigger?

**Анализ**:
- Это состояние (state) или событие (event)? → **Состояние**
- Это условие ДО начала UC? → **Да**

**Ответ**: **Precondition** (состояние перед началом)

---

**Вопрос**: "User clicks Checkout button" — это Precondition или Trigger?

**Анализ**:
- Это состояние или событие? → **Событие**
- Это что инициирует UC? → **Да**

**Ответ**: **Trigger** (событие, запускающее UC)

### Сценарий 7: Создание Test Cases из Use Case

**Use Case**: "Add to Cart"

**Main Flow**:
1. User views product
2. User clicks "Add to Cart"
3. System adds product to cart (quantity 1)
4. System displays success message

**Alternative Flow 1**: Product already in cart
- System increases quantity by 1

**Exception Flow 1**: Product out of stock
- System shows "Out of Stock"

**Test Cases**:
- **TC001**: Add new product → Main Flow
- **TC002**: Add existing product → Alternative 1
- **TC003**: Add out of stock product → Exception 1
- **TC004**: Add product (DB error) → Exception 2
- **TC005**: Add product (session expired) → Exception 3

### Сценарий 8: Business Rule в Use Case

**Business Rule**: "Discount cannot exceed 50%"

**Как включить в UC "Apply Discount"**:

**Step 5: System validates discount code**
\`\`\`
5. System validates discount code against database
  5a. If discount code not found:
    5a1. Show "Invalid discount code"
    5a2. Return to step 3

  5b. If discount > 50% (BR001 violation):
    5b1. Apply maximum 50% discount
    5b2. Show "Discount capped at 50% per policy"
    5b3. Continue to step 6

  5c. If discount code expired:
    5c1. Show "Discount code expired"
    5c2. Return to step 3
\`\`\`

### Сценарий 9: Generalization между Actors

**Ситуация**: Admin и Regular User оба могут View Products, но только Admin может Delete Products.

**UML**:
\`\`\`
         User
         ↑  ↑
         │  │
    Admin  Regular User

Associations:
- User → View Products
- User → Add to Cart
- Admin → Delete Products (only Admin)
- Admin → Manage Inventory (only Admin)
\`\`\`

**Результат**: Admin наследует все UC от User + дополнительные admin UC.

### Сценарий 10: Use Case Points estimation

**Проект**: Small CRM System

**Use Cases**:
- Login (Simple, 5 points)
- Manage Contacts (Complex, 15 points)
- View Reports (Average, 10 points)
- Send Email (Average, 10 points)

**Actors**:
- Sales Rep (Complex GUI user, 3 points)
- Email Service (Simple API, 1 point)

**Расчет**:
- UUCP = 5 + 15 + 10 + 10 = 40
- UAWP = 3 + 1 = 4
- UCP = 44 (assuming TCF=1.0, ECF=1.0)
- Effort = 44 × 20 hours/UCP = **880 hours** (~5.5 months для 1 dev)

---

## Типичные ошибки

### Ошибка 1: Mixing Precondition и Trigger

❌ **Неправильно**:
\`\`\`
Precondition: User clicks "Checkout" button
\`\`\`

**Проблема**: Это событие (trigger), не состояние (precondition).

✅ **Правильно**:
\`\`\`
Precondition: Cart contains at least 1 item
Trigger: User clicks "Checkout" button
\`\`\`

### Ошибка 2: Technical details в Main Flow

❌ **Неправильно**:
\`\`\`
5. System executes SQL query: SELECT * FROM users WHERE email = ?
6. System hashes password with bcrypt
7. System stores session in Redis cache
\`\`\`

**Проблема**: Слишком технические детали, не нужные stakeholders.

✅ **Правильно**:
\`\`\`
5. System validates credentials
6. System creates user session
\`\`\`

> 💡 Use Case описывает ЧТО делает система, не КАК (implementation details).

### Ошибка 3: Confusing Alternative и Exception Flows

❌ **Неправильно**: Называть "Payment declined" Alternative Flow.

**Проблема**: Цель UC (оплата) НЕ достигнута → это Exception, не Alternative.

✅ **Правильно**:
- **Alternative Flow**: Pay with PayPal (цель достигнута другим путем)
- **Exception Flow**: Payment declined (цель НЕ достигнута)

### Ошибка 4: Слишком низкий Goal Level (Fish level)

❌ **Неправильно**: Создавать отдельные UC для:
- "Validate Email Format"
- "Hash Password"
- "Send Confirmation Email"

**Проблема**: Это subfunction level, не доставляют ценность сами по себе.

✅ **Правильно**: Эти функции — шаги внутри user-goal UC "Register User" (🌊 Sea Level).

### Ошибка 5: Actor внутри System Boundary

❌ **Неправильно**: Рисовать Database или Controller как Actor внутри системы.

**Проблема**: Actor всегда **external** по отношению к системе.

✅ **Правильно**:
- **Actors** (снаружи): User, Payment Gateway, Email Service
- **Use Cases** (внутри): Login, Checkout, Send Email

### Ошибка 6: Postcondition = последний шаг Main Flow

❌ **Неправильно**:
\`\`\`
Postcondition: System displays confirmation message
\`\`\`

**Проблема**: Postcondition — это **состояние системы**, не UI action.

✅ **Правильно**:
\`\`\`
Postconditions:
  - Order created in database with status "Pending"
  - Inventory reserved
  - Payment authorization obtained
  - Confirmation email sent
\`\`\`

### Ошибка 7: Не документировать Exception Flows

❌ **Неправильно**: Писать только Main Flow, игнорировать ошибки.

**Проблема**: В production большинство проблем — обработка errors.

✅ **Правильно**: Документировать все значимые Exception Flows:
- Invalid input
- Service unavailable
- Timeout
- Insufficient permissions
- Business rule violations

### Ошибка 8: Abuse <<include>> вместо обычных шагов

❌ **Неправильно**: Каждый шаг делать отдельным included UC.

**Проблема**: Overengineering, сложность чтения.

✅ **Правильно**: Используйте <<include>> только для:
- Переиспользуемой функциональности (используется в 3+ UC)
- Комплексной логики, заслуживающей отдельного UC

---

## Best Practices

### 1. Большинство UC должны быть User-Goal Level (🌊 Sea)

Фокусируйтесь на задачах пользователя за одну сессию.

### 2. Документируйте Alternative и Exception Flows

Не ограничивайтесь только Happy Path — real value в обработке вариаций и ошибок.

### 3. Используйте активный залог и четко указывайте субъект

✅ "User enters email"
✅ "System validates credentials"

❌ "Email is entered"
❌ "Credentials validated"

### 4. Preconditions должны быть verifiable

✅ "User is authenticated"
✅ "Cart contains items"

❌ "User is in good mood"
❌ "System is ready"

### 5. Один Use Case = одна цель актора

Не смешивайте множество целей в одном UC.

### 6. Use Case Diagrams — для overview, текст — для details

Diagram показывает big picture, текстовая спецификация — детали flows.

### 7. Трассируемость: UC → Test Cases

Каждый flow должен быть покрыт тестами.

### 8. Stakeholder review

Показывайте UC stakeholders, собирайте feedback — избегайте misunderstanding.

### 9. Итеративное уточнение

Начните с Brief UC → уточните до Fully Dressed по мере необходимости.

### 10. Используйте Use Cases вместе с User Stories в Agile

User Story для инициации → Use Case для детализации сложных flows.

---

## Заключение

**Use Cases** — мощный инструмент для детального описания взаимодействия пользователей с системой. Они помогают:

- **Документировать** все сценарии: основные, альтернативные, исключительные
- **Общаться** между business analysts, developers, testers
- **Тестировать** систему полностью (каждый flow → test case)
- **Оценивать** объем проекта (Use Case Points)

### 🎯 Ключевые принципы для запоминания

1. **Use Case** = последовательность шагов Actor ↔ System для достижения цели
2. **Actor** = роль (не человек), может быть пользователем или внешней системой
3. **Main Flow** = happy path без ошибок
4. **Alternative Flows** = другие пути к успеху (цель достигнута)
5. **Exception Flows** = обработка ошибок (цель НЕ достигнута)
6. **<<include>>** = обязательное включение, **<<extend>>** = опциональное расширение
7. **User-Goal Level (🌊)** = оптимальный уровень для большинства UC
8. **Fully Dressed** для критичных UC, **Brief** для ранних стадий
9. **System Boundary** разделяет систему (внутри) и actors (снаружи)
10. **Traceability**: Use Case Flows → Test Cases для полного покрытия

> 💡 **Золотое правило**: Use Case описывает ЧТО делает система (behavior), а не КАК (implementation). Детально, но на уровне бизнес-логики, не технических деталей.

Используйте Use Cases для формальной документации сложных систем, особенно когда нужна полная спецификация всех сценариев и исключений.
`;

async function createUseCasesLecture() {
  console.log('🚀 Создание лекции: Use Cases...\n');

  try {
    // 1. Найти тест
    const test = await prisma.test.findFirst({
      where: { title: 'Use Cases: Сценарии использования' },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "Use Cases: Сценарии использования" не найден!');
    }

    console.log(`✅ Тест найден: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    // 2. Создать лекцию
    const lecture = await prisma.lecture.create({
      data: {
        title: 'Use Cases: Сценарии использования',
        topic: 'Use Cases: Actor, Preconditions, Main/Alternative/Exception Flows, UML Diagrams',
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

createUseCasesLecture();
