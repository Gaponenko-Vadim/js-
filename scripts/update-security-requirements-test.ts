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

const TEST_TITLE = 'Требования к безопасности (Security Requirements)';
const TEST_DESCRIPTION = 'Базовые требования безопасности: защита данных, доступы, риски и практики.';
const TEST_DIFFICULTY = 'intermediate';
const TEST_TAGS = ['system-analyst', 'qa-engineer', 'frontend', 'backend', 'fullstack'];

const questions = [
  {
    question: 'Что такое требования к безопасности (Security Requirements)?',
    options: [
      'Общие пожелания о надежности без критериев проверки и измерений',
      'Измеримые правила защиты данных, пользователей и системы от угроз',
      'Описание интерфейса и визуального стиля продукта для команды',
      'Список библиотек и технологий, которые планирует использовать команда'
    ],
    correctAnswer: 1,
    explanation: 'Security requirements — это измеримые и проверяемые правила защиты системы.'
  },
  {
    question: 'Зачем формализуют security requirements?',
    options: [
      'Чтобы заранее договориться о защите и проверить ее на тестах',
      'Чтобы заменить архитектуру и не заниматься анализом угроз',
      'Чтобы ускорить разработку за счет удаления мер безопасности',
      'Чтобы описать только функциональные требования без ограничений'
    ],
    correctAnswer: 0,
    explanation: 'Формализация делает безопасность проверяемой и снижает риск ошибок.'
  },
  {
    question: 'Что означает Integrity в CIA triad?',
    options: [
      'Данные нельзя незаметно изменить, целостность сохраняется',
      'Система всегда доступна без простоев и сбоев',
      'Доступ к данным есть у всех пользователей без ограничений',
      'Данные можно читать без шифрования внутри компании'
    ],
    correctAnswer: 0,
    explanation: 'Integrity отвечает за неизменность и корректность данных.'
  },
  {
    question: 'Уязвимость — это...',
    options: [
      'Слабое место системы, через которое возможна атака',
      'Потенциальный злоумышленник, который атакует сервис',
      'Вероятность ущерба, умноженная на масштаб последствий',
      'Правило шифрования, которое защищает канал связи'
    ],
    correctAnswer: 0,
    explanation: 'Уязвимость — это слабое место, через которое возможна атака.'
  },
  {
    question: 'Чем отличается authentication от authorization?',
    options: [
      'Authentication подтверждает личность, authorization определяет права доступа',
      'Authentication выдает права, authorization проверяет пароль пользователя',
      'Authentication нужна только администраторам, authorization только гостям',
      'Authentication и authorization — одно и то же, разница только в названии'
    ],
    correctAnswer: 0,
    explanation: 'Authentication отвечает на «кто ты», authorization — «что тебе можно».'
  },
  {
    question: 'Principle of Least Privilege означает, что...',
    options: [
      'Пользователь получает минимум прав, достаточный для своей задачи',
      'Пользователь получает максимум прав для ускорения работы',
      'Права расширяются автоматически со временем без подтверждения',
      'Минимальные права нужны только в тестовой среде'
    ],
    correctAnswer: 0,
    explanation: 'Least Privilege — это минимальные права, необходимые для задач.'
  },
  {
    question: 'Зачем вводят MFA?',
    options: [
      'Снижает риск взлома даже при утечке или угадывании пароля',
      'Ускоряет вход, потому что сокращает количество проверок',
      'Заменяет логирование действий и делает его ненужным',
      'Позволяет хранить пароли в открытом виде без риска'
    ],
    correctAnswer: 0,
    explanation: 'MFA снижает риск взлома при утечке пароля.'
  },
  {
    question: 'Когда уместно step-up MFA?',
    options: [
      'Для рискованных действий или входа с нового устройства',
      'Только для публичных страниц, где нет личных данных',
      'Всегда для любых запросов, включая чтение контента',
      'Только при регистрации, потом MFA не используется'
    ],
    correctAnswer: 0,
    explanation: 'Step-up MFA применяется для рискованных действий или новых устройств.'
  },
  {
    question: 'Какое требование корректно для токенов и сессий?',
    options: [
      'Access token короткий, refresh token отзывной и имеет срок жизни',
      'Токены бессрочные, чтобы пользователю не нужно входить повторно',
      'Сессии нельзя отзывать, иначе нарушится стабильность системы',
      'Длительность токенов не важна, если есть HTTPS'
    ],
    correctAnswer: 0,
    explanation: 'Токены должны иметь срок жизни и возможность отзыва.'
  },
  {
    question: 'Что верно про JWT?',
    options: [
      'JWT подписан, но не шифрует данные и не хранит секреты',
      'JWT всегда шифрует данные и безопасен для паролей',
      'JWT нужен только для кэширования ответов сервера',
      'JWT заменяет необходимость авторизации по ролям'
    ],
    correctAnswer: 0,
    explanation: 'JWT подписан, но не шифрует данные, поэтому секреты в нем не хранят.'
  },
  {
    question: 'Для чего используют OAuth 2.0?',
    options: [
      'Делегировать авторизацию без передачи пароля приложению',
      'Хранить пароли пользователей в зашифрованном виде',
      'Заменить TLS и шифровать трафик между браузером и сервером',
      'Сделать все API запросы анонимными по умолчанию'
    ],
    correctAnswer: 0,
    explanation: 'OAuth 2.0 позволяет делегировать доступ без передачи пароля.'
  },
  {
    question: 'Как правильно хранить пароли?',
    options: [
      'Хешировать bcrypt/Argon2id с солью, без возможности восстановления',
      'Шифровать обратимо, чтобы можно было восстановить пароль',
      'Хранить в открытом виде внутри защищенной сети компании',
      'Использовать один общий хеш для всех пользователей'
    ],
    correctAnswer: 0,
    explanation: 'Пароли хранятся как хеши с солью, без возможности восстановления.'
  },
  {
    question: 'Разработчик говорит, что bcrypt слишком медленный. Что делать?',
    options: [
      'Измерить нагрузку, подобрать cost или Argon2id и зафиксировать метрики',
      'Убрать хеширование, чтобы вход работал быстрее',
      'Хранить пароли в базе в открытом виде временно',
      'Оставить настройки без изменений и игнорировать проблему'
    ],
    correctAnswer: 0,
    explanation: 'Нужно подобрать параметры хеша под метрики, не убирая защиту.'
  },
  {
    question: 'Что верно про шифрование in transit и at rest?',
    options: [
      'In transit защищает канал, at rest защищает хранение данных',
      'In transit применяется только к паролям, at rest к логам',
      'At rest шифрует сетевой трафик, in transit хранение',
      'Шифрование нужно только на диске, сеть можно не защищать'
    ],
    correctAnswer: 0,
    explanation: 'In transit защищает передачу, at rest — хранение данных.'
  },
  {
    question: 'Как корректно сформулировать требование к каналу передачи?',
    options: [
      'Передача данных только по TLS 1.2+ с запретом HTTP',
      'Использовать SSL, когда получится, без обязательной версии',
      'Разрешить HTTP внутри сети, внешний трафик не важен',
      'Шифровать только при регистрации, остальные запросы можно без TLS'
    ],
    correctAnswer: 0,
    explanation: 'Требование должно быть конкретным: TLS версии и запрет HTTP.'
  },
  {
    question: 'Зачем используют OWASP Top 10?',
    options: [
      'Чтобы не забыть типовые классы уязвимостей и покрыть их',
      'Чтобы выбрать цветовую схему интерфейса для продукта',
      'Чтобы заменить threat modeling и не анализировать угрозы',
      'Чтобы определить технологический стек для разработки'
    ],
    correctAnswer: 0,
    explanation: 'OWASP Top 10 помогает покрыть наиболее частые уязвимости.'
  },
  {
    question: 'Лучшее требование против SQL Injection?',
    options: [
      'Все запросы к БД через параметризованные запросы или ORM',
      'Запретить пробелы в пользовательских полях ввода',
      'Скрыть сообщения об ошибках и ничего не менять',
      'Разрешить только короткие строки длиной до 20 символов'
    ],
    correctAnswer: 0,
    explanation: 'Параметризованные запросы исключают подстановку кода в SQL.'
  },
  {
    question: 'Что лучше всего защищает от XSS?',
    options: [
      'Экранирование вывода и CSP, запрещающая inline-скрипты',
      'Шифрование данных в базе и ротация ключей',
      'Проверка длины URL и фильтрация IP адресов',
      'Ограничение количества запросов в минуту для пользователей'
    ],
    correctAnswer: 0,
    explanation: 'XSS предотвращают экранированием и строгой CSP.'
  },
  {
    question: 'Какое требование помогает защититься от CSRF?',
    options: [
      'CSRF-токены и sameSite cookies для state-changing запросов',
      'JWT с длинным сроком жизни и хранение в localStorage',
      'Отключение всех форм и POST запросов в приложении',
      'Использование только GET запросов для изменения данных'
    ],
    correctAnswer: 0,
    explanation: 'CSRF закрывают токенами и настройкой cookies.'
  },
  {
    question: 'Что является Security Misconfiguration?',
    options: [
      'Дефолтные пароли и открытая админка без ограничений',
      'Параметризованные запросы и роли доступа',
      'Шифрование PII и TLS для всех запросов',
      'Логирование критичных действий и аудит доступа'
    ],
    correctAnswer: 0,
    explanation: 'Security Misconfiguration — это ошибки конфигурации и дефолтные настройки.'
  },
  {
    question: 'Зачем нужны Security Headers?',
    options: [
      'Задать правила браузеру и снизить риск XSS и clickjacking',
      'Шифровать данные в базе вместо TLS и других мер',
      'Ускорить работу API, отключив лишние проверки',
      'Заменить аутентификацию и авторизацию одним механизмом'
    ],
    correctAnswer: 0,
    explanation: 'Security headers ограничивают поведение браузера и снижают риски.'
  },
  {
    question: 'Для чего используют rate limiting?',
    options: [
      'Ограничить частоту запросов и снизить риск брутфорса и DoS',
      'Увеличить количество запросов без контроля ролей',
      'Заменить MFA и другие меры контроля доступа',
      'Сделать запросы быстрее за счет отключения логов'
    ],
    correctAnswer: 0,
    explanation: 'Rate limiting защищает от злоупотреблений и перегрузки.'
  },
  {
    question: 'Что верно про audit logs?',
    options: [
      'Неизменяемые логи критичных действий для расследований и комплаенса',
      'Логи нужны только разработчикам и не связаны с безопасностью',
      'Логи можно свободно изменять, чтобы исправлять ошибки',
      'Логировать нужно только успешные действия, ошибки не важны'
    ],
    correctAnswer: 0,
    explanation: 'Audit logs должны быть неизменяемыми и храниться для расследований.'
  },
  {
    question: 'Зачем нужен threat modeling?',
    options: [
      'Чтобы выявить угрозы и превратить их в требования безопасности',
      'Чтобы заменить тестирование и не проводить проверки',
      'Чтобы выбрать технологический стек для команды',
      'Чтобы описать дизайн интерфейса и сценарии UI'
    ],
    correctAnswer: 0,
    explanation: 'Threat modeling помогает выявлять угрозы и формализовать требования.'
  },
  {
    question: 'Чем отличается penetration testing от vulnerability scanning?',
    options: [
      'Pen test — ручная атака, scanning — автоматический поиск уязвимостей',
      'Pen test выполняется пользователями, scanning — только менеджерами',
      'Pen test проверяет UX, scanning проверяет производительность',
      'Pen test заменяет аудит логов, scanning заменяет threat modeling'
    ],
    correctAnswer: 0,
    explanation: 'Pen test — ручная имитация атаки, scanning — автоматический поиск.'
  },
  {
    question: 'Что означает SSDLC?',
    options: [
      'Интеграцию безопасности во все этапы разработки и релиза',
      'Разовую проверку безопасности только перед запуском',
      'Процесс ускорения разработки путем отключения проверок',
      'Набор правил только для мобильных приложений'
    ],
    correctAnswer: 0,
    explanation: 'SSDLC означает безопасность на всех этапах разработки.'
  },
  {
    question: 'Какая формулировка делает требование тестируемым?',
    options: [
      'Пароль минимум 12 символов, 1 цифра, 1 спецсимвол, проверка валидатором',
      'Пароль должен быть надежным и достаточно сложным',
      'Пароль должен понравиться команде и быть удобным',
      'Пароль выбирается разработчиком без критериев'
    ],
    correctAnswer: 0,
    explanation: 'Тестируемые требования всегда содержат измеримые критерии.'
  },
  {
    question: 'Как корректно описать data retention?',
    options: [
      'PII удаляется через 24 месяца после активности, audit-логи 90 дней',
      'Данные хранятся всегда, чтобы удобнее анализировать поведение',
      'Срок хранения не нужен, удаляем по желанию пользователя',
      'Удаляем все данные сразу после регистрации'
    ],
    correctAnswer: 0,
    explanation: 'Data retention должно содержать сроки и критерии удаления.'
  },
  {
    question: 'Что означает принцип Zero Trust?',
    options: [
      'Не доверять по умолчанию и проверять каждый запрос независимо от сети',
      'Доверять всем внутри периметра и отключить проверки',
      'Разрешить доступ один раз и больше не пересматривать права',
      'Использовать только VPN, остальные меры не нужны'
    ],
    correctAnswer: 0,
    explanation: 'Zero Trust означает проверку каждого запроса без доверия по сети.'
  },
  {
    question: 'Как приоритизировать security requirements при ограниченном бюджете?',
    options: [
      'Сначала обязательные нормы и критичные риски, остальное в бэклог',
      'Сначала удобные функции, безопасность позже после релиза',
      'Сделать всё Must Have, чтобы избежать обсуждений',
      'Закрыть только косметику и отложить безопасность на потом'
    ],
    correctAnswer: 0,
    explanation: 'В приоритете обязательные нормы и критичные риски.'
  }
];

async function updateSecurityRequirementsTest() {
  try {
    console.log(`🚀 Создание вопросов для теста "${TEST_TITLE}"...\n`);

    let test = await prisma.test.findFirst({
      where: { title: TEST_TITLE }
    });

    if (!test) {
      test = await prisma.test.create({
        data: {
          title: TEST_TITLE,
          description: TEST_DESCRIPTION,
          difficulty: TEST_DIFFICULTY,
          tags: TEST_TAGS
        }
      });
      console.log(`✅ Тест создан: ${test.title}`);
    } else {
      await prisma.test.update({
        where: { id: test.id },
        data: {
          description: TEST_DESCRIPTION,
          difficulty: TEST_DIFFICULTY,
          tags: TEST_TAGS
        }
      });
      console.log(`✅ Тест обновлен: ${test.title}`);
    }

    const lecture = await prisma.lecture.findFirst({
      where: { title: TEST_TITLE },
      orderBy: { createdAt: 'desc' }
    });

    if (!lecture) {
      throw new Error('Лекция не найдена. Сначала создайте лекцию.');
    }

    const existingLinks = await prisma.testQuestion.findMany({
      where: { testId: test.id }
    });

    const oldQuestionIds = existingLinks.map((link) => link.questionId);

    await prisma.testQuestion.deleteMany({
      where: { testId: test.id }
    });

    for (const questionId of oldQuestionIds) {
      const usageCount = await prisma.testQuestion.count({
        where: { questionId }
      });
      if (usageCount === 0) {
        await prisma.question.delete({ where: { id: questionId } });
      }
    }

    let createdCount = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      const newQuestion = await prisma.question.create({
        data: {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          lectureId: lecture.id
        }
      });

      await prisma.testQuestion.create({
        data: {
          testId: test.id,
          questionId: newQuestion.id,
          order: i + 1
        }
      });

      createdCount++;
    }

    console.log(`✅ Вопросов создано: ${createdCount}`);
    console.log(`📌 Тест: ${test.title}`);
    console.log(`📚 Лекция: ${lecture.id}`);
    console.log(`📊 Итого вопросов в тесте: ${await prisma.testQuestion.count({ where: { testId: test.id } })}`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateSecurityRequirementsTest();
