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

const lectureContent = `# Compliance и регуляторные требования

## Введение: Правила дорожного движения для ПО

Представьте дорогу без правил:
- 🚗 Каждый ездит как хочет
- Нет знаков, светофоров, разметки
- Хаос и аварии

**Правила (ПДД) нужны чтобы:**
- Защитить участников движения
- Обеспечить порядок
- Предотвратить аварии

> 💡 **Аналогия**: Compliance требования (требования соответствия) — это "ПДД" для ПО. Они защищают данные пользователей, обеспечивают безопасность, предотвращают злоупотребления.

**Факт**: Штраф за нарушение GDPR — до €20,000,000 или 4% годового оборота компании (что больше). Amazon получил штраф €746 млн в 2021 году.

В этой лекции вы узнаете:
- ✅ Что такое compliance и почему важно
- ✅ GDPR (защита данных в ЕС)
- ✅ HIPAA (медицинские данные, США)
- ✅ PCI DSS (платежные данные)
- ✅ SOC 2 (безопасность для SaaS)
- ✅ Audit trails и data retention

---

## Что такое Compliance?

### Определение

> "Compliance (Соответствие) — выполнение системой **законодательных требований, стандартов и регуляций**, применимых к конкретной индустрии или географии"

### Зачем нужен Compliance?

**1. Юридическая защита**
- Избежать штрафов (миллионы $/€)
- Избежать судебных исков
- Соответствие законам страны

**2. Защита данных пользователей**
- Конфиденциальность (privacy)
- Безопасность (security)
- Права пользователей (контроль над данными)

**3. Репутация**
- Доверие клиентов
- Конкурентное преимущество
- Требование для B2B контрактов

**4. Избежание data breaches**
- Предотвращение утечек
- Минимизация ущерба
- Быстрое реагирование

---

## GDPR (General Data Protection Regulation)

### Что это?

> "GDPR — регуляция ЕС (Европейский Союз) о защите персональных данных, вступила в силу 25 мая 2018"

### Кого затрагивает?

**Применяется если:**
- Компания в ЕС (любого размера)
- ИЛИ обрабатываете данные граждан ЕС
- ИЛИ предлагаете товары/услуги в ЕС

**Примеры:**
- ✅ Российская компания с европейскими клиентами → GDPR applies
- ✅ Американский сайт, доступный из ЕС → GDPR applies
- ❌ Чисто локальный бизнес в России без EU клиентов → GDPR не применяется

### Ключевые принципы GDPR

#### 1. Lawfulness, Fairness, Transparency

**ЧТО:** Законная, справедливая, прозрачная обработка данных

**Требования:**
\`\`\`
- Явное согласие пользователя (consent)
- Понятная политика конфиденциальности
- Информировать о цели сбора данных
\`\`\`

**Пример:**
\`\`\`
❌ Неправильно:
"Нажимая 'Зарегистрироваться', вы соглашаетесь с условиями"
(Скрытое согласие)

✅ Правильно:
☐ Я согласен на обработку персональных данных для регистрации
☐ Я согласен на получение маркетинговых рассылок (опционально)

[Политика конфиденциальности] (ссылка, понятным языком)
\`\`\`

#### 2. Purpose Limitation

**ЧТО:** Данные собираются для конкретной цели

**Требование:**
\`\`\`
- Указать зачем собираете данные
- Использовать ТОЛЬКО для этой цели
- Новая цель = новое согласие
\`\`\`

**Пример:**
\`\`\`
Собрали email для регистрации
❌ Нельзя: Использовать для рассылки без согласия
✅ Можно: Отправлять уведомления о заказах (часть сервиса)
\`\`\`

#### 3. Data Minimization

**ЧТО:** Собирать минимум необходимых данных

**Требование:**
\`\`\`
❌ Плохо: Собирать адрес, телефон, дату рождения для простой рассылки
✅ Хорошо: Собирать только email (достаточно для рассылки)
\`\`\`

#### 4. Right to be Forgotten

**ЧТО:** Право на удаление данных

**Требование:**
\`\`\`
Пользователь может запросить удаление своих данных
Вы ОБЯЗАНЫ удалить в течение 30 дней

Exceptions:
- Если нужно для legal compliance
- Если есть законное основание (например, неоплаченный долг)
\`\`\`

**Реализация:**
\`\`\`typescript
app.post('/users/me/delete', async (req, res) => {
  const user = await getUser(req.userId);

  // Anonymize or delete
  await db.users.update({
    where: { id: user.id },
    data: {
      email: null,
      name: 'DELETED USER',
      phone: null,
      address: null,
      deletedAt: new Date()
    }
  });

  // Keep order history (anonymized)
  await db.orders.updateMany({
    where: { userId: user.id },
    data: { userId: null, userName: 'Deleted User' }
  });

  res.json({ message: 'Account deleted' });
});
\`\`\`

#### 5. Data Portability

**ЧТО:** Право экспортировать свои данные

**Требование:**
\`\`\`
Пользователь может запросить экспорт данных
Формат: машиночитаемый (JSON, CSV)
Срок: В течение 30 дней
\`\`\`

**Пример:**
\`\`\`typescript
app.get('/users/me/export', async (req, res) => {
  const user = await getUser(req.userId);
  const orders = await getOrders(req.userId);

  const exportData = {
    profile: {
      email: user.email,
      name: user.name,
      registeredAt: user.createdAt
    },
    orders: orders.map(o => ({
      id: o.id,
      date: o.createdAt,
      total: o.total,
      items: o.items
    }))
  };

  res.json(exportData);
});
\`\`\`

#### 6. Breach Notification

**ЧТО:** Обязательное уведомление об утечке данных

**Требование:**
\`\`\`
Если произошла утечка (data breach):
- Уведомить регулятора (DPA) в течение 72 часов
- Уведомить пострадавших пользователей
- Описать что произошло, какие данные, какие меры
\`\`\`

### Штрафы GDPR

**Tier 1:** До €10 млн или 2% годового оборота
- Нарушения: не уведомили о breach, нет DPO (Data Protection Officer)

**Tier 2:** До €20 млн или 4% годового оборота
- Нарушения: обработка без согласия, нарушение прав пользователей

**Примеры реальных штрафов:**
- Amazon: €746 млн (2021)
- WhatsApp: €225 млн (2021)
- Google: €90 млн (2020)

---

## HIPAA (Health Insurance Portability and Accountability Act)

### Что это?

> "HIPAA — федеральный закон США о защите медицинских данных, принят в 1996"

### Кого затрагивает?

**Covered Entities:**
- Больницы, клиники
- Врачи, стоматологи
- Страховые компании
- Аптеки

**Business Associates:**
- IT компании, обрабатывающие медицинские данные
- Cloud providers (AWS, Azure) для медицинских систем
- Billing компании

### Protected Health Information (PHI)

**ЧТО:** Любая информация о здоровье, которая может идентифицировать человека

**Примеры PHI:**
\`\`\`
- Медицинская история
- Диагнозы, лечение
- Результаты анализов
- Страховые данные
- Номер медстраховки
\`\`\`

**+ Идентификаторы:**
\`\`\`
- Имя, адрес, телефон
- Email, IP адрес
- Social Security Number
- Фото лица
\`\`\`

### Требования HIPAA

**1. Encryption (Шифрование)**
\`\`\`
- PHI at rest: Encrypted (AES-256)
- PHI in transit: TLS 1.2+
- Backups: Encrypted
\`\`\`

**2. Access Control**
\`\`\`
- Role-based access (RBAC)
- Minimum necessary (доступ только к нужным данным)
- Audit logs (кто, когда, к чему обращался)
\`\`\`

**3. Audit Trails**
\`\`\`
Every access to PHI must be logged:
- Who accessed
- What data
- When
- Why (purpose)

Retention: 6 years
\`\`\`

**4. Business Associate Agreement (BAA)**
\`\`\`
Если third-party обрабатывает PHI → нужен контракт (BAA)

Example: Clinic uses AWS
- AWS signs BAA with clinic
- AWS guarantees HIPAA compliance
\`\`\`

### Штрафы HIPAA

**Tier 1:** $100-$50,000 per violation (не знали)
**Tier 2:** $1,000-$50,000 per violation (должны были знать)
**Tier 3:** $10,000-$50,000 per violation (сознательная небрежность)
**Tier 4:** $50,000 per violation (злой умысел)

**Maximum:** $1.5 млн в год за один тип нарушения

---

## PCI DSS (Payment Card Industry Data Security Standard)

### Что это?

> "PCI DSS — стандарт безопасности для компаний, обрабатывающих платежные карты (Visa, Mastercard, etc.)"

### Кого затрагивает?

**Любая компания, которая:**
- Принимает платежи картами
- Хранит данные карт
- Передает данные карт

**Уровни (по объему транзакций в год):**
- Level 1: > 6 млн транзакций
- Level 2: 1-6 млн
- Level 3: 20,000 - 1 млн
- Level 4: < 20,000

### 12 требований PCI DSS

#### 1-2. Network Security

\`\`\`
1. Firewall configuration
2. No default passwords (change vendor defaults)
\`\`\`

#### 3-4. Protect Cardholder Data

\`\`\`
3. Protect stored cardholder data
   - Encrypt PAN (Primary Account Number)
   - Hash CVV (never store in plain text)

4. Encrypt transmission
   - TLS for all card data transmission
\`\`\`

**Best Practice:** НЕ ХРАНИТЕ ДАННЫЕ КАРТ!
\`\`\`
✅ Используйте tokenization (Stripe, PayPal)
   Вы храните: token "tok_abc123"
   Stripe хранит: настоящие данные карты

Преимущества:
- Вы не подпадаете под PCI DSS (или minimal scope)
- Меньше риска
- Меньше затрат на compliance
\`\`\`

#### 5-6. Security Measures

\`\`\`
5. Use anti-virus
6. Secure systems and applications
\`\`\`

#### 7-9. Access Control

\`\`\`
7. Restrict access by business need-to-know
8. Assign unique ID to each person with access
9. Restrict physical access to cardholder data
\`\`\`

#### 10-11. Monitoring

\`\`\`
10. Track and monitor all access
    - Audit logs for 90+ days

11. Regularly test security systems
    - Quarterly vulnerability scans
\`\`\`

#### 12. Information Security Policy

\`\`\`
12. Maintain policy that addresses security
\`\`\`

### Compliance Validation

**Self-Assessment Questionnaire (SAQ):**
- Level 4: SAQ (анкета)
- Level 1-3: Quarterly scans + Annual audit (QSA - Qualified Security Assessor)

**Штрафы за нарушение:**
- $5,000 - $100,000 per month (от платежных систем)
- Потеря возможности принимать карты
- Судебные иски от пострадавших

---

## SOC 2 (Service Organization Control)

### Что это?

> "SOC 2 — стандарт безопасности для SaaS компаний, разработан AICPA (American Institute of CPAs)"

### Кого затрагивает?

**SaaS компании, которые:**
- Хранят данные клиентов в cloud
- Предоставляют услуги через интернет
- Хотят продавать enterprise клиентам (B2B)

**Пример:** Slack, Dropbox, Salesforce — все SOC 2 certified

### Trust Service Criteria (5 принципов)

#### 1. Security (Безопасность)

**ЧТО:** Защита от несанкционированного доступа

**Контроли:**
\`\`\`
- Access control (RBAC)
- Encryption (at rest, in transit)
- Firewall, IDS/IPS
- Security incident response plan
\`\`\`

#### 2. Availability (Доступность)

**ЧТО:** Система доступна согласно SLA

**Контроли:**
\`\`\`
- Uptime monitoring
- Redundancy (multiple servers, regions)
- Disaster recovery plan
- Incident response
\`\`\`

**Example SLA:** 99.9% uptime (downtime < 8.76 hours/year)

#### 3. Processing Integrity (Целостность обработки)

**ЧТО:** Система обрабатывает данные корректно

**Контроли:**
\`\`\`
- Data validation
- Error handling
- Transaction logging
- Reconciliation procedures
\`\`\`

#### 4. Confidentiality (Конфиденциальность)

**ЧТО:** Данные защищены от раскрытия

**Контроли:**
\`\`\`
- Data classification (public, internal, confidential)
- NDA (Non-Disclosure Agreements)
- Encryption of confidential data
- Access logging
\`\`\`

#### 5. Privacy (Приватность)

**ЧТО:** Личные данные обрабатываются согласно политике

**Контроли:**
\`\`\`
- Privacy policy
- Consent management
- Data retention policy
- Data deletion procedures
\`\`\`

### SOC 2 Type I vs Type II

**Type I:** Проверка контролей на момент аудита
- "Контроли существуют?"
- Длительность аудита: 1-2 недели

**Type II:** Проверка эффективности контролей за период
- "Контроли работают?" (за 6-12 месяцев)
- Длительность: 6-12 месяцев + audit

**Стоимость:** $20,000 - $100,000 (зависит от компании)

---

## Audit Trails (Журналы аудита)

### Что это?

> "Audit Trail — неизменяемая запись всех действий в системе для последующего анализа"

### Что логировать?

**Authentication Events:**
\`\`\`
- Login successful/failed
- Logout
- Password change
- MFA enabled/disabled
\`\`\`

**Data Access:**
\`\`\`
- Who accessed what data
- When
- From where (IP address)
- What action (view, edit, delete)
\`\`\`

**Administrative Actions:**
\`\`\`
- User created/deleted
- Permissions changed
- Configuration modified
- Backup/restore
\`\`\`

### Формат Audit Log

\`\`\`json
{
  "timestamp": "2024-03-15T10:30:45.123Z",
  "eventType": "DATA_ACCESS",
  "actor": {
    "userId": "user-123",
    "email": "admin@company.com",
    "ip": "203.0.113.42"
  },
  "target": {
    "resourceType": "PATIENT_RECORD",
    "resourceId": "patient-456",
    "action": "VIEW"
  },
  "result": "SUCCESS",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "sessionId": "sess-789"
  }
}
\`\`\`

### Retention Period

**По compliance:**
- HIPAA: 6 years
- PCI DSS: 90 days (minimum), 1 year (recommended)
- SOC 2: Varies (usually 1-3 years)
- GDPR: As long as data is stored

**Практика:**
\`\`\`
Hot storage (быстрый доступ): 90 days
Cold storage (архив): 7 years
\`\`\`

---

## Data Retention (Хранение данных)

### Политика хранения

**Зачем:** Баланс между compliance и storage costs

**Пример политики:**
\`\`\`
Data Type: User accounts
- Active users: Indefinitely
- Deleted users: Anonymize immediately, keep anonymized orders for 7 years

Data Type: Logs
- Application logs: 90 days
- Audit logs: 7 years
- Access logs: 1 year

Data Type: Backups
- Daily: 7 days
- Weekly: 4 weeks
- Monthly: 12 months
\`\`\`

### Automated Cleanup

\`\`\`typescript
// Cron job: Delete old logs
cron.schedule('0 0 * * *', async () => { // Daily at midnight
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const deleted = await db.logs.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });

  console.log(\`Deleted \${deleted.count} old logs\`);
});
\`\`\`

---

## Практические сценарии

### Сценарий 1: GDPR Compliance для стартапа

**Задача:** Реализовать GDPR для нового SaaS продукта

**Решение:**
\`\`\`typescript
// 1. Consent Management
app.post('/users/register', async (req, res) => {
  const { email, password, consents } = req.body;

  // Require explicit consent
  if (!consents.dataProcessing) {
    return res.status(400).json({
      error: 'Consent required for data processing'
    });
  }

  const user = await db.users.create({
    data: {
      email,
      password: await hash(password),
      consents: {
        dataProcessing: {
          granted: true,
          timestamp: new Date(),
          version: 'v1.0'
        },
        marketing: {
          granted: consents.marketing || false,
          timestamp: new Date()
        }
      }
    }
  });

  return res.json(user);
});

// 2. Right to Access (Data Portability)
app.get('/users/me/export', async (req, res) => {
  const user = await db.users.findUnique({
    where: { id: req.userId },
    include: { orders: true, preferences: true }
  });

  res.json({
    profile: user,
    exportedAt: new Date(),
    format: 'JSON'
  });
});

// 3. Right to be Forgotten
app.delete('/users/me', async (req, res) => {
  await db.users.update({
    where: { id: req.userId },
    data: {
      email: null,
      name: 'DELETED',
      deletedAt: new Date()
    }
  });

  res.json({ message: 'Account deleted' });
});

// 4. Breach Notification
async function handleDataBreach(incident) {
  // Log incident
  await db.incidents.create({ data: incident });

  // Notify within 72 hours
  if (incident.severity === 'HIGH') {
    await notifyDPA(incident); // Data Protection Authority
    await notifyAffectedUsers(incident);
  }
}
\`\`\`

### Сценарий 2: HIPAA для телемедицины

**Задача:** Реализовать HIPAA для приложения видеоконсультаций с врачами

**Решение:**
\`\`\`typescript
// 1. Encryption at Rest
const encryptedData = encrypt(patientData, KEY);
await db.patients.create({
  data: {
    name: encryptedData.name,
    diagnosis: encryptedData.diagnosis,
    encryptedAt: new Date()
  }
});

// 2. Access Control (RBAC)
async function checkAccess(userId, patientId, action) {
  const user = await db.users.findUnique({ where: { id: userId } });

  if (user.role === 'DOCTOR') {
    // Check if doctor is assigned to patient
    const assignment = await db.assignments.findFirst({
      where: { doctorId: userId, patientId }
    });

    if (!assignment) {
      throw new Error('Access denied: Not assigned to this patient');
    }
  }

  // Log access (Audit Trail)
  await db.auditLogs.create({
    data: {
      userId,
      action,
      resourceType: 'PATIENT',
      resourceId: patientId,
      timestamp: new Date(),
      ip: req.ip
    }
  });

  return true;
}

// 3. BAA with cloud provider
// AWS, Azure, GCP offer HIPAA-compliant services
// Must sign Business Associate Agreement
\`\`\`

---

## Best Practices

### 1. Privacy by Design

✅ **Что делать:** Думать о privacy с первого дня

> 💡 **Совет:** Проще встроить compliance, чем добавлять потом

### 2. Minimize Data Collection

✅ **Что делать:** Собирать только необходимое

### 3. Regular Audits

✅ **Что делать:** Ежегодный compliance audit

### 4. Employee Training

✅ **Что делать:** Обучать команду compliance требованиям

### 5. Incident Response Plan

✅ **Что делать:** План на случай data breach

---

## Заключение

Compliance — это не просто галочка, а **защита пользователей и бизнеса**.

### Ключевые моменты

🎯 **GDPR**: Защита данных граждан ЕС, право на удаление, штрафы до €20 млн

🎯 **HIPAA**: Медицинские данные в США, шифрование, audit trails

🎯 **PCI DSS**: Платежные карты, лучше использовать tokenization

🎯 **SOC 2**: Для SaaS, 5 принципов (Security, Availability, Processing Integrity, Confidentiality, Privacy)

🎯 **Audit Trails**: Логировать все, retention 1-7 лет

> 💡 **Помните:** Compliance дорого игнорировать, дешевле соблюдать!
`;

async function createComplianceLecture() {
  try {
    console.log('🚀 Создание лекции "Compliance и регуляторные требования"...\n');

    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'Compliance' }
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      throw new Error('❌ Тест "Compliance и регуляторные требования" не найден!');
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`   Вопросов в тесте: ${test.questions.length}\n`);

    const lecture = await prisma.lecture.create({
      data: {
        title: 'Compliance и регуляторные требования',
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
    console.log('🎉 Готово! Лекция "Compliance и регуляторные требования" создана.');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createComplianceLecture();
