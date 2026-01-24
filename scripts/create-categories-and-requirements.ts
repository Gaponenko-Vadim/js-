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

const requirementsTests = [
  // BEGINNER LEVEL
  {
    title: 'Основы требований: Что такое требования к ПО',
    description: 'Введение в требования к программному обеспечению: определения, типы, зачем нужны, роль аналитика в процессе разработки.',
    difficulty: 'beginner',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'frontend', 'fullstack'],
  },
  {
    title: 'Функциональные требования: Основы',
    description: 'Что такое функциональные требования (FR), как их описывать, примеры, различия между user stories и use cases.',
    difficulty: 'beginner',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Нефункциональные требования: Введение',
    description: 'Введение в нефункциональные требования (NFR): производительность, безопасность, usability, scalability и другие категории.',
    difficulty: 'beginner',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'User Stories: Написание пользовательских историй',
    description: 'Формат пользовательских историй "As a...I want...So that", INVEST критерии, Acceptance Criteria, работа с backlog.',
    difficulty: 'beginner',
    tags: ['system-analyst', 'qa-engineer', 'frontend', 'backend', 'fullstack'],
  },
  {
    title: 'Use Cases: Сценарии использования',
    description: 'Структура use case, actors, preconditions, postconditions, основной и альтернативные сценарии использования системы.',
    difficulty: 'beginner',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Сбор требований: Методы и техники',
    description: 'Техники сбора требований: интервью, workshops, наблюдение, анкетирование, brainstorming, анализ документов.',
    difficulty: 'beginner',
    tags: ['system-analyst', 'qa-engineer'],
  },
  {
    title: 'Приоритизация требований: MoSCoW, Kano, Value vs Effort',
    description: 'Методы приоритизации: MoSCoW (Must/Should/Could/Won\'t), Kano model, Value vs Effort matrix, работа с backlog.',
    difficulty: 'beginner',
    tags: ['system-analyst', 'qa-engineer'],
  },

  // INTERMEDIATE LEVEL
  {
    title: 'Требования к производительности (Performance Requirements)',
    description: 'Response time, throughput, latency, load capacity, benchmarking, метрики производительности и их измерение.',
    difficulty: 'intermediate',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Требования к безопасности (Security Requirements)',
    description: 'Аутентификация, авторизация, шифрование данных, OWASP Top 10, data protection, безопасное хранение паролей.',
    difficulty: 'intermediate',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Требования к масштабируемости и надежности',
    description: 'Horizontal и vertical scaling, availability (99.9%, 99.99%), failover, disaster recovery, fault tolerance.',
    difficulty: 'intermediate',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Требования к UI/UX и Usability',
    description: 'Accessibility (WCAG), responsiveness, user flow, UI patterns, consistency, юзабилити тестирование.',
    difficulty: 'intermediate',
    tags: ['system-analyst', 'qa-engineer', 'frontend', 'fullstack'],
  },
  {
    title: 'Бизнес-требования и бизнес-логика',
    description: 'Business rules, workflows, domain logic, бизнес-ограничения, моделирование бизнес-процессов.',
    difficulty: 'intermediate',
    tags: ['system-analyst', 'backend', 'fullstack'],
  },
  {
    title: 'Требования к интеграциям и API',
    description: 'API contracts, интеграция с третьими сторонами, webhooks, синхронные vs асинхронные интеграции, error handling.',
    difficulty: 'intermediate',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Документирование требований: SRS, BRD, FRD',
    description: 'Software Requirements Specification, Business Requirements Document, Functional Requirements Document, форматы и стандарты.',
    difficulty: 'intermediate',
    tags: ['system-analyst', 'qa-engineer'],
  },
  {
    title: 'Валидация и верификация требований',
    description: 'Validation vs verification, review процессы, трассируемость требований, acceptance testing.',
    difficulty: 'intermediate',
    tags: ['system-analyst', 'qa-engineer'],
  },

  // ADVANCED LEVEL
  {
    title: 'Управление изменениями требований (Change Management)',
    description: 'Impact analysis, версионирование требований, change request процесс, управление scope creep.',
    difficulty: 'advanced',
    tags: ['system-analyst', 'qa-engineer'],
  },
  {
    title: 'Конфликты и неоднозначности в требованиях',
    description: 'Выявление противоречий, неполноты, двусмысленности в требованиях, методы разрешения конфликтов.',
    difficulty: 'advanced',
    tags: ['system-analyst', 'qa-engineer'],
  },
  {
    title: 'Требования в Agile и Waterfall',
    description: 'Backlog grooming, refinement, epic/story/task иерархия, sprint planning, различия в подходах к требованиям.',
    difficulty: 'advanced',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Нефункциональные требования: Production-ready системы',
    description: 'Observability, monitoring, logging, alerting, deployment strategies, rollback, health checks.',
    difficulty: 'advanced',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Compliance и регуляторные требования',
    description: 'GDPR, HIPAA, PCI DSS, SOC 2, audit trails, data retention, соответствие законодательным требованиям.',
    difficulty: 'advanced',
    tags: ['system-analyst', 'qa-engineer', 'backend', 'fullstack'],
  },
  {
    title: 'Архитектурные требования и ограничения',
    description: 'Architectural constraints, technical debt, platform requirements, выбор технологического стека, trade-offs.',
    difficulty: 'advanced',
    tags: ['system-analyst', 'backend', 'fullstack'],
  },
  {
    title: 'Трассируемость требований: Requirements Traceability Matrix',
    description: 'RTM, связь requirements → design → code → tests, coverage анализ, отслеживание реализации.',
    difficulty: 'advanced',
    tags: ['system-analyst', 'qa-engineer'],
  },
];

async function createCategoriesAndRequirements() {
  console.log('🚀 Создание категорий и тестов по требованиям...\n');

  try {
    // ======================================================================
    // ШАГ 1: СОЗДАНИЕ КАТЕГОРИЙ
    // ======================================================================
    console.log('📁 ШАГ 1: Создание категорий');
    console.log('═'.repeat(70));

    // Создаем категорию REST API
    let restApiCategory = await prisma.category.findUnique({
      where: { slug: 'rest-api' },
    });

    if (!restApiCategory) {
      restApiCategory = await prisma.category.create({
        data: {
          name: 'REST API',
          slug: 'rest-api',
          description: 'Тесты по REST API: HTTP методы, статус коды, авторизация, проектирование API',
          icon: '🌐',
          order: 1,
        },
      });
      console.log('✅ Категория "REST API" создана');
    } else {
      console.log('⚠️  Категория "REST API" уже существует');
    }

    // Создаем категорию Requirements
    let requirementsCategory = await prisma.category.findUnique({
      where: { slug: 'requirements' },
    });

    if (!requirementsCategory) {
      requirementsCategory = await prisma.category.create({
        data: {
          name: 'Требования к ПО',
          slug: 'requirements',
          description: 'Функциональные и нефункциональные требования, User Stories, Use Cases, документирование',
          icon: '📋',
          order: 2,
        },
      });
      console.log('✅ Категория "Требования к ПО" создана');
    } else {
      console.log('⚠️  Категория "Требования к ПО" уже существует');
    }

    // ======================================================================
    // ШАГ 2: ПРИВЯЗКА СУЩЕСТВУЮЩИХ ТЕСТОВ К REST API
    // ======================================================================
    console.log('\n📦 ШАГ 2: Привязка существующих тестов к категории REST API');
    console.log('═'.repeat(70));

    const existingTests = await prisma.test.findMany({
      where: { categoryId: null },
    });

    console.log(`   Найдено тестов без категории: ${existingTests.length}`);

    for (const test of existingTests) {
      await prisma.test.update({
        where: { id: test.id },
        data: { categoryId: restApiCategory.id },
      });
    }

    console.log(`✅ ${existingTests.length} тестов привязаны к категории "REST API"`);

    // ======================================================================
    // ШАГ 3: СОЗДАНИЕ ТЕСТОВ ПО ТРЕБОВАНИЯМ
    // ======================================================================
    console.log('\n📝 ШАГ 3: Создание тестов по требованиям (пустые, без вопросов)');
    console.log('═'.repeat(70));

    let createdCount = 0;
    let skippedCount = 0;

    for (const testData of requirementsTests) {
      const existing = await prisma.test.findFirst({
        where: { title: testData.title },
      });

      if (existing) {
        console.log(`   ⚠️  "${testData.title}" - уже существует, пропускаем`);
        skippedCount++;
        continue;
      }

      await prisma.test.create({
        data: {
          ...testData,
          categoryId: requirementsCategory.id,
        },
      });

      console.log(`   ✅ "${testData.title}" - создан`);
      createdCount++;
    }

    console.log(`\n✅ Создано новых тестов: ${createdCount}`);
    console.log(`⚠️  Пропущено (уже существуют): ${skippedCount}`);

    // ======================================================================
    // ИТОГОВАЯ СТАТИСТИКА
    // ======================================================================
    console.log('\n' + '═'.repeat(70));
    console.log('📊 ИТОГОВАЯ СТАТИСТИКА');
    console.log('═'.repeat(70));

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { tests: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    categories.forEach((category) => {
      console.log(`\n${category.icon} ${category.name} (${category.slug})`);
      console.log(`   Тестов: ${category._count.tests}`);
      console.log(`   Описание: ${category.description}`);
    });

    // Статистика по уровням для Requirements
    console.log('\n📈 Детальная статистика категории "Требования к ПО":');
    const reqTests = await prisma.test.findMany({
      where: { categoryId: requirementsCategory.id },
    });

    const beginnerCount = reqTests.filter((t) => t.difficulty === 'beginner').length;
    const intermediateCount = reqTests.filter((t) => t.difficulty === 'intermediate').length;
    const advancedCount = reqTests.filter((t) => t.difficulty === 'advanced').length;

    console.log(`   📚 Beginner: ${beginnerCount} тестов`);
    console.log(`   📖 Intermediate: ${intermediateCount} тестов`);
    console.log(`   🎓 Advanced: ${advancedCount} тестов`);
    console.log(`   📊 Всего: ${reqTests.length} тестов`);

    // Статистика по профессиям
    console.log('\n👥 Покрытие по профессиям:');
    const professions = ['system-analyst', 'qa-engineer', 'frontend', 'backend', 'fullstack'];
    professions.forEach((prof) => {
      const count = reqTests.filter((t) => t.tags.includes(prof)).length;
      const icon = prof === 'system-analyst' ? '📊' : prof === 'qa-engineer' ? '🧪' : prof === 'frontend' ? '💻' : prof === 'backend' ? '⚙️' : '🌐';
      console.log(`   ${icon} ${prof}: ${count} тестов`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createCategoriesAndRequirements()
  .then(() => {
    console.log('\n🎉 Готово! Категории и тесты созданы.');
    console.log('\n💡 Следующий шаг: Добавить вопросы к тестам по требованиям');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка:', error);
    process.exit(1);
  });
