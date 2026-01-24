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
# Фильтрация и сортировка в REST API

## Введение

Представьте огромный интернет-магазин с 100,000 товаров. Пользователь хочет найти "красные кроссовки Nike размера 42 дешевле 5000 рублей, отсортированные по цене". Вместо того чтобы отправлять все 100К товаров клиенту и фильтровать на фронтенде, API должен выполнить фильтрацию и сортировку на сервере, вернув только релевантные результаты. Именно об этом мы поговорим - как правильно проектировать фильтрацию и сортировку в REST API.

## Зачем нужна фильтрация и сортировка на сервере?

### Проблемы клиентской фильтрации

1. **Огромный трафик**: Передача 100K записей по сети медленная и дорогая
2. **Performance**: Обработка больших датасетов в JavaScript замораживает браузер
3. **Security**: Клиент может видеть больше данных, чем нужно
4. **Сложность**: Дублирование бизнес-логики между сервером и клиентом

### Преимущества серверной фильтрации

✅ **Минимальный трафик** - только релевантные данные
✅ **Быстрый ответ** - SQL оптимизирован для фильтрации
✅ **Безопасность** - контроль доступа к данным
✅ **Единая точка правды** - вся логика на сервере

---

## Основные подходы к фильтрации

### 1. Query Parameters (простые фильтры)

**Концепция**: Каждый фильтр - это отдельный query параметр.

#### Простые равенства

\`\`\`
GET /api/products?category=electronics&status=active
\`\`\`

**SQL:**
\`\`\`sql
SELECT * FROM products
WHERE category = 'electronics' AND status = 'active';
\`\`\`

#### Множественные значения (IN)

\`\`\`
GET /api/products?status=active,pending
GET /api/products?status[]=active&status[]=pending
\`\`\`

**SQL:**
\`\`\`sql
SELECT * FROM products
WHERE status IN ('active', 'pending');
\`\`\`

#### Диапазоны значений

\`\`\`
GET /api/products?price_min=1000&price_max=5000
GET /api/products?created_after=2024-01-01&created_before=2024-12-31
\`\`\`

**SQL:**
\`\`\`sql
SELECT * FROM products
WHERE price >= 1000 AND price <= 5000
  AND created_at BETWEEN '2024-01-01' AND '2024-12-31';
\`\`\`

#### Плюсы простых query params

✅ **Интуитивно понятные** - легко читать и писать
✅ **Легко кешировать** - URL отражает запрос
✅ **Поддержка в HTML формах** - можно использовать \`<form method="GET">\`

#### Минусы

❌ **Ограниченная выразительность** - сложно выразить OR, NOT
❌ **Не масштабируется** - для сложных фильтров URL становится огромным
❌ **Нет стандарта** - каждый API выбирает свои соглашения

---

### 2. Filter Object Notation

**Концепция**: Использовать вложенную структуру для фильтров.

#### Синтаксис \`filter[field]\`

\`\`\`
GET /api/users?filter[name]=John&filter[age]=25
GET /api/users?filter[status]=active&filter[role]=admin
\`\`\`

Часто используется в JSON:API спецификации.

#### Вложенные фильтры

\`\`\`
GET /api/posts?filter[author][name]=John
\`\`\`

**Equivalent to:**
\`\`\`sql
SELECT * FROM posts
JOIN users ON posts.author_id = users.id
WHERE users.name = 'John';
\`\`\`

#### Плюсы

✅ **Явная семантика** - понятно что это фильтр
✅ **Поддержка вложенности** - легко фильтровать по связанным ресурсам
✅ **Расширяемость** - можно добавить операторы

---

### 3. Filter Operators (расширенные фильтры)

**Концепция**: Указывать оператор сравнения явно.

#### LHS Brackets (Left-Hand Side)

\`\`\`
GET /api/products?price[gte]=1000&price[lte]=5000
GET /api/users?age[gt]=18&created_at[lt]=2024-01-01
\`\`\`

**Операторы:**
- \`eq\` - equals (=)
- \`ne\` - not equals (!=)
- \`gt\` - greater than (>)
- \`gte\` - greater than or equal (>=)
- \`lt\` - less than (<)
- \`lte\` - less than or equal (<=)
- \`like\` - SQL LIKE с wildcard
- \`in\` - IN (...)
- \`nin\` - NOT IN (...)

#### Пример с like

\`\`\`
GET /api/users?name[like]=John%
\`\`\`

**SQL:**
\`\`\`sql
SELECT * FROM users WHERE name LIKE 'John%';
\`\`\`

#### RHS Colon (Right-Hand Side)

Альтернативный синтаксис:
\`\`\`
GET /api/products?price=gte:1000
GET /api/users?age=gt:18
\`\`\`

**Плюсы:**
- Короче чем LHS brackets
- Все еще понятно

**Минусы:**
- Требует парсинга значения
- Может конфликтовать с реальными данными (если значение содержит \`:\`)

---

### 4. RSQL (RESTful Query Language)

**Концепция**: Мини-язык запросов в URL, похожий на SQL WHERE.

#### Синтаксис

\`\`\`
GET /api/products?filter=price>=1000;price<=5000;category==electronics
\`\`\`

**Операторы RSQL:**
- \`==\` - equals
- \`!=\` - not equals
- \`>\` - greater than
- \`>=\` - greater or equal
- \`<\` - less than
- \`<=\` - less or equal
- \`=in=\` - IN
- \`=out=\` - NOT IN
- \`=like=\` - LIKE

**Логические операторы:**
- \`;\` или \`and\` - AND
- \`,\` или \`or\` - OR
- \`()\` - группировка

#### Примеры

**AND:**
\`\`\`
GET /api/products?filter=category==electronics;price>=1000
\`\`\`

Эквивалент SQL:
\`\`\`sql
WHERE category = 'electronics' AND price >= 1000
\`\`\`

**OR:**
\`\`\`
GET /api/products?filter=category==electronics,category==books
\`\`\`

Эквивалент SQL:
\`\`\`sql
WHERE category = 'electronics' OR category = 'books'
\`\`\`

**Группировка:**
\`\`\`
GET /api/products?filter=(category==electronics,category==books);price<1000
\`\`\`

Эквивалент SQL:
\`\`\`sql
WHERE (category = 'electronics' OR category = 'books') AND price < 1000
\`\`\`

**IN оператор:**
\`\`\`
GET /api/products?filter=status=in=(active,pending,draft)
\`\`\`

Эквивалент SQL:
\`\`\`sql
WHERE status IN ('active', 'pending', 'draft')
\`\`\`

#### Плюсы RSQL

✅ **Очень выразительный** - поддержка AND, OR, NOT, группировки
✅ **Компактный** - один параметр вместо множества
✅ **Стандартизированный** - есть спецификация и библиотеки
✅ **Type-safe парсинг** - легко валидировать

#### Минусы RSQL

❌ **Сложнее для новичков** - нужно изучить синтаксис
❌ **URL encoding проблемы** - \`()\`, \`,\`, \`;\` требуют кодирования
❌ **Не работает с HTML формами** - требует JavaScript

**Используется в:** Fireburst, rsql-parser библиотеки.

---

### 5. OData Query Syntax

**Концепция**: Стандарт Microsoft для REST API запросов.

#### $filter синтаксис

\`\`\`
GET /api/products?$filter=price gt 1000 and price lt 5000
GET /api/users?$filter=startswith(name, 'John')
\`\`\`

**Операторы:**
- \`eq\`, \`ne\`, \`gt\`, \`ge\`, \`lt\`, \`le\` - сравнения
- \`and\`, \`or\`, \`not\` - логические
- \`startswith()\`, \`endswith()\`, \`contains()\` - строковые функции
- \`year()\`, \`month()\`, \`day()\` - функции дат

#### Примеры

**Строковые функции:**
\`\`\`
GET /api/products?$filter=contains(name, 'phone')
GET /api/users?$filter=startswith(email, 'admin')
\`\`\`

**Функции дат:**
\`\`\`
GET /api/orders?$filter=year(created_at) eq 2024 and month(created_at) eq 12
\`\`\`

**Работа с null:**
\`\`\`
GET /api/users?$filter=deleted_at eq null
\`\`\`

#### Плюсы OData

✅ **Очень мощный** - функции, арифметика, навигация по связям
✅ **Стандартизированный** - полная спецификация от Microsoft
✅ **Богатые клиентские библиотеки** - официальная поддержка

#### Минусы OData

❌ **Сложный в реализации** - требует полноценный парсер
❌ **Overkill для простых API** - слишком тяжеловесный
❌ **Специфичный синтаксис** - отличается от обычных query params

**Используется в:** Microsoft Graph API, SharePoint, Dynamics 365.

---

## Сортировка (Sorting)

### 1. Простой sort параметр

\`\`\`
GET /api/products?sort=price
GET /api/products?sort=-price    # descending (минус = обратный порядок)
\`\`\`

**SQL:**
\`\`\`sql
-- sort=price
SELECT * FROM products ORDER BY price ASC;

-- sort=-price
SELECT * FROM products ORDER BY price DESC;
\`\`\`

### 2. Множественная сортировка

**Comma-separated:**
\`\`\`
GET /api/products?sort=category,-price,name
\`\`\`

**SQL:**
\`\`\`sql
SELECT * FROM products
ORDER BY category ASC, price DESC, name ASC;
\`\`\`

**Порядок важен:** сначала по category, потом по price внутри каждой категории.

### 3. Альтернативные синтаксисы

**Order parameter:**
\`\`\`
GET /api/products?sort=price&order=desc
GET /api/products?sort=price&order=asc
\`\`\`

**Separate parameters:**
\`\`\`
GET /api/products?sort_by=price&sort_order=desc
\`\`\`

**Array notation:**
\`\`\`
GET /api/products?sort[]=category&sort[]=-price
\`\`\`

### 4. Сортировка по связанным ресурсам

\`\`\`
GET /api/posts?sort=author.name
GET /api/orders?sort=customer.created_at
\`\`\`

**SQL:**
\`\`\`sql
SELECT posts.* FROM posts
JOIN users ON posts.author_id = users.id
ORDER BY users.name ASC;
\`\`\`

⚠️ **Performance warning**: JOIN может быть медленным на больших таблицах. Убедитесь что есть индексы.

### 5. Default sorting

Всегда задавайте дефолтную сортировку для предсказуемости:
\`\`\`javascript
const sortBy = req.query.sort || 'created_at';
const sortOrder = sortBy.startsWith('-') ? 'desc' : 'asc';
const field = sortBy.replace(/^-/, '');
\`\`\`

**Рекомендация:** По умолчанию сортировать по \`created_at DESC\` или \`id DESC\` (новые сверху).

---

## Full-text Search (полнотекстовый поиск)

### 1. Query parameter \`q\`

\`\`\`
GET /api/products?q=iphone
GET /api/articles?q=REST+API+best+practices
\`\`\`

**Короткий и интуитивный**, похож на Google поиск.

### 2. Search parameter

\`\`\`
GET /api/products?search=iphone
\`\`\`

**Более явный**, но длиннее чем \`q\`.

### 3. Поиск по конкретным полям

\`\`\`
GET /api/products?q=iphone&search_fields=name,description
\`\`\`

Искать "iphone" только в полях \`name\` и \`description\`.

### 4. Backend реализация

**PostgreSQL:**
\`\`\`sql
SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('english', 'iphone');
\`\`\`

**MySQL:**
\`\`\`sql
SELECT * FROM products
WHERE MATCH(name, description) AGAINST('iphone' IN NATURAL LANGUAGE MODE);
\`\`\`

**Простой LIKE (не рекомендуется для production):**
\`\`\`sql
SELECT * FROM products
WHERE name LIKE '%iphone%' OR description LIKE '%iphone%';
\`\`\`

⚠️ **LIKE проблемы:**
- Очень медленный на больших таблицах
- \`%keyword%\` не использует индексы
- Нет ранжирования результатов

**Решение:** Elasticsearch, Algolia, PostgreSQL Full-Text Search, MySQL FULLTEXT indexes.

### 5. Комбинация поиска и фильтров

\`\`\`
GET /api/products?q=iphone&category=electronics&price_max=50000&sort=-rating
\`\`\`

Поиск "iphone" в категории electronics, дешевле 50K, отсортировано по рейтингу.

---

## Sparse Fieldsets (выборочные поля)

### Концепция

Вместо возврата всех полей, клиент выбирает только нужные.

\`\`\`
GET /api/users?fields=id,name,email
GET /api/products?fields=id,name,price
\`\`\`

**Response:**
\`\`\`json
[
  { "id": 1, "name": "iPhone", "price": 50000 },
  { "id": 2, "name": "Samsung", "price": 40000 }
]
\`\`\`

Без \`created_at\`, \`updated_at\`, \`description\`, \`inventory\`, etc.

### Преимущества

✅ **Меньший трафик** - только необходимые данные
✅ **Быстрее парсинг** - меньше JSON для обработки
✅ **Безопасность** - не раскрываем лишние поля

### Синтаксис для связанных ресурсов (JSON:API)

\`\`\`
GET /api/posts?include=author&fields[posts]=title,body&fields[author]=name
\`\`\`

- \`include=author\` - включить связанного автора
- \`fields[posts]=title,body\` - для постов взять только title и body
- \`fields[author]=name\` - для авторов только name

### Реализация (Prisma example)

\`\`\`javascript
const fields = req.query.fields ? req.query.fields.split(',') : null;

const select = fields ? Object.fromEntries(fields.map(f => [f, true])) : undefined;

const products = await prisma.product.findMany({
  select: select || undefined
});
\`\`\`

---

## OR логика в фильтрах

### Проблема

Query params по умолчанию комбинируются через AND:
\`\`\`
GET /api/products?status=active&category=electronics
\`\`\`
→ \`WHERE status = 'active' AND category = 'electronics'\`

Но как выразить OR?

### Решение 1: Comma-separated (IN)

\`\`\`
GET /api/products?status=active,pending
\`\`\`
→ \`WHERE status IN ('active', 'pending')\`

Работает только для одного поля.

### Решение 2: RSQL

\`\`\`
GET /api/products?filter=status==active,status==pending
\`\`\`
→ \`WHERE status = 'active' OR status = 'pending'\`

### Решение 3: Explicit OR parameter

\`\`\`
GET /api/products?or[status]=active&or[status]=pending
\`\`\`

Менее стандартно, но работает.

### Решение 4: JSON в query (не рекомендуется)

\`\`\`
GET /api/products?filter={"$or":[{"status":"active"},{"category":"electronics"}]}
\`\`\`

Сложно читать, проблемы с URL encoding.

---

## Date Range Filtering

### Форматы дат

**ISO 8601 (рекомендуется):**
\`\`\`
GET /api/orders?created_after=2024-01-01T00:00:00Z
GET /api/orders?created_before=2024-12-31T23:59:59Z
\`\`\`

**Date only:**
\`\`\`
GET /api/orders?created_after=2024-01-01&created_before=2024-12-31
\`\`\`

**Unix timestamp:**
\`\`\`
GET /api/orders?created_after=1704067200
\`\`\`

### Диапазоны

**Между датами:**
\`\`\`
GET /api/orders?created_at[gte]=2024-01-01&created_at[lte]=2024-12-31
\`\`\`

**SQL:**
\`\`\`sql
SELECT * FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';
\`\`\`

### Относительные даты

Некоторые API поддерживают относительные значения:
\`\`\`
GET /api/orders?created_after=now-7d  # Последние 7 дней
GET /api/orders?created_after=today
GET /api/orders?created_after=this-month
\`\`\`

Требует парсинг на сервере.

---

## Validation и Security

### 1. Whitelist разрешенных полей

❌ **Опасно:**
\`\`\`javascript
const sortBy = req.query.sort; // Может быть любое поле!
const query = \`SELECT * FROM users ORDER BY \${sortBy}\`; // SQL injection риск
\`\`\`

✅ **Безопасно:**
\`\`\`javascript
const ALLOWED_SORT_FIELDS = ['name', 'email', 'created_at'];
const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sort)
  ? req.query.sort
  : 'created_at';
\`\`\`

### 2. Защита от огромных фильтров

\`\`\`javascript
const filters = Object.keys(req.query).filter(k => k.startsWith('filter['));
if (filters.length > 20) {
  return res.status(400).json({ error: 'Too many filters' });
}
\`\`\`

### 3. Защита приватных полей

Не позволяйте фильтровать/сортировать по приватным полям:
\`\`\`javascript
const PRIVATE_FIELDS = ['password_hash', 'reset_token', 'api_key'];
if (PRIVATE_FIELDS.includes(sortBy)) {
  return res.status(403).json({ error: 'Cannot sort by this field' });
}
\`\`\`

### 4. Rate limiting для поиска

Полнотекстовый поиск дорогой:
\`\`\`javascript
if (req.query.q && req.query.q.length < 3) {
  return res.status(400).json({ error: 'Search query must be at least 3 characters' });
}
\`\`\`

---

## Best Practices

### 1. Документируйте все параметры

В API документации четко описать:
- Какие фильтры доступны
- Какие операторы поддерживаются
- Default сортировка
- Примеры использования

### 2. Consistency в именовании

Выберите одну схему и придерживайтесь её:
- ✅ \`created_at[gte]\` или \`created_at=gte:...\`
- ❌ Не смешивайте разные подходы в одном API

### 3. Case sensitivity

Явно укажите регистрозависимость:
\`\`\`
GET /api/users?name=john     # case-insensitive
GET /api/users?name[eq]=John  # case-sensitive
\`\`\`

**SQL:**
\`\`\`sql
-- case-insensitive
WHERE LOWER(name) = LOWER('john')

-- case-sensitive
WHERE name = 'John'
\`\`\`

### 4. Комбинируйте с пагинацией

Всегда добавляйте пагинацию при фильтрации:
\`\`\`
GET /api/products?category=electronics&sort=-price&limit=20&page=1
\`\`\`

Даже фильтрованные результаты могут быть огромными.

### 5. Индексы для фильтров

Для каждого часто используемого фильтра создайте индекс:
\`\`\`sql
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
\`\`\`

Composite indexes для комбинированных фильтров:
\`\`\`sql
CREATE INDEX idx_products_category_status ON products(category, status);
\`\`\`

### 6. Возвращайте примененные фильтры

\`\`\`json
{
  "data": [...],
  "filters_applied": {
    "category": "electronics",
    "price_min": 1000,
    "sort": "-price"
  },
  "pagination": {...}
}
\`\`\`

Полезно для debugging и UX (показать активные фильтры).

### 7. Fallback для неизвестных фильтров

\`\`\`javascript
const KNOWN_FILTERS = ['category', 'status', 'price_min', 'price_max'];
const unknownFilters = Object.keys(req.query).filter(k => !KNOWN_FILTERS.includes(k));

if (unknownFilters.length > 0) {
  console.warn('Unknown filters:', unknownFilters);
  // Игнорировать или вернуть 400
}
\`\`\`

---

## Типичные задачи

### Задача 1: Простая фильтрация и сортировка

\`\`\`javascript
app.get('/api/products', async (req, res) => {
  const { category, status, sort } = req.query;

  const where = {};
  if (category) where.category = category;
  if (status) where.status = status;

  const sortField = sort?.startsWith('-') ? sort.slice(1) : sort || 'created_at';
  const sortOrder = sort?.startsWith('-') ? 'desc' : 'asc';

  const products = await db.products.findMany({
    where,
    orderBy: { [sortField]: sortOrder }
  });

  res.json(products);
});
\`\`\`

### Задача 2: Range фильтры

\`\`\`javascript
app.get('/api/products', async (req, res) => {
  const { price_min, price_max } = req.query;

  const where = {};

  if (price_min || price_max) {
    where.price = {};
    if (price_min) where.price.gte = parseFloat(price_min);
    if (price_max) where.price.lte = parseFloat(price_max);
  }

  const products = await db.products.findMany({ where });
  res.json(products);
});
\`\`\`

### Задача 3: Полнотекстовый поиск + фильтры

\`\`\`javascript
app.get('/api/products', async (req, res) => {
  const { q, category, price_max } = req.query;

  const where = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }

  if (category) where.category = category;
  if (price_max) where.price = { lte: parseFloat(price_max) };

  const products = await db.products.findMany({ where });
  res.json(products);
});
\`\`\`

### Задача 4: RSQL парсинг (упрощенный)

\`\`\`javascript
// GET /api/products?filter=price>=1000;category==electronics

function parseRSQL(filter) {
  const parts = filter.split(';'); // AND split
  const conditions = {};

  parts.forEach(part => {
    if (part.includes('>=')) {
      const [field, value] = part.split('>=');
      conditions[field] = { gte: parseFloat(value) };
    } else if (part.includes('==')) {
      const [field, value] = part.split('==');
      conditions[field] = value;
    }
    // ... другие операторы
  });

  return conditions;
}

app.get('/api/products', async (req, res) => {
  const where = req.query.filter ? parseRSQL(req.query.filter) : {};
  const products = await db.products.findMany({ where });
  res.json(products);
});
\`\`\`

---

## Сравнительная таблица подходов

| Подход | Простота | Выразительность | Use Case |
|--------|----------|-----------------|----------|
| **Query Params** | ✅ Очень простой | ⚠️ Ограничена | Простые фильтры |
| **Filter Object** | ✅ Простой | ⚠️ Средняя | JSON:API, вложенные |
| **RSQL** | ⚠️ Средний | ✅ Высокая | Сложные запросы |
| **OData** | ❌ Сложный | ✅ Очень высокая | Enterprise API |

---

## Заключение

**Рекомендации по выбору:**

1. **Простой API (CRUD, admin панели)**: Query parameters
   \`\`\`
   GET /api/products?category=electronics&status=active&sort=-price
   \`\`\`

2. **Средняя сложность (мобильные приложения)**: Filter operators
   \`\`\`
   GET /api/products?price[gte]=1000&price[lte]=5000&sort=name
   \`\`\`

3. **Сложные фильтры (аналитика, dashboards)**: RSQL
   \`\`\`
   GET /api/products?filter=price>=1000;(category==electronics,category==books)
   \`\`\`

4. **Enterprise, интеграции**: OData
   \`\`\`
   GET /api/products?$filter=price gt 1000 and contains(name, 'phone')
   \`\`\`

**Золотое правило**: Начните с простых query parameters. Добавляйте сложность только когда реально нужно. Большинству API достаточно базовых фильтров + сортировки.

Всегда помните про безопасность (whitelist полей), производительность (индексы) и UX (понятные ошибки при невалидных фильтрах).
`;

const lectureContent = cleanContent(lectureContentRaw);

async function createLecture() {
  try {
    console.log('🔧 Создание лекции "Фильтрация и сортировка"...\n');

    const lecture = await prisma.lecture.create({
      data: {
        title: 'Фильтрация и сортировка в REST API',
        topic: 'Фильтрация и сортировка',
        content: lectureContent,
      },
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'Фильтрация' },
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
      console.log('❌ Тест "Фильтрация и сортировка" не найден');
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
