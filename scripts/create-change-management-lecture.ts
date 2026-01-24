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

const lectureContent = `# Управление изменениями требований (Change Management)

## Введение: Ремонт квартиры и изменение планов

Представьте, что вы делаете ремонт квартиры:
- 📐 Нарисовали план: кухня 12м², гостиная 20м², спальня 15м²
- 🔨 Строители начали работу (2 недели)
- 💭 Вы передумали: "А давайте кухню-гостиную сделаем! Снести стену!"

**Что произойдет?**
- ⏱️ Задержка: перепланировка +2 недели
- 💰 Перерасход: демонтаж стены, новые материалы
- 📄 Документы: новое согласование перепланировки
- 😤 Конфликт: строители недовольны

> 💡 **Аналогия**: Изменение требований в IT-проекте — это как изменение плана ремонта во время работы. Чем позже меняем, тем дороже. **Change Management (Управление изменениями)** — процесс контроля этих изменений.

**Факт**: По исследованиям Standish Group, 70% проектов выходят за рамки бюджета из-за **scope creep (расползание scope)** — неконтролируемого добавления требований.

В этой лекции вы узнаете:
- ✅ Что такое Change Management и зачем он нужен
- ✅ Процесс управления изменениями (Change Request)
- ✅ Impact Analysis — анализ влияния изменений
- ✅ Версионирование требований
- ✅ Scope Creep и как его избежать
- ✅ Практические сценарии и best practices

---

## Что такое Change Management?

### Определение

> "Change Management (Управление изменениями) — формальный процесс **контроля изменений требований**: регистрация запросов, оценка влияния, принятие решения, реализация и отслеживание"

### Простыми словами

**Без Change Management:**
❌ Stakeholder: "А добавьте еще кнопку!"
❌ Разработчик: "Ок, добавляем"
❌ Проект: Выход за сроки, бюджет, хаос

**С Change Management:**
✅ Stakeholder: "Хочу добавить кнопку"
✅ Процесс: Change Request → Impact Analysis → Одобрение → Реализация
✅ Проект: Контроль сроков, бюджета, качества

### Зачем нужен Change Management?

**1. Контроль Scope Creep (расползание границ)**
- Проект начинался с 20 требованиями
- Без контроля: через 3 месяца 50 требований
- С контролем: понятно, что новое, почему добавлено, как влияет

**2. Прозрачность затрат**
- "Добавить кнопку" кажется простым
- На деле: design (2 часа) + frontend (4 часа) + backend (6 часов) + тесты (4 часа) = 2 дня
- С Change Management: stakeholder видит реальную стоимость

**3. Приоритизация**
- Нельзя сделать все изменения
- Нужно выбрать самые важные
- Change Management помогает ранжировать

**4. Документация**
- История изменений
- Почему приняли решение
- Кто одобрил

---

## Процесс Change Management

### Этапы процесса

\`\`\`
1. Change Request (Запрос на изменение)
   ↓
2. Impact Analysis (Анализ влияния)
   ↓
3. Change Review (Обзор изменения)
   ↓
4. Decision (Решение: Approve / Reject / Defer)
   ↓
5. Implementation (Реализация)
   ↓
6. Verification (Проверка)
   ↓
7. Close (Закрытие)
\`\`\`

### Шаг 1: Change Request (CR)

**ЧТО:** Формальный запрос на изменение требований

**КТО может создать:** Заказчик, Product Owner, пользователи, команда разработки

**Шаблон Change Request:**
\`\`\`
CR ID: CR-001
Date: 2024-03-15
Requested by: Иванов А.А. (Product Owner)
Priority: High / Medium / Low
Type: New Feature / Enhancement / Bug Fix / Removal

Title: Добавить фильтр по дате в историю операций

Current Situation:
Пользователи видят всю историю операций (может быть 1000+ записей).
Долго прокручивать, неудобно искать конкретную транзакцию.

Proposed Change:
Добавить фильтр "За последние 7 дней / 30 дней / 3 месяца / Все время"
+ Date picker для выбора кастомного диапазона

Business Justification:
- 40% пользователей жалуются на неудобство (опрос 500 человек)
- Конкуренты уже имеют этот функционал
- Ожидаемое улучшение NPS: +0.5

Affected Requirements:
- FR-10: История операций (изменение)

Impact (preliminary):
- Backend: новый API endpoint с query params
- Frontend: UI компонент фильтра
- Database: добавить индекс на дату

Estimated Effort: TBD (после Impact Analysis)

Attachments:
- mockup.png (дизайн фильтра)
\`\`\`

### Шаг 2: Impact Analysis (Анализ влияния)

**ЧТО:** Детальная оценка, как изменение повлияет на проект

**КТО проводит:** Бизнес-аналитик, Техлид, Архитектор

**Аспекты анализа:**

**1. Technical Impact (Технический)**
\`\`\`
Backend:
- Новый endpoint: GET /transactions?startDate=X&endDate=Y
- Изменить query: добавить WHERE created_at BETWEEN
- Добавить индекс: CREATE INDEX idx_transactions_date ON transactions(created_at)
- Effort: 6 часов

Frontend:
- Новый компонент DateFilter.tsx
- Интеграция с существующим TransactionHistory
- Effort: 8 часов

Testing:
- Unit tests: 4 часа
- Integration tests: 4 часа
- Manual QA: 4 часа

Total: 26 часов (3.5 дня)
\`\`\`

**2. Schedule Impact (Влияние на сроки)**
\`\`\`
Current Sprint: Week 5 of 8
Remaining capacity: 80 hours

Options:
A. Add to current sprint: Риск не успеть другие задачи
B. Next sprint: Без риска, но задержка на 2 недели
C. Separate mini-sprint: Дополнительные затраты

Recommendation: Option B (Next sprint)
\`\`\`

**3. Cost Impact (Стоимость)**
\`\`\`
Development: 26 hours × $50/hour = $1,300
Testing: Already included
Deployment: $0 (automated)
Maintenance: +2 hours/month ($100/month)

Total one-time cost: $1,300
Annual maintenance: $1,200
\`\`\`

**4. Risk Impact (Риски)**
\`\`\`
Technical Risks:
- Risk 1: Database index может замедлить INSERT операции
  Mitigation: Протестировать на staging
  Probability: Low

- Risk 2: Фильтр может вернуть 10,000+ записей (не задан лимит)
  Mitigation: Добавить pagination
  Probability: Medium → Add to scope

Business Risks:
- Risk 3: Пользователи не будут использовать фильтр
  Mitigation: A/B тест, аналитика
  Probability: Low (есть запросы)
\`\`\`

**5. Dependencies (Зависимости)**
\`\`\`
Depends on:
- None

Blocks:
- CR-005: "Export transactions to CSV" (нужен тот же фильтр)
\`\`\`

### Шаг 3: Change Review (Обзор)

**ЧТО:** Встреча Change Control Board (CCB)

**КТО участвует:**
- Change Manager (ведущий)
- Product Owner
- Technical Lead
- Представитель заказчика
- Бизнес-аналитик

**Agenda (30 минут):**
\`\`\`
1. Presentation (5 мин): Автор представляет CR-001
2. Impact Analysis (10 мин): Обзор анализа влияния
3. Discussion (10 мин): Вопросы, альтернативы
4. Voting (5 мин): Approve / Reject / Defer
\`\`\`

**Критерии оценки:**
- ✅ Business value: Высокая (40% пользователей хотят)
- ✅ Cost: Приемлемая ($1,300)
- ✅ Risk: Низкий (легко реализовать)
- ⚠️ Schedule: Задержка на 2 недели (приемлемо)

**Альтернативы:**
- A1: Упрощенная версия (только 3 preset фильтра, без date picker) → 1 день вместо 3.5
- A2: Отложить до v2.0

### Шаг 4: Decision (Решение)

**Варианты решения:**

**Approve (Одобрить)**
\`\`\`
Decision: APPROVED with modifications

Approved Scope:
- Preset filters: Last 7 days, 30 days, 3 months
- Date picker: DEFER to v2.0 (reduce scope)

Effort: 1.5 days (reduced)
Schedule: Next sprint (Week 9-10)
Budget: Approved $700

Next Steps:
- Update requirements document
- Create Jira ticket
- Assign to dev team
\`\`\`

**Reject (Отклонить)**
\`\`\`
Decision: REJECTED

Reason: Low ROI (Return on Investment)
Only 5% users requested, cost $1,300

Alternative: Keep in backlog, revisit in 6 months
\`\`\`

**Defer (Отложить)**
\`\`\`
Decision: DEFERRED

Reason: Not enough capacity in Q1
Good idea, but lower priority than security updates

Revisit: Q2 planning (April 2024)
\`\`\`

### Шаг 5-7: Implementation, Verification, Close

После одобрения:
1. **Implementation**: Разработка согласно обновленным требованиям
2. **Verification**: Тестирование, UAT
3. **Close**: Закрытие CR, обновление документации

---

## Impact Analysis (Детальный анализ)

### Модель анализа: 5 измерений

**1. Scope (Границы)**
- Какие модули затронуты?
- Какие требования изменяются?
- Что добавляется, что удаляется?

**2. Schedule (Сроки)**
- Сколько времени займет?
- Как повлияет на текущий план?
- Нужны ли дополнительные ресурсы?

**3. Cost (Стоимость)**
- Development cost
- Testing cost
- Deployment cost
- Maintenance cost

**4. Quality (Качество)**
- Риски для стабильности?
- Регрессионные баги?
- Нужно ли refactoring?

**5. Resources (Ресурсы)**
- Кто будет делать?
- Достаточно ли экспертизы?
- Нужен ли training?

### Шаблон Impact Analysis

\`\`\`markdown
# Impact Analysis: CR-001

## Executive Summary
Change adds date filter to transaction history.
Effort: 26 hours | Cost: $1,300 | Risk: Low

## Detailed Impact

### Functional Impact
Affected Requirements:
- FR-10: Transaction History → ADD filter functionality
- NFR-5: Performance → Need to test with filters

New Requirements:
- FR-10.1: Preset filters (7 days, 30 days, 3 months)
- FR-10.2: Date picker (custom range)
- NFR-5.1: Filtered query < 300ms

### Technical Impact
Components Changed:
- Backend: TransactionController, TransactionService
- Database: Add index on created_at
- Frontend: TransactionHistory component
- API: New query parameters

Architecture Changes:
- None (fits existing architecture)

### Testing Impact
Test Cases:
- Update: TC-10 (Transaction History)
- New: TC-10.1, TC-10.2, TC-10.3
- Regression: Run full test suite

### Documentation Impact
Documents to Update:
- API Documentation (OpenAPI spec)
- User Manual (How to use filters)
- SRS (Section 3.2.5)

### Training Impact
Team Training: None required
User Training: Help tooltip in UI

## Risks
[See Шаг 2 above]

## Recommendation
APPROVE with scope reduction (defer date picker to v2.0)
\`\`\`

---

## Версионирование требований

### Зачем версионировать?

**Проблема без версий:**
- Изменили требование → никто не помнит, как было раньше
- Спор: "Вы обещали фичу X!" — "Нет, мы договорились на Y"
- Нет истории изменений

**С версиями:**
- ✅ История всех изменений
- ✅ Можно вернуться к предыдущей версии
- ✅ Понятно, кто и когда изменил

### Semantic Versioning для требований

**Формат: MAJOR.MINOR.PATCH**

**MAJOR** (1.0.0 → 2.0.0): Кардинальные изменения
- Удаление требований
- Изменение core функциональности
- Breaking changes

**MINOR** (1.0.0 → 1.1.0): Новые функции
- Добавление новых требований
- Расширение существующих
- Backward compatible

**PATCH** (1.0.0 → 1.0.1): Исправления
- Уточнение формулировок
- Исправление опечаток
- Clarifications

**Пример:**
\`\`\`
SRS v1.0.0 (Initial Release)
- 50 требований

SRS v1.1.0 (Added Authentication)
- Added FR-51 to FR-55: OAuth login
- Updated FR-10: Login now supports OAuth

SRS v1.1.1 (Clarifications)
- Updated FR-52: Clarified OAuth provider list

SRS v2.0.0 (Major Refactor)
- Removed FR-20 to FR-25 (old payment system)
- Added FR-60 to FR-70 (new payment API)
- Breaking change: Payment flow completely redesigned
\`\`\`

### Changelog (Журнал изменений)

**Пример:**
\`\`\`markdown
# Changelog: BRD - Online Banking

## [2.0.0] - 2024-03-15
### Changed
- BR-10: Changed target NPS from 7.0 to 8.5 (market research)

### Removed
- BR-15: Credit card application (moved to separate project)

## [1.2.0] - 2024-02-20
### Added
- BR-20: Multi-currency support (EUR, USD, RUB)
- BR-21: International transfers (SWIFT)

### Changed
- BR-5: Updated transaction limit from 100K to 500K

## [1.1.0] - 2024-01-10
### Added
- BR-18: Biometric authentication (Touch ID, Face ID)

## [1.0.0] - 2023-12-01
### Initial Release
- 15 business requirements
\`\`\`

---

## Scope Creep (Расползание границ)

### Определение

> "Scope Creep — неконтролируемое **постепенное расширение границ проекта** через добавление новых требований без корректировки сроков, бюджета или ресурсов"

### Как выглядит Scope Creep

**Пример проекта:**
\`\`\`
Week 1:
Scope: 20 требований
Deadline: 8 недель
Budget: $100,000

Week 3:
Заказчик: "А давайте добавим экспорт в Excel"
Команда: "Ок" (+ 2 требования)

Week 5:
Заказчик: "А можно еще фильтры по 10 полям?"
Команда: "Ок" (+ 5 требований)

Week 7:
Заказчик: "Хочу Dashboard с графиками"
Команда: "Ок" (+ 8 требований)

Week 8:
Scope: 35 требований (было 20)
Deadline: Missed (нужно еще 4 недели)
Budget: Exceeded ($150,000)
Team: Burnout
\`\`\`

### Причины Scope Creep

**1. Нет формального Change Management**
- Изменения добавляются устно
- Нет оценки влияния
- Нет одобрения

**2. "Just add this small thing"**
- Кажется маленьким
- На деле: 3 дня работы

**3. Плохо определенные требования**
- Изначально scope неясен
- "Додумываем" по ходу

**4. Неконтролируемые stakeholders**
- Каждый добавляет "свою фичу"
- Нет приоритизации

### Как избежать Scope Creep

**1. Формальный Change Request процесс**
✅ Любое изменение → CR
✅ Impact Analysis обязателен
✅ Одобрение CCB

**2. Baseline (Базовая линия)**
\`\`\`
Зафиксировать изначальный scope:

Approved Scope Baseline v1.0:
- 20 functional requirements
- 5 non-functional requirements
- Deadline: March 31, 2024
- Budget: $100,000

Любое изменение → Change Request
\`\`\`

**3. Приоритизация (MoSCoW)**
\`\`\`
Must Have: 20 req (в scope)
Should Have: 10 req (если успеем)
Could Have: 15 req (backlog)
Won't Have: 20 req (точно нет)

Новая фича → в Could Have / Won't Have
\`\`\`

**4. Trade-off (Компромисс)**
\`\`\`
Заказчик: "Хочу добавить Dashboard"
Команда: "Ok, но нужно +2 недели и +$20,000.
         Или убираем Export feature (2 недели экономии)"

Trade-off: Добавить A → убрать B или продлить deadline
\`\`\`

**5. "No" — это тоже ответ**
✅ Команда имеет право сказать "Нет"
✅ Объяснить почему (Impact Analysis)
✅ Предложить альтернативу

---

## Практические сценарии

### Сценарий 1: Критическое изменение во время разработки

**Ситуация**: Week 6 of 8, заказчик хочет изменить core функциональность

**Change Request:**
\`\`\`
CR-015
Title: Change payment provider from Stripe to PayPal

Reason: PayPal offers better rates (1.5% vs 2.9%)

Impact Analysis:
- Backend: Полная переработка PaymentService (40 hours)
- Frontend: Изменение UI flow (16 hours)
- Testing: Полное regression testing (24 hours)
- Total: 80 hours (2 weeks)

Current Status:
- Week 6 of 8
- Remaining capacity: 80 hours
- This change: 80 hours

Conclusion: NOT FEASIBLE in current timeline
\`\`\`

**Decision:**
\`\`\`
Options:
A. Extend deadline by 2 weeks → April 14
B. Defer to Phase 2 (after initial release)
C. Hybrid: Keep Stripe for v1.0, add PayPal in v1.1

Approved: Option C (Hybrid)
- Launch v1.0 with Stripe (on time)
- Add PayPal in v1.1 (1 month later)
- Budget: Approve $4,000 for v1.1
\`\`\`

> 💡 **Вывод**: Impact Analysis показал реальную стоимость, нашли компромисс

### Сценарий 2: Scope Creep prevention

**Ситуация**: Заказчик просит "маленькую" фичу каждую неделю

**Week 3:**
\`\`\`
Заказчик: "Можно добавить кнопку 'Экспорт в Excel'?"
Команда: Impact Analysis → 12 hours

Объяснение заказчику:
"Экспорт в Excel выглядит просто, но требует:
- Backend: Generate Excel file (library integration)
- Handle large datasets (10,000+ rows)
- Testing different Excel versions
- Error handling (file too large, out of memory)

Estimated: 12 hours ($600)

Options:
A. Add to current sprint (риск other tasks)
B. Add to backlog for next sprint
C. Reduce scope: Export only first 1000 rows (4 hours)

Your choice?"
\`\`\`

**Результат**: Заказчик выбрал Option C (reduced scope)

**Week 5:**
\`\`\`
Заказчик: "Давайте добавим еще 5 фильтров"
Команда: Impact Analysis → 20 hours

Conversation:
"Это еще 20 hours ($1,000).

Current situation:
- Baseline: $100,000, Deadline: March 31
- Already added: $2,000 in changes
- This request: $1,000
- Total changes: $3,000 (3% over budget)

Trade-off needed:
- Extend budget by $3,000, OR
- Remove lower-priority features

Which features can we defer?"
\`\`\`

**Результат**: Заказчик понял реальную стоимость, отложил 2 low-priority фичи

> 💡 **Вывод**: Прозрачность затрат останавливает Scope Creep

### Сценарий 3: Версионирование при major change

**Ситуация**: Изменение архитектуры после 3 месяцев разработки

**Change:**
\`\`\`
Initial Architecture (v1.0):
- Monolith application
- Single database
- Requirements: FR-1 to FR-50

Proposed Change:
- Microservices architecture
- Multiple databases
- Complete redesign

Impact:
- 60% requirements need rewrite
- 3 months additional development
- $50,000 additional cost
\`\`\`

**Decision Process:**
\`\`\`
CCB Meeting:
1. Present business case:
   - Current: Monolith hits scaling limits at 10K users
   - Target: Need to scale to 100K users
   - Microservices: Can scale to 1M+ users

2. Options:
   A. Continue monolith → Rewrite in 1 year (technical debt)
   B. Switch now → 3 months delay, but future-proof
   C. Hybrid → Keep monolith, add microservices for new features

3. Decision: Option B (Switch now)
   - Long-term benefit > short-term cost
   - Better to do now than later
\`\`\`

**Versioning:**
\`\`\`
Requirements v1.0 → DEPRECATED
Requirements v2.0 → NEW BASELINE

Changelog:
## [2.0.0] - BREAKING CHANGES
### Architectural Shift
- Moved to microservices
- Rewritten: FR-10 to FR-40
- Added: FR-51 to FR-60 (service boundaries)
- Removed: FR-45 to FR-50 (monolith-specific)

### Migration Plan
- v1.0 deprecated: June 2024
- v2.0 production: July 2024
\`\`\`

> 💡 **Вывод**: Major change = Major version, четкая коммуникация stakeholders

### Сценарий 4: Managing multiple change requests

**Ситуация**: 10 Change Requests одновременно, нужна приоритизация

**Change Requests:**
\`\`\`
CR-020: Add dark mode (8 hours, Low priority)
CR-021: Fix critical security vulnerability (16 hours, CRITICAL)
CR-022: Export to PDF (12 hours, Medium priority)
CR-023: Add push notifications (40 hours, High priority)
CR-024: Improve search performance (24 hours, High priority)
CR-025: Add social login (20 hours, Medium priority)
...
CR-029: UI redesign (80 hours, Low priority)
\`\`\`

**Prioritization Matrix:**

| CR ID | Effort | Priority | Business Value | Risk | Score |
|-------|--------|----------|----------------|------|-------|
| CR-021 | 16h | CRITICAL | Critical | High if not fixed | 100 |
| CR-024 | 24h | High | High (user complaints) | Low | 85 |
| CR-023 | 40h | High | High (retention) | Medium | 75 |
| CR-022 | 12h | Medium | Medium | Low | 55 |
| CR-025 | 20h | Medium | Medium | Low | 50 |
| CR-020 | 8h | Low | Low (nice-to-have) | Low | 20 |
| CR-029 | 80h | Low | Low | High (major change) | 10 |

**Decision:**
\`\`\`
Approved for Current Sprint:
✅ CR-021: Security fix (CRITICAL, must do)
✅ CR-024: Performance (High value, reasonable effort)

Approved for Next Sprint:
✅ CR-023: Push notifications (High value, but 40h)

Backlog:
⏸️ CR-022, CR-025: Good ideas, lower priority

Rejected:
❌ CR-020: Nice-to-have, low ROI
❌ CR-029: Too risky, too big, low priority
\`\`\`

> 💡 **Вывод**: Приоритизация по матрице Value vs Effort vs Risk

### Сценарий 5: Rolling back a change

**Ситуация**: Реализовали изменение, но оно вызвало проблемы

**Timeline:**
\`\`\`
Week 10:
- Implemented CR-030: New caching layer
- Deployed to production

Week 11:
- Users report: System 50% slower (!!!!)
- Bug: Cache invalidation не работает, stale data
- Business impact: Revenue down 20%

Emergency Decision:
- ROLLBACK CR-030 immediately
- Revert to v1.5 (before caching)
- Hot fix deployed in 2 hours
\`\`\`

**Post-Mortem:**
\`\`\`
Root Cause:
- Insufficient testing of cache invalidation
- No performance testing with real load

Lessons Learned:
1. Impact Analysis недооценил риск
2. Testing plan не включал cache scenarios
3. No rollback plan prepared

Changes to Process:
- Add "Rollback Plan" to Impact Analysis
- Require performance testing for NFR changes
- Canary deployment (5% users first)
\`\`\`

**Versioning:**
\`\`\`
v1.6 (CR-030 Caching) → REVERTED
v1.5 → RESTORED

Changelog:
## [1.6.1] - Hotfix
### Reverted
- Reverted v1.6 caching changes (performance issues)
- Restored v1.5 baseline

### Next Steps
- CR-030 moved back to development
- Additional testing required
- Resubmit as CR-030-v2
\`\`\`

> 💡 **Вывод**: Rollback plan должен быть частью каждого Change Request

---

## Типичные ошибки

### Ошибка 1: "Just add this small thing"

❌ **Неправильно**:
\`\`\`
Заказчик: "Просто добавьте кнопку"
Команда: "Ok, добавляем" (без анализа)
\`\`\`

**Проблема**: "Кнопка" требует:
- Design
- Frontend
- Backend logic
- Testing
- = 12 часов, не "просто"

✅ **Правильно**: Всегда делать Impact Analysis

> 💡 **Совет**: Нет "маленьких" изменений, есть изменения с разной стоимостью

### Ошибка 2: Изменения без документирования

❌ **Неправильно**: Изменения по Slack/Email, не зафиксированы

**Проблема**: Через месяц никто не помнит, что решили

✅ **Правильно**: Change Request в системе (JIRA, Confluence)

> 💡 **Совет**: Если не задокументировано — не произошло

### Ошибка 3: Нет Change Control Board

❌ **Неправильно**: Каждый может менять требования

**Проблема**: Хаос, противоречивые изменения

✅ **Правильно**: CCB принимает решения

> 💡 **Совет**: Одна точка принятия решений

### Ошибка 4: Игнорирование Impact Analysis

❌ **Неправильно**: "Давайте быстро добавим, потом разберемся"

**Проблема**: Технический долг, баги, задержки

✅ **Правильно**: Сначала Impact Analysis, потом решение

> 💡 **Совет**: 1 час анализа экономит 10 часов проблем

### Ошибка 5: Нет baseline

❌ **Неправильно**: Нечеткие границы проекта с самого начала

**Проблема**: Непонятно, что изменилось, что нет

✅ **Правильно**: Зафиксировать baseline v1.0

> 💡 **Совет**: Baseline = точка отсчета для всех изменений

---

## Best Practices

### 1. Формализуйте Change Management процесс

✅ **Что делать**: Документируйте процесс, обучите команду

**Документ:**
\`\`\`markdown
# Change Management Process

1. Anyone can submit Change Request (template: CR-template.md)
2. BA conducts Impact Analysis (3 business days)
3. CCB reviews (weekly meeting, Tuesdays 14:00)
4. Decision communicated within 24 hours
5. Approved changes go to backlog/sprint planning
\`\`\`

### 2. Используйте Change Control Board (CCB)

✅ **Что делать**: Регулярные встречи CCB

**Состав CCB:**
- Product Owner (голос заказчика)
- Technical Lead (техническая экспертиза)
- BA (анализ требований)
- Project Manager (сроки, бюджет)

**Частота:** Еженедельно (если есть CR)

### 3. Автоматизируйте трекинг

✅ **Что делать**: JIRA workflow для CR

**Workflow:**
\`\`\`
Submitted → Under Analysis → Pending Approval →
Approved → In Development → Done

OR

Submitted → Under Analysis → Rejected → Closed
\`\`\`

### 4. Трассируемость изменений

✅ **Что делать**: Связывайте CR с требованиями

\`\`\`
CR-030 → FR-20 (modified)
       → FR-21 (added)
       → NFR-5 (impacted)
\`\`\`

### 5. Коммуникация stakeholders

✅ **Что делать**: Регулярные updates

**Weekly Change Report:**
\`\`\`
This Week:
- Approved: CR-030, CR-031 (added to Sprint 5)
- Rejected: CR-032 (low ROI)
- Deferred: CR-033 (next quarter)

Impact on Project:
- Schedule: +1 week (now April 7)
- Budget: +$2,000 (now $102,000)
\`\`\`

---

## Заключение

Управление изменениями — это **баланс между гибкостью и контролем**. Изменения неизбежны, но они должны быть контролируемыми, задокументированными и обоснованными.

### Ключевые моменты

🎯 **Change Management**: Формальный процесс контроля изменений требований

🎯 **Impact Analysis**: Оценка влияния изменения на scope, schedule, cost, quality, resources

🎯 **Версионирование**: История изменений, semantic versioning (MAJOR.MINOR.PATCH)

🎯 **Scope Creep**: Неконтролируемое расширение границ → избегать через CR процесс

🎯 **CCB**: Change Control Board принимает решения об изменениях

> 💡 **Помните**: Сказать "Нет" изменению — это тоже управление изменениями. Не все изменения должны быть одобрены!
`;

async function createChangeManagementLecture() {
  try {
    console.log('🚀 Создание лекции "Управление изменениями требований"...\n');

    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'Управление изменениями требований' }
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "Управление изменениями требований" не найден!');
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    const lecture = await prisma.lecture.create({
      data: {
        title: 'Управление изменениями требований (Change Management)',
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
    console.log('🎉 Готово! Лекция "Управление изменениями требований" создана.');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createChangeManagementLecture();
