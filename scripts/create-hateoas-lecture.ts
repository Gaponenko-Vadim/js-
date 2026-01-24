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
# HATEOAS принцип

## Введение

Представьте веб-сайт без ссылок. Чтобы перейти на другую страницу, вам нужно знать точный URL и вводить его вручную. Абсурдно, правда? Именно так работает большинство REST API - клиенты должны hardcode URLs endpoints. HATEOAS (Hypermedia As The Engine Of Application State) решает эту проблему: API сам сообщает клиенту, какие действия доступны, через гиперссылки в ответах.

## Что такое HATEOAS?

**HATEOAS** = **H**ypermedia **A**s **T**he **E**ngine **O**f **A**pplication **S**tate

### Концепция

REST API должен работать как веб-сайт: клиент начинает с одного URL и следует по ссылкам для выполнения действий. Сервер возвращает не только данные, но и **ссылки на доступные действия**.

### Простой пример

**Без HATEOAS:**
\`\`\`json
GET /users/123

{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`

Клиент должен знать:
- Как получить заказы пользователя? \`GET /users/123/orders\`
- Как удалить пользователя? \`DELETE /users/123\`
- Как обновить? \`PUT /users/123\`

**С HATEOAS:**
\`\`\`json
GET /users/123

{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "links": [
    {
      "rel": "self",
      "href": "/users/123",
      "method": "GET"
    },
    {
      "rel": "orders",
      "href": "/users/123/orders",
      "method": "GET"
    },
    {
      "rel": "update",
      "href": "/users/123",
      "method": "PUT"
    },
    {
      "rel": "delete",
      "href": "/users/123",
      "method": "DELETE"
    }
  ]
}
\`\`\`

Клиент видит все доступные действия и переходит по ссылкам.

---

## Преимущества HATEOAS

### 1. Самодокументирование

API сообщает клиенту:
- Какие действия доступны
- Как выполнить каждое действие
- Какие связанные ресурсы существуют

**Клиент не нуждается в документации для навигации.**

### 2. Loose Coupling (слабая связанность)

Сервер контролирует URLs:
- Можно изменить URL структуру без breaking changes
- Клиент следует по ссылкам, не конструирует URLs

**Пример:**
\`\`\`
Сервер меняет: /users/123/orders → /users/123/purchases
Клиент по-прежнему работает: следует по rel="orders"
\`\`\`

### 3. Context-Aware Actions (контекстные действия)

Ссылки отражают **текущее состояние** ресурса.

**Пример: заказ**

**Статус = "pending":**
\`\`\`json
{
  "id": 456,
  "status": "pending",
  "links": [
    { "rel": "cancel", "href": "/orders/456/cancel", "method": "POST" },
    { "rel": "pay", "href": "/orders/456/payment", "method": "POST" }
  ]
}
\`\`\`

**Статус = "shipped":**
\`\`\`json
{
  "id": 456,
  "status": "shipped",
  "links": [
    { "rel": "track", "href": "/orders/456/tracking", "method": "GET" }
  ]
}
\`\`\`

**Нет** ссылки "cancel" - заказ нельзя отменить. Клиент автоматически скрывает кнопку "Cancel".

### 4. Versioning без breaking changes

Сервер может добавить новые ссылки без изменения существующих:
\`\`\`json
{
  "id": 123,
  "links": [
    { "rel": "self", "href": "/users/123" },
    { "rel": "avatar", "href": "/users/123/avatar" }  // Новая ссылка
  ]
}
\`\`\`

Старые клиенты игнорируют неизвестные ссылки.

---

## Richardson Maturity Model

**Leonard Richardson** определил 4 уровня зрелости REST API:

### Level 0: The Swamp of POX (Plain Old XML)

- Один URL, один HTTP метод (обычно POST)
- RPC-style: \`POST /api\` с телом \`{"action": "getUser"}\`
- **Пример:** SOAP, XML-RPC

### Level 1: Resources

- Множество URLs для разных ресурсов
- \`/users\`, \`/orders\`, \`/products\`
- Но все еще один метод (POST)

### Level 2: HTTP Verbs

- Используются HTTP методы по назначению
- \`GET /users\`, \`POST /users\`, \`DELETE /users/123\`
- Стандартные статус коды (200, 404, 500)

**Большинство "REST API" на этом уровне.**

### Level 3: Hypermedia Controls (HATEOAS)

- Responses содержат ссылки на доступные действия
- Клиент следует по ссылкам вместо hardcoded URLs
- **Полноценный REST**

**Очень мало API достигают уровня 3.**

---

## Анатомия HATEOAS ссылки

### Базовая структура

\`\`\`json
{
  "rel": "orders",
  "href": "/users/123/orders",
  "method": "GET",
  "type": "application/json"
}
\`\`\`

#### Поля:

**1. \`rel\` (relation type) - тип отношения:**
- Семантическое значение ссылки
- Что означает эта ссылка?

Примеры:
- \`self\` - ссылка на сам ресурс
- \`next\`, \`prev\` - пагинация
- \`edit\`, \`delete\` - действия
- \`author\`, \`comments\` - связанные ресурсы

**2. \`href\` (hypertext reference) - URL:**
- Абсолютный или относительный URL
- Куда перейти для выполнения действия

**3. \`method\` (опционально) - HTTP метод:**
- \`GET\`, \`POST\`, \`PUT\`, \`DELETE\`, \`PATCH\`
- По умолчанию \`GET\`

**4. \`type\` (опционально) - Media Type:**
- \`application/json\`, \`application/xml\`
- Content-Type ожидаемого ответа

---

## Стандарты HATEOAS

### 1. HAL (Hypertext Application Language)

**HAL** - популярный формат для HATEOAS в JSON и XML.

#### HAL JSON структура

\`\`\`json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "_links": {
    "self": {
      "href": "/users/123"
    },
    "orders": {
      "href": "/users/123/orders"
    },
    "avatar": {
      "href": "/users/123/avatar",
      "type": "image/png"
    }
  },
  "_embedded": {
    "orders": [
      {
        "id": 456,
        "total": 99.99,
        "_links": {
          "self": { "href": "/orders/456" }
        }
      }
    ]
  }
}
\`\`\`

**Ключевые секции:**

**\`_links\`** - гиперссылки на связанные ресурсы
**\`_embedded\`** - встроенные полные ресурсы (опционально)

#### HAL relation types

\`\`\`json
{
  "_links": {
    "self": { "href": "/users/123" },
    "next": { "href": "/users?page=2" },
    "prev": { "href": "/users?page=1" },
    "first": { "href": "/users?page=1" },
    "last": { "href": "/users?page=10" }
  }
}
\`\`\`

#### Content-Type для HAL

\`\`\`
Content-Type: application/hal+json
Content-Type: application/vnd.hal+json
\`\`\`

Оба варианта валидны.

#### Плюсы HAL

✅ **Простой** - легко понять и реализовать
✅ **Стандартизированный** - specification + библиотеки
✅ **Популярный** - Spring HATEOAS, HAL Explorer

#### Минусы HAL

❌ **Ограниченная выразительность** - нет actions с параметрами
❌ **Только ссылки** - не описывает формы для POST/PUT

---

### 2. JSON-LD (JSON Linked Data)

**JSON-LD** - W3C стандарт для linked data.

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "/users/123",
  "name": "John Doe",
  "email": "john@example.com",
  "knows": {
    "@id": "/users/456",
    "name": "Jane Smith"
  }
}
\`\`\`

**Особенности:**
- \`@context\` - словарь терминов (schema.org)
- \`@type\` - тип ресурса
- \`@id\` - уникальный идентификатор (URL)

#### Плюсы JSON-LD

✅ **Semantic Web** - интеграция с RDF, SPARQL
✅ **SEO-friendly** - Google понимает schema.org
✅ **Rich metadata** - детальное описание данных

#### Минусы

❌ **Overkill для REST API** - слишком сложный
❌ **Редко используется** в обычных REST API

#### Когда использовать

- Публичные данные (Open Data)
- SEO критично (structured data)
- Интеграция с Semantic Web

---

### 3. Siren

**Siren** - спецификация с поддержкой actions и forms.

\`\`\`json
{
  "class": ["user"],
  "properties": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "entities": [
    {
      "class": ["order"],
      "rel": ["/rels/order"],
      "href": "/orders/456"
    }
  ],
  "actions": [
    {
      "name": "update-user",
      "method": "PUT",
      "href": "/users/123",
      "type": "application/json",
      "fields": [
        { "name": "name", "type": "text" },
        { "name": "email", "type": "email" }
      ]
    }
  ],
  "links": [
    { "rel": ["self"], "href": "/users/123" }
  ]
}
\`\`\`

**Секции:**

**\`properties\`** - данные ресурса
**\`entities\`** - встроенные связанные ресурсы
**\`actions\`** - доступные действия с параметрами
**\`links\`** - навигационные ссылки

#### Плюсы Siren

✅ **Actions с параметрами** - описывает формы
✅ **Выразительный** - полное описание возможностей

#### Минусы

❌ **Сложный** - больше boilerplate
❌ **Менее популярен** чем HAL

---

## Templated URLs

**Концепция**: URLs с параметрами для клиента.

### URI Template (RFC 6570)

\`\`\`json
{
  "_links": {
    "search": {
      "href": "/users{?name,email,page}",
      "templated": true
    }
  }
}
\`\`\`

**Клиент подставляет параметры:**
\`\`\`
/users?name=John
/users?email=john@example.com&page=2
/users?name=John&email=john@example.com
\`\`\`

### Синтаксис URI Template

\`\`\`
/users/{id}              # Path parameter
/users{?page,size}       # Query parameters
/users/{id}/orders{?status}  # Mixed
\`\`\`

**\`templated: true\`** сообщает клиенту, что URL нужно expand.

### Плюсы

✅ **Гибкость** - клиент выбирает параметры
✅ **Документирование** - видны доступные фильтры
✅ **Стандарт** - RFC 6570

---

## Link Relations Registry (IANA)

**IANA** поддерживает реестр стандартизированных relation types.

### Стандартные \`rel\` значения

| Rel | Значение |
|-----|----------|
| \`self\` | Сам ресурс |
| \`next\` | Следующая страница |
| \`prev\` | Предыдущая страница |
| \`first\` | Первая страница |
| \`last\` | Последняя страница |
| \`edit\` | Редактирование ресурса |
| \`alternate\` | Альтернативное представление |
| \`author\` | Автор ресурса |
| \`collection\` | Коллекция, к которой принадлежит |
| \`item\` | Элемент коллекции |

**Полный список:** https://www.iana.org/assignments/link-relations/

### Custom relation types

Если стандартного нет, используйте URI:
\`\`\`json
{
  "rel": "http://api.example.com/rels/activate",
  "href": "/users/123/activate"
}
\`\`\`

Или сокращенно (с \`@context\`):
\`\`\`json
{
  "@context": {
    "activate": "http://api.example.com/rels/activate"
  },
  "rel": "activate",
  "href": "/users/123/activate"
}
\`\`\`

---

## Контекстно-зависимые ссылки

### Пример: Workflow для заказа

**Статус: pending**
\`\`\`json
{
  "id": 789,
  "status": "pending",
  "total": 199.99,
  "links": [
    { "rel": "self", "href": "/orders/789" },
    { "rel": "pay", "href": "/orders/789/payment", "method": "POST" },
    { "rel": "cancel", "href": "/orders/789", "method": "DELETE" }
  ]
}
\`\`\`

**Статус: paid**
\`\`\`json
{
  "id": 789,
  "status": "paid",
  "total": 199.99,
  "links": [
    { "rel": "self", "href": "/orders/789" },
    { "rel": "invoice", "href": "/orders/789/invoice", "method": "GET" },
    { "rel": "refund", "href": "/orders/789/refund", "method": "POST" }
  ]
}
\`\`\`

**Статус: shipped**
\`\`\`json
{
  "id": 789,
  "status": "shipped",
  "total": 199.99,
  "links": [
    { "rel": "self", "href": "/orders/789" },
    { "rel": "track", "href": "/orders/789/tracking" }
  ]
}
\`\`\`

Клиент **не проверяет status** для отображения кнопок - просто показывает доступные ссылки.

---

## Нужен ли HATEOAS всем API?

### Когда НЕ нужен HATEOAS

❌ **Простые CRUD API**
- 5-10 endpoints
- Один клиент (ваш фронтенд)
- Редкие изменения

❌ **Internal микросервисы**
- Жесткий контракт между сервисами
- Нет динамической навигации

❌ **Мобильные приложения**
- UI hardcoded под endpoints
- Overhead в размере ответов критичен

### Когда HATEOAS полезен

✅ **Публичные API**
- Множество сторонних клиентов
- Нужна эволюция без breaking changes

✅ **Сложные workflows**
- Состояния ресурсов меняются
- Доступные действия зависят от контекста

✅ **Долгоживущие API**
- Планируется использовать 5-10+ лет
- Важна гибкость изменения URL структуры

✅ **Self-service API**
- Клиенты исследуют API через responses
- Меньше зависимости от документации

---

## Влияние на размер ответа

### Без HATEOAS

\`\`\`json
{
  "id": 123,
  "name": "John"
}
\`\`\`
**Размер:** ~30 bytes

### С HATEOAS (HAL)

\`\`\`json
{
  "id": 123,
  "name": "John",
  "_links": {
    "self": { "href": "/users/123" },
    "orders": { "href": "/users/123/orders" },
    "edit": { "href": "/users/123" }
  }
}
\`\`\`
**Размер:** ~150 bytes

**Увеличение:** ~5x для малого ресурса, ~20-50% для реалистичного.

### Оптимизация

1. **Не включать очевидные ссылки** (\`self\` часто избыточен)
2. **Сжатие (gzip)** - JSON хорошо сжимается
3. **Sparse links** - только релевантные для текущего контекста

---

## Практическая реализация

### Задача 1: Базовый HATEOAS (без фреймворка)

\`\`\`javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);

  const response = {
    ...user,
    links: [
      {
        rel: 'self',
        href: \`/users/\${user.id}\`,
        method: 'GET'
      },
      {
        rel: 'orders',
        href: \`/users/\${user.id}/orders\`,
        method: 'GET'
      },
      {
        rel: 'update',
        href: \`/users/\${user.id}\`,
        method: 'PUT'
      }
    ]
  };

  res.json(response);
});
\`\`\`

### Задача 2: HAL формат

\`\`\`javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);

  const response = {
    id: user.id,
    name: user.name,
    email: user.email,
    _links: {
      self: { href: \`/users/\${user.id}\` },
      orders: { href: \`/users/\${user.id}/orders\` },
      avatar: {
        href: \`/users/\${user.id}/avatar\`,
        type: 'image/png'
      }
    }
  };

  res.set('Content-Type', 'application/hal+json');
  res.json(response);
});
\`\`\`

### Задача 3: Контекстные ссылки

\`\`\`javascript
app.get('/orders/:id', async (req, res) => {
  const order = await db.orders.findById(req.params.id);

  const links = [
    { rel: 'self', href: \`/orders/\${order.id}\` }
  ];

  // Добавляем ссылки в зависимости от статуса
  if (order.status === 'pending') {
    links.push({ rel: 'pay', href: \`/orders/\${order.id}/payment\`, method: 'POST' });
    links.push({ rel: 'cancel', href: \`/orders/\${order.id}\`, method: 'DELETE' });
  }

  if (order.status === 'paid') {
    links.push({ rel: 'invoice', href: \`/orders/\${order.id}/invoice\` });
    links.push({ rel: 'refund', href: \`/orders/\${order.id}/refund\`, method: 'POST' });
  }

  if (order.status === 'shipped') {
    links.push({ rel: 'track', href: \`/orders/\${order.id}/tracking\` });
  }

  res.json({ ...order, links });
});
\`\`\`

### Задача 4: Templated URLs

\`\`\`javascript
app.get('/users', async (req, res) => {
  const users = await db.users.find();

  const response = {
    users,
    _links: {
      self: { href: '/users' },
      search: {
        href: '/users{?name,email,page,size}',
        templated: true
      }
    }
  };

  res.json(response);
});
\`\`\`

---

## Фреймворки для HATEOAS

### Spring HATEOAS (Java)

\`\`\`java
@GetMapping("/users/{id}")
public EntityModel<User> getUser(@PathVariable Long id) {
    User user = userRepository.findById(id);

    return EntityModel.of(user,
        linkTo(methodOn(UserController.class).getUser(id)).withSelfRel(),
        linkTo(methodOn(OrderController.class).getOrdersByUser(id)).withRel("orders")
    );
}
\`\`\`

### Django REST Framework (Python)

\`\`\`python
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def user_detail(request, pk):
    user = User.objects.get(pk=pk)

    return Response({
        'id': user.id,
        'name': user.name,
        'links': [
            {'rel': 'self', 'href': f'/users/{user.id}'},
            {'rel': 'orders', 'href': f'/users/{user.id}/orders'}
        ]
    })
\`\`\`

---

## Best Practices

### 1. Используйте стандартные relation types

✅ \`self\`, \`next\`, \`prev\` из IANA registry
❌ Custom названия без документации

### 2. Абсолютные vs относительные URLs

**Относительные (рекомендуется):**
\`\`\`json
{ "href": "/users/123" }
\`\`\`

**Абсолютные (для cross-domain):**
\`\`\`json
{ "href": "https://api.example.com/users/123" }
\`\`\`

### 3. Включайте method только если не GET

\`\`\`json
{ "rel": "delete", "href": "/users/123", "method": "DELETE" }
\`\`\`

GET - default, можно не указывать.

### 4. Не дублируйте данные в ссылках

❌ **Плохо:**
\`\`\`json
{
  "id": 123,
  "links": [
    { "rel": "self", "href": "/users/123", "userId": 123 }
  ]
}
\`\`\`

Ссылка должна содержать только навигационную информацию.

### 5. Тестируйте кли entскую обработку

Клиент должен:
- Игнорировать неизвестные relation types
- Не падать если ссылка отсутствует
- Обрабатывать динамические ссылки

---

## Заключение

**HATEOAS в двух словах:**

✅ **Используйте если:**
- Публичный API с множеством клиентов
- Сложные workflows с состояниями
- Долгосрочная эволюция без breaking changes
- Нужно self-documenting API

❌ **Не используйте если:**
- Простой CRUD для одного фронтенда
- Мобильные приложения с жестким UI
- Каждый байт трафика критичен
- Команда не готова поддерживать сложность

**Рекомендации:**

1. **Начните с Level 2** (HTTP verbs) - это уже хороший REST
2. **Добавьте HATEOAS постепенно** - сначала базовые ссылки (\`self\`, \`next\`)
3. **Используйте HAL** - простой и популярный стандарт
4. **Документируйте relation types** - что означает каждый \`rel\`
5. **Контекстные ссылки** - показывайте только доступные действия

HATEOAS - это идеал REST, но не всегда практичный. Выбирайте уровень зрелости API исходя из реальных потребностей проекта, не ради соответствия теоретическим принципам.
`;

const lectureContent = cleanContent(lectureContentRaw);

async function createLecture() {
  try {
    console.log('🔧 Создание лекции "HATEOAS принцип"...\n');

    const lecture = await prisma.lecture.create({
      data: {
        title: 'HATEOAS принцип',
        topic: 'HATEOAS',
        content: lectureContent,
      },
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'HATEOAS' },
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
      console.log('❌ Тест "HATEOAS" не найден');
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
