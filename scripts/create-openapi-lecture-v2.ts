import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL не загружен');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function cleanContent(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

const lectureContent = cleanContent(`# OpenAPI и API Documentation

## Введение: Что такое документация API?

### Аналогия с инструкцией 📖

Представьте, что API — это сложный электронный прибор (например, новый смартфон):

- **Без инструкции** 📱❓: Вы не знаете, какие кнопки нажимать, что делают функции, какие ограничения
- **С инструкцией** 📱📖: Понятно как пользоваться, какие возможности есть, что делать в случае ошибки

**API документация** — это инструкция по использованию вашего API для других разработчиков.

### Проблема без документации

Разработчик хочет использовать ваш API:

❌ **Без документации**:
- "Какие endpoints есть?"
- "Какие параметры передавать?"
- "Что означает эта ошибка?"
- "Как аутентифицироваться?"
- → Постоянно звонит/пишет вам с вопросами

✅ **С документацией**:
- Все ответы в одном месте
- Можно попробовать запросы прямо в браузере
- Понятно, что и как работает
- → Разработчик самостоятельно интегрируется

---

## Что такое OpenAPI Specification?

**OpenAPI Specification (OAS)** — это **стандарт описания REST API** в формате YAML или JSON.

### Простыми словами

Это как **меню в ресторане**, которое описывает:
- 📋 Какие блюда есть (endpoints)
- 🍕 Из чего они состоят (параметры)
- 💰 Сколько стоят (authentication)
- 🕒 Когда доступны (rate limits)

Но вместо блюд — API endpoints, вместо ингредиентов — параметры запросов.

### История

- **Swagger 2.0** (старое название) — до 2016 года
- **OpenAPI 3.0** — современный стандарт (с 2017 года)
- **OpenAPI 3.1** — последняя версия (2021)

> 💡 **Важно**: OpenAPI = Swagger. Это одно и то же, просто переименовали.

---

## Зачем нужна OpenAPI?

### 1. Интерактивная документация (Swagger UI) 🌐

**Что это**: Красивый веб-интерфейс, где можно **читать, смотреть и ТЕСТИРОВАТЬ** API прямо в браузере.

**Пример**: Вы открываете \`https://api.example.com/docs\` и видите:
- Список всех endpoints
- Для каждого — описание, параметры, примеры
- Кнопка "Try it out" — можно отправить реальный запрос

**Без OpenAPI**:
\`\`\`
Вам придется писать документацию вручную в Word/Google Docs
\`\`\`

**С OpenAPI**:
\`\`\`yaml
# Вы пишете в YAML:
/users:
  get:
    summary: Get all users
    parameters:
      - name: page
        schema:
          type: integer

# И автоматически получаете красивую интерактивную документацию!
\`\`\`

---

### 2. Генерация клиентских библиотек 🛠️

**Проблема**: Разработчик на Python хочет использовать ваш API. Ему нужно написать код для каждого запроса.

**Решение OpenAPI**: Автоматически сгенерировать Python SDK:

\`\`\`bash
openapi-generator generate -i api.yaml -g python -o python-client/

# Теперь разработчик может использовать:
from myapi import UsersApi

api = UsersApi()
users = api.get_users(page=1, limit=20)
\`\`\`

**Поддерживаются языки**: TypeScript, Python, Java, Go, PHP, C#, Ruby и еще 40+.

---

### 3. Валидация запросов и ответов ✅

**API Gateway** (Kong, AWS API Gateway) может **автоматически валидировать**:

\`\`\`yaml
# В OpenAPI вы описали:
parameters:
  - name: age
    schema:
      type: integer
      minimum: 18
      maximum: 120

# API Gateway автоматически проверит:
GET /users?age=17  → 400 Bad Request (age < 18)
GET /users?age=abc → 400 Bad Request (age не integer)
GET /users?age=25  → ✅ OK
\`\`\`

**Без OpenAPI**: Нужно писать validation вручную в коде.

---

### 4. Contract Testing 🧪

**Проблема**: Backend изменил структуру ответа, frontend сломался.

**Решение**: **Contract Testing** — проверка, что API соответствует OpenAPI спецификации.

\`\`\`typescript
// Тест: API должен соответствовать api.yaml
test('GET /users returns valid response', async () => {
  const response = await api.get('/users');

  // Проверяем соответствие OpenAPI схеме
  expect(response).toMatchOpenAPISchema('GetUsersResponse');
});
\`\`\`

Если backend изменил API, тест упадет **до** того, как код попадет в production.

---

### 5. Mock серверы для разработки 🎭

**Проблема**: Backend еще не готов, frontend уже хочет разрабатывать.

**Решение**: Создать **mock сервер** из OpenAPI:

\`\`\`bash
# Запустить mock сервер из api.yaml
prism mock api.yaml

# Теперь frontend может делать запросы:
GET http://localhost:4010/users
→ Возвращает примеры из OpenAPI
\`\`\`

Frontend может разрабатывать параллельно с backend!

---

## Структура OpenAPI документа

### Основные секции

\`\`\`yaml
openapi: 3.0.0              # 1. Версия стандарта

info:                       # 2. Метаинформация
  title: My API
  version: 1.0.0

servers:                    # 3. URL серверов
  - url: https://api.example.com

paths:                      # 4. Endpoints (главная часть!)
  /users:
    get: ...

components:                 # 5. Переиспользуемые части
  schemas: ...              # Модели данных
  responses: ...            # Ответы
  parameters: ...           # Параметры
  securitySchemes: ...      # Методы авторизации

security:                   # 6. Глобальная авторизация
  - bearerAuth: []

tags:                       # 7. Группировка endpoints
  - name: Users
\`\`\`

---

## info: Метаинформация API

### Базовая информация

\`\`\`yaml
info:
  title: User Management API           # Название API
  description: API for managing users  # Описание
  version: 1.0.0                       # Версия API

  contact:                             # Контакты поддержки
    name: API Support Team
    email: api@example.com
    url: https://example.com/support

  license:                             # Лицензия
    name: MIT
    url: https://opensource.org/licenses/MIT

  termsOfService: https://example.com/terms
\`\`\`

> 💡 **Важно**: \`version\` в info — это **версия API** (1.0.0), а \`openapi\` — версия стандарта OpenAPI (3.0.0).

---

## servers: URL серверов

### Один сервер

\`\`\`yaml
servers:
  - url: https://api.example.com/v1
\`\`\`

### Несколько окружений

\`\`\`yaml
servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging
  - url: http://localhost:3000/v1
    description: Local development
\`\`\`

### С переменными

\`\`\`yaml
servers:
  - url: https://{environment}.example.com/{version}
    description: Configurable environment
    variables:
      environment:
        default: api
        enum:
          - api
          - staging
      version:
        default: v1
        enum:
          - v1
          - v2
\`\`\`

---

## paths: Описание endpoints

### Структура endpoint

\`\`\`yaml
paths:
  /users:                    # Path
    get:                     # HTTP метод
      summary: Get all users # Краткое описание
      description: |         # Детальное описание
        Returns a paginated list of users.
        Requires authentication.

      tags:                  # Группировка в UI
        - Users

      parameters: [...]      # Query/Path параметры

      requestBody: {...}     # Тело запроса (для POST/PUT)

      responses:             # Возможные ответы
        '200': {...}
        '400': {...}

      security:              # Требования авторизации
        - bearerAuth: []
\`\`\`

---

## parameters: Параметры запроса

### Query параметры

\`\`\`yaml
parameters:
  - name: page              # Название параметра
    in: query               # Где: query, path, header, cookie
    description: Page number
    required: false         # Обязательный?
    schema:
      type: integer         # Тип данных
      default: 1            # Значение по умолчанию
      minimum: 1            # Валидация
      maximum: 1000

  - name: search
    in: query
    schema:
      type: string
      minLength: 3
      maxLength: 100
\`\`\`

### Path параметры

\`\`\`yaml
/users/{id}:              # {id} - path параметр
  get:
    parameters:
      - name: id          # Должен совпадать с {id}
        in: path
        required: true    # Path параметры всегда required
        schema:
          type: string
          format: uuid    # Валидация формата
\`\`\`

### Header параметры

\`\`\`yaml
parameters:
  - name: X-API-Version
    in: header
    required: true
    schema:
      type: string
      enum: ['1.0', '2.0']
\`\`\`

---

## requestBody: Тело запроса

### Простой пример

\`\`\`yaml
/users:
  post:
    requestBody:
      required: true
      content:
        application/json:              # Content-Type
          schema:
            type: object
            required:                  # Обязательные поля
              - name
              - email
            properties:
              name:
                type: string
                minLength: 2
                maxLength: 100
              email:
                type: string
                format: email
              age:
                type: integer
                minimum: 18
\`\`\`

### С примерами

\`\`\`yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/User'
      examples:                     # Несколько примеров
        alice:
          summary: Alice Example
          value:
            name: Alice
            email: alice@example.com
            age: 25
        bob:
          summary: Bob Example
          value:
            name: Bob
            email: bob@example.com
            age: 30
\`\`\`

---

## responses: Ответы

### Базовая структура

\`\`\`yaml
responses:
  '200':                              # HTTP статус код
    description: Successful response  # Описание
    content:
      application/json:               # Content-Type ответа
        schema:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
\`\`\`

### Несколько статус кодов

\`\`\`yaml
responses:
  '200':
    description: Success
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'

  '400':
    description: Invalid input
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'

  '401':
    description: Unauthorized

  '404':
    description: User not found

  '500':
    description: Internal server error
\`\`\`

---

## components/schemas: Модели данных

### Простая модель

\`\`\`yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        age:
          type: integer
          minimum: 0
          maximum: 150
        createdAt:
          type: string
          format: date-time
\`\`\`

### Использование $ref

\`\`\`yaml
# Определение
components:
  schemas:
    User:
      type: object
      properties:
        name:
          type: string

# Использование
responses:
  '200':
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
\`\`\`

### Вложенные объекты

\`\`\`yaml
User:
  type: object
  properties:
    id:
      type: string
    address:
      type: object
      properties:
        street:
          type: string
        city:
          type: string
        country:
          type: string
\`\`\`

### Массивы

\`\`\`yaml
UsersResponse:
  type: object
  properties:
    data:
      type: array
      items:
        $ref: '#/components/schemas/User'
    total:
      type: integer
\`\`\`

---

## components/securitySchemes: Авторизация

### Bearer Token (JWT)

\`\`\`yaml
components:
  securitySchemes:
    bearerAuth:              # Имя схемы
      type: http
      scheme: bearer
      bearerFormat: JWT      # Опционально

# Использование
paths:
  /users:
    get:
      security:
        - bearerAuth: []     # Требует bearerAuth
\`\`\`

**HTTP запрос**:
\`\`\`http
GET /users HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
\`\`\`

### API Key

\`\`\`yaml
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header             # Где: header, query, cookie
      name: X-API-Key        # Название header/параметра

# Использование
security:
  - apiKey: []
\`\`\`

**HTTP запрос**:
\`\`\`http
GET /users HTTP/1.1
X-API-Key: your-api-key-here
\`\`\`

### OAuth 2.0

\`\`\`yaml
components:
  securitySchemes:
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://example.com/oauth/authorize
          tokenUrl: https://example.com/oauth/token
          scopes:
            read:users: Read user data
            write:users: Modify user data
\`\`\`

---

## Решение типичных задач

### Задача 1: Как описать пагинацию в OpenAPI?

**Ответ**: Через query параметры \`page\` и \`limit\`.

\`\`\`yaml
/users:
  get:
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
          minimum: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
          minimum: 1
          maximum: 100
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/User'
                pagination:
                  type: object
                  properties:
                    page:
                      type: integer
                    limit:
                      type: integer
                    total:
                      type: integer
\`\`\`

---

### Задача 2: Как документировать file upload?

**Ответ**: \`multipart/form-data\` Content-Type.

\`\`\`yaml
/upload:
  post:
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              file:
                type: string
                format: binary      # Для файлов
              description:
                type: string
\`\`\`

**Запрос**:
\`\`\`http
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary--
\`\`\`

---

### Задача 3: Как описать разные ответы для разных статус кодов?

**Ответ**: Секция \`responses\` с несколькими кодами.

\`\`\`yaml
responses:
  '200':
    description: Success
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
  '400':
    description: Invalid input
    content:
      application/json:
        schema:
          type: object
          properties:
            error:
              type: string
  '404':
    description: User not found
\`\`\`

---

### Задача 4: Как документировать вложенные endpoints?

**Ответ**: Просто перечислить в \`paths\`:

\`\`\`yaml
paths:
  /users:
    get: ...
    post: ...

  /users/{id}:
    get: ...
    put: ...
    delete: ...

  /users/{id}/posts:           # Вложенный ресурс
    get:
      summary: Get user's posts

  /users/{id}/posts/{postId}:
    get:
      summary: Get specific post
\`\`\`

---

### Задача 5: Как документировать query параметры для фильтрации?

**Ответ**: Перечислить как отдельные parameters.

\`\`\`yaml
/products:
  get:
    parameters:
      - name: category
        in: query
        schema:
          type: string
          enum: [electronics, books, clothing]

      - name: minPrice
        in: query
        schema:
          type: number
          minimum: 0

      - name: maxPrice
        in: query
        schema:
          type: number

      - name: inStock
        in: query
        schema:
          type: boolean
\`\`\`

---

### Задача 6: Можно ли переиспользовать параметры?

**Ответ**: Да, через \`components/parameters\`.

\`\`\`yaml
components:
  parameters:
    PageParam:                # Определение
      name: page
      in: query
      schema:
        type: integer
        default: 1

paths:
  /users:
    get:
      parameters:
        - $ref: '#/components/parameters/PageParam'  # Использование

  /posts:
    get:
      parameters:
        - $ref: '#/components/parameters/PageParam'  # Переиспользование
\`\`\`

---

### Задача 7: Как описать enum (список возможных значений)?

**Ответ**: Поле \`enum\` в schema.

\`\`\`yaml
properties:
  status:
    type: string
    enum:
      - pending
      - active
      - suspended
      - deleted
    description: User status
\`\`\`

---

### Задача 8: Как документировать deprecated endpoints?

**Ответ**: Поле \`deprecated: true\`.

\`\`\`yaml
/old-endpoint:
  get:
    deprecated: true             # Помечен как устаревший
    summary: Old endpoint (use /new-endpoint instead)
    description: This endpoint is deprecated and will be removed in v2.0
\`\`\`

В Swagger UI это будет отображаться зачеркнутым.

---

### Задача 9: Как описать условную обязательность (required if...)?

**Ответ**: OpenAPI **не поддерживает** условную валидацию напрямую. Решение:

\`\`\`yaml
# В description объяснить правило
properties:
  type:
    type: string
    enum: [email, phone]
  email:
    type: string
    format: email
    description: Required if type is 'email'
  phone:
    type: string
    description: Required if type is 'phone'

# Валидация должна быть на backend
\`\`\`

---

### Задача 10: Swagger UI vs Redoc — что выбрать?

**Ответ**: Оба генерируются из OpenAPI, разница в UI:

**Swagger UI**:
- ✅ Интерактивное тестирование ("Try it out")
- ✅ Популярный, много интеграций
- ❌ Дизайн простоват

**Redoc**:
- ✅ Красивый современный дизайн
- ✅ Лучше для публичной документации
- ✅ Адаптивный
- ❌ Нет интерактивного тестирования

**Рекомендация**: Используйте оба! Swagger UI для разработчиков, Redoc для публичной документации.

---

## Best Practices — Лучшие практики

### 1. Всегда добавляйте примеры (examples)

❌ **Плохо**:
\`\`\`yaml
schema:
  type: object
  properties:
    name:
      type: string
\`\`\`

✅ **Хорошо**:
\`\`\`yaml
schema:
  type: object
  properties:
    name:
      type: string
  example:
    name: John Doe
\`\`\`

**Почему**: Примеры помогают понять формат данных.

---

### 2. Используйте $ref для переиспользования

❌ **Плохо** (дублирование):
\`\`\`yaml
/users:
  get:
    responses:
      '200':
        schema:
          type: object
          properties:
            id:
              type: string
            name:
              type: string

/posts:
  get:
    responses:
      '200':
        schema:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
\`\`\`

✅ **Хорошо** (переиспользование):
\`\`\`yaml
components:
  schemas:
    Entity:
      type: object
      properties:
        id:
          type: string
        name:
          type: string

/users:
  get:
    responses:
      '200':
        schema:
          $ref: '#/components/schemas/Entity'
\`\`\`

---

### 3. Добавляйте description везде

❌ **Плохо**:
\`\`\`yaml
/users:
  get:
\`\`\`

✅ **Хорошо**:
\`\`\`yaml
/users:
  get:
    summary: Get all users
    description: |
      Returns a paginated list of users.
      Requires authentication.
      Maximum 100 users per page.
\`\`\`

---

### 4. Валидируйте OpenAPI спецификацию

\`\`\`bash
# Установить валидатор
npm install -g @apidevtools/swagger-cli

# Проверить
swagger-cli validate api.yaml

# Должно вернуть:
✅ api.yaml is valid
\`\`\`

**Частые ошибки**:
- Опечатки в $ref
- Неправильные отступы в YAML
- Неверный формат версии

---

### 5. Генерируйте OpenAPI из кода (Code-First подход)

Вместо ручного написания YAML, используйте библиотеки:

**NestJS (TypeScript)**:
\`\`\`typescript
@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get()
  @ApiResponse({ status: 200, type: [User] })
  async getUsers() {
    // ...
  }
}

// Автоматически генерируется OpenAPI
\`\`\`

**FastAPI (Python)**:
\`\`\`python
@app.get("/users", response_model=List[User])
def get_users():
    # ...

# Автоматически генерируется OpenAPI по типам
\`\`\`

---

## Заключение

**OpenAPI Specification** — это **стандарт документирования REST API**, который дает:

**Запомните главное**:

1. 📖 **Интерактивная документация** — Swagger UI/Redoc автоматически
2. 🛠️ **Генерация кода** — SDK для всех языков
3. ✅ **Валидация** — API Gateway проверяет запросы/ответы
4. 🧪 **Contract Testing** — тесты соответствия спецификации
5. 🎭 **Mock серверы** — frontend может разрабатывать до готовности backend

**Формат**: YAML или JSON

**Основные секции**:
- \`info\` — метаданные
- \`servers\` — URL серверов
- \`paths\` — endpoints (главное!)
- \`components\` — переиспользуемые части
- \`security\` — авторизация

**Best Practice**: Не писать YAML вручную, а генерировать из кода (Code-First).

> 💡 **Главная мысль**: OpenAPI превращает ваш API в самодокументируемый продукт, который легко интегрировать и тестировать.
`);

async function createLecture() {
  try {
    console.log('📚 Создание лекции "OpenAPI и API Documentation" (v2)...\n');

    // Удалить старую лекцию если есть
    const existing = await prisma.lecture.findFirst({
      where: { title: { contains: 'OpenAPI' } }
    });

    if (existing) {
      console.log('⚠️  Удаление старой лекции...');
      await prisma.question.updateMany({
        where: { lectureId: existing.id },
        data: { lectureId: null }
      });
      await prisma.lecture.delete({ where: { id: existing.id } });
    }

    // Найти тест
    const test = await prisma.test.findFirst({
      where: {
        title: { contains: 'OpenAPI' }
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      console.error('❌ Тест "OpenAPI и API Documentation" не найден!');
      return;
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`📊 Вопросов в тесте: ${test.questions.length}\n`);

    // Создать лекцию
    console.log('📝 Создание новой лекции...');
    const lecture = await prisma.lecture.create({
      data: {
        title: 'OpenAPI и API Documentation',
        topic: 'OpenAPI',
        content: lectureContent
      }
    });

    console.log(`✅ Лекция создана: ${lecture.id}\n`);

    // Привязать к вопросам ЭТОГО теста
    console.log('🔗 Привязка лекции к вопросам теста...');
    const questionIds = test.questions.map(tq => tq.questionId);

    for (const questionId of questionIds) {
      await prisma.question.update({
        where: { id: questionId },
        data: { lectureId: lecture.id }
      });
    }

    console.log(`✅ Лекция привязана к ${questionIds.length} вопросам теста "${test.title}"\n`);

    // Статистика
    console.log('📊 Статистика:');
    console.log(`   Размер лекции: ${lectureContent.length} символов`);
    console.log(`   Строк: ~${lectureContent.split('\n').length}`);
    console.log('');
    console.log('🎉 Готово!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLecture();
