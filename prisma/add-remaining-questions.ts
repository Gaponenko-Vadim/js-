import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type QuestionData = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

// Функция для добавления вопросов к существующему тесту
async function addQuestionsToTest(testTitle: string, newQuestions: QuestionData[]) {
  const test = await prisma.test.findFirst({
    where: { title: testTitle },
    include: { questions: true }
  });

  if (!test) {
    console.log(`❌ Test "${testTitle}" not found`);
    return;
  }

  const startOrder = test.questions.length;

  for (let i = 0; i < newQuestions.length; i++) {
    const q = newQuestions[i];

    // Проверяем, существует ли уже такой вопрос
    let question = await prisma.question.findFirst({
      where: {
        question: q.question,
        correctAnswer: q.correctAnswer,
      }
    });

    // Если вопроса нет, создаём его
    if (!question) {
      question = await prisma.question.create({
        data: {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        }
      });
    }

    // Проверяем, не связан ли уже вопрос с тестом
    const existingLink = await prisma.testQuestion.findFirst({
      where: {
        testId: test.id,
        questionId: question.id,
      }
    });

    // Создаём связь только если её ещё нет
    if (!existingLink) {
      await prisma.testQuestion.create({
        data: {
          testId: test.id,
          questionId: question.id,
          order: startOrder + i,
        }
      });
    }
  }

  console.log(`✅ Added ${newQuestions.length} questions to "${testTitle}" (total: ${startOrder + newQuestions.length})`);
}

// ============= INTERMEDIATE LEVEL =============

const statusCodes5xxQuestions: QuestionData[] = [
  {
    question: 'Какой статус код означает внутреннюю ошибку сервера?',
    options: ['400', '404', '500', '503'],
    correctAnswer: 2,
    explanation: '500 Internal Server Error - общая ошибка сервера при обработке запроса.'
  },
  {
    question: 'Что означает 502 Bad Gateway?',
    options: [
      'Сервер недоступен',
      'Прокси получил неверный ответ от upstream сервера',
      'Таймаут соединения',
      'Сервер перегружен'
    ],
    correctAnswer: 1,
    explanation: '502 возвращается когда прокси/gateway получает невалидный ответ от upstream сервера.'
  },
  {
    question: 'В чем разница между 502 и 503?',
    options: [
      'Нет разницы',
      '502 - проблема с upstream, 503 - сервер временно недоступен',
      '502 - таймаут, 503 - перегрузка',
      '503 устаревший код'
    ],
    correctAnswer: 1,
    explanation: '502 - ошибка прокси/gateway, 503 - сервер временно не может обработать запрос.'
  },
  {
    question: 'Какой статус при таймауте gateway?',
    options: ['500 Internal Server Error', '502 Bad Gateway', '503 Service Unavailable', '504 Gateway Timeout'],
    correctAnswer: 3,
    explanation: '504 Gateway Timeout когда прокси/gateway не дождался ответа от upstream сервера.'
  },
  {
    question: 'Что означает 503 Service Unavailable?',
    options: [
      'Сервер сломан',
      'Сервер временно недоступен (обслуживание, перегрузка)',
      'Сервис не найден',
      'Сервис устарел'
    ],
    correctAnswer: 1,
    explanation: '503 указывает на временную недоступность, обычно включает Retry-After заголовок.'
  },
  {
    question: 'Какой заголовок нужно добавить к 503 ответу?',
    options: ['Location', 'Retry-After', 'Allow', 'Accept'],
    correctAnswer: 1,
    explanation: 'Retry-After указывает когда клиент может повторить запрос.'
  },
  {
    question: 'Что означает 505 HTTP Version Not Supported?',
    options: [
      'Старый браузер',
      'Сервер не поддерживает версию HTTP протокола из запроса',
      'Версия API не поддерживается',
      'Нужно обновление'
    ],
    correctAnswer: 1,
    explanation: '505 когда сервер не поддерживает версию HTTP протокола, указанную в запросе.'
  },
  {
    question: 'Следует ли логировать 5xx ошибки?',
    options: ['Нет', 'Да, обязательно', 'Только 500', 'Только критичные'],
    correctAnswer: 1,
    explanation: '5xx ошибки указывают на проблемы сервера и должны логироваться для мониторинга.'
  },
  {
    question: 'Какую информацию безопасно возвращать в 500 ответе?',
    options: [
      'Stack trace',
      'Детали БД ошибки',
      'Общее сообщение об ошибке',
      'Код и строку ошибки'
    ],
    correctAnswer: 2,
    explanation: 'Детали внутренних ошибок не должны раскрываться клиенту из соображений безопасности.'
  },
  {
    question: 'Что означает 501 Not Implemented?',
    options: [
      'Функция в разработке',
      'Сервер не поддерживает функциональность для запроса',
      'Метод не реализован',
      'Эндпоинт не готов'
    ],
    correctAnswer: 1,
    explanation: '501 когда сервер не распознает метод запроса или не может его выполнить.'
  },
  {
    question: 'Можно ли использовать 500 для бизнес-логики ошибок?',
    options: ['Да', 'Нет, используйте 4xx', 'Иногда', 'Для критичных ошибок'],
    correctAnswer: 1,
    explanation: '500 только для технических ошибок сервера, бизнес-логика - это 4xx ошибки.'
  },
  {
    question: 'Что означает 507 Insufficient Storage?',
    options: [
      'База данных заполнена',
      'Сервер не может сохранить ресурс из-за недостатка места',
      'Файл слишком большой',
      'Лимит хранилища превышен'
    ],
    correctAnswer: 1,
    explanation: '507 (WebDAV) когда сервер не может сохранить ресурс из-за недостатка места.'
  },
  {
    question: 'Какой статус при ошибке валидации схемы на сервере?',
    options: ['500 Internal Server Error', '400 Bad Request', '422 Unprocessable Entity', '502 Bad Gateway'],
    correctAnswer: 0,
    explanation: 'Если схема валидации на сервере неправильна - это 500, если данные клиента - 4xx.'
  },
  {
    question: 'Нужно ли включать request ID в 5xx ответы?',
    options: ['Нет', 'Да, для трейсинга', 'Опционально', 'Только для 500'],
    correctAnswer: 1,
    explanation: 'Request ID помогает коррелировать клиентские ошибки с серверными логами.'
  },
  {
    question: 'Что означает 511 Network Authentication Required?',
    options: [
      'Нужна авторизация API',
      'Требуется аутентификация в сети (captive portal)',
      'Токен истек',
      'VPN требуется'
    ],
    correctAnswer: 1,
    explanation: '511 используется captive portals (Wi-Fi в отелях, аэропортах) для требования аутентификации.'
  },
];

const authorizationHeaderQuestions: QuestionData[] = [
  {
    question: 'Как правильно передать Bearer token?',
    options: [
      'Authorization: token',
      'Authorization: Bearer token',
      'Auth: Bearer token',
      'Bearer: token'
    ],
    correctAnswer: 1,
    explanation: 'Формат: Authorization: Bearer <token> согласно RFC 6750.'
  },
  {
    question: 'Что означает схема Basic в Authorization?',
    options: [
      'Простая аутентификация',
      'Base64(username:password)',
      'Базовый токен',
      'Стандартная схема'
    ],
    correctAnswer: 1,
    explanation: 'Basic Auth использует Base64 кодирование "username:password".'
  },
  {
    question: 'Какая разница между Authorization и Authentication?',
    options: [
      'Нет разницы',
      'Authorization - права доступа, Authentication - проверка identity',
      'Authorization устарела',
      'Authentication - для API ключей'
    ],
    correctAnswer: 1,
    explanation: 'Authentication (кто вы?), Authorization (что вам разрешено?).'
  },
  {
    question: 'Что вернуть если Authorization заголовок отсутствует?',
    options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '422 Unprocessable'],
    correctAnswer: 1,
    explanation: '401 Unauthorized с WWW-Authenticate заголовком.'
  },
  {
    question: 'Какой заголовок должен быть в 401 ответе?',
    options: ['Allow', 'WWW-Authenticate', 'Location', 'Retry-After'],
    correctAnswer: 1,
    explanation: 'WWW-Authenticate указывает требуемую схему аутентификации.'
  },
  {
    question: 'Можно ли использовать несколько схем в Authorization?',
    options: ['Нет', 'Да, через запятую', 'Только одна схема', 'Да, в разных заголовках'],
    correctAnswer: 2,
    explanation: 'Один Authorization заголовок может содержать только одну схему аутентификации.'
  },
  {
    question: 'Что такое Digest authentication?',
    options: [
      'Хеш пароля',
      'Challenge-response схема с MD5/SHA',
      'Сжатая аутентификация',
      'Дайджест токенов'
    ],
    correctAnswer: 1,
    explanation: 'Digest Auth использует challenge-response для избежания передачи пароля открытым текстом.'
  },
  {
    question: 'Безопасна ли Basic Auth без HTTPS?',
    options: ['Да', 'Нет, Base64 легко декодируется', 'Да, если пароль сложный', 'Зависит от сервера'],
    correctAnswer: 1,
    explanation: 'Basic Auth передает credentials в Base64 (не шифрование!), нужен HTTPS.'
  },
  {
    question: 'Какой формат для API ключа в Authorization?',
    options: [
      'Authorization: ApiKey key',
      'Authorization: Bearer key',
      'X-API-Key: key',
      'Нет стандарта'
    ],
    correctAnswer: 3,
    explanation: 'Нет RFC стандарта для API ключей, используются разные подходы (Bearer, custom headers).'
  },
  {
    question: 'Что такое OAuth 2.0 Bearer token?',
    options: [
      'Токен владельца',
      'Access token для доступа к ресурсам',
      'Временный ключ',
      'Зашифрованный токен'
    ],
    correctAnswer: 1,
    explanation: 'Bearer token - это access token, предъявитель имеет доступ к ресурсам.'
  },
  {
    question: 'Следует ли валидировать формат Bearer token?',
    options: ['Нет', 'Да, проверять структуру JWT', 'Только длину', 'Только сигнатуру'],
    correctAnswer: 1,
    explanation: 'Валидируйте формат, срок действия, сигнатуру JWT токена.'
  },
  {
    question: 'Можно ли передавать токен в query параметре?',
    options: ['Да', 'Нет, небезопасно', 'Только для GET', 'Для публичных API'],
    correctAnswer: 1,
    explanation: 'Токены в URL логируются и видны в истории браузера, используйте заголовки.'
  },
  {
    question: 'Что такое HOBA authentication?',
    options: [
      'HTTP Origin-Bound Authentication',
      'Hash-based аутентификация',
      'Home Banking Auth',
      'Hybrid OAuth Bearer Auth'
    ],
    correctAnswer: 0,
    explanation: 'HOBA - HTTP Origin-Bound Authentication, использует цифровые подписи.'
  },
  {
    question: 'Какой срок жизни рекомендуется для access tokens?',
    options: ['1 час или меньше', '24 часа', '7 дней', 'Бесконечный'],
    correctAnswer: 0,
    explanation: 'Короткий срок жизни (15 мин - 1 час) снижает риски при компрометации.'
  },
  {
    question: 'Что такое refresh token?',
    options: [
      'Обновленный токен',
      'Токен для получения нового access token',
      'Токен обновления данных',
      'Резервный токен'
    ],
    correctAnswer: 1,
    explanation: 'Refresh token используется для получения новых access tokens без повторной аутентификации.'
  },
  {
    question: 'Нужно ли логировать Authorization заголовки?',
    options: ['Да, для аудита', 'Нет, это sensitive данные', 'Только неуспешные', 'Только схему'],
    correctAnswer: 1,
    explanation: 'Никогда не логируйте токены и credentials, логируйте только события (успех/неудача).'
  },
  {
    question: 'Что означает схема Mutual в Authorization?',
    options: [
      'Общая аутентификация',
      'Mutual TLS (клиент и сервер аутентифицируют друг друга)',
      'Множественная аутентификация',
      'Взаимный токен'
    ],
    correctAnswer: 1,
    explanation: 'Mutual TLS обеспечивает двустороннюю аутентификацию через сертификаты.'
  },
  {
    question: 'Какой статус при невалидной сигнатуре JWT?',
    options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '422 Unprocessable'],
    correctAnswer: 1,
    explanation: '401 Unauthorized - токен невалиден, требуется повторная аутентификация.'
  },
  {
    question: 'Можно ли использовать один токен для разных API?',
    options: ['Нет', 'Да, если аудитория (aud) включает все API', 'Да, всегда', 'Только в микросервисах'],
    correctAnswer: 1,
    explanation: 'JWT claim "aud" (audience) должен включать целевые API для безопасности.'
  },
  {
    question: 'Что такое HAWK authentication?',
    options: [
      'HTTP Authentication With Keys',
      'HMAC-based схема с nonce и timestamp',
      'Hardware Auth With Keys',
      'Hash-authenticated Web Keys'
    ],
    correctAnswer: 1,
    explanation: 'HAWK использует HMAC для подписи запросов с защитой от replay атак.'
  },
];

const crudOperationsQuestions: QuestionData[] = [
  {
    question: 'Что означает идемпотентность PUT запроса?',
    options: [
      'Всегда возвращает одинаковый результат',
      'Многократные идентичные PUT дают тот же эффект что и один',
      'PUT безопасный метод',
      'PUT кешируется'
    ],
    correctAnswer: 1,
    explanation: 'PUT идемпотентен - N одинаковых PUT запросов оставляют ресурс в том же состоянии.'
  },
  {
    question: 'В чем разница между PUT и PATCH?',
    options: [
      'Нет разницы',
      'PUT - полная замена, PATCH - частичное обновление',
      'PATCH быстрее',
      'PUT для создания, PATCH для обновления'
    ],
    correctAnswer: 1,
    explanation: 'PUT заменяет ресурс целиком, PATCH модифицирует отдельные поля.'
  },
  {
    question: 'Можно ли использовать PUT для создания ресурса?',
    options: ['Нет, только POST', 'Да, если клиент знает ID', 'Нет, PUT только для update', 'Зависит от API'],
    correctAnswer: 1,
    explanation: 'PUT может создавать ресурс если клиент определяет ID (PUT /users/123).'
  },
  {
    question: 'Что должен вернуть DELETE успешно удаленного ресурса?',
    options: ['200 OK', '204 No Content', '202 Accepted', 'Любой из перечисленных'],
    correctAnswer: 3,
    explanation: '200 с телом, 204 без тела, 202 если удаление асинхронное.'
  },
  {
    question: 'Что вернуть при повторном DELETE уже удаленного ресурса?',
    options: ['404 Not Found', '204 No Content', '410 Gone', 'Зависит от реализации'],
    correctAnswer: 3,
    explanation: 'Разные подходы: 404 (не найден), 204 (идемпотентно), 410 (удален ранее).'
  },
  {
    question: 'Нужно ли включать Location заголовок при 201 Created?',
    options: ['Нет', 'Да, обязательно', 'Рекомендуется', 'Только для POST'],
    correctAnswer: 2,
    explanation: 'Location указывает URI созданного ресурса, сильно рекомендуется.'
  },
  {
    question: 'Что такое upsert операция?',
    options: [
      'Update или Insert',
      'Update + Insert одновременно',
      'Обновление с проверкой',
      'Универсальное сохранение'
    ],
    correctAnswer: 0,
    explanation: 'Upsert (update or insert) - создает если не существует, обновляет если существует.'
  },
  {
    question: 'Какой HTTP метод использовать для upsert?',
    options: ['POST', 'PUT', 'PATCH', 'Нет стандарта'],
    correctAnswer: 1,
    explanation: 'PUT семантически подходит для upsert (replace or create).'
  },
  {
    question: 'Можно ли использовать POST для обновления?',
    options: ['Нет', 'Да, но не рекомендуется', 'Только для частичного обновления', 'Только с _method'],
    correctAnswer: 1,
    explanation: 'POST может использоваться для update, но PUT/PATCH более семантичны.'
  },
  {
    question: 'Что вернуть при PATCH с пустым телом?',
    options: ['200 OK', '400 Bad Request', '204 No Content', '422 Unprocessable'],
    correctAnswer: 1,
    explanation: '400 Bad Request - пустое тело PATCH не имеет смысла.'
  },
  {
    question: 'Должен ли PUT валидировать все поля ресурса?',
    options: ['Да', 'Нет', 'Только обязательные', 'Зависит от ресурса'],
    correctAnswer: 0,
    explanation: 'PUT заменяет ресурс целиком, все обязательные поля должны присутствовать.'
  },
  {
    question: 'Что такое JSON Patch (RFC 6902)?',
    options: [
      'PATCH с JSON',
      'Формат описания изменений JSON документа',
      'Патч для JSON файлов',
      'Частичный JSON'
    ],
    correctAnswer: 1,
    explanation: 'JSON Patch - стандартный формат для описания операций (add, remove, replace) над JSON.'
  },
  {
    question: 'Какой Content-Type для JSON Patch?',
    options: ['application/json', 'application/json-patch+json', 'application/patch', 'text/json'],
    correctAnswer: 1,
    explanation: 'application/json-patch+json - MIME тип для JSON Patch документов.'
  },
  {
    question: 'Что такое оптимистичная блокировка (optimistic locking)?',
    options: [
      'Оптимизация запросов',
      'Проверка версии ресурса при обновлении',
      'Блокировка для чтения',
      'Асинхронное обновление'
    ],
    correctAnswer: 1,
    explanation: 'Optimistic locking использует ETag/версию для предотвращения конфликтов обновлений.'
  },
  {
    question: 'Какой заголовок использовать для условного PUT?',
    options: ['If-Modified-Since', 'If-Match', 'If-None-Match', 'If-Range'],
    correctAnswer: 1,
    explanation: 'If-Match с ETag гарантирует обновление только если версия не изменилась.'
  },
  {
    question: 'Что вернуть если If-Match не совпадает?',
    options: ['400 Bad Request', '409 Conflict', '412 Precondition Failed', '428 Precondition Required'],
    correctAnswer: 2,
    explanation: '412 Precondition Failed когда условный заголовок (If-Match) не выполнен.'
  },
  {
    question: 'Должен ли POST быть идемпотентным?',
    options: ['Да', 'Нет', 'Желательно', 'Зависит от операции'],
    correctAnswer: 1,
    explanation: 'POST не идемпотентен по спецификации, повторные запросы могут создавать дубликаты.'
  },
  {
    question: 'Как предотвратить дубликаты при повторных POST?',
    options: [
      'Проверять на сервере',
      'Idempotency-Key заголовок',
      'UUID в запросе',
      'Все перечисленное'
    ],
    correctAnswer: 3,
    explanation: 'Комбинация: Idempotency-Key, деdупликация на сервере, уникальные ID.'
  },
  {
    question: 'Что такое soft delete?',
    options: [
      'Частичное удаление',
      'Пометка записи как удаленной без физического удаления',
      'Временное удаление',
      'Мягкое удаление без подтверждения'
    ],
    correctAnswer: 1,
    explanation: 'Soft delete помечает запись флагом (deleted_at) вместо удаления из БД.'
  },
  {
    question: 'Должен ли DELETE возвращать удаленный ресурс?',
    options: ['Нет', 'Да, всегда', 'Опционально', 'Для аудита'],
    correctAnswer: 2,
    explanation: 'Можно вернуть удаленный ресурс в теле (200 OK) или пустой ответ (204 No Content).'
  },
];

const idempotencyQuestions: QuestionData[] = [
  {
    question: 'Какие HTTP методы идемпотентны?',
    options: [
      'GET, POST, PUT',
      'GET, PUT, DELETE, HEAD, OPTIONS',
      'Только GET',
      'GET, POST, DELETE'
    ],
    correctAnswer: 1,
    explanation: 'Идемпотентные методы: GET, HEAD, PUT, DELETE, OPTIONS, TRACE.'
  },
  {
    question: 'Является ли PATCH идемпотентным?',
    options: ['Да', 'Нет', 'Зависит от реализации', 'Только для JSON Patch'],
    correctAnswer: 2,
    explanation: 'PATCH может быть идемпотентным или нет в зависимости от операций (replace - да, increment - нет).'
  },
  {
    question: 'Что такое Idempotency-Key заголовок?',
    options: [
      'Ключ для кеширования',
      'Уникальный ключ для предотвращения дубликатов',
      'Идентификатор запроса',
      'Токен идемпотентности'
    ],
    correctAnswer: 1,
    explanation: 'Idempotency-Key позволяет безопасно повторять POST запросы без создания дубликатов.'
  },
  {
    question: 'Как долго сервер должен хранить Idempotency-Key?',
    options: ['Вечно', '24 часа', 'До обработки запроса', 'Зависит от API'],
    correctAnswer: 3,
    explanation: 'Обычно 24-72 часа, достаточно для retry логики, но зависит от требований API.'
  },
  {
    question: 'Что вернуть при повторном POST с тем же Idempotency-Key?',
    options: [
      '409 Conflict',
      'Тот же ответ что и первый раз',
      '200 с пустым телом',
      '304 Not Modified'
    ],
    correctAnswer: 1,
    explanation: 'Вернуть оригинальный ответ (кешированный результат первого запроса).'
  },
  {
    question: 'Почему DELETE идемпотентен если возвращает 404 при повторе?',
    options: [
      'Это не идемпотентность',
      'Идемпотентность о состоянии ресурса, не о коде ответа',
      'DELETE не идемпотентен',
      'Ошибка спецификации'
    ],
    correctAnswer: 1,
    explanation: 'После первого DELETE ресурса нет, повторные DELETE не меняют это состояние.'
  },
  {
    question: 'Можно ли сделать POST идемпотентным?',
    options: ['Нет', 'Да, с Idempotency-Key', 'Да, если операция идемпотентна', 'Оба варианта'],
    correctAnswer: 3,
    explanation: 'Idempotency-Key или семантически идемпотентная операция (например, поиск).'
  },
  {
    question: 'Что такое safe (безопасный) HTTP метод?',
    options: [
      'Зашифрованный',
      'Не изменяет состояние сервера',
      'Идемпотентный',
      'Быстрый'
    ],
    correctAnswer: 1,
    explanation: 'Safe методы (GET, HEAD, OPTIONS) предназначены только для чтения данных.'
  },
  {
    question: 'Все ли safe методы идемпотентны?',
    options: ['Да', 'Нет', 'Кроме GET', 'Кроме OPTIONS'],
    correctAnswer: 0,
    explanation: 'Все safe методы идемпотентны, но не все идемпотентные методы safe (PUT, DELETE).'
  },
  {
    question: 'Почему PATCH increment операция не идемпотентна?',
    options: [
      'PATCH никогда не идемпотентен',
      'Повторные increment дают разные результаты',
      'Increment требует POST',
      'Это ошибка реализации'
    ],
    correctAnswer: 1,
    explanation: 'PATCH {op: "increment", field: "counter"} - каждый вызов увеличивает значение.'
  },
];

const paginationQuestions: QuestionData[] = [
  {
    question: 'Что такое offset-based пагинация?',
    options: [
      'Пагинация по номеру страницы',
      'Пагинация по смещению от начала',
      'Пагинация по времени',
      'Пагинация по ID'
    ],
    correctAnswer: 1,
    explanation: 'Offset пагинация: ?offset=20&limit=10 (пропустить 20, взять 10).'
  },
  {
    question: 'В чем проблема offset пагинации для больших датасетов?',
    options: [
      'Медленная',
      'Пропуски/дубликаты при изменении данных',
      'Сложная реализация',
      'Не масштабируется'
    ],
    correctAnswer: 1,
    explanation: 'При добавлении/удалении записей offset может пропустить элементы или показать дубликаты.'
  },
  {
    question: 'Что такое cursor-based пагинация?',
    options: [
      'Пагинация с курсором мыши',
      'Пагинация по уникальному указателю (cursor)',
      'Бесконечный скроллинг',
      'Пагинация по времени'
    ],
    correctAnswer: 1,
    explanation: 'Cursor указывает на конкретную позицию, устойчива к изменениям данных.'
  },
  {
    question: 'Какие метаданные включать в пагинированный ответ?',
    options: [
      'Только данные',
      'total, page, per_page',
      'next_cursor, prev_cursor',
      'Зависит от типа пагинации'
    ],
    correctAnswer: 3,
    explanation: 'Offset: total, page, per_page; Cursor: next_cursor, has_more; Keyset: next_id.'
  },
  {
    question: 'Что такое keyset pagination?',
    options: [
      'Пагинация по ключам',
      'Пагинация по последнему значению сортируемого поля',
      'Пагинация по ID',
      'То же что cursor'
    ],
    correctAnswer: 1,
    explanation: 'Keyset: WHERE id > last_id ORDER BY id LIMIT 10, эффективна для индексированных полей.'
  },
  {
    question: 'Какой подход пагинации наиболее эффективен для real-time данных?',
    options: ['Offset', 'Page-based', 'Cursor-based', 'Все одинаковы'],
    correctAnswer: 2,
    explanation: 'Cursor-based устойчива к изменениям данных в реальном времени.'
  },
  {
    question: 'Следует ли ограничивать максимальный размер страницы?',
    options: ['Нет', 'Да, для защиты сервера', 'Только для публичных API', 'Опционально'],
    correctAnswer: 1,
    explanation: 'Лимит (например, max 100 записей) защищает от DoS и перегрузки.'
  },
  {
    question: 'Что вернуть если запрошенная страница не существует?',
    options: ['404 Not Found', '200 с пустым массивом', '400 Bad Request', 'Зависит от API'],
    correctAnswer: 3,
    explanation: 'Оба подхода используются: 200 + empty array или 404, выберите один.'
  },
  {
    question: 'Как реализовать двунаправленную пагинацию (вперед/назад)?',
    options: [
      'Только offset',
      'Cursor с next_cursor и prev_cursor',
      'Две конечные точки',
      'Невозможно'
    ],
    correctAnswer: 1,
    explanation: 'Cursor-based с поддержкой next и previous курсоров.'
  },
  {
    question: 'Что такое Link заголовок в пагинации?',
    options: [
      'Ссылка на данные',
      'RFC 5988 заголовок с URL для next/prev/first/last',
      'Внутренняя ссылка',
      'Гиперссылка'
    ],
    correctAnswer: 1,
    explanation: 'Link заголовок содержит URL для навигации: <url>; rel="next".'
  },
  {
    question: 'Нужно ли возвращать total count при cursor пагинации?',
    options: ['Да, всегда', 'Нет, cursor не поддерживает', 'Опционально', 'Для первой страницы'],
    correctAnswer: 2,
    explanation: 'Total count дорогой для больших датасетов, часто не включается в cursor пагинацию.'
  },
  {
    question: 'Что такое seek pagination?',
    options: [
      'Поиск пагинации',
      'То же что keyset pagination',
      'Пагинация по поиску',
      'Случайная пагинация'
    ],
    correctAnswer: 1,
    explanation: 'Seek (keyset) pagination - поиск следующей страницы по значению ключа.'
  },
  {
    question: 'Как реализовать пагинацию для сложной сортировки?',
    options: [
      'Offset',
      'Cursor с составным ключом',
      'Невозможно',
      'Только page-based'
    ],
    correctAnswer: 1,
    explanation: 'Cursor может содержать несколько полей для сложной сортировки.'
  },
  {
    question: 'Следует ли кешировать пагинированные ответы?',
    options: ['Нет, данные меняются', 'Да, с коротким TTL', 'Только первую страницу', 'Зависит от данных'],
    correctAnswer: 3,
    explanation: 'Статичные данные - да, real-time - нет или очень короткий TTL.'
  },
  {
    question: 'Что вернуть если limit превышает максимум?',
    options: [
      '400 Bad Request',
      'Использовать максимум',
      '413 Payload Too Large',
      'Оба варианта A и B'
    ],
    correctAnswer: 3,
    explanation: 'Можно вернуть ошибку (400) или молча применить максимум (указав в документации).'
  },
];

const filteringSortingQuestions: QuestionData[] = [
  {
    question: 'Как правильно передать фильтрацию по полю в query параметрах?',
    options: [
      '?filter=name:John',
      '?name=John',
      '?filter[name]=John',
      'Все варианты используются'
    ],
    correctAnswer: 3,
    explanation: 'Нет единого стандарта: ?name=John (простое), ?filter[name]=John (структурное).'
  },
  {
    question: 'Что такое RSQL (RESTful Query Language)?',
    options: [
      'SQL для REST',
      'Язык запросов для фильтрации в URL',
      'Сжатый SQL',
      'REST SQL dialect'
    ],
    correctAnswer: 1,
    explanation: 'RSQL: ?filter=name==John;age>18 - компактный язык для сложных фильтров.'
  },
  {
    question: 'Как обозначить сортировку по убыванию?',
    options: [
      '?sort=-name',
      '?sort=name:desc',
      '?sort=name&order=desc',
      'Все варианты используются'
    ],
    correctAnswer: 3,
    explanation: 'Разные конвенции: -name (префикс минус), :desc (суффикс), отдельный order параметр.'
  },
  {
    question: 'Что такое фильтры с операторами (filter operators)?',
    options: [
      'Операторы БД',
      'eq, ne, gt, lt, gte, lte, like, in',
      'AND, OR, NOT',
      'Математические операции'
    ],
    correctAnswer: 1,
    explanation: 'Операторы сравнения: ?price[gte]=10&price[lte]=100 (price >= 10 AND price <= 100).'
  },
  {
    question: 'Как реализовать поиск по нескольким полям (full-text search)?',
    options: [
      '?search=keyword',
      '?q=keyword',
      '?query=keyword',
      'Все варианты используются'
    ],
    correctAnswer: 3,
    explanation: 'Общие паттерны: ?q, ?search, ?query для полнотекстового поиска.'
  },
  {
    question: 'Что такое sparse fieldsets в JSON:API?',
    options: [
      'Редкие поля',
      'Выбор возвращаемых полей (?fields[users]=name,email)',
      'Пустые поля',
      'Фильтрация записей'
    ],
    correctAnswer: 1,
    explanation: 'Sparse fieldsets позволяют клиенту запросить только нужные поля.'
  },
  {
    question: 'Как передать OR логику в фильтрах?',
    options: [
      'Невозможно в query params',
      '?name=John,Jane',
      '?or[name]=John&or[name]=Jane',
      'Зависит от API'
    ],
    correctAnswer: 3,
    explanation: 'Разные подходы: запятая для IN, специальный синтаксис, или POST с телом.'
  },
  {
    question: 'Следует ли поддерживать регистронезависимый поиск?',
    options: ['Нет', 'Да, по умолчанию', 'Опционально через параметр', 'Для текстовых полей'],
    correctAnswer: 2,
    explanation: 'Предложите опцию: ?name=john&caseSensitive=false для гибкости.'
  },
  {
    question: 'Что такое GraphQL-like фильтрация в REST?',
    options: [
      'Использование GraphQL',
      'Вложенные фильтры: ?where[user][name]=John',
      'Фильтры в теле POST',
      'Специальный язык'
    ],
    correctAnswer: 1,
    explanation: 'Некоторые REST API используют вложенную структуру похожую на GraphQL where.'
  },
  {
    question: 'Как реализовать фильтрацию по диапазону дат?',
    options: [
      '?date[from]=...&date[to]=...',
      '?startDate=...&endDate=...',
      '?date=start..end',
      'Все варианты'
    ],
    correctAnswer: 3,
    explanation: 'Выберите один подход и будьте консистентны во всем API.'
  },
  {
    question: 'Нужно ли валидировать комбинации фильтров?',
    options: ['Нет', 'Да, конфликтующие параметры', 'Только на фронтенде', 'Опционально'],
    correctAnswer: 1,
    explanation: 'Валидируйте логические конфликты: ?minPrice=100&maxPrice=50.'
  },
  {
    question: 'Что такое OData query syntax?',
    options: [
      'Object Data',
      'Open Data Protocol query стандарт',
      'Optimized Data',
      'Oracle Data'
    ],
    correctAnswer: 1,
    explanation: 'OData: $filter, $orderby, $top, $skip - стандартизированный синтаксис запросов.'
  },
  {
    question: 'Как обозначить сортировку по связанному ресурсу?',
    options: [
      '?sort=user.name',
      '?sort[user]=name',
      'Невозможно',
      'Оба варианта A и B'
    ],
    correctAnswer: 3,
    explanation: 'Точечная нотация или структурированные параметры для вложенной сортировки.'
  },
  {
    question: 'Следует ли ограничивать количество фильтров?',
    options: ['Нет', 'Да, для производительности', 'Только для публичных API', 'Опционально'],
    correctAnswer: 1,
    explanation: 'Слишком сложные фильтры могут замедлить БД, установите разумные лимиты.'
  },
  {
    question: 'Что вернуть если фильтр применен к несуществующему полю?',
    options: ['200 с пустым массивом', '400 Bad Request', 'Игнорировать параметр', '404 Not Found'],
    correctAnswer: 1,
    explanation: '400 Bad Request с указанием невалидного поля для предотвращения ошибок.'
  },
];

// ============= ADVANCED LEVEL =============

const apiNamingQuestions: QuestionData[] = [
  {
    question: 'Следует ли использовать множественное число для коллекций?',
    options: ['Нет, единственное', 'Да, множественное', 'Без разницы', 'Зависит от ресурса'],
    correctAnswer: 1,
    explanation: '/users (коллекция), /users/1 (элемент) - множественное число для консистентности.'
  },
  {
    question: 'Как правильно именовать составные слова в URL?',
    options: ['camelCase', 'snake_case', 'kebab-case', 'PascalCase'],
    correctAnswer: 2,
    explanation: 'kebab-case (/user-profiles) предпочтителен в URL, более читаем и SEO-friendly.'
  },
  {
    question: 'Следует ли использовать глаголы в REST API URL?',
    options: ['Да, для ясности', 'Нет, используйте существительные', 'Для действий', 'Только в RPC'],
    correctAnswer: 2,
    explanation: 'Существительные для ресурсов, глаголы только для действий не-CRUD: /users/1/activate.'
  },
  {
    question: 'Как правильно организовать вложенные ресурсы?',
    options: [
      '/posts/1/comments/2',
      '/comments/2',
      'Оба варианта валидны',
      'Максимум 2 уровня'
    ],
    correctAnswer: 2,
    explanation: 'Вложенность для связи (/posts/1/comments) и прямой доступ (/comments/2) оба полезны.'
  },
  {
    question: 'Следует ли использовать аббревиатуры в URL?',
    options: ['Да, для краткости', 'Нет, только полные слова', 'Для общепринятых терминов', 'По желанию'],
    correctAnswer: 2,
    explanation: 'Избегайте аббревиатур кроме общепринятых (api, id, url), используйте полные слова.'
  },
  {
    question: 'Что лучше: /users/1/delete или DELETE /users/1?',
    options: [
      'Первый вариант',
      'Второй вариант',
      'Оба одинаковы',
      'Первый для браузеров'
    ],
    correctAnswer: 1,
    explanation: 'DELETE /users/1 - RESTful подход, используйте HTTP методы, не URL.'
  },
  {
    question: 'Как именовать эндпоинт для множественных действий?',
    options: [
      '/users/bulk-delete',
      '/users/delete-many',
      '/batch/users/delete',
      'Нет стандарта'
    ],
    correctAnswer: 3,
    explanation: 'Разные конвенции: /bulk, /batch, /many - выберите одну и будьте консистентны.'
  },
  {
    question: 'Следует ли включать тип ресурса в ответе?',
    options: ['Нет', 'Да, для самодокументирования', 'Только для гетерогенных коллекций', 'Опционально'],
    correctAnswer: 1,
    explanation: 'type/kind поле помогает клиентам обрабатывать полиморфные ответы.'
  },
  {
    question: 'Как правильно именовать булевы поля?',
    options: ['is_active', 'active', 'hasAccess', 'Все варианты'],
    correctAnswer: 3,
    explanation: 'is/has префиксы или без них - выберите один стиль и будьте консистентны.'
  },
  {
    question: 'Что лучше: /api/v1/users или /v1/api/users?',
    options: ['Первый', 'Второй', 'Оба плохие', 'Без разницы'],
    correctAnswer: 0,
    explanation: '/api/v1/users - версия после базового пути, перед ресурсами.'
  },
  {
    question: 'Следует ли использовать ID в URL для синглтонов (/me, /settings)?',
    options: ['Да', 'Нет', 'Опционально', 'Для совместимости'],
    correctAnswer: 1,
    explanation: 'Синглтоны не нуждаются в ID: /me, /users/me/settings (не /settings/1).'
  },
  {
    question: 'Как именовать агрегированные данные?',
    options: [
      '/users/stats',
      '/statistics/users',
      '/users/aggregations',
      'Первый вариант'
    ],
    correctAnswer: 3,
    explanation: '/users/stats или /users/summary - подресурс коллекции для агрегаций.'
  },
  {
    question: 'Следует ли использовать расширения файлов (.json, .xml)?',
    options: ['Да', 'Нет, используйте Accept заголовок', 'Для обратной совместимости', 'По желанию'],
    correctAnswer: 1,
    explanation: 'Content negotiation через Accept заголовок более гибкий и RESTful.'
  },
  {
    question: 'Как правильно именовать временные endpoints?',
    options: [
      '/temp/...',
      '/preview/...',
      '/draft/...',
      'Зависит от семантики'
    ],
    correctAnswer: 3,
    explanation: 'Используйте семантичные имена: /drafts, /preview, /pending в зависимости от назначения.'
  },
  {
    question: 'Что лучше для поиска: /search?q=... или /users/search?q=...?',
    options: [
      'Первый для глобального поиска',
      'Второй для поиска в ресурсе',
      'Оба варианта валидны',
      'Все перечисленное'
    ],
    correctAnswer: 3,
    explanation: '/search для поиска по всем ресурсам, /users/search для поиска пользователей.'
  },
  {
    question: 'Следует ли использовать _ или - в URL?',
    options: ['Подчеркивание (_)', 'Дефис (-)', 'Без разницы', 'camelCase'],
    correctAnswer: 1,
    explanation: 'Дефис (kebab-case) более читаем в URL и не подчеркивается в браузерах.'
  },
  {
    question: 'Как именовать webhook endpoints?',
    options: ['/webhooks', '/callbacks', '/hooks', 'Все используются'],
    correctAnswer: 3,
    explanation: '/webhooks, /callbacks, /hooks - все распространены, выберите один термин.'
  },
  {
    question: 'Следует ли версионировать каждый endpoint отдельно?',
    options: ['Да', 'Нет, версионируйте весь API', 'Для больших изменений', 'Зависит от стратегии'],
    correctAnswer: 1,
    explanation: 'Единая версия API (/v1/) проще управляется, детальное версионирование сложнее.'
  },
  {
    question: 'Как именовать эндпоинты для экспорта/импорта?',
    options: [
      '/users/export, /users/import',
      '/export/users, /import/users',
      'POST /users/exports',
      'Первый вариант'
    ],
    correctAnswer: 3,
    explanation: '/users/export, /users/import - действия как подресурсы коллекции.'
  },
  {
    question: 'Что лучше: /user_profiles или /user-profiles?',
    options: ['snake_case', 'kebab-case', 'Оба плохие', 'Без разницы'],
    correctAnswer: 1,
    explanation: 'kebab-case (/user-profiles) стандарт для REST API URLs.'
  },
];

const versioningQuestions: QuestionData[] = [
  {
    question: 'Какие основные стратегии версионирования API?',
    options: [
      'URL, заголовок, query параметр',
      'Только URL',
      'Только заголовок',
      'Версия не нужна'
    ],
    correctAnswer: 0,
    explanation: 'URI (/v1/), заголовок (Accept: version=1), query (?version=1) - основные подходы.'
  },
  {
    question: 'Что такое semantic versioning (semver) для API?',
    options: [
      'Семантическое именование',
      'MAJOR.MINOR.PATCH (1.2.3)',
      'Версии по датам',
      'Случайные версии'
    ],
    correctAnswer: 1,
    explanation: 'Semver: MAJOR (breaking changes), MINOR (новые фичи), PATCH (баг-фиксы).'
  },
  {
    question: 'Где лучше указывать версию API?',
    options: ['В URL', 'В заголовке', 'В query параметре', 'Зависит от случая'],
    correctAnswer: 3,
    explanation: 'URL проще, заголовок чище, query удобнее для браузеров - нет единого правильного ответа.'
  },
  {
    question: 'Что такое header-based версионирование?',
    options: [
      'Версия в заголовке',
      'Accept: application/vnd.api+json; version=1',
      'X-API-Version: 1',
      'Все варианты'
    ],
    correctAnswer: 3,
    explanation: 'Версия в Accept заголовке (content negotiation) или кастомном заголовке.'
  },
  {
    question: 'Следует ли поддерживать несколько версий одновременно?',
    options: ['Нет', 'Да, минимум 2 версии', 'Да, для миграции', 'Бесконечно долго'],
    correctAnswer: 2,
    explanation: 'Поддерживайте старую версию достаточно долго для миграции клиентов.'
  },
  {
    question: 'Что такое deprecation policy?',
    options: [
      'Политика удаления',
      'План и сроки вывода из эксплуатации старых версий',
      'Документация об устаревших фичах',
      'Предупреждения'
    ],
    correctAnswer: 1,
    explanation: 'Deprecation policy определяет когда и как версии будут выведены из эксплуатации.'
  },
  {
    question: 'Какой заголовок использовать для предупреждения об устаревшей версии?',
    options: ['Warning', 'Deprecation', 'Sunset', 'Все перечисленное'],
    correctAnswer: 3,
    explanation: 'Warning (RFC 7234), Deprecation и Sunset заголовки информируют о deprecation.'
  },
  {
    question: 'Что такое URL-based версионирование?',
    options: [
      'Версия в домене',
      'Версия в пути (/v1/users)',
      'Версия в query',
      'Версия в fragment'
    ],
    correctAnswer: 1,
    explanation: 'Версия как часть пути: /api/v1/users - самый распространенный подход.'
  },
  {
    question: 'Следует ли версионировать с v0?',
    options: ['Нет, начинайте с v1', 'Да, для альфа/бета', 'Нет, используйте v1.0.0-alpha', 'Зависит от политики'],
    correctAnswer: 1,
    explanation: 'v0 для нестабильных версий, v1 для первого стабильного релиза.'
  },
  {
    question: 'Что такое calendar versioning для API?',
    options: [
      'Версии по датам',
      'YYYY-MM или YYYY.MM (2024.01)',
      'Ежегодные версии',
      'Все перечисленное'
    ],
    correctAnswer: 3,
    explanation: 'CalVer использует дату релиза: /api/2024-01/users, показывает когда версия выпущена.'
  },
  {
    question: 'Как долго поддерживать старую версию API?',
    options: ['6 месяцев', '1-2 года', 'Вечно', 'Зависит от пользователей'],
    correctAnswer: 3,
    explanation: 'Зависит от количества пользователей и критичности изменений, обычно 6-24 месяца.'
  },
  {
    question: 'Что такое evolutionary API design?',
    options: [
      'API развивается',
      'Обратная совместимость вместо версионирования',
      'Эволюционный подход',
      'Версии не нужны'
    ],
    correctAnswer: 1,
    explanation: 'Evolutionary design избегает breaking changes, добавляет фичи совместимо.'
  },
  {
    question: 'Нужно ли версионировать internal APIs?',
    options: ['Нет', 'Да, как и публичные', 'Опционально', 'Для микросервисов'],
    correctAnswer: 2,
    explanation: 'Зависит от количества клиентов и частоты изменений, но рекомендуется.'
  },
  {
    question: 'Что такое Sunset HTTP заголовок?',
    options: [
      'Время заката',
      'Дата прекращения поддержки API/ресурса',
      'Таймаут',
      'Окончание сессии'
    ],
    correctAnswer: 1,
    explanation: 'Sunset: Sat, 31 Dec 2024 23:59:59 GMT - указывает когда API/endpoint будет отключен.'
  },
  {
    question: 'Следует ли возвращать версию API в ответе?',
    options: ['Нет', 'Да, для отладки', 'В заголовке', 'Оба варианта B и C'],
    correctAnswer: 3,
    explanation: 'X-API-Version заголовок или поле в теле помогают отладке и мониторингу.'
  },
];

const hateoasQuestions: QuestionData[] = [
  {
    question: 'Что означает HATEOAS?',
    options: [
      'Hate Over API Security',
      'Hypermedia As The Engine Of Application State',
      'Hypertext Application Transfer',
      'HTTP Advanced Technology'
    ],
    correctAnswer: 1,
    explanation: 'HATEOAS - клиент взаимодействует с API через гипермедиа ссылки в ответах.'
  },
  {
    question: 'Какой уровень зрелости Richardson Maturity Model соответствует HATEOAS?',
    options: ['Уровень 0', 'Уровень 1', 'Уровень 2', 'Уровень 3'],
    correctAnswer: 3,
    explanation: 'Уровень 3 (HATEOAS) - полный REST с hypermedia controls.'
  },
  {
    question: 'Что такое hypermedia controls?',
    options: [
      'Мультимедиа контент',
      'Ссылки на доступные действия/ресурсы',
      'Контроллеры API',
      'Медиа заголовки'
    ],
    correctAnswer: 1,
    explanation: 'Links/actions в ответе показывают клиенту доступные переходы и операции.'
  },
  {
    question: 'Какой формат для HATEOAS ссылок используется в HAL?',
    options: [
      '_links',
      'links',
      'relations',
      'hrefs'
    ],
    correctAnswer: 0,
    explanation: 'HAL (Hypertext Application Language) использует _links объект для гипермедиа.'
  },
  {
    question: 'Что такое relation type (rel) в HATEOAS?',
    options: [
      'Тип отношения между ресурсами',
      'Релевантность',
      'Релиз версии',
      'Относительный путь'
    ],
    correctAnswer: 0,
    explanation: 'rel описывает семантику связи: "self", "next", "edit", "delete".'
  },
  {
    question: 'Зачем нужен HATEOAS?',
    options: [
      'Усложнить API',
      'Самодокументирование и loose coupling',
      'Для красоты',
      'Для SEO'
    ],
    correctAnswer: 1,
    explanation: 'HATEOAS делает API самодокументируемым, клиент не хардкодит URL.'
  },
  {
    question: 'Что такое HAL (Hypertext Application Language)?',
    options: [
      'HTTP Application Layer',
      'Стандарт для гипермедиа в JSON/XML',
      'Hardware Abstraction Layer',
      'Hypertext API Links'
    ],
    correctAnswer: 1,
    explanation: 'HAL - простой формат для включения гипермедиа в JSON: _links и _embedded.'
  },
  {
    question: 'Что такое JSON-LD в контексте HATEOAS?',
    options: [
      'JSON Limited Data',
      'JSON Linked Data (W3C стандарт)',
      'JSON Large Dataset',
      'JSON Lite Design'
    ],
    correctAnswer: 1,
    explanation: 'JSON-LD добавляет семантику и связи к JSON через @context.'
  },
  {
    question: 'Нужен ли HATEOAS для всех REST API?',
    options: ['Да, обязательно', 'Нет, опционально', 'Только для публичных', 'Только для сложных'],
    correctAnswer: 1,
    explanation: 'HATEOAS полезен для публичных API, но не обязателен для простых/internal API.'
  },
  {
    question: 'Что такое templated URLs в HATEOAS?',
    options: [
      'Шаблоны URL',
      'URL с параметрами: /users{?page,size}',
      'Предзаполненные URL',
      'URL генераторы'
    ],
    correctAnswer: 1,
    explanation: 'RFC 6570 URI Templates для параметризованных ссылок в HATEOAS.'
  },
  {
    question: 'Какой Content-Type для HAL JSON?',
    options: ['application/json', 'application/hal+json', 'application/vnd.hal+json', 'Оба B и C'],
    correctAnswer: 3,
    explanation: 'application/hal+json - стандартный, application/vnd.hal+json - vendor specific.'
  },
  {
    question: 'Что такое link relations registry (IANA)?',
    options: [
      'Регистр API',
      'Стандартизированные имена relation types',
      'База данных ссылок',
      'Регистрация доменов'
    ],
    correctAnswer: 1,
    explanation: 'IANA Link Relations - стандартные имена для rel: "next", "prev", "self".'
  },
  {
    question: 'Следует ли включать все возможные actions в HATEOAS?',
    options: ['Да, всегда', 'Нет, только доступные для текущего контекста', 'Только CRUD', 'Опционально'],
    correctAnswer: 1,
    explanation: 'Включайте только действия доступные в текущем состоянии и для текущего пользователя.'
  },
  {
    question: 'Что такое Siren hypermedia?',
    options: [
      'Сигнал API',
      'Спецификация для гипермедиа с entities, actions, links',
      'Сирена протокол',
      'Security Information'
    ],
    correctAnswer: 1,
    explanation: 'Siren - гипермедиа спецификация с поддержкой actions (forms) и подресурсов.'
  },
  {
    question: 'Увеличивает ли HATEOAS размер ответа?',
    options: ['Нет', 'Да, значительно', 'Да, но незначительно', 'Зависит от реализации'],
    correctAnswer: 2,
    explanation: 'HATEOAS добавляет ссылки, увеличивая размер, но это обычно приемлемо с gzip.'
  },
];

const httpCachingQuestions: QuestionData[] = [
  {
    question: 'Какой заголовок запрещает кеширование?',
    options: [
      'Cache-Control: no-cache',
      'Cache-Control: no-store',
      'Pragma: no-cache',
      'Все перечисленное'
    ],
    correctAnswer: 1,
    explanation: 'no-store полностью запрещает кеширование, no-cache требует ревалидацию.'
  },
  {
    question: 'Что означает Cache-Control: max-age=3600?',
    options: [
      'Кеш на 1 час',
      'Максимальный возраст 3600 лет',
      'Максимальный размер кеша',
      'Обновлять каждые 3600 секунд'
    ],
    correctAnswer: 0,
    explanation: 'max-age указывает время в секундах (3600 = 1 час) пока ресурс считается свежим.'
  },
  {
    question: 'Что такое ETag заголовок?',
    options: [
      'Электронный тег',
      'Идентификатор версии ресурса для условных запросов',
      'Тег кеша',
      'Уникальный тег'
    ],
    correctAnswer: 1,
    explanation: 'ETag - хеш или версия ресурса для валидации кеша через If-None-Match.'
  },
  {
    question: 'В чем разница между strong и weak ETag?',
    options: [
      'Сильный/слабый алгоритм',
      'Strong (точное совпадение), Weak (семантическое)',
      'Размер тега',
      'Время жизни'
    ],
    correctAnswer: 1,
    explanation: 'Strong ETag ("abc") - побайтовое совпадение, Weak (W/"abc") - семантически идентичен.'
  },
  {
    question: 'Какой статус возвращается при успешной валидации кеша?',
    options: ['200 OK', '204 No Content', '304 Not Modified', '412 Precondition Failed'],
    correctAnswer: 2,
    explanation: '304 Not Modified - кеш валиден, тело ответа не отправляется.'
  },
  {
    question: 'Что означает Cache-Control: private?',
    options: [
      'Приватный кеш',
      'Кешируется только браузером, не прокси',
      'Требуется авторизация',
      'Секретный кеш'
    ],
    correctAnswer: 1,
    explanation: 'private - только для браузера пользователя, shared caches (CDN, proxy) не должны кешировать.'
  },
  {
    question: 'Что такое Vary заголовок?',
    options: [
      'Вариации ответа',
      'Заголовки влияющие на кеш (Content-Encoding, Accept-Language)',
      'Переменный кеш',
      'Разные версии'
    ],
    correctAnswer: 1,
    explanation: 'Vary указывает какие заголовки запроса влияют на ответ для кеширования.'
  },
  {
    question: 'Какой заголовок использовать для условного GET с временем?',
    options: ['If-Modified-Since', 'If-Match', 'If-Range', 'Last-Modified'],
    correctAnswer: 0,
    explanation: 'If-Modified-Since проверяет изменился ли ресурс с указанной даты.'
  },
  {
    question: 'Что означает Cache-Control: must-revalidate?',
    options: [
      'Всегда проверять',
      'После истечения срока обязательно ревалидировать',
      'Требуется валидация',
      'Принудительное обновление'
    ],
    correctAnswer: 1,
    explanation: 'must-revalidate запрещает использовать stale кеш, требует ревалидацию.'
  },
  {
    question: 'Можно ли кешировать POST запросы?',
    options: ['Нет', 'Да, с явным Cache-Control', 'Да, всегда', 'Только в браузере'],
    correctAnswer: 1,
    explanation: 'POST может кешироваться если явно разрешено Cache-Control, но это редко используется.'
  },
  {
    question: 'Что такое stale-while-revalidate?',
    options: [
      'Устаревший кеш',
      'Отдавать устаревший кеш пока обновляется в фоне',
      'Стейл валидация',
      'Ревалидация истекших'
    ],
    correctAnswer: 1,
    explanation: 'stale-while-revalidate позволяет отдать кеш сразу, обновляя его асинхронно.'
  },
  {
    question: 'Что означает Cache-Control: immutable?',
    options: [
      'Неизменяемый',
      'Ресурс никогда не изменится, не ревалидировать',
      'Иммутабельный объект',
      'Постоянный кеш'
    ],
    correctAnswer: 1,
    explanation: 'immutable - ресурс не изменится, браузер не должен ревалидировать даже при refresh.'
  },
  {
    question: 'Какой заголовок ответа указывает время последнего изменения?',
    options: ['Last-Modified', 'Modified-Date', 'Updated-At', 'Date'],
    correctAnswer: 0,
    explanation: 'Last-Modified используется с If-Modified-Since для условных запросов.'
  },
  {
    question: 'Что такое CDN в контексте кеширования?',
    options: [
      'Content Delivery Network - распределенный кеш',
      'Central Data Network',
      'Cache Distribution Node',
      'Content Data Network'
    ],
    correctAnswer: 0,
    explanation: 'CDN кеширует контент географически близко к пользователям для скорости.'
  },
  {
    question: 'Следует ли кешировать аутентифицированные запросы?',
    options: ['Нет', 'Да, с Cache-Control: private', 'Да, с Vary: Authorization', 'Оба B и C'],
    correctAnswer: 3,
    explanation: 'private для браузера, Vary: Authorization чтобы CDN различали пользователей.'
  },
  {
    question: 'Что означает Cache-Control: s-maxage?',
    options: [
      'Секундный maxage',
      'Shared cache (CDN/proxy) maxage',
      'Server maxage',
      'Специальный maxage'
    ],
    correctAnswer: 1,
    explanation: 's-maxage переопределяет max-age для shared caches (CDN), не влияет на браузер.'
  },
  {
    question: 'Что такое cache invalidation?',
    options: [
      'Невалидный кеш',
      'Принудительное удаление/обновление кеша',
      'Проверка кеша',
      'Отключение кеша'
    ],
    correctAnswer: 1,
    explanation: 'Cache invalidation - удаление устаревших данных из кеша при изменении ресурса.'
  },
  {
    question: 'Какой заголовок для условного запроса с ETag?',
    options: ['If-Match', 'If-None-Match', 'Оба варианта', 'ETag-Match'],
    correctAnswer: 2,
    explanation: 'If-None-Match для GET (304 если совпал), If-Match для PUT (412 если не совпал).'
  },
  {
    question: 'Что такое Expires заголовок?',
    options: [
      'Истекает',
      'Абсолютная дата/время истечения кеша',
      'Срок действия',
      'Время жизни'
    ],
    correctAnswer: 1,
    explanation: 'Expires (HTTP/1.0) указывает точную дату, Cache-Control: max-age предпочтительнее.'
  },
  {
    question: 'Нужно ли добавлять версию в URL для cache busting?',
    options: ['Нет', 'Да, для статики (/app.js?v=1.2)', 'Только для CSS/JS', 'Для всех ресурсов'],
    correctAnswer: 1,
    explanation: 'Версия в query (?v=) или хеш в имени (app.abc123.js) для инвалидации кеша.'
  },
];

const rateLimitingQuestions: QuestionData[] = [
  {
    question: 'Какой заголовок указывает лимит запросов?',
    options: ['X-RateLimit-Limit', 'Rate-Limit', 'X-Limit', 'Нет стандарта'],
    correctAnswer: 0,
    explanation: 'X-RateLimit-Limit (де-факто стандарт) указывает максимум запросов в окне.'
  },
  {
    question: 'Какой статус код при превышении rate limit?',
    options: ['400 Bad Request', '403 Forbidden', '429 Too Many Requests', '503 Service Unavailable'],
    correctAnswer: 2,
    explanation: '429 Too Many Requests специально для rate limiting.'
  },
  {
    question: 'Что такое token bucket алгоритм?',
    options: [
      'Токены в ведре',
      'Алгоритм rate limiting с пополняемыми токенами',
      'Хранилище токенов',
      'Бакет для auth токенов'
    ],
    correctAnswer: 1,
    explanation: 'Token bucket добавляет токены с постоянной скоростью, запрос потребляет токен.'
  },
  {
    question: 'Что означает X-RateLimit-Remaining?',
    options: [
      'Оставшееся время',
      'Оставшиеся запросы в текущем окне',
      'Остаток лимита',
      'Количество ожидающих'
    ],
    correctAnswer: 1,
    explanation: 'X-RateLimit-Remaining показывает сколько запросов доступно до достижения лимита.'
  },
  {
    question: 'Что такое sliding window алгоритм?',
    options: [
      'Скользящее окно времени для rate limiting',
      'Движущееся окно',
      'Окно браузера',
      'Временной слайдер'
    ],
    correctAnswer: 0,
    explanation: 'Sliding window сглаживает rate limit, учитывая запросы в динамическом окне.'
  },
  {
    question: 'Какой заголовок указывает когда лимит сбросится?',
    options: ['X-RateLimit-Reset', 'Reset-Time', 'Retry-After', 'Оба A и C'],
    correctAnswer: 3,
    explanation: 'X-RateLimit-Reset (timestamp) и Retry-After (секунды) оба используются.'
  },
  {
    question: 'Что такое rate limiting по IP?',
    options: [
      'Лимит на IP адрес',
      'Ограничение запросов с одного IP',
      'IP блокировка',
      'Фильтр IP'
    ],
    correctAnswer: 1,
    explanation: 'Rate limit применяется к IP адресу, защита от атак и abuse.'
  },
  {
    question: 'Следует ли применять разные лимиты для разных endpoints?',
    options: ['Нет', 'Да, дорогие операции - ниже лимит', 'Одинаковые для всех', 'Опционально'],
    correctAnswer: 1,
    explanation: 'Тяжелые операции (поиск, экспорт) должны иметь более строгие лимиты.'
  },
  {
    question: 'Что такое burst rate limit?',
    options: [
      'Взрывной лимит',
      'Краткосрочный лимит для всплесков трафика',
      'Резервный лимит',
      'Максимальный лимит'
    ],
    correctAnswer: 1,
    explanation: 'Burst позволяет короткие всплески выше обычного rate, затем throttling.'
  },
  {
    question: 'Нужно ли информировать о rate limit в документации?',
    options: ['Нет', 'Да, обязательно', 'Только для публичных API', 'Опционально'],
    correctAnswer: 1,
    explanation: 'Клиенты должны знать лимиты чтобы правильно реализовать retry и backoff.'
  },
  {
    question: 'Что такое distributed rate limiting?',
    options: [
      'Распределенный лимит',
      'Rate limiting в распределенной системе (Redis)',
      'Лимит на микросервисы',
      'Глобальный лимит'
    ],
    correctAnswer: 1,
    explanation: 'Использование shared storage (Redis) для синхронизации лимитов между серверами.'
  },
  {
    question: 'Следует ли давать authenticated пользователям выше лимит?',
    options: ['Нет', 'Да', 'Только премиум', 'Одинаково для всех'],
    correctAnswer: 1,
    explanation: 'Аутентифицированные пользователи обычно получают выше лимиты чем анонимные.'
  },
  {
    question: 'Что такое leaky bucket алгоритм?',
    options: [
      'Дырявое ведро',
      'Алгоритм со стабильной скоростью обработки',
      'Утечка токенов',
      'Протекающий лимит'
    ],
    correctAnswer: 1,
    explanation: 'Leaky bucket обрабатывает запросы с постоянной скоростью, остальные в очередь или отбрасывает.'
  },
  {
    question: 'Как клиент должен обрабатывать 429 ответ?',
    options: [
      'Игнорировать',
      'Exponential backoff retry с Retry-After',
      'Немедленно повторить',
      'Отменить запрос'
    ],
    correctAnswer: 1,
    explanation: 'Клиент должен подождать Retry-After секунд, затем retry с exponential backoff.'
  },
  {
    question: 'Что такое quota в rate limiting?',
    options: [
      'Квота',
      'Долгосрочный лимит (месяц, год)',
      'Максимум запросов',
      'Резервация'
    ],
    correctAnswer: 1,
    explanation: 'Quota - лимит на длительный период (1000 запросов/месяц), в отличие от rate (10 запросов/минуту).'
  },
];

const batchingRequestsQuestions: QuestionData[] = [
  {
    question: 'Что такое batch request?',
    options: [
      'Пакетный запрос',
      'Несколько операций в одном HTTP запросе',
      'Групповой запрос',
      'Все перечисленное'
    ],
    correctAnswer: 3,
    explanation: 'Batching объединяет множество операций в один HTTP запрос для эффективности.'
  },
  {
    question: 'Какой Content-Type для multipart/mixed batch?',
    options: ['application/json', 'multipart/mixed', 'application/batch', 'multipart/batch'],
    correctAnswer: 1,
    explanation: 'multipart/mixed с boundary для разделения частей (OData, Google APIs).'
  },
  {
    question: 'Что такое JSON-RPC batch?',
    options: [
      'RPC батч',
      'Массив JSON-RPC запросов в одном POST',
      'Батч для JSON',
      'Удаленные вызовы'
    ],
    correctAnswer: 1,
    explanation: 'JSON-RPC позволяет отправить массив запросов [{method, params, id}, ...].'
  },
  {
    question: 'Следует ли прерывать batch при ошибке одной операции?',
    options: ['Да', 'Нет, обработать все', 'Зависит от флага', 'Оба варианта B и C'],
    correctAnswer: 3,
    explanation: 'Обычно продолжают обработку, но можно добавить опцию stopOnError.'
  },
  {
    question: 'Какой статус код возвращать для batch запроса?',
    options: ['200 OK всегда', '207 Multi-Status', 'Статус первой операции', 'Зависит от реализации'],
    correctAnswer: 3,
    explanation: '200 с индивидуальными статусами внутри, или 207 Multi-Status для явности.'
  },
  {
    question: 'Что такое GraphQL batching?',
    options: [
      'Батчинг графов',
      'Объединение множества GraphQL запросов',
      'Групповые мутации',
      'DataLoader паттерн'
    ],
    correctAnswer: 1,
    explanation: 'GraphQL позволяет множественные операции в одном запросе через aliases.'
  },
  {
    question: 'Нужно ли ограничивать размер batch?',
    options: ['Нет', 'Да, для защиты сервера', 'Только для публичных API', 'Опционально'],
    correctAnswer: 1,
    explanation: 'Лимит (например, max 100 операций) предотвращает перегрузку и таймауты.'
  },
  {
    question: 'Как обозначить зависимости между операциями в batch?',
    options: [
      'Невозможно',
      'Через ссылки на ID предыдущих операций',
      'Последовательный порядок',
      'Оба варианта B и C'
    ],
    correctAnswer: 3,
    explanation: 'Порядок выполнения или явные ссылки: {depends_on: ["op1", "op2"]}.'
  },
  {
    question: 'Что такое bulk operation?',
    options: [
      'Массовая операция',
      'Действие над множеством ресурсов (bulk delete)',
      'Большой запрос',
      'То же что batch'
    ],
    correctAnswer: 1,
    explanation: 'Bulk - одна операция над множеством ресурсов, batch - множество разных операций.'
  },
  {
    question: 'Следует ли делать batch транзакционным?',
    options: ['Да, всегда', 'Нет', 'Опционально через флаг', 'Для критичных операций'],
    correctAnswer: 2,
    explanation: 'Транзакционность полезна, но дорога, предложите как опцию: {atomic: true}.'
  },
  {
    question: 'Как обрабатывать частичный успех batch?',
    options: [
      'Вернуть ошибку',
      'Вернуть результаты успешных и ошибки для failed',
      'Откатить все',
      'Игнорировать ошибки'
    ],
    correctAnswer: 1,
    explanation: 'Вернуть массив с индивидуальными результатами/ошибками для каждой операции.'
  },
  {
    question: 'Что такое Facebook batch API?',
    options: [
      'API Facebook',
      'Батчинг через относительные URL в одном POST',
      'Social batching',
      'Batch для соцсетей'
    ],
    correctAnswer: 1,
    explanation: 'Facebook Graph API: POST /batch с массивом {method, relative_url}.'
  },
  {
    question: 'Нужно ли логировать каждую операцию в batch отдельно?',
    options: ['Нет', 'Да, для аудита', 'Только ошибки', 'Опционально'],
    correctAnswer: 1,
    explanation: 'Логируйте каждую операцию для полного audit trail и отладки.'
  },
  {
    question: 'Как реализовать batch GET запросов?',
    options: [
      'Невозможно',
      'POST /batch с массивом URL',
      'GET с query параметрами',
      'Множественные GET'
    ],
    correctAnswer: 1,
    explanation: 'GET должен быть idempotent, для batch используйте POST с телом.'
  },
  {
    question: 'Что возвращать если весь batch failed?',
    options: ['500 Internal Server Error', '400 Bad Request', '207 с ошибками', 'Зависит от причины'],
    correctAnswer: 3,
    explanation: 'Валидационная ошибка - 400, серверная ошибка - 500, частичный успех - 207.'
  },
];

async function main() {
  console.log('🌱 Adding remaining questions to existing tests...');

  // Intermediate tests
  await addQuestionsToTest('Статус коды: ошибки сервера', statusCodes5xxQuestions);
  await addQuestionsToTest('Authorization header', authorizationHeaderQuestions);
  await addQuestionsToTest('CRUD операции детально', crudOperationsQuestions);
  await addQuestionsToTest('Идемпотентность методов', idempotencyQuestions);
  await addQuestionsToTest('Pagination', paginationQuestions);
  await addQuestionsToTest('Фильтрация и сортировка', filteringSortingQuestions);

  // Advanced tests
  await addQuestionsToTest('REST API naming best practices', apiNamingQuestions);
  await addQuestionsToTest('Версионирование API', versioningQuestions);
  await addQuestionsToTest('HATEOAS принцип', hateoasQuestions);
  await addQuestionsToTest('HTTP кеширование', httpCachingQuestions);
  await addQuestionsToTest('Rate Limiting', rateLimitingQuestions);
  await addQuestionsToTest('Batching requests', batchingRequestsQuestions);

  console.log('🎉 Successfully added all remaining questions!');
  console.log('📊 Summary:');
  console.log('  Intermediate level: 6 tests completed');
  console.log('  Advanced level: 6 tests completed');
  console.log('  Total: 12 tests with all questions');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
