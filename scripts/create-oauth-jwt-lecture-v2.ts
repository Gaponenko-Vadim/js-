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

const lectureContent = cleanContent(`# OAuth 2.0 и JWT — Современная аутентификация и авторизация

## Введение: Зачем нужна авторизация?

### Аналогия с пропусками в офис 🏢

Представьте большой офисный центр:

**Без системы доступа** ❌:
- Любой человек может войти куда угодно
- Нельзя проверить, кто когда заходил
- Невозможно ограничить доступ к конфиденциальным зонам

**С системой доступа** ✅:
- 🎫 **Пропуск (Token)** — показываете на входе
- 🚪 **Уровни доступа** — пропуск открывает только разрешенные двери
- 📝 **Журнал** — записывается, кто когда входил
- ⏰ **Срок действия** — пропуск действует ограниченное время

**OAuth 2.0 и JWT** — это система электронных пропусков для вашего API.

---

## Проблема: Как безопасно авторизовать пользователей?

### Устаревший подход (плохой) ❌

**Basic Authentication** — передавать логин/пароль в каждом запросе:

\`\`\`http
GET /api/profile HTTP/1.1
Authorization: Basic dXNlcjpwYXNzd29yZA==
\`\`\`

**Проблемы**:
- 🔓 Пароль передается в каждом запросе (риск перехвата)
- 🚫 Нельзя ограничить доступ (пароль дает полный доступ)
- ⏰ Нельзя установить время жизни
- 📱 Нельзя отозвать доступ без смены пароля

---

### Современный подход (правильный) ✅

**Токены (OAuth 2.0 + JWT)**:

1. Пользователь **один раз** вводит логин/пароль
2. Сервер выдает **токен** (temporary password)
3. Клиент использует токен вместо пароля
4. Токен имеет ограниченный срок жизни

**Преимущества**:
- 🔒 Пароль передается только один раз
- ⏰ Токен автоматически истекает
- 🚫 Можно отозвать токен без смены пароля
- 🎯 Можно ограничить доступ (scopes/permissions)

---

## Что такое OAuth 2.0?

**OAuth 2.0** — это **протокол авторизации**, который определяет:
- Как клиент получает токен?
- Как обновить токен, когда он истек?
- Как отозвать токен?

### Простыми словами

OAuth 2.0 — это **инструкция по выдаче пропусков**.

Определяет **разные способы (flows)** получения токена для разных сценариев:
- 🌐 Веб-приложение
- 📱 Мобильное приложение
- 🤖 Сервис-to-сервис (backend)
- 🔐 Доверенное приложение (ваш собственный frontend)

---

## Ключевые термины OAuth 2.0

### 1. Resource Owner (Владелец ресурса)

**Кто это**: Пользователь, которому принадлежат данные.

**Пример**: Вы — владелец своих фотографий в Google Photos.

---

### 2. Client (Клиент)

**Кто это**: Приложение, которое хочет получить доступ к данным.

**Примеры**:
- Мобильное приложение
- Веб-приложение
- Сторонний сервис

**Пример**: Приложение для редактирования фото хочет получить доступ к вашим фотографиям в Google Photos.

---

### 3. Authorization Server (Сервер авторизации)

**Что это**: Сервер, который **выдает токены** после проверки логина/пароля.

**Примеры**:
- Auth0
- Okta
- Keycloak
- Ваш собственный auth сервис

**Endpoints**:
- \`/authorize\` — страница логина
- \`/token\` — выдача токенов

---

### 4. Resource Server (Сервер ресурсов)

**Что это**: API, который **хранит данные** и проверяет токены.

**Пример**: Ваш REST API, который возвращает данные пользователя.

---

### 5. Access Token (Токен доступа)

**Что это**: **Временный пропуск** для доступа к API.

**Формат**: Обычно JWT (подробнее ниже).

**Пример**:
\`\`\`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
\`\`\`

**Срок жизни**: 15 минут - 1 час (короткий).

---

### 6. Refresh Token (Токен обновления)

**Что это**: **Долгосрочный токен** для получения нового access token, когда старый истек.

**Срок жизни**: Дни, недели, месяцы.

**Зачем**: Чтобы не просить пользователя вводить логин/пароль каждые 15 минут.

---

### 7. Scopes (Области доступа)

**Что это**: **Разрешения**, определяющие что может делать токен.

**Примеры**:
- \`read:users\` — читать пользователей
- \`write:posts\` — создавать посты
- \`delete:comments\` — удалять комментарии

**В токене**:
\`\`\`json
{
  "sub": "user123",
  "scopes": ["read:users", "write:posts"]
}
\`\`\`

---

## OAuth 2.0 Flows (способы получения токена)

### 1. Authorization Code Flow (рекомендуется для веб-приложений)

**Когда использовать**: Веб-приложение с backend.

**Этапы**:

\`\`\`
1. Frontend → Authorization Server
   https://auth.example.com/authorize?
     client_id=myapp&
     redirect_uri=https://myapp.com/callback&
     response_type=code&
     scope=read:users

2. User → Вводит логин/пароль

3. Authorization Server → Frontend
   Redirect: https://myapp.com/callback?code=AUTH_CODE

4. Backend → Authorization Server
   POST /token
   {
     grant_type: "authorization_code",
     code: "AUTH_CODE",
     client_id: "myapp",
     client_secret: "SECRET"
   }

5. Authorization Server → Backend
   {
     "access_token": "...",
     "refresh_token": "...",
     "expires_in": 3600
   }

6. Frontend → Backend API
   GET /api/profile
   Authorization: Bearer ACCESS_TOKEN
\`\`\`

**Особенности**:
- ✅ Самый безопасный
- ✅ Client secret хранится на backend (не утечет)
- ✅ Authorization code одноразовый

---

### 2. Client Credentials Flow (для сервис-to-сервис)

**Когда использовать**: Backend обращается к другому backend без участия пользователя.

**Этапы**:

\`\`\`
1. Service A → Authorization Server
   POST /token
   {
     grant_type: "client_credentials",
     client_id: "service_a",
     client_secret: "SECRET",
     scope: "read:data"
   }

2. Authorization Server → Service A
   {
     "access_token": "...",
     "expires_in": 3600
   }

3. Service A → Service B
   GET /api/data
   Authorization: Bearer ACCESS_TOKEN
\`\`\`

**Особенности**:
- 🤖 Нет пользователя (machine-to-machine)
- 🔒 Требует client secret
- ⚡ Простой и быстрый

---

### 3. Resource Owner Password Credentials Flow (только для доверенных приложений)

**Когда использовать**: Ваш собственный frontend + backend (полностью доверенные).

**Этапы**:

\`\`\`
1. Frontend → Authorization Server
   POST /token
   {
     grant_type: "password",
     username: "user@example.com",
     password: "password123",
     client_id: "myapp"
   }

2. Authorization Server → Frontend
   {
     "access_token": "...",
     "refresh_token": "...",
     "expires_in": 3600
   }
\`\`\`

**Особенности**:
- ⚠️ **Используйте только для своих приложений!**
- ❌ НЕ используйте для сторонних приложений
- ✅ Простой для внутренних систем

---

### 4. Refresh Token Flow (обновление истекшего токена)

**Когда использовать**: Access token истек, нужен новый.

\`\`\`
1. Frontend → Authorization Server
   POST /token
   {
     grant_type: "refresh_token",
     refresh_token: "REFRESH_TOKEN",
     client_id: "myapp"
   }

2. Authorization Server → Frontend
   {
     "access_token": "NEW_ACCESS_TOKEN",
     "refresh_token": "NEW_REFRESH_TOKEN",  // опционально
     "expires_in": 3600
   }
\`\`\`

**Особенности**:
- 🔄 Не нужно вводить логин/пароль снова
- ⏰ Refresh token может быть использован многократно
- 🔒 Refresh token можно отозвать на сервере

---

## Что такое JWT?

**JWT (JSON Web Token)** — это **формат токена**, закодированная строка, содержащая JSON данные.

### Структура JWT

JWT состоит из **3 частей**, разделенных точкой:

\`\`\`
HEADER.PAYLOAD.SIGNATURE
\`\`\`

**Пример**:
\`\`\`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
\`\`\`

---

### Часть 1: Header (Заголовок)

**Содержимое** (до кодирования):
\`\`\`json
{
  "alg": "HS256",       // Алгоритм подписи
  "typ": "JWT"          // Тип токена
}
\`\`\`

**После base64 encode**:
\`\`\`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
\`\`\`

---

### Часть 2: Payload (Полезная нагрузка)

**Содержимое** (до кодирования):
\`\`\`json
{
  "sub": "1234567890",           // Subject (user ID)
  "name": "John Doe",            // Кастомное поле
  "email": "john@example.com",
  "role": "admin",
  "iat": 1516239022,             // Issued At (время создания)
  "exp": 1516242622              // Expiration (срок истечения)
}
\`\`\`

**После base64 encode**:
\`\`\`
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ
\`\`\`

**Стандартные claims**:
- \`sub\` (subject) — ID пользователя
- \`iat\` (issued at) — время создания токена (Unix timestamp)
- \`exp\` (expiration) — время истечения токена
- \`iss\` (issuer) — кто выдал токен
- \`aud\` (audience) — для кого предназначен токен

---

### Часть 3: Signature (Подпись)

**Как создается**:
\`\`\`javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
\`\`\`

**Зачем**: Подтверждает, что токен **не был изменен** после создания.

---

## Как работает JWT?

### Создание токена (на сервере)

\`\`\`javascript
// 1. Создать payload
const payload = {
  sub: "user_123",
  email: "john@example.com",
  role: "admin",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600  // +1 час
};

// 2. Подписать
const token = jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });

// 3. Вернуть клиенту
return { access_token: token };
\`\`\`

---

### Проверка токена (на сервере)

\`\`\`javascript
// 1. Извлечь токен из header
const token = req.headers.authorization.replace('Bearer ', '');

// 2. Верифицировать подпись
try {
  const decoded = jwt.verify(token, SECRET_KEY);

  // 3. Проверка прошла успешно
  console.log(decoded.sub);     // user_123
  console.log(decoded.email);   // john@example.com

  // 4. Проверить срок действия (автоматически в jwt.verify)
  // Если истек — выбросит ошибку TokenExpiredError

} catch (err) {
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  return res.status(401).json({ error: 'Invalid token' });
}
\`\`\`

---

## JWT vs Session Cookies

### Session Cookies (традиционный подход)

\`\`\`
1. User logs in
2. Server creates session in database
   Session ID: abc123
3. Server sets cookie: sessionId=abc123
4. Client sends cookie with each request
5. Server looks up session in database
\`\`\`

**Проблемы**:
- 🗄️ Нужна база данных для хранения сессий
- 🐌 Каждый запрос = query в БД
- 🚫 Сложно масштабировать (нужна shared session storage)

---

### JWT (современный подход)

\`\`\`
1. User logs in
2. Server creates JWT (no database)
3. Server returns JWT to client
4. Client sends JWT with each request
5. Server verifies JWT signature (no database lookup!)
\`\`\`

**Преимущества**:
- ⚡ Не нужна БД для каждого запроса
- 📈 Легко масштабировать (stateless)
- 🌐 Работает с microservices (токен содержит всю инфо)

**Недостатки**:
- 🔓 Нельзя отозвать токен до истечения срока
- 📦 Токен может быть большим (если много данных в payload)

---

## Решение типичных задач

### Задача 1: Как обновить истекший access token?

**Ответ**: Использовать refresh token.

\`\`\`javascript
// 1. Access token истек
fetch('/api/profile', {
  headers: {
    'Authorization': \`Bearer \${accessToken}\`
  }
})
.then(res => {
  if (res.status === 401) {
    // 2. Обновить токен
    return fetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    .then(res => res.json())
    .then(data => {
      // 3. Сохранить новый access token
      accessToken = data.access_token;

      // 4. Повторить исходный запрос
      return fetch('/api/profile', {
        headers: {
          'Authorization': \`Bearer \${accessToken}\`
        }
      });
    });
  }
  return res;
});
\`\`\`

---

### Задача 2: Где хранить токены на клиенте?

**Варианты**:

❌ **localStorage** (НЕ рекомендуется):
- Уязвим к XSS атакам
- JavaScript может прочитать токен

✅ **httpOnly Cookie** (рекомендуется):
- JavaScript не может прочитать
- Автоматически отправляется с запросами
- Защита от XSS

\`\`\`javascript
// Backend устанавливает httpOnly cookie
res.cookie('access_token', token, {
  httpOnly: true,          // JavaScript не может прочитать
  secure: true,            // Только по HTTPS
  sameSite: 'strict',      // Защита от CSRF
  maxAge: 3600000          // 1 час
});
\`\`\`

✅ **Memory (in-memory)** (самый безопасный):
- Хранится в переменной JavaScript
- Исчезает при обновлении страницы
- Нужен refresh token в httpOnly cookie

---

### Задача 3: Как защититься от перехвата токена?

**Ответы**:

1. **HTTPS всегда** 🔒
   - Токены передаются только по зашифрованному соединению

2. **Короткий срок жизни** ⏰
   - Access token: 15-60 минут
   - Если перехватят, истечет быстро

3. **Refresh token rotation** 🔄
   - При каждом refresh выдавать новый refresh token
   - Старый — инвалидировать

4. **Secure cookies** 🍪
   \`\`\`javascript
   {
     httpOnly: true,
     secure: true,
     sameSite: 'strict'
   }
   \`\`\`

---

### Задача 4: Как отозвать JWT до истечения срока?

**Проблема**: JWT stateless — сервер не хранит токены, не может их отозвать.

**Решения**:

**1. Token Blacklist** (список отозванных):
\`\`\`javascript
// Redis
const revokedTokens = new Set();

function revokeToken(token) {
  revokedTokens.add(token);
  // Установить TTL = времени до истечения токена
}

function verifyToken(token) {
  if (revokedTokens.has(token)) {
    throw new Error('Token revoked');
  }
  return jwt.verify(token, SECRET_KEY);
}
\`\`\`

**2. Short-lived tokens + refresh token**:
- Access token живет 15 минут
- Если нужно отозвать — удалить refresh token из БД
- Через 15 минут access token истечет сам

---

### Задача 5: Как проверить scopes в токене?

**Ответ**: Middleware проверяет scopes.

\`\`\`javascript
// Токен содержит:
{
  "sub": "user123",
  "scopes": ["read:users", "write:posts"]
}

// Middleware
function requireScopes(...requiredScopes) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, SECRET_KEY);

    const hasAllScopes = requiredScopes.every(scope =>
      decoded.scopes.includes(scope)
    );

    if (!hasAllScopes) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Использование
app.delete('/posts/:id',
  requireScopes('delete:posts'),
  deletePost
);
\`\`\`

---

### Задача 6: Как реализовать "Remember Me"?

**Ответ**: Разные сроки жизни refresh token.

\`\`\`javascript
function login(username, password, rememberMe) {
  // ... проверка логина/пароля

  const accessToken = generateAccessToken(user);

  const refreshTokenExpiry = rememberMe
    ? 30 * 24 * 60 * 60  // 30 дней
    : 24 * 60 * 60;       // 1 день

  const refreshToken = generateRefreshToken(user, refreshTokenExpiry);

  return {
    access_token: accessToken,
    refresh_token: refreshToken
  };
}
\`\`\`

---

### Задача 7: Bearer token — что это значит?

**Ответ**: Это тип authorization схемы.

\`\`\`http
Authorization: Bearer eyJhbGci...
\`\`\`

**"Bearer"** = "предъявитель"

Означает: **кто предъявил токен, тот и авторизован** (не важно кто на самом деле).

**Сравнение**:
- **Bearer**: Как анонимный билет в кино — кто предъявил, тот прошел
- **Signature-based**: Как именной билет — нужно подтвердить личность

---

### Задача 8: Разница между authentication и authorization?

**Ответ**:

**Authentication (аутентификация)** 🔑:
- **Кто вы?**
- Проверка логина/пароля
- Результат: токен

**Authorization (авторизация)** 🚪:
- **Что вам разрешено делать?**
- Проверка scopes/permissions в токене
- Результат: доступ разрешен/запрещен

**Пример**:
\`\`\`
1. Authentication: Вы вошли в систему (JWT получен)
2. Authorization: У вас есть права удалять посты?
   → Проверка scope "delete:posts" в JWT
\`\`\`

---

### Задача 9: Что делать если токен украли?

**Немедленные действия**:

1. **Отозвать токен**:
   - Добавить в blacklist
   - Или удалить refresh token из БД

2. **Сменить пароль** пользователя

3. **Отозвать все токены** этого пользователя

4. **Проверить логи** на подозрительную активность

**Превентивные меры**:
- Короткие access tokens (15-30 мин)
- Refresh token rotation
- Мониторинг необычной активности (IP changes, device changes)

---

### Задача 10: Как передать JWT в запросе?

**3 способа**:

**1. Authorization header (рекомендуется)** ✅:
\`\`\`http
GET /api/profile HTTP/1.1
Authorization: Bearer eyJhbGci...
\`\`\`

**2. Cookie** ✅:
\`\`\`http
GET /api/profile HTTP/1.1
Cookie: access_token=eyJhbGci...
\`\`\`

**3. Query parameter** ❌ (НЕ рекомендуется):
\`\`\`http
GET /api/profile?token=eyJhbGci... HTTP/1.1
\`\`\`
**Почему плохо**: URL логируются в access logs, кешируются браузером.

---

## Best Practices — Лучшие практики

### 1. Используйте HTTPS всегда 🔒

❌ **Плохо**:
\`\`\`
http://api.example.com  ← токен передается открытым текстом
\`\`\`

✅ **Хорошо**:
\`\`\`
https://api.example.com  ← токен зашифрован при передаче
\`\`\`

---

### 2. Короткие access tokens, длинные refresh tokens ⏰

✅ **Рекомендуется**:
- Access token: **15-30 минут**
- Refresh token: **7-30 дней**

\`\`\`javascript
const accessToken = jwt.sign(payload, SECRET, {
  expiresIn: '15m'
});

const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
  expiresIn: '7d'
});
\`\`\`

---

### 3. Не храните sensitive данные в JWT 🚫

❌ **Плохо**:
\`\`\`json
{
  "sub": "user123",
  "password": "secret123",        ← НИКОГДА!
  "credit_card": "1234-5678",     ← НИКОГДА!
  "ssn": "123-45-6789"            ← НИКОГДА!
}
\`\`\`

✅ **Хорошо**:
\`\`\`json
{
  "sub": "user123",
  "email": "user@example.com",
  "role": "admin",
  "permissions": ["read", "write"]
}
\`\`\`

**Почему**: JWT можно декодировать (base64 != encryption).

---

### 4. Используйте сильные секретные ключи 🔐

❌ **Плохо**:
\`\`\`javascript
const SECRET_KEY = 'secret';  // Очень слабый
\`\`\`

✅ **Хорошо**:
\`\`\`javascript
// Сгенерировать:
const SECRET_KEY = crypto.randomBytes(64).toString('hex');
// → '8f3c2a1b9d4e6f7c8a9b0d1e2f3g4h5i...'

// Хранить в environment variable
const SECRET_KEY = process.env.JWT_SECRET_KEY;
\`\`\`

---

### 5. Валидируйте все claims в токене ✅

\`\`\`javascript
const decoded = jwt.verify(token, SECRET_KEY);

// 1. Проверить expiration (автоматически в jwt.verify)

// 2. Проверить issuer
if (decoded.iss !== 'https://auth.example.com') {
  throw new Error('Invalid issuer');
}

// 3. Проверить audience
if (!decoded.aud.includes('api.example.com')) {
  throw new Error('Invalid audience');
}

// 4. Проверить custom claims
if (!decoded.email_verified) {
  throw new Error('Email not verified');
}
\`\`\`

---

## Заключение

**OAuth 2.0** — это **протокол авторизации**, определяющий как клиенты получают токены.

**JWT** — это **формат токена**, содержащий JSON данные + подпись.

**Вместе они дают**:
- 🔒 Безопасную передачу токенов (OAuth 2.0 flows)
- ⚡ Stateless авторизацию (JWT не требует БД)
- 🎯 Гранулярные разрешения (scopes в JWT)
- ⏰ Автоматическое истечение (exp claim в JWT)

**Запомните главное**:

1. 🔑 **Access token** — короткий (15-60 мин)
2. 🔄 **Refresh token** — длинный (дни/недели)
3. 🔒 **HTTPS** — обязательно всегда
4. 🍪 **httpOnly cookies** — лучше чем localStorage
5. ⚠️ **Не храните пароли** в JWT
6. ✅ **Валидируйте** все claims при проверке

> 💡 **Главная мысль**: OAuth 2.0 + JWT — это современный стандарт безопасной авторизации, который используют Google, Facebook, GitHub и большинство современных API.
`);

async function createLecture() {
  try {
    console.log('📚 Создание лекции "OAuth 2.0 и JWT" (v2)...\n');

    // Удалить старую лекцию если есть
    const existing = await prisma.lecture.findFirst({
      where: {
        OR: [
          { title: { contains: 'OAuth' } },
          { title: { contains: 'JWT' } }
        ]
      }
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
        OR: [
          { title: { contains: 'OAuth' } },
          { title: { contains: 'JWT' } }
        ]
      },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      console.error('❌ Тест "OAuth 2.0 и JWT" не найден!');
      return;
    }

    console.log(`✅ Найден тест: ${test.title}`);
    console.log(`📊 Вопросов в тесте: ${test.questions.length}\n`);

    // Создать лекцию
    console.log('📝 Создание новой лекции...');
    const lecture = await prisma.lecture.create({
      data: {
        title: 'OAuth 2.0 и JWT',
        topic: 'Authentication',
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
