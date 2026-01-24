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
    console.log('📚 Создание лекции "WebSockets и Real-time"...\n');

    const existing = await prisma.lecture.findFirst({
      where: { title: { contains: 'WebSocket' } }
    });

    if (existing) {
      console.log('⚠️  Лекция уже существует, удаляю старую...');
      await prisma.lecture.delete({ where: { id: existing.id } });
    }

    const lectureContent = cleanContent(`# WebSockets и Real-time коммуникация в REST API

## 1. Введение в Real-time коммуникацию

### Проблема HTTP Request/Response

HTTP - это **request/response** протокол:
- Клиент инициирует запрос
- Сервер не может отправить данные клиенту без запроса
- Для получения обновлений нужно постоянно опрашивать сервер (polling)

**Для real-time приложений** (чаты, игры, live updates) нужна двусторонняя связь.

### Real-time технологии

| Технология | Направление | Use Case |
|------------|-------------|----------|
| **WebSocket** | Bidirectional | Чаты, игры, collaborative editing |
| **SSE (Server-Sent Events)** | Server → Client | Уведомления, live feeds, прогресс |
| **Long Polling** | Client ← Server | Fallback для старых браузеров |
| **Short Polling** | Client → Server | Редкие обновления (не рекомендуется) |

## 2. WebSocket

### Что такое WebSocket?

**WebSocket** - это протокол для **full-duplex** (двусторонней) real-time коммуникации через единое TCP соединение.

\`\`\`
HTTP (Request/Response)          WebSocket (Full-Duplex)
────────────────────────         ───────────────────────
Client → Server (request)        Client ↔ Server
Client ← Server (response)       │         │
[Connection closed]              │  msg 1  │
                                 │  msg 2  │
Client → Server (new request)    │  msg 3  │
Client ← Server (response)       └─────────┘
[Connection closed]              [Persistent connection]
\`\`\`

### WebSocket Handshake

WebSocket начинается с HTTP Upgrade запроса:

\`\`\`http
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
\`\`\`

**Server Response:**

\`\`\`http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
\`\`\`

После handshake соединение переключается на протокол \`ws://\` (или \`wss://\` для TLS).

### WebSocket Client (Browser)

\`\`\`javascript
// Подключение к WebSocket серверу
const ws = new WebSocket('ws://localhost:8080');

// Event: соединение установлено
ws.onopen = () => {
  console.log('Connected to WebSocket server');

  // Отправка сообщения
  ws.send(JSON.stringify({
    type: 'message',
    text: 'Hello, server!'
  }));
};

// Event: получено сообщение от сервера
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);

  // Обработка разных типов сообщений
  if (data.type === 'message') {
    displayMessage(data.text);
  } else if (data.type === 'user_joined') {
    showNotification(\`\${data.username} joined the chat\`);
  }
};

// Event: ошибка
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Event: соединение закрыто
ws.onclose = (event) => {
  console.log('Disconnected:', event.code, event.reason);

  // Автоматический reconnect
  setTimeout(() => {
    console.log('Reconnecting...');
    connectWebSocket();
  }, 3000);
};

// Отправка сообщения
function sendMessage(text) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      text: text
    }));
  } else {
    console.error('WebSocket is not open');
  }
}

// Закрытие соединения
function disconnect() {
  ws.close(1000, 'User disconnected'); // 1000 = normal closure
}
\`\`\`

### WebSocket Server (Node.js + ws library)

\`\`\`javascript
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Хранилище подключенных клиентов
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = generateId();
  clients.set(clientId, { ws, userId: null });

  console.log(\`Client connected: \${clientId}\`);

  // Получение сообщения от клиента
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      // Обработка разных типов сообщений
      switch (message.type) {
        case 'auth':
          handleAuth(clientId, message.token);
          break;

        case 'message':
          // Broadcast сообщение всем клиентам
          broadcast({
            type: 'message',
            userId: clients.get(clientId).userId,
            text: message.text,
            timestamp: Date.now()
          });
          break;

        case 'ping':
          // Heartbeat
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Соединение закрыто
  ws.on('close', () => {
    console.log(\`Client disconnected: \${clientId}\`);
    clients.delete(clientId);

    // Уведомить других клиентов
    broadcast({
      type: 'user_left',
      userId: clients.get(clientId)?.userId
    });
  });

  // Ошибка
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast сообщение всем подключенным клиентам
function broadcast(message) {
  const data = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

// Отправка сообщения конкретному клиенту
function sendToClient(clientId, message) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

server.listen(8080, () => {
  console.log('WebSocket server started on port 8080');
});
\`\`\`

### WebSocket Authentication

**Вариант 1: JWT в query параметре**

\`\`\`javascript
// Client
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const ws = new WebSocket(\`ws://localhost:8080?token=\${token}\`);

// Server
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'No token provided');
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    clients.set(clientId, { ws, userId: decoded.sub });
  } catch (error) {
    ws.close(4002, 'Invalid token');
  }
});
\`\`\`

**Вариант 2: Авторизация после подключения**

\`\`\`javascript
// Client
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // Отправляем токен в первом сообщении
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }));
};

// Server
ws.on('message', (data) => {
  const message = JSON.parse(data);

  if (message.type === 'auth') {
    const decoded = jwt.verify(message.token, JWT_SECRET);
    clients.get(clientId).userId = decoded.sub;
    ws.send(JSON.stringify({ type: 'auth_success' }));
  }
});
\`\`\`

### Heartbeat (Ping/Pong)

Heartbeat проверяет, что соединение еще живо.

\`\`\`javascript
// Server-side heartbeat
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
});

// Каждые 30 секунд отправляем ping
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      // Клиент не ответил на ping - закрываем соединение
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});
\`\`\`

## 3. Server-Sent Events (SSE)

### Что такое SSE?

**SSE** - это технология для **однонаправленной** (server → client) real-time связи через HTTP.

**Отличия от WebSocket:**
- ✅ Проще реализовать
- ✅ Автоматический reconnect
- ✅ Работает через HTTP (не нужен отдельный протокол)
- ❌ Только server → client (нет bidirectional)
- ❌ Только text data (не binary)

### SSE Client (Browser)

\`\`\`javascript
// Подключение к SSE endpoint
const eventSource = new EventSource('/events');

// Получение сообщений
eventSource.onmessage = (event) => {
  console.log('New message:', event.data);

  const data = JSON.parse(event.data);
  displayNotification(data.message);
};

// Custom event type
eventSource.addEventListener('notification', (event) => {
  const data = JSON.parse(event.data);
  console.log('Notification:', data);
});

// Ошибка
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // EventSource автоматически пытается reconnect
};

// Закрытие соединения
eventSource.close();
\`\`\`

### SSE Server (Node.js + Express)

\`\`\`javascript
const express = require('express');
const app = express();

// SSE endpoint
app.get('/events', (req, res) => {
  // Устанавливаем SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Отключаем буферизацию
  res.flushHeaders();

  // Отправка сообщения клиенту
  const sendEvent = (data) => {
    res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  };

  // Custom event type
  const sendNotification = (data) => {
    res.write(\`event: notification\\n\`);
    res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  };

  // Отправляем сообщение каждые 5 секунд
  const intervalId = setInterval(() => {
    sendEvent({
      message: 'Server time: ' + new Date().toISOString()
    });
  }, 5000);

  // Heartbeat (комментарий каждые 30 сек для keep-alive)
  const heartbeatId = setInterval(() => {
    res.write(': heartbeat\\n\\n');
  }, 30000);

  // Очистка при закрытии соединения
  req.on('close', () => {
    clearInterval(intervalId);
    clearInterval(heartbeatId);
    console.log('Client disconnected');
  });
});

// Broadcast уведомление всем подключенным клиентам
const clients = [];

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Добавляем клиента в список
  clients.push(res);

  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

// Функция для broadcast
function broadcastEvent(data) {
  clients.forEach((client) => {
    client.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  });
}

// Пример: отправка уведомления при создании нового поста
app.post('/posts', async (req, res) => {
  const post = await createPost(req.body);

  // Broadcast уведомление всем подключенным клиентам
  broadcastEvent({
    type: 'new_post',
    post: post
  });

  res.json(post);
});

app.listen(3000);
\`\`\`

### SSE Format

SSE формат - это текстовые строки, разделенные \`\\n\\n\`:

\`\`\`
data: This is a message\\n\\n

event: notification\\n
data: {"text": "New notification"}\\n\\n

id: 123\\n
data: Message with ID\\n\\n

retry: 10000\\n
\`\`\`

**Поля:**
- \`data:\` - данные сообщения
- \`event:\` - тип события (по умолчанию "message")
- \`id:\` - ID сообщения (для reconnect)
- \`retry:\` - время reconnect в миллисекундах

## 4. Polling (Short и Long)

### Short Polling

Клиент периодически делает HTTP запросы для проверки обновлений.

\`\`\`javascript
// Client-side
function checkForUpdates() {
  fetch('/api/updates')
    .then(res => res.json())
    .then(data => {
      if (data.hasUpdates) {
        displayUpdates(data.updates);
      }
    });
}

// Опрашивать каждую секунду
setInterval(checkForUpdates, 1000);
\`\`\`

**❌ Недостатки:**
- Много лишних запросов (overhead)
- Задержка обнаружения изменений
- Высокая нагрузка на сервер

### Long Polling

Сервер держит запрос открытым до появления данных.

\`\`\`javascript
// Client-side
function longPoll() {
  fetch('/api/long-poll')
    .then(res => res.json())
    .then(data => {
      displayUpdates(data);

      // Сразу делаем новый запрос
      longPoll();
    })
    .catch(error => {
      console.error('Error:', error);

      // Retry через 5 секунд
      setTimeout(longPoll, 5000);
    });
}

longPoll();
\`\`\`

\`\`\`javascript
// Server-side (Express)
app.get('/api/long-poll', async (req, res) => {
  const timeout = 30000; // 30 секунд
  const startTime = Date.now();

  // Ждем появления новых данных
  while (Date.now() - startTime < timeout) {
    const updates = await checkForUpdates();

    if (updates.length > 0) {
      // Есть обновления - возвращаем их
      return res.json({ updates });
    }

    // Ждем 1 секунду перед следующей проверкой
    await sleep(1000);
  }

  // Timeout - возвращаем пустой ответ
  res.json({ updates: [] });
});
\`\`\`

## 5. Socket.IO

### Что такое Socket.IO?

**Socket.IO** - это библиотека для real-time apps, которая:
- Использует WebSocket если доступен
- Автоматический fallback на long polling
- Добавляет rooms, namespaces, reconnection

### Socket.IO Server

\`\`\`javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Подключение клиента
io.on('connection', (socket) => {
  console.log(\`User connected: \${socket.id}\`);

  // Получение сообщения от клиента
  socket.on('message', (data) => {
    console.log('Message:', data);

    // Broadcast всем клиентам (кроме отправителя)
    socket.broadcast.emit('message', {
      userId: socket.id,
      text: data.text
    });
  });

  // Присоединение к room
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(\`User \${socket.id} joined room: \${room}\`);

    // Отправка сообщения только в эту room
    io.to(room).emit('user_joined', {
      userId: socket.id,
      room: room
    });
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log(\`User disconnected: \${socket.id}\`);
  });
});

server.listen(3000);
\`\`\`

### Socket.IO Client

\`\`\`javascript
import { io } from 'socket.io-client';

// Подключение к серверу
const socket = io('http://localhost:3000');

// Соединение установлено
socket.on('connect', () => {
  console.log('Connected:', socket.id);

  // Присоединяемся к room
  socket.emit('join_room', 'chat_room_1');
});

// Отправка сообщения
function sendMessage(text) {
  socket.emit('message', { text });
}

// Получение сообщения
socket.on('message', (data) => {
  displayMessage(data.userId, data.text);
});

// Отключение
socket.on('disconnect', () => {
  console.log('Disconnected');
});
\`\`\`

## 6. Масштабирование WebSocket приложений

### Проблема

WebSocket соединения **stateful** - каждый клиент подключен к конкретному серверу.

\`\`\`
User A → Server 1 (WebSocket)
User B → Server 2 (WebSocket)

Если User A отправляет сообщение,
Server 1 не может отправить его User B на Server 2
\`\`\`

### Решение: Message Broker (Redis Pub/Sub)

\`\`\`javascript
const Redis = require('ioredis');
const redis = new Redis();
const redisSub = new Redis();

// Subscribe на канал
redisSub.subscribe('chat_messages');

// Получение сообщений из Redis
redisSub.on('message', (channel, message) => {
  const data = JSON.parse(message);

  // Broadcast всем клиентам на этом сервере
  broadcastToLocalClients(data);
});

// Отправка сообщения в Redis
function publishMessage(data) {
  redis.publish('chat_messages', JSON.stringify(data));
}

// WebSocket message handler
ws.on('message', (data) => {
  const message = JSON.parse(data);

  // Публикуем в Redis (все серверы получат)
  publishMessage({
    userId: clients.get(clientId).userId,
    text: message.text
  });
});
\`\`\`

## 7. Сравнение технологий

| Feature | WebSocket | SSE | Long Polling | Short Polling |
|---------|-----------|-----|--------------|---------------|
| **Направление** | Bidirectional | Server → Client | Server → Client | Server → Client |
| **Протокол** | ws:// / wss:// | HTTP | HTTP | HTTP |
| **Overhead** | Низкий | Средний | Высокий | Очень высокий |
| **Binary data** | ✅ Да | ❌ Нет | ✅ Да | ✅ Да |
| **Browser support** | ✅ Все современные | ✅ Все современные | ✅ Все | ✅ Все |
| **Reconnect** | Вручную | Автоматический | Вручную | Не нужен |
| **Сложность** | Высокая | Низкая | Средняя | Низкая |

## 8. Когда использовать каждую технологию

### ✅ WebSocket

- Chat приложения
- Multiplayer игры
- Collaborative editing (Google Docs)
- Trading platforms (real-time prices)
- Live dashboards
- Требуется bidirectional связь

### ✅ SSE (Server-Sent Events)

- Уведомления (notifications)
- Live feeds (Twitter, новости)
- Прогресс загрузки/обработки
- Live sports scores
- Stock tickers
- Только server → client связь

### ✅ Long Polling

- Fallback для старых браузеров
- Редкие обновления
- Простая реализация

### ❌ Short Polling

- Только для очень редких обновлений
- Когда другие технологии недоступны
- Не рекомендуется для production

## Заключение

Ключевые takeaways:

1. ✅ **WebSocket** - bidirectional real-time (чаты, игры)
2. ✅ **SSE** - server → client (уведомления, live updates)
3. ✅ **Long Polling** - fallback для старых браузеров
4. ✅ **Socket.IO** - WebSocket с fallback и дополнительными features
5. ✅ **Масштабирование** - Redis Pub/Sub для sync между серверами
6. ✅ **Heartbeat** - ping/pong для проверки соединения
7. ✅ **Авторизация** - JWT в query или initial message
8. ✅ **Выбор технологии** зависит от направления связи и требований
`);

    const lecture = await prisma.lecture.create({
      data: {
        title: 'WebSockets и Real-time коммуникация',
        topic: 'websockets-realtime',
        content: lectureContent,
      },
    });

    console.log(`✅ Лекция создана с ID: ${lecture.id}\n`);

    const test = await prisma.test.findFirst({
      where: { title: { contains: 'WebSocket' } },
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
    console.log('🎉 Готово! Лекция "WebSockets и Real-time" создана и связана с тестом');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLecture();
