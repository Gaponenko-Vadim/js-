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

const lectureContent = `# Трассируемость требований: Requirements Traceability Matrix

## Введение: Цепочка от идеи до кода

Представьте детектива, расследующего дело:
- 🔍 Нашли улику (bug в коде)
- ❓ Откуда она? Какое требование нарушено?
- ❓ Кто виноват? Какой тест пропустил?
- ❓ Что еще затронуто? Какие связанные части?

**Без трассируемости:**
- Часы на поиск связей
- Невозможно найти корень проблемы
- Риск пропустить зависимости

**С трассируемостью:**
- За минуты найти цепочку: Requirement → Design → Code → Test
- Понять влияние изменений
- Гарантировать покрытие

> 💡 **Аналогия**: Requirements Traceability Matrix (RTM) — это **карта связей** между всеми артефактами проекта. Как GPS для навигации в проекте.

**Факт**: По данным IEEE, проекты с RTM имеют на 60% меньше дефектов и на 40% быстрее находят проблемы.

В этой лекции вы узнаете:
- ✅ Что такое трассируемость требований
- ✅ Forward vs Backward traceability
- ✅ Requirements Traceability Matrix (RTM)
- ✅ Инструменты трассируемости
- ✅ Как поддерживать трассируемость
- ✅ Практические примеры

---

## Что такое трассируемость требований?

### Определение

> "Requirements Traceability (Трассируемость требований) — способность **проследить связи** между требованиями, дизайном, кодом, тестами и другими артефактами проекта в обоих направлениях"

### Зачем нужна трассируемость?

**1. Impact Analysis (Анализ влияния)**
\`\`\`
Question: "Требование FR-20 изменилось, что нужно обновить?"

With Traceability:
FR-20 → Design Doc Section 3.2
      → Code: payment.service.ts, order.controller.ts
      → Tests: TC-45, TC-46, TC-47

Answer: "3 файла кода + 3 теста нужно обновить"
\`\`\`

**2. Coverage Analysis (Анализ покрытия)**
\`\`\`
Question: "Все ли требования реализованы и протестированы?"

With Traceability:
FR-1 → ✅ Implemented → ✅ Tested
FR-2 → ✅ Implemented → ❌ NOT TESTED
FR-3 → ❌ NOT IMPLEMENTED

Answer: "FR-2 не протестирован, FR-3 не реализован"
\`\`\`

**3. Root Cause Analysis (Поиск причины)**
\`\`\`
Scenario: Bug найден в production

Bug → Test TC-30 (missed it)
    → Code payment.service.ts:125
    → Design payment-flow.md
    → Requirement FR-20

Root cause: FR-20 был неоднозначным → неправильно понят → bug
\`\`\`

**4. Compliance (Соответствие)**
\`\`\`
Auditor: "Докажите, что все security требования реализованы"

With RTM:
SEC-1 → Design → Code → Test → ✅
SEC-2 → Design → Code → Test → ✅
SEC-3 → Design → Code → Test → ✅

Evidence: "Вот RTM, все security требования покрыты"
\`\`\`

---

## Forward vs Backward Traceability

### Forward Traceability (Прямая)

**ЧТО:** От требований вперед к реализации

**Цепочка:**
\`\`\`
Requirement → Design → Code → Test → Deployment

Example:
FR-20: Payment processing
  ↓ Forward
Design: payment-flow.md (section 3.5)
  ↓ Forward
Code: payment.service.ts:100-250
  ↓ Forward
Tests: TC-45 (unit), TC-46 (integration)
  ↓ Forward
Deployment: v1.5 (deployed 2024-03-15)
\`\`\`

**Для чего:**
- Проверить что требование реализовано
- Найти все зависимые артефакты
- Impact analysis при изменении требования

### Backward Traceability (Обратная)

**ЧТО:** От реализации назад к требованиям

**Цепочка:**
\`\`\`
Test ← Code ← Design ← Requirement

Example:
Bug found in payment.service.ts:150
  ↑ Backward
What code? payment.service.ts (processPayment method)
  ↑ Backward
What design? payment-flow.md (section 3.5)
  ↑ Backward
What requirement? FR-20 (Payment processing)
  ↑ Backward
Who requested? Product Owner (for v1.5 milestone)
\`\`\`

**Для чего:**
- Найти почему код написан именно так
- Понять бизнес-обоснование
- Кто принял решение

---

## Requirements Traceability Matrix (RTM)

### Что это?

> "RTM — таблица связей между requirements и другими артефактами"

### Базовая RTM

| Req ID | Requirement | Design | Code | Test | Status |
|--------|-------------|--------|------|------|--------|
| FR-1 | User login | design.md:3.1 | auth.service.ts | TC-001, TC-002 | ✅ Done |
| FR-2 | Password reset | design.md:3.2 | auth.service.ts | TC-003 | ✅ Done |
| FR-3 | 2FA authentication | design.md:3.3 | auth.service.ts | - | ⚠️ Not tested |
| FR-4 | OAuth login | - | - | - | ❌ Not started |

### Расширенная RTM

| Req ID | Business Need | Design | Code | Unit Test | Integration Test | Status | Owner | Sprint |
|--------|---------------|--------|------|-----------|------------------|--------|-------|--------|
| FR-1 | BN-5 | DD-3.1 | auth.service.ts:10-50 | UT-001 | IT-001 | ✅ | Alice | S-3 |
| FR-2 | BN-5 | DD-3.2 | auth.service.ts:51-80 | UT-002 | IT-002 | ✅ | Alice | S-3 |
| FR-3 | BN-8 | DD-3.3 | auth.service.ts:81-120 | UT-003 | - | ⚠️ | Bob | S-4 |

**Legends:**
- BN = Business Need
- DD = Design Document
- UT = Unit Test
- IT = Integration Test

### Анализ RTM

**Coverage Analysis:**
\`\`\`
Total Requirements: 50
Implemented: 45 (90%)
Tested: 40 (80%)
Deployed: 38 (76%)

Gaps:
- 5 requirements not implemented
- 5 implemented but not tested
- 2 tested but not deployed

Action Items:
1. Implement FR-45 to FR-49 (Sprint 6)
2. Write tests for FR-3, FR-10, FR-22, FR-30, FR-35
3. Deploy FR-39, FR-40 (hotfix release)
\`\`\`

---

## Типы трассируемости

### 1. Requirements to Requirements

**ЧТО:** Связи между требованиями

**Примеры:**
\`\`\`
FR-20: Payment processing
  depends on → FR-10: User authentication (must be logged in)
  depends on → FR-15: Cart management (must have items)
  conflicts with → FR-25: Guest checkout (no auth required)

NFR-5: Response time < 300ms
  impacts → FR-20: Payment (complex logic may slow down)
  supports → BR-10: Good UX (fast payments)
\`\`\`

### 2. Requirements to Design

**ЧТО:** Какие design documents покрывают требование

**Пример:**
\`\`\`
FR-20: Payment processing
  → Architecture Diagram: payment-architecture.png
  → Sequence Diagram: payment-flow.puml
  → Database Schema: payment_transactions table
  → API Spec: POST /api/payments (OpenAPI)
\`\`\`

### 3. Requirements to Code

**ЧТО:** Какой код реализует требование

**Пример:**
\`\`\`
FR-20: Payment processing
  → payment.service.ts:100-250 (core logic)
  → payment.controller.ts:50-80 (API endpoint)
  → payment.validator.ts:10-40 (validation)
  → stripe.client.ts:20-100 (Stripe integration)

Total: 4 files, ~300 lines of code
\`\`\`

### 4. Requirements to Tests

**ЧТО:** Какие тесты верифицируют требование

**Пример:**
\`\`\`
FR-20: Payment processing
  Unit Tests:
    → payment.service.spec.ts:50-150 (core logic)
    → payment.validator.spec.ts:10-50 (validation)

  Integration Tests:
    → payment.integration.spec.ts:100-300 (Stripe API)

  E2E Tests:
    → payment-flow.e2e.spec.ts:50-200 (full flow)

Total: 4 test files, 350 lines of tests
\`\`\`

---

## Инструменты трассируемости

### 1. Manual (Таблицы)

**Инструменты:** Excel, Google Sheets, Confluence tables

**Пример:**
\`\`\`
spreadsheet: traceability-matrix.xlsx
Columns: Req ID | Title | Design | Code | Test | Status

Pros:
- ✅ Simple
- ✅ Flexible
- ✅ No tool required

Cons:
- ❌ Manual updates (error-prone)
- ❌ No automation
- ❌ Scales poorly (>100 requirements)
\`\`\`

### 2. JIRA + Linking

**Инструмент:** Atlassian JIRA

**Как:**
\`\`\`
Requirement: PROJ-100 "Payment processing"
  ↓ "implemented by"
Task: PROJ-150 "Implement payment API"
  ↓ "tested by"
Test: PROJ-200 "Payment tests"

Link types:
- "depends on"
- "blocks"
- "implements"
- "tests"
\`\`\`

**Pros:**
- ✅ Integrated (все в JIRA)
- ✅ Clickable links
- ✅ Reports

**Cons:**
- ⚠️ Requires discipline (manual linking)

### 3. Code Annotations

**Инструмент:** Comments in code

**Пример:**
\`\`\`typescript
/**
 * Implements FR-20: Payment processing
 * Related: Design doc section 3.5
 * Tests: payment.service.spec.ts
 */
export class PaymentService {
  /**
   * Processes payment
   * @implements FR-20.1 (Stripe integration)
   */
  async processPayment(order: Order): Promise<Payment> {
    // ...
  }
}

/**
 * @tests FR-20
 * @tests FR-20.1 (Stripe integration)
 * @tests FR-20.2 (Error handling)
 */
describe('PaymentService', () => {
  // ...
});
\`\`\`

**Extraction:**
\`\`\`bash
# Extract traceability from code
grep -r "@implements" src/ | awk '{print $2}'

Output:
FR-20
FR-20.1
FR-21
...
\`\`\`

### 4. Specialized Tools

**Инструменты:**
- IBM DOORS (enterprise, дорого)
- Jama Connect (ALM tool)
- ReqView (lightweight)
- Helix RM (Perforce)

**Возможности:**
- ✅ Automated traceability
- ✅ Impact analysis
- ✅ Coverage reports
- ✅ Compliance reports

**Cons:**
- ❌ Дорого ($$$)
- ❌ Сложно настраивать

---

## Как поддерживать трассируемость

### 1. Naming Convention (Соглашение об именовании)

**Что делать:** Использовать ID требований везде

**Пример:**
\`\`\`
Git commit:
"[FR-20] Implement payment processing"

Pull Request:
"Implements FR-20: Payment processing"
Related: FR-10, FR-15

Branch name:
feature/FR-20-payment-processing

Test file:
payment.service.spec.ts
// @tests FR-20

JIRA ticket:
PROJ-150: Implement FR-20 (Payment processing)
\`\`\`

### 2. Definition of Done (DoD)

**Требование:** Задача не Done пока нет трассируемости

**Checklist:**
\`\`\`
☐ Code written
☐ Tests written
☐ Code review passed
☐ Traceability documented:
  ☐ Requirement ID in code comment
  ☐ Requirement ID in test
  ☐ Requirement ID in commit message
  ☐ Link in JIRA
  ☐ RTM updated
\`\`\`

### 3. Automated Checks

**CI Pipeline:**
\`\`\`yaml
# .github/workflows/traceability-check.yml
name: Traceability Check

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check requirement links
        run: |
          # Check PR description has requirement ID
          if ! echo "$PR_BODY" | grep -E "(FR|NFR)-[0-9]+"; then
            echo "❌ Missing requirement ID in PR description"
            exit 1
          fi

          # Check commits have requirement ID
          for commit in $(git log --format=%B origin/main..HEAD); do
            if ! echo "$commit" | grep -E "\[(FR|NFR)-[0-9]+\]"; then
              echo "⚠️ Commit missing requirement ID: $commit"
            fi
          done
\`\`\`

### 4. Regular Audits

**Процесс:**
\`\`\`
Monthly: Traceability Audit
1. Export RTM
2. Check coverage:
   - Any requirements not implemented?
   - Any code without requirement link?
   - Any tests without requirement link?
3. Fix gaps
4. Report to stakeholders
\`\`\`

---

## Практические сценарии

### Сценарий 1: Impact Analysis для изменения требования

**Ситуация:** FR-20 изменилось (добавлена поддержка Apple Pay)

**Процесс с RTM:**
\`\`\`
Step 1: Найти FR-20 в RTM

FR-20: Payment processing
  Design: payment-flow.md:3.5
  Code: payment.service.ts:100-250
       stripe.client.ts:20-100
  Tests: TC-45, TC-46, TC-47

Step 2: Impact Analysis

Affected:
- payment-flow.md → Update: добавить Apple Pay flow
- payment.service.ts → Modify: add applePayProvider()
- stripe.client.ts → No change (Stripe supports Apple Pay)
- TC-45 → Update: test Apple Pay scenario

New:
- apple-pay.client.ts → Create new
- TC-48 → Create: Apple Pay integration test

Effort Estimate:
- Design update: 2 hours
- Code changes: 8 hours
- New code: 6 hours
- Test updates: 4 hours
- Total: 20 hours (2.5 days)

Step 3: Communicate

Email stakeholders:
"FR-20 change impacts 3 files + 1 new file + 4 tests.
Estimated: 2.5 days.
Can fit in current sprint? Or defer to next?"
\`\`\`

### Сценарий 2: Coverage Report для audit

**Ситуация:** Compliance audit, нужно доказать что все security требования покрыты

**Процесс:**
\`\`\`
Step 1: Фильтр RTM по security requirements

Security Requirements (SEC-*):
SEC-1: HTTPS only
SEC-2: Password hashing (bcrypt)
SEC-3: JWT authentication
SEC-4: Rate limiting
SEC-5: SQL injection prevention

Step 2: Coverage Check

SEC-1 → ✅ Implemented → ✅ Tested → ✅ Deployed
SEC-2 → ✅ Implemented → ✅ Tested → ✅ Deployed
SEC-3 → ✅ Implemented → ✅ Tested → ✅ Deployed
SEC-4 → ✅ Implemented → ❌ NOT TESTED → ⚠️ Deployed
SEC-5 → ✅ Implemented → ✅ Tested → ✅ Deployed

Gap: SEC-4 не протестирован

Step 3: Fix gap

Create: TC-SEC-4 "Rate limiting test"
Run test: ✅ Passed
Update RTM: SEC-4 → ✅ Tested

Step 4: Generate report

Coverage Report:
Security Requirements: 5/5 (100%) implemented
                       5/5 (100%) tested
                       5/5 (100%) deployed

Evidence: RTM + test results + deployment logs

Auditor: ✅ Approved
\`\`\`

### Сценарий 3: Root Cause Analysis для bug

**Ситуация:** Bug в production (платежи иногда дублируются)

**Процесс:**
\`\`\`
Step 1: Identify bug location

Bug: payment.service.ts:150 (processPayment method)

Step 2: Backward traceability

Code: payment.service.ts:150
  ↑ Implements
Design: payment-flow.md:3.5.2 "Idempotency handling"
  ↑ Specifies
Requirement: FR-20.3 "Payments must be idempotent"

Step 3: Check test coverage

FR-20.3 → Test: TC-47 "Idempotency test"

Review TC-47:
Test covers:
✅ Duplicate requests with same idempotency key
❌ NOT COVERED: Concurrent requests (race condition)

Step 4: Root Cause

Root Cause: Test gap (concurrent requests not tested)
-> Bug slipped through

Step 5: Fix

1. Fix code: Add mutex/lock for concurrent requests
2. Update test: TC-47.1 "Concurrent idempotency test"
3. Update design: payment-flow.md (clarify concurrency)
4. Update RTM: FR-20.3 → TC-47, TC-47.1

Step 6: Prevention

Add to DoD:
"Consider concurrency scenarios in tests"
\`\`\`

### Сценарий 4: Поддержка legacy code

**Ситуация:** Новый разработчик, нужно изменить старый код

**Проблема без трассируемости:**
\`\`\`
Developer: "Что делает этот код? Зачем он здесь?"
Code: 500 lines, написано 3 года назад, автор уволился
Developer: Часы на изучение кода, риск сломать
\`\`\`

**С трассируемостью:**
\`\`\`
Step 1: Check code comment

/**
 * @implements FR-35: Legacy payment gateway integration
 * Added: 2021-03-15
 * Author: john@company.com
 * Context: Required for EU customers (PayPal not available)
 */

Step 2: Check RTM

FR-35: Legacy gateway
  Business Need: BN-15 (EU market expansion)
  Design: legacy-gateway-integration.md
  Status: Active (still needed)
  Dependencies: FR-20 (payment processing)

Step 3: Understanding

Now developer knows:
- Why code exists (EU customers)
- Business context (market expansion)
- Is it still needed? (Yes, active)
- Where to find docs (legacy-gateway-integration.md)

Result: 5 minutes instead of hours
\`\`\`

---

## Best Practices

### 1. Automate где возможно

✅ **Что делать:** Использовать инструменты для автоматического извлечения связей

**Пример:** Code annotations → script → RTM

### 2. Keep it Simple

✅ **Что делать:** Не усложнять

**Bad:** 20 columns в RTM
**Good:** 6 columns (Req ID, Title, Code, Test, Status, Owner)

### 3. Living Document

✅ **Что делать:** RTM обновляется постоянно, не только в конце

### 4. Bi-directional Links

✅ **Что делать:** Связи работают в обе стороны (forward + backward)

### 5. Traceability в DoD

✅ **Что делать:** Requirement ID обязателен в коде, тестах, commits

---

## Заключение

Трассируемость требований — это **карта навигации проекта**. Без нее вы блуждаете в темноте. С ней — всегда знаете где вы, откуда пришли, куда идете.

### Ключевые моменты

🎯 **Traceability**: Связи requirements ↔ design ↔ code ↔ tests

🎯 **RTM**: Центральная таблица всех связей

🎯 **Forward**: От требования к реализации (coverage analysis)

🎯 **Backward**: От кода к требованию (root cause analysis)

🎯 **Automation**: Инструменты + процессы для поддержания трассируемости

> 💡 **Помните:** "If you can't trace it, you can't manage it!"
`;

async function createTraceabilityMatrixLecture() {
  try {
    console.log('🚀 Создание лекции "Трассируемость требований: RTM"...\n');

    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'Трассируемость требований' }
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "Трассируемость требований" не найден!');
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    const lecture = await prisma.lecture.create({
      data: {
        title: 'Трассируемость требований: Requirements Traceability Matrix',
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
    console.log('🎉 Готово! Лекция "Трассируемость требований: RTM" создана.');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTraceabilityMatrixLecture();
