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

const CATEGORY = {
  name: 'HTML и CSS',
  slug: 'html-css',
  description:
    'Научитесь верстать современные интерфейсы: семантика HTML, формы, адаптивность, Flexbox и Grid. ' +
    'Закрепите знания тестами для frontend и всех IT-специалистов.',
  icon: '🎨'
};

const TAGS = ['frontend', 'fullstack', 'qa-engineer'];

const tests = [
  // HTML
  {
    title: 'HTML: основы и структура документа',
    description: 'DOCTYPE, html/head/body, базовые правила и структура страницы.',
    difficulty: 'beginner'
  },
  {
    title: 'HTML: текст и семантика',
    description: 'Заголовки, абзацы, inline-элементы и смысловые теги.',
    difficulty: 'beginner'
  },
  {
    title: 'HTML: ссылки и навигация',
    description: 'a, якоря, rel/target, навигационные блоки.',
    difficulty: 'beginner'
  },
  {
    title: 'HTML: списки и таблицы',
    description: 'ul/ol/dl, table, thead/tbody, корректная семантика.',
    difficulty: 'beginner'
  },
  {
    title: 'HTML5: семантическая разметка страницы',
    description: 'header/nav/main/section/article/aside/footer и логика блоков.',
    difficulty: 'beginner'
  },
  {
    title: 'HTML: изображения и медиа',
    description: 'img, picture/srcset, figure, audio/video и подписи.',
    difficulty: 'beginner'
  },
  {
    title: 'HTML: формы — основы',
    description: 'form, input types, label, textarea, select.',
    difficulty: 'beginner'
  },
  {
    title: 'HTML: формы — валидация и UX',
    description: 'required, pattern, autocomplete и базовые ошибки ввода.',
    difficulty: 'intermediate'
  },
  {
    title: 'HTML: доступность и ARIA основы',
    description: 'alt, label, роли и базовые aria-атрибуты.',
    difficulty: 'intermediate'
  },
  {
    title: 'HTML: метаданные и SEO',
    description: 'title, meta, Open Graph, robots и favicon.',
    difficulty: 'intermediate'
  },
  {
    title: 'HTML: best practices и типичные ошибки',
    description: 'Валидность, вложенность, читаемость и производительность.',
    difficulty: 'intermediate'
  },

  // CSS
  {
    title: 'CSS: подключение и базовый синтаксис',
    description: 'Подключение стилей, базовые правила и каскад.',
    difficulty: 'beginner'
  },
  {
    title: 'CSS: каскад, селекторы и специфичность',
    description: 'Селекторы, приоритеты, !important и порядок правил.',
    difficulty: 'beginner'
  },
  {
    title: 'CSS: наследование и единицы измерения',
    description: 'px/em/rem/%, vw/vh и inheritance.',
    difficulty: 'beginner'
  },
  {
    title: 'CSS: box model и box-sizing',
    description: 'margin/padding/border, размеры блоков и box-sizing.',
    difficulty: 'beginner'
  },
  {
    title: 'CSS: display, normal flow, visibility, overflow',
    description: 'Normal flow, block/inline/inline-block, скрытие и прокрутка.',
    difficulty: 'beginner'
  },
  {
    title: 'CSS: типографика',
    description: 'font-family, line-height, читаемость и ритм текста.',
    difficulty: 'beginner'
  },
  {
    title: 'CSS: цвета, фон и границы',
    description: 'Цвета, фоновые изображения, границы и тени.',
    difficulty: 'beginner'
  },
  {
    title: 'CSS: позиционирование и z-index',
    description: 'relative/absolute/fixed/sticky и контексты наложения.',
    difficulty: 'beginner'
  },
  {
    title: 'CSS: Flexbox',
    description: 'Одномерные раскладки и управление выравниванием.',
    difficulty: 'intermediate'
  },
  {
    title: 'CSS: Grid',
    description: 'Двумерные сетки и размещение элементов.',
    difficulty: 'intermediate'
  },
  {
    title: 'CSS: адаптивность и media queries',
    description: 'Breakpoints, responsive layout и базовые подходы.',
    difficulty: 'intermediate'
  },
  {
    title: 'CSS: псевдоклассы и псевдоэлементы',
    description: ':hover, :focus, ::before/::after и состояния UI.',
    difficulty: 'intermediate'
  },
  {
    title: 'CSS: трансформации и transitions',
    description: 'transform, transition и плавные эффекты.',
    difficulty: 'intermediate'
  },
  {
    title: 'CSS: анимации',
    description: '@keyframes, animation и контроль движений.',
    difficulty: 'intermediate'
  },
  {
    title: 'CSS: переменные и темы',
    description: 'CSS variables, :root и управление темами.',
    difficulty: 'intermediate'
  },
  {
    title: 'CSS: архитектура и организация стилей',
    description: 'БЭМ/utility-подходы и масштабирование стилей.',
    difficulty: 'advanced'
  }
];

async function createHtmlCssTests() {
  try {
    console.log('🚀 Создание коллекции тестов для категории "HTML и CSS"...\n');

    let category = await prisma.category.findUnique({
      where: { slug: CATEGORY.slug }
    });

    if (!category) {
      const maxOrder = await prisma.category.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
      });

      category = await prisma.category.create({
        data: {
          ...CATEGORY,
          order: (maxOrder?.order ?? 0) + 1
        }
      });
      console.log(`✅ Категория создана: ${category.name}`);
    } else {
      await prisma.category.update({
        where: { id: category.id },
        data: {
          name: CATEGORY.name,
          description: CATEGORY.description,
          icon: CATEGORY.icon
        }
      });
      console.log(`✅ Категория обновлена: ${category.name}`);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let linkedCount = 0;

    for (let i = 0; i < tests.length; i++) {
      const testData = tests[i];

      let test = await prisma.test.findFirst({
        where: { title: testData.title }
      });

      if (!test) {
        test = await prisma.test.create({
          data: {
            title: testData.title,
            description: testData.description,
            difficulty: testData.difficulty,
            tags: TAGS
          }
        });
        createdCount++;
      } else {
        await prisma.test.update({
          where: { id: test.id },
          data: {
            description: testData.description,
            difficulty: testData.difficulty,
            tags: TAGS
          }
        });
        updatedCount++;
      }

      const order = i + 1;
      const existingLink = await prisma.categoryTest.findFirst({
        where: { categoryId: category.id, testId: test.id }
      });

      if (!existingLink) {
        await prisma.categoryTest.create({
          data: {
            categoryId: category.id,
            testId: test.id,
            order
          }
        });
      } else if (existingLink.order !== order) {
        await prisma.categoryTest.update({
          where: { id: existingLink.id },
          data: { order }
        });
      }

      linkedCount++;
    }

    console.log(`✅ Создано тестов: ${createdCount}`);
    console.log(`✅ Обновлено тестов: ${updatedCount}`);
    console.log(`✅ Привязано тестов к категории: ${linkedCount}`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createHtmlCssTests();
