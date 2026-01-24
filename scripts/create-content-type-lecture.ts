import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const lectureContent = `# Content-Type заголовок: Основные типы контента в HTTP

## Введение: Что такое Content-Type?

Представьте, что вы отправили посылку по почте. Внутри может быть что угодно: книга, хрупкая ваза, жидкость, электроника. Но как почтовая служба узнает, как обращаться с вашей посылкой? Для этого на упаковке наклеивают стикеры: "Хрупкое!", "Не переворачивать!", "Скоропортящийся продукт".

**Content-Type заголовок** — это именно такой "стикер" для HTTP сообщений. Он сообщает получателю:
> "Внимание! Внутри данные в формате [тип]. Обрабатывай их соответственно!"

### Зачем нужен Content-Type?

Без Content-Type:
- ❌ Сервер не знает, как парсить данные (это JSON? XML? Обычный текст?)
- ❌ Клиент не знает, как отображать ответ (показать как текст? Скачать файл?)
- ❌ Промежуточные прокси не знают, можно ли кешировать контент

С правильным Content-Type:
- ✅ Автоматический парсинг на стороне получателя
- ✅ Правильная обработка специальных символов (кодировка)
- ✅ Оптимизация передачи данных
- ✅ Соответствие стандартам HTTP/REST API

---

## Структура Content-Type заголовка

### Базовый формат

\`\`\`
Content-Type: тип/подтип
\`\`\`

**Пример**:
\`\`\`http
Content-Type: application/json
\`\`\`

### Формат с параметрами

\`\`\`
Content-Type: тип/подтип; параметр1=значение1; параметр2=значение2
\`\`\`

**Примеры**:
\`\`\`http
Content-Type: text/html; charset=utf-8
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Type: application/json; charset=utf-8
\`\`\`

### Категории MIME типов

| Категория | Описание | Примеры |
|-----------|----------|---------|
| **text/** | Текстовые данные | text/plain, text/html, text/csv |
| **application/** | Бинарные данные, структурированные форматы | application/json, application/xml, application/pdf |
| **image/** | Изображения | image/png, image/jpeg, image/svg+xml |
| **video/** | Видео | video/mp4, video/webm |
| **audio/** | Аудио | audio/mpeg, audio/wav |
| **multipart/** | Составные данные (несколько частей) | multipart/form-data |

---

## application/json — Современный стандарт REST API

### Описание

**application/json** — самый популярный Content-Type для REST API в 2024 году.

> "Я отправляю структурированные данные в формате JSON. Парси их как объект!"

### Когда использовать

- ✅ REST API запросы и ответы
- ✅ Структурированные данные (объекты, массивы)
- ✅ Обмен данными между frontend и backend
- ✅ Конфигурационные файлы через API

### Особенности

✅ **UTF-8 по умолчанию** — charset параметр НЕ обязателен (RFC 8259)
✅ **Читабельный** для человека
✅ **Поддерживается везде** (все языки, браузеры)
❌ **НЕ поддерживает бинарные данные** (только Base64)
❌ **НЕ поддерживает комментарии**

### Примеры

**POST запрос с JSON:**

\`\`\`http
POST /api/users HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "age": 28,
  "roles": ["user", "moderator"]
}
\`\`\`

**Ответ сервера:**

\`\`\`http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 123,
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**PATCH запрос (частичное обновление):**

\`\`\`http
PATCH /api/users/123 HTTP/1.1
Content-Type: application/json

{
  "age": 29
}
\`\`\`

### Нужен ли charset для JSON?

**Ответ**: НЕТ, не обязателен!

❌ **Избыточно**:
\`\`\`http
Content-Type: application/json; charset=utf-8
\`\`\`

✅ **Правильно**:
\`\`\`http
Content-Type: application/json
\`\`\`

> 💡 **Почему?** RFC 8259 явно указывает, что JSON **всегда** в UTF-8 (или UTF-16/UTF-32 с BOM). Указывать charset — это legacy-практика.

---

## text/html — HTML документы

### Описание

**text/html** используется для передачи HTML разметки.

### Когда использовать

- ✅ Веб-страницы
- ✅ Email шаблоны (HTML письма)
- ✅ Серверный рендеринг (SSR)

### Примеры

**Ответ с HTML:**

\`\`\`http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>
<head>
  <title>Главная страница</title>
</head>
<body>
  <h1>Добро пожаловать!</h1>
</body>
</html>
\`\`\`

> ⚠️ **Важно**: Для HTML **charset обязателен** (в отличие от JSON)!

---

## application/x-www-form-urlencoded — HTML формы

### Описание

**application/x-www-form-urlencoded** — это формат кодирования данных HTML форм.

> "Данные закодированы как URL параметры: key1=value1&key2=value2"

### Когда использовать

- ✅ Стандартные HTML формы (без файлов)
- ✅ OAuth токен запросы
- ✅ Простые POST запросы

### Формат данных

Данные кодируются как:
\`\`\`
поле1=значение1&поле2=значение2&поле3=значение3
\`\`\`

**Специальные символы кодируются**:
- Пробел → \`+\` или \`%20\`
- \`@\` → \`%40\`
- \`&\` → \`%26\`

### Примеры

**HTML форма:**

\`\`\`html
<form action="/login" method="POST">
  <input name="username" value="ivan@example.com">
  <input name="password" type="password" value="secret123">
  <button type="submit">Войти</button>
</form>
\`\`\`

**HTTP запрос:**

\`\`\`http
POST /login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=ivan%40example.com&password=secret123
\`\`\`

**OAuth токен запрос:**

\`\`\`http
POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=ivan&password=secret&client_id=my-app
\`\`\`

### Поддержка вложенных объектов

**Ответ**: Зависит от библиотеки!

Стандарт НЕ поддерживает вложенность, но библиотеки добавляют свои соглашения:

**Точечная нотация** (Express.js, body-parser):
\`\`\`
user.name=Ivan&user.age=28
\`\`\`

**Квадратные скобки** (PHP, Ruby on Rails):
\`\`\`
user[name]=Ivan&user[age]=28
\`\`\`

**Массивы**:
\`\`\`
tags[]=JavaScript&tags[]=Node.js&tags[]=REST
\`\`\`

> ⚠️ **Важно**: Это **не стандарт**, а соглашение. Для сложных структур используйте JSON!

---

## multipart/form-data — Загрузка файлов

### Описание

**multipart/form-data** — это формат для отправки **файлов и текстовых данных** в одном запросе.

### Когда использовать

- ✅ Загрузка файлов (изображения, документы, видео)
- ✅ Формы с файлами + текстовыми полями
- ✅ Отправка нескольких файлов одновременно

### Что такое boundary?

**boundary** — это уникальная строка-разделитель между частями (parts) multipart запроса.

\`\`\`http
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
\`\`\`

**Пример структуры**:

\`\`\`http
POST /api/users/123/avatar HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="name"

Иван Петров
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="avatar"; filename="photo.jpg"
Content-Type: image/jpeg

[бинарные данные изображения]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
\`\`\`

### HTML форма с файлом

\`\`\`html
<form action="/upload" method="POST" enctype="multipart/form-data">
  <input type="text" name="title" placeholder="Название">
  <input type="file" name="document">
  <button type="submit">Загрузить</button>
</form>
\`\`\`

### JavaScript загрузка файла

\`\`\`javascript
const formData = new FormData();
formData.append('title', 'Мой документ');
formData.append('document', fileInput.files[0]);

fetch('/api/documents', {
  method: 'POST',
  body: formData,
  // НЕ указываем Content-Type! Браузер добавит автоматически с boundary
});
\`\`\`

> ⚠️ **Важно**: НЕ устанавливайте Content-Type вручную при использовании FormData! Браузер автоматически установит правильный boundary.

---

## text/plain — Простой текст

### Описание

**text/plain** — обычный текст без форматирования.

### Когда использовать

- ✅ Логи, plain text файлы
- ✅ Простые текстовые заметки
- ✅ Webhook payload (некоторые сервисы)

### Примеры

\`\`\`http
POST /api/logs HTTP/1.1
Content-Type: text/plain

[2024-01-15 10:30:00] INFO: User logged in
[2024-01-15 10:30:15] ERROR: Database connection failed
\`\`\`

---

## application/yaml и text/yaml — YAML данные

### Описание

YAML — альтернатива JSON, более читабельная для людей.

### Какой тип использовать?

**Ответ**: Все три используются!

- **application/yaml** — современный стандарт
- **application/x-yaml** — устаревший (с префиксом x-)
- **text/yaml** — legacy вариант

> 💡 **Рекомендация**: Используйте **application/yaml**, но обрабатывайте все три.

### Пример

\`\`\`http
POST /api/config HTTP/1.1
Content-Type: application/yaml

server:
  host: localhost
  port: 3000
database:
  url: postgresql://localhost/mydb
  pool: 20
\`\`\`

---

## GraphQL и Content-Type

### Какой Content-Type для GraphQL?

**Ответ**: **application/json**!

GraphQL запросы — это обычный JSON с полями \`query\`, \`variables\`, \`operationName\`.

### Пример GraphQL запроса

\`\`\`http
POST /graphql HTTP/1.1
Content-Type: application/json

{
  "query": "query GetUser($id: ID!) { user(id: $id) { name email } }",
  "variables": {
    "id": "123"
  }
}
\`\`\`

> ❌ **Не существует**: \`application/graphql\` — это не стандартный MIME тип!

---

## text/event-stream — Server-Sent Events (SSE)

### Описание

**text/event-stream** используется для потоковой передачи событий от сервера к клиенту.

### Когда использовать

- ✅ Уведомления в реальном времени
- ✅ Лайв-обновления (биржевые котировки, счёт матча)
- ✅ Прогресс длинных операций

### Пример SSE ответа

\`\`\`http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"message": "Подключение установлено"}

data: {"progress": 25}

data: {"progress": 50}

data: {"progress": 100, "status": "completed"}
\`\`\`

### JavaScript клиент

\`\`\`javascript
const eventSource = new EventSource('/api/notifications');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Новое событие:', data);
};
\`\`\`

---

## Vendor-specific типы (application/vnd.*)

### Описание

**application/vnd.*** — это проприетарные форматы, специфичные для конкретного производителя (vendor).

**vnd** = vendor (производитель)

### Примеры

| MIME тип | Описание |
|----------|----------|
| \`application/vnd.api+json\` | JSON:API формат |
| \`application/vnd.ms-excel\` | Microsoft Excel |
| \`application/vnd.github.v3+json\` | GitHub API v3 |
| \`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\` | Excel .xlsx |

### Структурированные суффиксы (+json, +xml)

**Что означает +json?**

\`\`\`
application/vnd.api+json
           ^^^     ^^^^
           |       |
      проприетарный формат
                   |
              базовый синтаксис (JSON)
\`\`\`

**Значение**: "Это специфичный формат API, но синтаксически это JSON. Можешь парсить как JSON!"

### Пример: JSON:API

\`\`\`http
GET /api/articles/1 HTTP/1.1
Accept: application/vnd.api+json
\`\`\`

**Ответ:**

\`\`\`http
HTTP/1.1 200 OK
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "articles",
    "id": "1",
    "attributes": {
      "title": "JSON:API paints my bikeshed!"
    }
  }
}
\`\`\`

---

## application/wasm — WebAssembly модули

### Описание

**application/wasm** — для передачи скомпилированных WebAssembly модулей.

### Пример

\`\`\`http
HTTP/1.1 200 OK
Content-Type: application/wasm
Content-Length: 45678

[бинарный WASM код]
\`\`\`

---

## text/csv — CSV файлы

### Описание

**text/csv** — для табличных данных в формате Comma-Separated Values.

### Пример

\`\`\`http
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8

id,name,email,age
1,Иван Петров,ivan@example.com,28
2,Мария Сидорова,maria@example.com,25
3,Алексей Смирнов,alex@example.com,32
\`\`\`

---

## video/mp4, image/*, audio/* — Медиа файлы

### Видео

\`\`\`http
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: 25678900

[бинарные данные видео]
\`\`\`

**Популярные типы**:
- \`video/mp4\`
- \`video/webm\`
- \`video/quicktime\` (MOV)

### Изображения

- \`image/png\`
- \`image/jpeg\`
- \`image/gif\`
- \`image/svg+xml\`
- \`image/webp\`

### Аудио

- \`audio/mpeg\` (MP3)
- \`audio/wav\`
- \`audio/ogg\`

---

## Accept заголовок — что клиент хочет получить

### Описание

**Accept** — это "обратная сторона" Content-Type. Клиент сообщает серверу: "Я могу обработать эти типы контента".

### Accept: */*

**Что означает?**

\`\`\`http
Accept: */*
\`\`\`

> "Я принимаю **любой** тип контента. Отправь что угодно!"

### Примеры

**Запрос JSON:**

\`\`\`http
GET /api/users/123 HTTP/1.1
Accept: application/json
\`\`\`

**Запрос HTML или JSON (с приоритетом):**

\`\`\`http
GET /api/users/123 HTTP/1.1
Accept: application/json, text/html; q=0.9
\`\`\`

> 💡 **q** — это приоритет (quality factor) от 0 до 1. По умолчанию q=1.

**Принимаю всё:**

\`\`\`http
GET /api/data HTTP/1.1
Accept: */*
\`\`\`

---

## Что делать, если Content-Type отсутствует?

### Сценарий

Клиент отправил POST запрос **без** заголовка Content-Type:

\`\`\`http
POST /api/users HTTP/1.1

{"name": "Ivan"}
\`\`\`

### Правильная реакция сервера

**Ответ**: Предположить **application/octet-stream** (бинарные данные).

> 📜 **RFC 7231**: Если Content-Type отсутствует, получатель может попытаться определить тип автоматически, но **не обязан**.

**Рекомендации**:

1. **Строгий API**: Вернуть ошибку 400 Bad Request
\`\`\`http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Content-Type header is required"
}
\`\`\`

2. **Мягкий API**: Попытаться определить тип автоматически (парсинг JSON, если начинается с \`{\`)

3. **По умолчанию**: Обработать как \`application/octet-stream\` (сырые байты)

---

## Нужен ли Content-Type для пустого POST запроса?

### Вопрос

\`\`\`http
POST /api/logout HTTP/1.1
[без тела запроса]
\`\`\`

Нужен ли Content-Type?

### Ответ: Рекомендуется, но не обязателен

**Best practice**:

✅ **Хорошо** (явно указываем отсутствие контента):
\`\`\`http
POST /api/logout HTTP/1.1
Content-Length: 0
\`\`\`

✅ **Тоже хорошо** (если сервер понимает пустое тело):
\`\`\`http
POST /api/logout HTTP/1.1
Content-Type: application/json
Content-Length: 0
\`\`\`

⚠️ **Не лучший вариант** (может вызвать warning):
\`\`\`http
POST /api/logout HTTP/1.1
[нет ни Content-Type, ни Content-Length]
\`\`\`

---

## Можно ли указать несколько типов в Content-Type?

### Ответ: Только через multipart!

❌ **Нельзя**:
\`\`\`http
Content-Type: application/json, text/html
\`\`\`

✅ **Правильно** (multipart):
\`\`\`http
Content-Type: multipart/mixed; boundary=boundary123

--boundary123
Content-Type: application/json

{"status": "ok"}
--boundary123
Content-Type: text/html

<h1>Отчёт готов</h1>
--boundary123--
\`\`\`

> 💡 **Важно**: Несколько типов можно указать в **Accept** (что клиент принимает), но не в **Content-Type** (что отправляется).

---

## Сравнительная таблица основных Content-Type

| Content-Type | Использование | Файлы | Структура | Пример |
|--------------|---------------|-------|-----------|--------|
| **application/json** | REST API | ❌ | Объекты, массивы | \`{"name": "Ivan"}\` |
| **application/x-www-form-urlencoded** | HTML формы | ❌ | Плоские пары ключ-значение | \`name=Ivan&age=28\` |
| **multipart/form-data** | Загрузка файлов | ✅ | Части с boundary | Файл + поля формы |
| **text/plain** | Обычный текст | ❌ | Текст | \`Hello, World!\` |
| **text/html** | HTML страницы | ❌ | HTML разметка | \`<h1>Title</h1>\` |
| **text/csv** | Табличные данные | ✅ | CSV строки | \`id,name\\n1,Ivan\` |
| **application/yaml** | Конфигурация | ❌ | YAML структура | \`key: value\` |
| **text/event-stream** | SSE события | ❌ | Поток событий | \`data: {...}\` |
| **video/mp4** | Видео | ✅ | Бинарные данные | [видео байты] |
| **image/jpeg** | Изображения | ✅ | Бинарные данные | [JPEG байты] |

---

## Решение типичных задач

### Задача 1: Отправка JSON данных в POST

**Ответ**:
\`\`\`http
POST /api/users
Content-Type: application/json

{"name": "Ivan"}
\`\`\`

### Задача 2: Отправка HTML формы без файлов

**Ответ**:
\`\`\`http
POST /login
Content-Type: application/x-www-form-urlencoded

username=ivan&password=secret
\`\`\`

### Задача 3: Загрузка файла с дополнительными полями

**Ответ**:
\`\`\`http
POST /api/documents
Content-Type: multipart/form-data; boundary=abc123

--abc123
Content-Disposition: form-data; name="title"

Мой документ
--abc123
Content-Disposition: form-data; name="file"; filename="doc.pdf"
Content-Type: application/pdf

[PDF данные]
--abc123--
\`\`\`

### Задача 4: GraphQL запрос

**Ответ**:
\`\`\`http
POST /graphql
Content-Type: application/json

{"query": "{ users { id name } }"}
\`\`\`

### Задача 5: Указать, что принимаем любой тип

**Ответ**:
\`\`\`http
GET /api/data
Accept: */*
\`\`\`

### Задача 6: Отправка YAML конфигурации

**Ответ**:
\`\`\`http
POST /api/config
Content-Type: application/yaml

server:
  port: 3000
\`\`\`

### Задача 7: Нужен ли charset для JSON?

**Ответ**: НЕТ, JSON всегда UTF-8 по умолчанию (RFC 8259).

### Задача 8: Что такое boundary в multipart?

**Ответ**: Уникальная строка-разделитель между частями multipart запроса.

### Задача 9: Отсутствует Content-Type — что делать?

**Ответ**: Предположить \`application/octet-stream\` или вернуть 400 Bad Request (зависит от строгости API).

### Задача 10: Несколько типов в одном запросе?

**Ответ**: Только через \`multipart/mixed\` или \`multipart/form-data\`.

---

## Best Practices — Лучшие практики

### 1. Всегда указывайте Content-Type

❌ **Плохо**:
\`\`\`http
POST /api/users

{"name": "Ivan"}
\`\`\`

✅ **Хорошо**:
\`\`\`http
POST /api/users
Content-Type: application/json

{"name": "Ivan"}
\`\`\`

### 2. Не добавляйте charset к JSON

❌ **Избыточно**:
\`\`\`http
Content-Type: application/json; charset=utf-8
\`\`\`

✅ **Правильно**:
\`\`\`http
Content-Type: application/json
\`\`\`

### 3. Используйте multipart для файлов

❌ **Плохо** (Base64 в JSON — раздувает размер на 33%):
\`\`\`http
POST /api/upload
Content-Type: application/json

{
  "file": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
\`\`\`

✅ **Хорошо**:
\`\`\`http
POST /api/upload
Content-Type: multipart/form-data; boundary=abc

--abc
Content-Disposition: form-data; name="file"; filename="image.png"
Content-Type: image/png

[бинарные данные]
--abc--
\`\`\`

### 4. Не устанавливайте Content-Type вручную для FormData

❌ **Плохо**:
\`\`\`javascript
fetch('/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' }, // ❌ Без boundary!
  body: formData
});
\`\`\`

✅ **Хорошо**:
\`\`\`javascript
fetch('/upload', {
  method: 'POST',
  // НЕ указываем Content-Type, браузер добавит автоматически
  body: formData
});
\`\`\`

### 5. Используйте Accept для согласования контента

✅ **Хорошо**:
\`\`\`http
GET /api/users/123
Accept: application/json
\`\`\`

Сервер вернёт JSON, если поддерживает, или 406 Not Acceptable.

### 6. Обрабатывайте отсутствие Content-Type

✅ **Хорошо** (строгий API):
\`\`\`javascript
if (!req.headers['content-type']) {
  return res.status(400).json({ error: 'Content-Type required' });
}
\`\`\`

✅ **Хорошо** (мягкий API):
\`\`\`javascript
const contentType = req.headers['content-type'] || 'application/octet-stream';
\`\`\`

---

## Заключение

**Content-Type заголовок** — это критически важная часть HTTP коммуникации. Он сообщает получателю, как интерпретировать данные в теле сообщения.

**Запомните главное**:

1. **application/json** — для REST API (charset не нужен)
2. **application/x-www-form-urlencoded** — для простых форм
3. **multipart/form-data** — для загрузки файлов (с boundary)
4. **text/html** — для HTML (charset обязателен)
5. **Accept: */** — принимаю любой тип
6. **Vendor-specific (vnd.*)** — проприетарные форматы
7. **+json, +xml** — структурированные суффиксы (формат синтаксиса)
8. **Всегда указывайте Content-Type** для POST/PUT/PATCH

Правильное использование Content-Type делает ваш API **понятным**, **стандартизированным** и **совместимым** с любыми клиентами.
`;

async function createLecture() {
  try {
    console.log('🎓 Создание лекции по Content-Type заголовку...\n');

    const test = await prisma.test.findFirst({
      where: {
        title: 'Content-Type заголовок',
      },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!test) {
      console.error('❌ Тест "Content-Type заголовок" не найден!');
      return;
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`📊 Количество вопросов: ${test.questions.length}\n`);

    console.log('📝 Создание лекции...');
    const lecture = await prisma.lecture.create({
      data: {
        title: 'Content-Type заголовок: Основные типы контента в HTTP',
        topic: 'HTTP заголовки',
        content: lectureContent,
      },
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    console.log('🔗 Привязка лекции к вопросам теста...');
    const questionIds = test.questions.map((tq) => tq.questionId);

    let linkedCount = 0;
    for (const questionId of questionIds) {
      await prisma.question.update({
        where: { id: questionId },
        data: { lectureId: lecture.id },
      });
      linkedCount++;
    }

    console.log(`✅ Лекция привязана к ${linkedCount} вопросам\n`);

    console.log('🎉 Готово!');
    console.log(`\n📚 Лекция "${lecture.title}" успешно создана и привязана к тесту "${test.title}"`);
  } catch (error) {
    console.error('❌ Ошибка при создании лекции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLecture();
