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
  // Удаляем управляющие символы, кроме \n (0x0A), \r (0x0D), \t (0x09)
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

async function createLecture() {
  try {
    console.log('📚 Создание лекции "CORS и Security в REST API"...\n');

    // Проверка существования лекции
    const existing = await prisma.lecture.findFirst({
      where: { title: { contains: 'CORS' } }
    });

    if (existing) {
      console.log('⚠️  Лекция уже существует, удаляю старую...');
      await prisma.lecture.delete({ where: { id: existing.id } });
    }

    const lectureContent = cleanContent(`# CORS и Security в REST API

## 1. CORS (Cross-Origin Resource Sharing)

### Что такое CORS?

**CORS** - это механизм безопасности браузера, который позволяет веб-странице с одного домена (origin) делать запросы к API на другом домене.

**Origin = протокол + домен + порт**

\`\`\`
https://example.com:443
│      │          │    │
│      │          │    └─ Порт
│      │          └────── Домен
│      └───────────────── Протокол
\`\`\`

### Зачем нужен CORS?

Браузеры блокируют cross-origin запросы по умолчанию (Same-Origin Policy) для защиты от атак. CORS позволяет серверу явно указать, какие origins разрешены.

### Основные HTTP заголовки CORS

**1. Access-Control-Allow-Origin**
Указывает, какие origins разрешены для доступа к ресурсу.

\`\`\`http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Origin: *  # Разрешить все origins (небезопасно с credentials)
\`\`\`

**2. Access-Control-Allow-Methods**
Перечисляет разрешенные HTTP методы.

\`\`\`http
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
\`\`\`

**3. Access-Control-Allow-Headers**
Указывает разрешенные custom headers.

\`\`\`http
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
\`\`\`

**4. Access-Control-Allow-Credentials**
Разрешает отправку cookies и авторизационных заголовков.

\`\`\`http
Access-Control-Allow-Credentials: true
\`\`\`

⚠️ **Важно:** При использовании \`credentials: true\`, нельзя использовать \`Access-Control-Allow-Origin: *\`. Нужно указать конкретный origin.

**5. Access-Control-Max-Age**
Указывает, сколько секунд браузер может кешировать preflight response.

\`\`\`http
Access-Control-Max-Age: 86400  # 24 часа
\`\`\`

### Simple vs Non-Simple Requests

**Simple Request** (не требует preflight):
- Методы: GET, POST, HEAD
- Content-Type: text/plain, application/x-www-form-urlencoded, multipart/form-data
- Только standard headers (Accept, Accept-Language, Content-Language, Content-Type)

\`\`\`javascript
// Simple request - без preflight
fetch('https://api.example.com/users', {
  method: 'GET'
});
\`\`\`

**Non-Simple Request** (требует preflight):
- Методы: PUT, DELETE, PATCH
- Custom headers (Authorization, X-Custom-Header)
- Content-Type: application/json, application/xml

\`\`\`javascript
// Non-simple request - с preflight
fetch('https://api.example.com/users/123', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer token123'
  }
});
\`\`\`

### Preflight Request

Preflight - это автоматический **OPTIONS** запрос, который браузер отправляет перед actual request для проверки CORS разрешений.

\`\`\`http
OPTIONS /api/users/123 HTTP/1.1
Host: api.example.com
Origin: https://example.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: Authorization
\`\`\`

**Preflight Response:**

\`\`\`http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization
Access-Control-Max-Age: 86400
\`\`\`

Если preflight успешен, браузер отправляет actual request.

### Реализация CORS в Express.js

\`\`\`javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Вариант 1: Разрешить все origins
app.use(cors());

// Вариант 2: Настроить конкретные origins
app.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Разрешить cookies
  maxAge: 86400
}));

// Вариант 3: Динамическая проверка origin
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['https://example.com', 'https://app.example.com'];
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
\`\`\`

## 2. CSRF (Cross-Site Request Forgery)

### Что такое CSRF?

**CSRF** - атака, при которой злоумышленник заставляет авторизованного пользователя выполнить нежелательное действие на сайте без его ведома.

### Пример CSRF атаки

1. Пользователь авторизован на \`bank.com\`
2. Злоумышленник отправляет ему ссылку на свой сайт \`evil.com\`
3. На \`evil.com\` есть скрытая форма:

\`\`\`html
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="10000">
</form>
<script>document.forms[0].submit();</script>
\`\`\`

4. Браузер автоматически отправляет cookies пользователя с запросом
5. Деньги переведены злоумышленнику

### Защита от CSRF

**1. CSRF Tokens**

Сервер генерирует уникальный токен для каждой сессии/формы. Токен должен быть в каждом POST/PUT/DELETE запросе.

\`\`\`javascript
// Server-side (Express)
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/transfer', csrfProtection, (req, res) => {
  // CSRF токен проверяется автоматически
  // Если токен неверный - 403 Forbidden
});
\`\`\`

\`\`\`html
<!-- Client-side -->
<form method="POST" action="/transfer">
  <input type="hidden" name="_csrf" value="{{csrfToken}}">
  <input name="amount" value="100">
  <button type="submit">Transfer</button>
</form>
\`\`\`

**2. SameSite Cookie Attribute**

Указывает браузеру, когда отправлять cookie.

\`\`\`javascript
res.cookie('sessionId', 'abc123', {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict' // или 'Lax', 'None'
});
\`\`\`

**Значения SameSite:**

- **Strict**: Cookie отправляется только для same-site запросов (максимальная защита)
- **Lax**: Cookie отправляется для same-site и top-level navigation GET запросов (баланс безопасности/удобства)
- **None**: Cookie отправляется для всех запросов (требует \`Secure\`, только HTTPS)

**3. Проверка Origin/Referer Headers**

\`\`\`javascript
app.use((req, res, next) => {
  const origin = req.get('Origin');
  const referer = req.get('Referer');

  if (req.method !== 'GET') {
    if (!origin || !origin.startsWith('https://myapp.com')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  next();
});
\`\`\`

## 3. XSS (Cross-Site Scripting)

### Что такое XSS?

**XSS** - атака внедрения вредоносного JavaScript кода в веб-страницу, который выполняется в браузере пользователя.

### Типы XSS

**1. Reflected XSS** (отраженный)

\`\`\`javascript
// Уязвимый код
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send('<h1>Results for: ' + query + '</h1>');
});

// Атака: /search?q=<script>alert('XSS')</script>
\`\`\`

**2. Stored XSS** (хранимый)

\`\`\`javascript
// Уязвимый код - сохраняет комментарий в БД без санитизации
app.post('/comments', async (req, res) => {
  await db.comments.insert({ text: req.body.comment });
});

// Атака: комментарий с <script>steal_cookies()</script>
\`\`\`

**3. DOM-based XSS**

\`\`\`javascript
// Уязвимый код
const name = location.hash.substring(1);
document.getElementById('welcome').innerHTML = 'Hello ' + name;

// Атака: #<img src=x onerror=alert('XSS')>
\`\`\`

### Защита от XSS

**1. Input Sanitization (Санитизация ввода)**

\`\`\`javascript
const validator = require('validator');

app.post('/comments', (req, res) => {
  let comment = req.body.comment;

  // Удалить HTML теги
  comment = validator.stripLow(comment);
  comment = validator.escape(comment);

  // Или использовать библиотеку
  const DOMPurify = require('isomorphic-dompurify');
  comment = DOMPurify.sanitize(comment);
});
\`\`\`

**2. Output Escaping (Экранирование вывода)**

\`\`\`javascript
// Плохо
res.send('<div>' + userInput + '</div>');

// Хорошо - используйте template engines с auto-escaping
res.render('page', { userInput }); // Handlebars/EJS автоматически экранируют

// Или вручную
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
\`\`\`

**3. Content-Security-Policy (CSP)**

HTTP заголовок, который указывает браузеру откуда разрешено загружать ресурсы.

\`\`\`javascript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://trusted-cdn.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none';"
  );
  next();
});
\`\`\`

**CSP Directives:**

- \`default-src 'self'\` - по умолчанию загружать ресурсы только с того же origin
- \`script-src 'self'\` - разрешить скрипты только с того же origin
- \`script-src 'none'\` - запретить все inline скрипты
- \`script-src 'nonce-abc123'\` - разрешить скрипт с конкретным nonce
- \`style-src 'unsafe-inline'\` - разрешить inline стили (не рекомендуется)

**4. HttpOnly Cookies**

\`\`\`javascript
res.cookie('token', 'jwt123', {
  httpOnly: true,  // JavaScript не может прочитать cookie
  secure: true,    // Только HTTPS
  sameSite: 'Strict'
});
\`\`\`

## 4. SQL Injection

### Что такое SQL Injection?

**SQL Injection** - атака, при которой злоумышленник вводит SQL код в поля ввода, который выполняется в запросе к БД.

### Пример атаки

\`\`\`javascript
// Уязвимый код
app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT * FROM users WHERE id = ' + userId;
  const user = await db.query(query);
  res.json(user);
});

// Атака: GET /users/1 OR 1=1
// Результат: SELECT * FROM users WHERE id = 1 OR 1=1
// Возвращает ВСЕХ пользователей
\`\`\`

\`\`\`javascript
// Атака на login
// Input: username = admin'--
// Query: SELECT * FROM users WHERE username = 'admin'--' AND password = 'xxx'
// Комментарий -- отключает проверку пароля
\`\`\`

### Защита от SQL Injection

**1. Prepared Statements (Параметризованные запросы)**

\`\`\`javascript
// PostgreSQL с pg
const result = await client.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]  // Параметры автоматически экранируются
);

// MySQL с mysql2
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
\`\`\`

**2. ORM с экранированием**

\`\`\`javascript
// Prisma
const user = await prisma.user.findUnique({
  where: { id: userId }  // Prisma автоматически экранирует
});

// Sequelize
const user = await User.findByPk(userId);

// TypeORM
const user = await userRepository.findOne({ where: { id: userId } });
\`\`\`

**3. Input Validation**

\`\`\`javascript
app.get('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  res.json(user);
});
\`\`\`

## 5. HTTPS и TLS

### Что такое HTTPS?

**HTTPS = HTTP + TLS (Transport Layer Security)**

TLS шифрует данные между клиентом и сервером, защищая от:
- Перехвата данных (man-in-the-middle атаки)
- Подмены данных
- Кражи cookies, токенов, паролей

### Как работает TLS Handshake

1. **Client Hello**: Клиент отправляет поддерживаемые шифры
2. **Server Hello**: Сервер выбирает шифр и отправляет сертификат
3. **Certificate Verification**: Клиент проверяет сертификат (CA подпись)
4. **Key Exchange**: Обмен ключами для симметричного шифрования
5. **Encrypted Communication**: Все данные шифруются

### Настройка HTTPS в Node.js

\`\`\`javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
\`\`\`

### Secure Cookie Attributes

\`\`\`javascript
res.cookie('token', 'jwt123', {
  httpOnly: true,   // Защита от XSS
  secure: true,     // Только HTTPS
  sameSite: 'Strict', // Защита от CSRF
  maxAge: 3600000   // 1 час
});
\`\`\`

## 6. JWT Security

### Хранение JWT токенов

**❌ Плохо: localStorage**

\`\`\`javascript
// Уязвимо к XSS - JavaScript может прочитать токен
localStorage.setItem('token', jwtToken);

const token = localStorage.getItem('token');
fetch('/api/users', {
  headers: { 'Authorization': 'Bearer ' + token }
});
\`\`\`

**✅ Хорошо: HttpOnly Cookies**

\`\`\`javascript
// Server-side - устанавливает HttpOnly cookie
res.cookie('token', jwtToken, {
  httpOnly: true,  // JavaScript не может прочитать
  secure: true,    // Только HTTPS
  sameSite: 'Strict'
});

// Client-side - браузер автоматически отправляет cookie
fetch('/api/users', {
  credentials: 'include'  // Включить cookies
});
\`\`\`

### JWT Best Practices

1. **Короткое время жизни**: Access token 15-30 минут
2. **Refresh tokens**: Для обновления access token
3. **Whitelist/Blacklist**: Хранить активные токены в Redis
4. **HTTPS only**: Токены должны передаваться только по HTTPS

## 7. Дополнительные Security Headers

### X-Frame-Options

Защита от clickjacking (встраивание сайта в iframe).

\`\`\`javascript
res.setHeader('X-Frame-Options', 'DENY');
// или
res.setHeader('X-Frame-Options', 'SAMEORIGIN');
\`\`\`

### X-Content-Type-Options

Предотвращает MIME-sniffing.

\`\`\`javascript
res.setHeader('X-Content-Type-Options', 'nosniff');
\`\`\`

### Strict-Transport-Security (HSTS)

Заставляет браузер использовать только HTTPS.

\`\`\`javascript
res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
\`\`\`

### X-XSS-Protection

\`\`\`javascript
res.setHeader('X-XSS-Protection', '1; mode=block');
\`\`\`

### Использование helmet.js

\`\`\`javascript
const helmet = require('helmet');

app.use(helmet()); // Автоматически устанавливает все security headers
\`\`\`

## 8. Практический пример: Безопасный REST API

\`\`\`javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

const app = express();

// 1. Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));

// 2. CORS configuration
app.use(cors({
  origin: 'https://myapp.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов с одного IP
});
app.use('/api/', limiter);

// 4. CSRF protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// 5. Input validation
app.post('/api/users', async (req, res) => {
  const { email, password } = req.body;

  // Валидация
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }

  // Хеширование пароля
  const hashedPassword = await bcrypt.hash(password, 10);

  // Используем ORM для защиты от SQL injection
  const user = await prisma.user.create({
    data: { email, password: hashedPassword }
  });

  res.json({ id: user.id, email: user.email });
});

app.listen(443);
\`\`\`

## Заключение

Ключевые принципы безопасности REST API:

1. ✅ **CORS**: Настраивать только для доверенных origins
2. ✅ **CSRF**: Использовать CSRF токены + SameSite cookies
3. ✅ **XSS**: Санитизация input, экранирование output, CSP headers
4. ✅ **SQL Injection**: Prepared statements, ORM, валидация
5. ✅ **HTTPS**: Всегда использовать TLS для production
6. ✅ **JWT**: HttpOnly cookies вместо localStorage
7. ✅ **Security Headers**: X-Frame-Options, CSP, HSTS
8. ✅ **Input Validation**: Валидировать все user input
9. ✅ **Rate Limiting**: Защита от brute-force атак
10. ✅ **Least Privilege**: Минимальные права доступа для каждого API endpoint
`);

    // Создание лекции
    const lecture = await prisma.lecture.create({
      data: {
        title: 'CORS и Security в REST API',
        topic: 'cors-security',
        content: lectureContent,
      },
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    // Связывание вопросов с лекцией
    const test = await prisma.test.findFirst({
      where: { title: { contains: 'CORS' } },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      console.log('❌ Тест не найден');
      return;
    }

    let linkedCount = 0;
    for (const tq of test.questions) {
      await prisma.question.update({
        where: { id: tq.questionId },
        data: { lectureId: lecture.id }
      });
      linkedCount++;
    }

    console.log(`✅ Связано ${linkedCount} вопросов с лекцией\n`);
    console.log('🎉 Готово! Лекция "CORS и Security" создана и связана с тестом');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLecture();
