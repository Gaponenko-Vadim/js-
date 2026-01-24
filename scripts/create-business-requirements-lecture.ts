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

const lectureContent = `# Бизнес-требования и бизнес-логика

## Введение: Правила игры в шахматы

Представьте шахматы без правил:
- Пешка ходит куда хочет
- Король прыгает через всю доску
- Игроки сами решают, когда мат

> 💡 **Аналогия**: Бизнес-требования и бизнес-логика — это **правила игры** для вашего приложения. Они определяют, что можно делать, что нельзя, и при каких условиях что происходит.

**Реальный пример:**
- 📦 Интернет-магазин: "Скидка 10% при заказе от 5000 рублей" — это бизнес-правило
- 🏦 Банк: "Перевод больше 100,000₽ требует подтверждения по SMS" — это бизнес-логика
- 🎫 Авиабилеты: "Нельзя забронировать место, которое уже занято" — это бизнес-ограничение

В этой лекции вы узнаете:
- ✅ Что такое бизнес-требования и чем они отличаются от функциональных
- ✅ Типы бизнес-правил (validation, calculation, inference, action enabler)
- ✅ Как описывать workflows и бизнес-процессы
- ✅ Domain logic vs application logic
- ✅ Практические примеры и типичные ошибки

---

## Что такое бизнес-требования?

### Определение

> "Бизнес-требования (Business Requirements) — это **описание целей и задач бизнеса**, которые должна решить система, а также **правила и ограничения**, определяющие поведение системы в контексте бизнес-процессов"

### Простыми словами

**Бизнес-требования отвечают на вопросы:**
- 🎯 Какую бизнес-проблему мы решаем?
- 💰 Какую ценность это принесет компании?
- 📊 Как измерить успех?
- ⚖️ Какие правила должна соблюдать система?

### Уровни требований

| Уровень | Описание | Пример |
|---------|----------|--------|
| **Business Requirements** | Цели бизнеса | "Увеличить онлайн-продажи на 20%" |
| **Business Rules** | Правила и ограничения | "Скидка только для зарегистрированных" |
| **Functional Requirements** | Конкретные функции | "Кнопка 'Применить промокод'" |

---

## Бизнес-правила (Business Rules)

### Определение

> "Бизнес-правило (Business Rule) — это **условие или ограничение**, которое определяет или регулирует поведение системы в соответствии с бизнес-политикой"

### Четыре типа бизнес-правил

#### 1. Validation Rules (Правила валидации)

**ЧТО:** Проверяют корректность данных

**Примеры:**
- ✅ Email должен содержать @ и домен
- ✅ Возраст клиента >= 18 лет для открытия счета
- ✅ Номер телефона начинается с +7 или 8

**Код (псевдокод):**
\`\`\`typescript
if (customer.age < 18) {
  throw new ValidationError("Клиент должен быть старше 18 лет");
}
\`\`\`

#### 2. Calculation Rules (Правила вычисления)

**ЧТО:** Определяют, как рассчитывать значения

**Примеры:**
- 💰 Итоговая сумма = сумма товаров - скидка + доставка
- 📊 Рейтинг продавца = (положительные отзывы / всего отзывов) * 100
- 🎁 Скидка 10% при заказе от 5000₽, 15% от 10000₽

**Код:**
\`\`\`typescript
function calculateDiscount(orderAmount: number): number {
  if (orderAmount >= 10000) return 0.15;
  if (orderAmount >= 5000) return 0.10;
  return 0;
}
\`\`\`

#### 3. Inference Rules (Правила вывода)

**ЧТО:** Автоматически определяют новые факты на основе существующих

**Примеры:**
- 🌟 VIP-клиент = заказы > 100,000₽ за год
- ⚠️ Рисковая транзакция = сумма > обычная в 10 раз
- 📦 Бесплатная доставка = постоянный клиент + заказ > 3000₽

**Код:**
\`\`\`typescript
function inferCustomerTier(customer: Customer): string {
  const yearlySpending = calculateYearlySpending(customer);

  if (yearlySpending > 100000) return "VIP";
  if (yearlySpending > 50000) return "Gold";
  if (yearlySpending > 10000) return "Silver";
  return "Basic";
}
\`\`\`

#### 4. Action Enabler Rules (Правила разрешения действий)

**ЧТО:** Определяют, когда действие доступно

**Примеры:**
- 🚫 Нельзя отменить заказ, если он уже отправлен
- ✅ Можно вернуть товар в течение 14 дней
- 🔒 Удаление аккаунта требует подтверждения по email

**Код:**
\`\`\`typescript
function canCancelOrder(order: Order): boolean {
  const allowedStatuses = ["pending", "confirmed"];
  return allowedStatuses.includes(order.status);
}

if (!canCancelOrder(order)) {
  throw new Error("Заказ уже отправлен, отмена невозможна");
}
\`\`\`

---

## Бизнес-логика (Business Logic)

### Определение

> "Бизнес-логика (Business Logic, Domain Logic) — это **реализация бизнес-правил и процессов** в коде приложения"

### Domain Logic vs Application Logic

| Критерий | Domain Logic | Application Logic |
|----------|--------------|-------------------|
| **Что** | Бизнес-правила | Технические правила |
| **Примеры** | Расчет скидки, проверка лимита | Форматирование JSON, pagination |
| **Где меняется** | По решению бизнеса | По решению разработчиков |
| **Тестируется** | Бизнес-тестами | Техническими тестами |

**Пример Domain Logic:**
\`\`\`typescript
class Order {
  // Бизнес-логика: расчет итоговой суммы
  calculateTotal(): number {
    const subtotal = this.items.reduce((sum, item) =>
      sum + item.price * item.quantity, 0
    );

    const discount = this.applyDiscount(subtotal);
    const shipping = this.calculateShipping(subtotal);

    return subtotal - discount + shipping;
  }

  // Бизнес-правило: бесплатная доставка от 3000₽
  private calculateShipping(subtotal: number): number {
    return subtotal >= 3000 ? 0 : 300;
  }
}
\`\`\`

**Пример Application Logic:**
\`\`\`typescript
// Техническая логика: форматирование ответа API
app.get('/orders/:id', async (req, res) => {
  const order = await orderService.findById(req.params.id);

  res.json({
    data: order,
    meta: { timestamp: Date.now() }
  });
});
\`\`\`

---

## Workflows и бизнес-процессы

### Что такое Workflow?

> "Workflow — это **последовательность шагов**, которые проходит объект (заказ, заявка, документ) от начала до конца"

### Пример: Жизненный цикл заказа

**Состояния заказа:**
1. **Pending** (В ожидании) — создан, ждет оплаты
2. **Confirmed** (Подтвержден) — оплачен
3. **Processing** (В обработке) — собирается на складе
4. **Shipped** (Отправлен) — передан курьеру
5. **Delivered** (Доставлен) — получен клиентом
6. **Cancelled** (Отменен) — отменен клиентом/магазином

**Допустимые переходы (transitions):**
\`\`\`
Pending → Confirmed (оплата)
Pending → Cancelled (отмена до оплаты)
Confirmed → Processing (начало сборки)
Confirmed → Cancelled (отмена после оплаты, возврат денег)
Processing → Shipped (передача курьеру)
Shipped → Delivered (доставка завершена)
\`\`\`

**Бизнес-правила для переходов:**
\`\`\`typescript
class OrderWorkflow {
  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped"],
      shipped: ["delivered"]
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  transition(order: Order, newStatus: OrderStatus): void {
    if (!this.canTransition(order.status, newStatus)) {
      throw new Error(\`Невозможный переход: \${order.status} → \${newStatus}\`);
    }

    // Применить побочные эффекты
    if (newStatus === "cancelled" && order.status === "confirmed") {
      this.refundPayment(order);
    }

    order.status = newStatus;
  }
}
\`\`\`

---

## Практические сценарии

### Сценарий 1: Система лояльности интернет-магазина

**Ситуация**: Нужно внедрить систему накопительных баллов

**Бизнес-правила:**
1. За каждые 100₽ — 1 балл
2. VIP-клиенты: 2 балла за 100₽
3. 1 балл = 1₽ скидки
4. Можно списать максимум 30% от суммы заказа
5. Баллы сгорают через 12 месяцев

**Решение:**
\`\`\`typescript
class LoyaltyService {
  earnPoints(order: Order, customer: Customer): number {
    const multiplier = customer.tier === "VIP" ? 2 : 1;
    const points = Math.floor(order.total / 100) * multiplier;

    customer.loyaltyPoints += points;
    return points;
  }

  canUsePoints(order: Order, pointsToUse: number): boolean {
    const maxDiscount = order.total * 0.3; // максимум 30%
    return pointsToUse <= maxDiscount;
  }

  applyPoints(order: Order, customer: Customer, pointsToUse: number): void {
    if (!this.canUsePoints(order, pointsToUse)) {
      throw new Error("Можно списать максимум 30% от суммы заказа");
    }

    if (customer.loyaltyPoints < pointsToUse) {
      throw new Error("Недостаточно баллов");
    }

    order.discount += pointsToUse;
    customer.loyaltyPoints -= pointsToUse;
  }
}
\`\`\`

> 💡 **Вывод**: Бизнес-правила инкапсулированы в отдельный сервис, легко тестируются и изменяются

### Сценарий 2: Банковский перевод с лимитами

**Ситуация**: Онлайн-банкинг, переводы между счетами

**Бизнес-правила:**
1. Перевод <= 100,000₽ — без подтверждения
2. Перевод > 100,000₽ — требуется SMS-код
3. Лимит переводов в день: 500,000₽
4. Нельзя перевести больше, чем баланс
5. Минимальный перевод: 1₽

**Решение:**
\`\`\`typescript
class TransferService {
  async validateTransfer(
    fromAccount: Account,
    toAccount: Account,
    amount: number
  ): Promise<void> {
    // Правило 5: минимальная сумма
    if (amount < 1) {
      throw new Error("Минимальный перевод: 1₽");
    }

    // Правило 4: достаточный баланс
    if (fromAccount.balance < amount) {
      throw new Error("Недостаточно средств на счете");
    }

    // Правило 3: дневной лимит
    const todayTransfers = await this.getTodayTransfers(fromAccount);
    if (todayTransfers + amount > 500000) {
      throw new Error("Превышен дневной лимит переводов (500,000₽)");
    }
  }

  requiresConfirmation(amount: number): boolean {
    // Правило 1-2: подтверждение для крупных сумм
    return amount > 100000;
  }

  async transfer(
    fromAccount: Account,
    toAccount: Account,
    amount: number,
    smsCode?: string
  ): Promise<Transfer> {
    await this.validateTransfer(fromAccount, toAccount, amount);

    if (this.requiresConfirmation(amount) && !smsCode) {
      throw new Error("Требуется SMS-подтверждение");
    }

    if (smsCode && !await this.verifySmsCode(fromAccount, smsCode)) {
      throw new Error("Неверный SMS-код");
    }

    // Выполнить перевод
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    return this.createTransferRecord(fromAccount, toAccount, amount);
  }
}
\`\`\`

> 💡 **Вывод**: Сложные бизнес-правила разбиты на отдельные методы, каждый проверяет одно правило

### Сценарий 3: Бронирование номеров в отеле

**Ситуация**: Система онлайн-бронирования

**Бизнес-правила:**
1. Нельзя забронировать номер на прошедшие даты
2. Минимальное бронирование: 1 ночь
3. Максимальное бронирование: 30 ночей
4. Скидка 10% при бронировании > 7 ночей
5. Ранний check-in (+500₽) доступен только с 10:00
6. Поздний check-out (+700₽) до 18:00
7. Нельзя забронировать уже занятый номер

**Решение:**
\`\`\`typescript
class BookingService {
  async validateBooking(
    room: Room,
    checkIn: Date,
    checkOut: Date
  ): Promise<void> {
    const now = new Date();
    const nights = this.calculateNights(checkIn, checkOut);

    // Правило 1: не в прошлом
    if (checkIn < now) {
      throw new Error("Нельзя забронировать даты в прошлом");
    }

    // Правило 2-3: длительность
    if (nights < 1) {
      throw new Error("Минимальное бронирование: 1 ночь");
    }
    if (nights > 30) {
      throw new Error("Максимальное бронирование: 30 ночей");
    }

    // Правило 7: доступность
    const isAvailable = await this.checkAvailability(room, checkIn, checkOut);
    if (!isAvailable) {
      throw new Error("Номер занят в выбранные даты");
    }
  }

  calculatePrice(
    room: Room,
    checkIn: Date,
    checkOut: Date,
    earlyCheckIn: boolean = false,
    lateCheckOut: boolean = false
  ): number {
    const nights = this.calculateNights(checkIn, checkOut);
    let total = room.pricePerNight * nights;

    // Правило 4: скидка за длительное бронирование
    if (nights > 7) {
      total *= 0.9; // -10%
    }

    // Правило 5: ранний check-in
    if (earlyCheckIn) {
      total += 500;
    }

    // Правило 6: поздний check-out
    if (lateCheckOut) {
      total += 700;
    }

    return total;
  }
}
\`\`\`

> 💡 **Вывод**: Валидация и расчет цены — отдельные методы, легко добавлять новые правила

### Сценарий 4: Workflow возврата товара

**Ситуация**: Интернет-магазин, клиент хочет вернуть товар

**Бизнес-процесс:**
1. Клиент создает заявку на возврат
2. Менеджер проверяет условия возврата (14 дней, целостность)
3. Менеджер одобряет или отклоняет
4. Если одобрено — клиент отправляет товар
5. Склад получает товар, проверяет состояние
6. Бухгалтерия возвращает деньги

**Решение:**
\`\`\`typescript
enum ReturnStatus {
  REQUESTED = "requested",
  APPROVED = "approved",
  REJECTED = "rejected",
  ITEM_SHIPPED = "item_shipped",
  ITEM_RECEIVED = "item_received",
  REFUNDED = "refunded"
}

class ReturnWorkflow {
  canReturn(order: Order): boolean {
    const daysSinceDelivery = this.getDaysSince(order.deliveredAt);

    // Правило: возврат в течение 14 дней
    if (daysSinceDelivery > 14) return false;

    // Правило: заказ доставлен
    if (order.status !== "delivered") return false;

    return true;
  }

  requestReturn(order: Order, reason: string): Return {
    if (!this.canReturn(order)) {
      throw new Error("Срок возврата истек (14 дней)");
    }

    return this.createReturn({
      orderId: order.id,
      status: ReturnStatus.REQUESTED,
      reason
    });
  }

  approveReturn(returnRequest: Return, manager: User): void {
    if (returnRequest.status !== ReturnStatus.REQUESTED) {
      throw new Error("Заявка уже обработана");
    }

    returnRequest.status = ReturnStatus.APPROVED;
    returnRequest.approvedBy = manager.id;

    // Отправить клиенту адрес для возврата
    this.sendReturnLabel(returnRequest);
  }

  rejectReturn(returnRequest: Return, manager: User, reason: string): void {
    if (returnRequest.status !== ReturnStatus.REQUESTED) {
      throw new Error("Заявка уже обработана");
    }

    returnRequest.status = ReturnStatus.REJECTED;
    returnRequest.rejectionReason = reason;

    this.notifyCustomer(returnRequest);
  }

  processRefund(returnRequest: Return): void {
    if (returnRequest.status !== ReturnStatus.ITEM_RECEIVED) {
      throw new Error("Товар еще не получен на складе");
    }

    const order = this.getOrder(returnRequest.orderId);
    this.refundPayment(order);

    returnRequest.status = ReturnStatus.REFUNDED;
  }
}
\`\`\`

> 💡 **Вывод**: Workflow управляет переходами между состояниями, каждый переход проверяет бизнес-правила

### Сценарий 5: Динамическое ценообразование (Dynamic Pricing)

**Ситуация**: Сервис такси, цена зависит от спроса

**Бизнес-правила:**
1. Базовая цена = расстояние * тариф
2. Коэффициент спроса: высокий спрос → цена x1.5
3. Время суток: ночью (00:00-06:00) → цена x1.2
4. Погода: дождь/снег → цена x1.3
5. Промокод: скидка 10-50%
6. Итоговая цена >= минимальная цена (100₽)

**Решение:**
\`\`\`typescript
class DynamicPricingService {
  calculatePrice(ride: RideRequest): number {
    let basePrice = ride.distance * this.getRatePerKm();

    // Правило 2: спрос
    const demandMultiplier = this.getDemandMultiplier(ride.location);
    basePrice *= demandMultiplier;

    // Правило 3: время суток
    if (this.isNightTime(ride.requestedAt)) {
      basePrice *= 1.2;
    }

    // Правило 4: погода
    const weather = this.getWeather(ride.location);
    if (weather === "rain" || weather === "snow") {
      basePrice *= 1.3;
    }

    // Правило 5: промокод
    if (ride.promoCode) {
      const discount = this.getPromoDiscount(ride.promoCode);
      basePrice *= (1 - discount);
    }

    // Правило 6: минимальная цена
    return Math.max(basePrice, 100);
  }

  private getDemandMultiplier(location: Location): number {
    const activeRides = this.getActiveRidesCount(location);
    const availableDrivers = this.getAvailableDriversCount(location);

    const ratio = activeRides / availableDrivers;

    if (ratio > 2) return 1.5;  // Очень высокий спрос
    if (ratio > 1) return 1.2;  // Высокий спрос
    return 1.0;                 // Нормальный спрос
  }

  private isNightTime(date: Date): boolean {
    const hours = date.getHours();
    return hours >= 0 && hours < 6;
  }
}
\`\`\`

> 💡 **Вывод**: Сложное ценообразование разбито на модульные правила, каждое легко тестировать

### Сценарий 6: Утверждение отпуска (Approval Workflow)

**Ситуация**: Корпоративная система, сотрудник подает заявку на отпуск

**Бизнес-правила:**
1. Минимум 3 дня до начала отпуска
2. Минимальная длительность: 3 дня
3. Максимум 28 дней отпуска в год
4. Требуется согласование менеджера
5. Отпуск > 14 дней — требуется согласование HR
6. Нельзя взять отпуск, если коллега уже в отпуске (в маленькой команде)

**Решение:**
\`\`\`typescript
class VacationWorkflow {
  async requestVacation(
    employee: Employee,
    startDate: Date,
    endDate: Date
  ): Promise<VacationRequest> {
    const days = this.calculateDays(startDate, endDate);

    // Правило 1: заранее
    const daysUntilStart = this.getDaysUntil(startDate);
    if (daysUntilStart < 3) {
      throw new Error("Заявка должна быть подана минимум за 3 дня");
    }

    // Правило 2: минимальная длительность
    if (days < 3) {
      throw new Error("Минимальная длительность отпуска: 3 дня");
    }

    // Правило 3: годовой лимит
    const usedDays = await this.getUsedVacationDays(employee);
    if (usedDays + days > 28) {
      throw new Error(\`Превышен лимит отпуска (осталось: \${28 - usedDays} дней)\`);
    }

    // Правило 6: конфликты в команде
    const hasConflict = await this.checkTeamConflict(employee.teamId, startDate, endDate);
    if (hasConflict) {
      throw new Error("В это время другой член команды уже в отпуске");
    }

    const request = await this.createRequest({
      employeeId: employee.id,
      startDate,
      endDate,
      status: "pending_manager"
    });

    // Уведомить менеджера
    await this.notifyManager(employee.managerId, request);

    return request;
  }

  async approveByManager(request: VacationRequest, manager: User): Promise<void> {
    if (request.status !== "pending_manager") {
      throw new Error("Заявка не в статусе ожидания менеджера");
    }

    const days = this.calculateDays(request.startDate, request.endDate);

    // Правило 5: длинный отпуск требует HR
    if (days > 14) {
      request.status = "pending_hr";
      await this.notifyHR(request);
    } else {
      request.status = "approved";
    }

    request.managerApprovedAt = new Date();
    await this.save(request);
  }

  async approveByHR(request: VacationRequest, hr: User): Promise<void> {
    if (request.status !== "pending_hr") {
      throw new Error("Заявка не требует одобрения HR");
    }

    request.status = "approved";
    request.hrApprovedAt = new Date();

    await this.save(request);
    await this.notifyEmployee(request.employeeId);
  }
}
\`\`\`

> 💡 **Вывод**: Multi-stage approval workflow с разными правилами на каждом этапе

### Сценарий 7: Биржа акций — ордера на покупку/продажу

**Ситуация**: Торговая платформа, пользователь размещает ордер

**Бизнес-правила:**
1. Market Order (рыночный) — исполняется немедленно по текущей цене
2. Limit Order (лимитный) — исполняется при достижении цены
3. Нельзя продать больше, чем есть на счете
4. Нельзя купить на сумму больше баланса
5. Минимальная сумма сделки: 1000₽
6. Комиссия: 0.1% от суммы сделки

**Решение:**
\`\`\`typescript
enum OrderType {
  MARKET = "market",
  LIMIT = "limit"
}

class TradingService {
  async placeBuyOrder(
    user: User,
    symbol: string,
    quantity: number,
    orderType: OrderType,
    limitPrice?: number
  ): Promise<Order> {
    const currentPrice = await this.getCurrentPrice(symbol);
    const estimatedCost = quantity * (limitPrice || currentPrice);

    // Правило 5: минимальная сумма
    if (estimatedCost < 1000) {
      throw new Error("Минимальная сумма сделки: 1000₽");
    }

    // Правило 4: достаточный баланс
    const commission = estimatedCost * 0.001; // 0.1%
    const totalCost = estimatedCost + commission;

    if (user.balance < totalCost) {
      throw new Error("Недостаточно средств на счете");
    }

    const order = await this.createOrder({
      userId: user.id,
      symbol,
      side: "buy",
      quantity,
      type: orderType,
      limitPrice,
      status: "pending"
    });

    // Правило 1: Market Order исполняется сразу
    if (orderType === OrderType.MARKET) {
      await this.executeOrder(order, currentPrice);
    }

    return order;
  }

  async placeSellOrder(
    user: User,
    symbol: string,
    quantity: number,
    orderType: OrderType,
    limitPrice?: number
  ): Promise<Order> {
    // Правило 3: достаточно акций
    const holdings = await this.getUserHoldings(user.id, symbol);
    if (holdings < quantity) {
      throw new Error(\`Недостаточно акций (есть: \${holdings}, нужно: \${quantity})\`);
    }

    const currentPrice = await this.getCurrentPrice(symbol);
    const estimatedValue = quantity * (limitPrice || currentPrice);

    // Правило 5: минимальная сумма
    if (estimatedValue < 1000) {
      throw new Error("Минимальная сумма сделки: 1000₽");
    }

    const order = await this.createOrder({
      userId: user.id,
      symbol,
      side: "sell",
      quantity,
      type: orderType,
      limitPrice,
      status: "pending"
    });

    if (orderType === OrderType.MARKET) {
      await this.executeOrder(order, currentPrice);
    }

    return order;
  }

  private async executeOrder(order: Order, price: number): Promise<void> {
    const value = order.quantity * price;
    const commission = value * 0.001; // Правило 6

    if (order.side === "buy") {
      // Списать деньги, добавить акции
      await this.updateBalance(order.userId, -(value + commission));
      await this.addHoldings(order.userId, order.symbol, order.quantity);
    } else {
      // Списать акции, добавить деньги
      await this.removeHoldings(order.userId, order.symbol, order.quantity);
      await this.updateBalance(order.userId, value - commission);
    }

    order.status = "executed";
    order.executedPrice = price;
    order.executedAt = new Date();
  }
}
\`\`\`

> 💡 **Вывод**: Финансовые операции требуют строгой валидации и атомарности

### Сценарий 8: Подписки и recurring payments

**Ситуация**: SaaS-сервис с ежемесячной подпиской

**Бизнес-правила:**
1. Trial period (пробный период) — 14 дней бесплатно
2. После trial — автоматическое списание
3. Если оплата неуспешна — 3 попытки списания (через 3, 5, 7 дней)
4. После 3 неудач — приостановка подписки
5. Grace period (льготный период) — 7 дней для восстановления оплаты
6. Можно отменить подписку в любое время (доступ до конца оплаченного периода)

**Решение:**
\`\`\`typescript
enum SubscriptionStatus {
  TRIAL = "trial",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  SUSPENDED = "suspended",
  CANCELLED = "cancelled"
}

class SubscriptionService {
  async createSubscription(user: User, plan: Plan): Promise<Subscription> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // Правило 1

    return this.create({
      userId: user.id,
      planId: plan.id,
      status: SubscriptionStatus.TRIAL,
      trialEndsAt,
      nextBillingDate: trialEndsAt
    });
  }

  async processBilling(subscription: Subscription): Promise<void> {
    const paymentSuccessful = await this.chargePayment(
      subscription.userId,
      subscription.planPrice
    );

    if (paymentSuccessful) {
      // Продлить подписку на месяц
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.nextBillingDate = this.addMonths(new Date(), 1);
      subscription.failedAttempts = 0;
    } else {
      // Правило 3: попытки повтора
      subscription.failedAttempts += 1;
      subscription.status = SubscriptionStatus.PAST_DUE;

      if (subscription.failedAttempts >= 3) {
        // Правило 4: приостановка после 3 неудач
        subscription.status = SubscriptionStatus.SUSPENDED;
        subscription.suspendedAt = new Date();

        // Правило 5: grace period 7 дней
        subscription.gracePeriodEndsAt = this.addDays(new Date(), 7);
      } else {
        // Запланировать следующую попытку
        const daysToRetry = [3, 5, 7][subscription.failedAttempts - 1];
        subscription.nextRetryDate = this.addDays(new Date(), daysToRetry);
      }
    }

    await this.save(subscription);
  }

  async cancelSubscription(subscription: Subscription): Promise<void> {
    // Правило 6: отмена в любое время
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();

    // Доступ сохраняется до конца периода
    subscription.accessEndsAt = subscription.nextBillingDate;

    await this.save(subscription);
  }

  hasAccess(subscription: Subscription): boolean {
    const now = new Date();

    // Доступ есть в статусах: trial, active, past_due (с попытками)
    if ([SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE].includes(subscription.status)) {
      return true;
    }

    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      // Доступ во время попыток оплаты
      return subscription.failedAttempts < 3;
    }

    if (subscription.status === SubscriptionStatus.SUSPENDED) {
      // Grace period
      return subscription.gracePeriodEndsAt > now;
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      // До конца оплаченного периода
      return subscription.accessEndsAt > now;
    }

    return false;
  }
}
\`\`\`

> 💡 **Вывод**: Recurring billing требует сложной логики повторных попыток и статусов

---

## Типичные ошибки

### Ошибка 1: Бизнес-логика в контроллерах

❌ **Неправильно**:
\`\`\`typescript
app.post('/orders/:id/cancel', async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  // Бизнес-логика размазана по контроллеру
  if (order.status === "shipped") {
    return res.status(400).json({ error: "Нельзя отменить отправленный заказ" });
  }

  if (order.isPaid) {
    // Возврат денег
    await stripe.refunds.create({ payment_intent: order.paymentId });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
  res.json(order);
});
\`\`\`

**Проблема**: Бизнес-правила не переиспользуются, сложно тестировать, легко допустить ошибку

✅ **Правильно**:
\`\`\`typescript
// Domain Service
class OrderService {
  canCancel(order: Order): boolean {
    return !["shipped", "delivered"].includes(order.status);
  }

  async cancel(order: Order): Promise<void> {
    if (!this.canCancel(order)) {
      throw new BusinessRuleError("Нельзя отменить отправленный заказ");
    }

    if (order.isPaid) {
      await this.paymentService.refund(order.paymentId);
    }

    order.status = "cancelled";
    await this.repository.save(order);
  }
}

// Контроллер — тонкая обертка
app.post('/orders/:id/cancel', async (req, res) => {
  const order = await orderService.findById(req.params.id);
  await orderService.cancel(order);
  res.json(order);
});
\`\`\`

> 💡 **Совет**: Бизнес-логика в service/domain слоях, контроллер только маршрутизация

### Ошибка 2: Дублирование бизнес-правил

❌ **Неправильно**:
\`\`\`typescript
// В одном месте
if (customer.age >= 18) {
  // разрешить
}

// В другом месте
if (customer.age < 18) {
  throw new Error("Только для 18+");
}

// В третьем месте
const isAdult = customer.age > 17;
\`\`\`

**Проблема**: Правило продублировано, при изменении (например, 21+) нужно менять везде

✅ **Правильно**:
\`\`\`typescript
class Customer {
  isAdult(): boolean {
    return this.age >= 18; // Правило в одном месте
  }
}

// Использование
if (!customer.isAdult()) {
  throw new Error("Только для 18+");
}
\`\`\`

> 💡 **Совет**: Одно правило — один метод/функция

### Ошибка 3: Магические числа без объяснений

❌ **Неправильно**:
\`\`\`typescript
if (order.total >= 5000) {
  discount = 0.10;
} else if (order.total >= 3000) {
  discount = 0.05;
}
\`\`\`

**Проблема**: Непонятно, откуда взялись 5000 и 3000, что это за правило

✅ **Правильно**:
\`\`\`typescript
const DISCOUNT_TIERS = {
  GOLD: { threshold: 5000, discount: 0.10 },   // 10% от 5000₽
  SILVER: { threshold: 3000, discount: 0.05 }  // 5% от 3000₽
};

function calculateDiscount(orderTotal: number): number {
  if (orderTotal >= DISCOUNT_TIERS.GOLD.threshold) {
    return DISCOUNT_TIERS.GOLD.discount;
  }
  if (orderTotal >= DISCOUNT_TIERS.SILVER.threshold) {
    return DISCOUNT_TIERS.SILVER.discount;
  }
  return 0;
}
\`\`\`

> 💡 **Совет**: Магические числа → константы с понятными именами

### Ошибка 4: Игнорирование edge cases

❌ **Неправильно**:
\`\`\`typescript
function calculateShipping(orderTotal: number): number {
  return orderTotal >= 3000 ? 0 : 300;
}
\`\`\`

**Проблема**: Что если orderTotal отрицательный? Что если 0?

✅ **Правильно**:
\`\`\`typescript
function calculateShipping(orderTotal: number): number {
  if (orderTotal < 0) {
    throw new Error("Сумма заказа не может быть отрицательной");
  }

  if (orderTotal === 0) {
    return 0; // Пустой заказ — нет доставки
  }

  return orderTotal >= 3000 ? 0 : 300;
}
\`\`\`

> 💡 **Совет**: Всегда проверяйте граничные случаи (0, отрицательные, null, undefined)

### Ошибка 5: Бизнес-правила в SQL запросах

❌ **Неправильно**:
\`\`\`typescript
const vipCustomers = await prisma.$queryRaw\`
  SELECT * FROM customers
  WHERE total_spent > 100000 AND status = 'active'
\`;
\`\`\`

**Проблема**: Правило "VIP = потратил > 100,000₽" захардкожено в SQL, нельзя переиспользовать

✅ **Правильно**:
\`\`\`typescript
class Customer {
  isVIP(): boolean {
    return this.totalSpent > 100000 && this.status === "active";
  }
}

// Использование
const customers = await customerRepository.findAll();
const vipCustomers = customers.filter(c => c.isVIP());
\`\`\`

> 💡 **Совет**: Бизнес-логика в коде, не в SQL

### Ошибка 6: Отсутствие валидации на уровне домена

❌ **Неправильно**:
\`\`\`typescript
class Order {
  total: number;
  items: OrderItem[];
}

// Можно создать некорректный заказ
const order = new Order();
order.total = -1000; // ❌ отрицательная сумма
order.items = [];    // ❌ пустой заказ
\`\`\`

**Проблема**: Можно создать невалидный объект

✅ **Правильно**:
\`\`\`typescript
class Order {
  private _total: number;
  private _items: OrderItem[];

  constructor(items: OrderItem[]) {
    if (items.length === 0) {
      throw new Error("Заказ должен содержать хотя бы один товар");
    }

    this._items = items;
    this._total = this.calculateTotal();
  }

  get total(): number {
    return this._total;
  }

  private calculateTotal(): number {
    return this._items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
\`\`\`

> 💡 **Совет**: Невозможно создать невалидный объект

### Ошибка 7: Смешивание различных типов логики

❌ **Неправильно**:
\`\`\`typescript
async function processOrder(orderId: string) {
  const order = await db.order.find(orderId);        // Data Access

  if (order.total >= 5000) {                         // Business Logic
    order.discount = 0.10;
  }

  const json = JSON.stringify(order);                // Presentation Logic
  await redis.set(\`order:\${orderId}\`, json);        // Caching Logic
  await kafka.publish('order.created', order);       // Integration Logic
}
\`\`\`

**Проблема**: Все типы логики в одной функции, невозможно тестировать

✅ **Правильно**:
\`\`\`typescript
// Business Logic
class OrderService {
  applyDiscounts(order: Order): void {
    if (order.total >= 5000) {
      order.discount = 0.10;
    }
  }
}

// Application Logic (orchestration)
class ProcessOrderUseCase {
  async execute(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    this.orderService.applyDiscounts(order);
    await this.orderRepository.save(order);

    await this.cache.set(orderId, order);
    await this.eventBus.publish('order.created', order);
  }
}
\`\`\`

> 💡 **Совет**: Разделяйте domain logic, application logic, infrastructure

### Ошибка 8: Отсутствие явных бизнес-исключений

❌ **Неправильно**:
\`\`\`typescript
if (order.status === "shipped") {
  throw new Error("Cannot cancel");
}
\`\`\`

**Проблема**: Неясно, это техническая или бизнес-ошибка

✅ **Правильно**:
\`\`\`typescript
class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

if (order.status === "shipped") {
  throw new BusinessRuleError("Нельзя отменить отправленный заказ");
}

// В обработчике
try {
  await orderService.cancel(order);
} catch (error) {
  if (error instanceof BusinessRuleError) {
    return res.status(400).json({ error: error.message });
  }
  // Технические ошибки — 500
  return res.status(500).json({ error: "Internal error" });
}
\`\`\`

> 💡 **Совет**: Создавайте специальные классы ошибок для бизнес-правил

---

## Best Practices

### 1. Инкапсулируйте бизнес-правила в domain objects

✅ **Что делать**: Бизнес-логика внутри классов домена

\`\`\`typescript
class Order {
  canBeCancelled(): boolean {
    return !["shipped", "delivered"].includes(this.status);
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new BusinessRuleError("Order cannot be cancelled");
    }
    this.status = "cancelled";
  }
}
\`\`\`

**Почему это важно**: Логика рядом с данными, легко найти и изменить

### 2. Используйте Value Objects для бизнес-концепций

✅ **Что делать**: Создавайте специальные классы для важных концепций

\`\`\`typescript
class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Currency mismatch");
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}

// Использование
const price = new Money(1000, "RUB");
const discount = new Money(100, "RUB");
const total = price.add(discount.negate());
\`\`\`

**Пример использования**:
\`\`\`typescript
class Email {
  private value: string;

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error("Invalid email");
    }
    this.value = email;
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toString(): string {
    return this.value;
  }
}

// Невозможно создать невалидный email
const email = new Email("user@example.com"); // ✅
const invalid = new Email("not-an-email");   // ❌ бросит ошибку
\`\`\`

### 3. Явно моделируйте workflows как state machines

✅ **Что делать**: Используйте паттерн State Machine для сложных процессов

\`\`\`typescript
class OrderStateMachine {
  private transitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
  };

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
}
\`\`\`

### 4. Документируйте бизнес-правила в коде

✅ **Что делать**: Используйте комментарии для объяснения "почему"

\`\`\`typescript
function calculateLoyaltyPoints(order: Order): number {
  // Бизнес-правило: 1 балл за каждые 100₽
  // Источник: Маркетинговая политика от 15.01.2024
  const basePoints = Math.floor(order.total / 100);

  // Бизнес-правило: VIP-клиенты получают x2 баллов
  // Источник: Программа лояльности, раздел 3.2
  const multiplier = order.customer.tier === "VIP" ? 2 : 1;

  return basePoints * multiplier;
}
\`\`\`

### 5. Тестируйте бизнес-логику изолированно

✅ **Что делать**: Unit-тесты для каждого правила

\`\`\`typescript
describe('Order.canBeCancelled', () => {
  it('should allow cancellation for pending orders', () => {
    const order = new Order({ status: 'pending' });
    expect(order.canBeCancelled()).toBe(true);
  });

  it('should not allow cancellation for shipped orders', () => {
    const order = new Order({ status: 'shipped' });
    expect(order.canBeCancelled()).toBe(false);
  });
});
\`\`\`

### 6. Используйте спецификации для сложных правил

✅ **Что делать**: Паттерн Specification для композиции правил

\`\`\`typescript
interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
}

class VIPCustomerSpecification implements Specification<Customer> {
  isSatisfiedBy(customer: Customer): boolean {
    return customer.totalSpent > 100000;
  }
}

class ActiveCustomerSpecification implements Specification<Customer> {
  isSatisfiedBy(customer: Customer): boolean {
    return customer.status === "active";
  }
}

// Композиция
class AndSpecification<T> implements Specification<T> {
  constructor(private specs: Specification<T>[]) {}

  isSatisfiedBy(candidate: T): boolean {
    return this.specs.every(spec => spec.isSatisfiedBy(candidate));
  }
}

// Использование
const vipActiveSpec = new AndSpecification([
  new VIPCustomerSpecification(),
  new ActiveCustomerSpecification()
]);

if (vipActiveSpec.isSatisfiedBy(customer)) {
  // Предоставить VIP-услуги
}
\`\`\`

### 7. Храните историю изменений важных объектов

✅ **Что делать**: Event Sourcing или Audit Log

\`\`\`typescript
class OrderAuditLog {
  async logStatusChange(
    order: Order,
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
    changedBy: User
  ): Promise<void> {
    await this.repository.create({
      orderId: order.id,
      eventType: 'status_changed',
      oldValue: oldStatus,
      newValue: newStatus,
      changedBy: changedBy.id,
      changedAt: new Date(),
      reason: order.statusChangeReason
    });
  }
}
\`\`\`

---

## Заключение

Бизнес-требования и бизнес-логика — это **сердце вашего приложения**. Они определяют, как система работает с точки зрения бизнеса, какие правила соблюдает, и какие процессы реализует.

### Ключевые моменты

🎯 **Бизнес-требования**: Цели бизнеса, правила и ограничения, которые должна соблюдать система

🎯 **Четыре типа правил**: Validation (проверка), Calculation (расчет), Inference (вывод), Action Enabler (разрешения)

🎯 **Бизнес-логика**: Реализация бизнес-правил в коде, должна быть изолирована от технических деталей

🎯 **Workflows**: Жизненные циклы объектов, состояния и переходы между ними

🎯 **Best Practices**: Инкапсуляция в domain objects, явное моделирование правил, тестирование изолированно

> 💡 **Помните**: Хорошая бизнес-логика — это логика, которую легко изменить, когда бизнес-требования изменятся (а они изменятся!)
`;

async function createBusinessRequirementsLecture() {
  try {
    console.log('🚀 Создание лекции "Бизнес-требования и бизнес-логика"...\n');

    // Найти тест
    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'Бизнес-требования и бизнес-логика' }
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "Бизнес-требования и бизнес-логика" не найден!');
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    // Создать лекцию
    const lecture = await prisma.lecture.create({
      data: {
        title: 'Бизнес-требования и бизнес-логика',
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
    console.log('🎉 Готово! Лекция "Бизнес-требования и бизнес-логика" создана.');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createBusinessRequirementsLecture();
