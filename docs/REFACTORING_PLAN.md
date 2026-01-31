# 🏗️ План рефакторинга REST API Trainer

**Версия:** 2.0 (Обновлено)
**Дата обновления:** 2026-01-27
**Статус:** 🚀 В процессе выполнения
**Цель:** Завершить оставшиеся фазы: SEO, PWA, Performance, расширение Component Library

---

## ✅ Что уже выполнено (Фазы 0-4)

### ✅ Phase 0: Подготовка (ЗАВЕРШЕНО)
- ✅ Создана система Design Tokens (`src/styles/tokens.scss`)
- ✅ Созданы глобальные SCSS утилиты (`src/styles/utilities.scss`)
- ✅ Настроена feature-based структура (`src/features/`)
- ✅ Создан Auth Middleware (`src/shared/api/middleware/authMiddleware.ts`)

### ✅ Phase 1: Архитектура и декомпозиция (ЗАВЕРШЕНО)
- ✅ Feature-based структура полностью реализована
- ✅ Разбиты монолитные компоненты:
  - `tests/[id]/page.tsx`: 669 → 302 строки (-55%)
  - `combined-test`: 703 → 293 строки (-58%)
  - `LectureModal`: 672 → 299 строк (-55%)
- ✅ Создано 3 custom hooks: useTestTimer, useTestProgress, useTestSubmit
- ✅ Создано 11 UI компонентов для tests и lectures
- ✅ Auth Middleware внедрен во всех 15 API routes

### ✅ Phase 2: Redux и State Management (ЗАВЕРШЕНО)
- ✅ RTK Query полностью настроен
- ✅ Создано 24 API endpoints в 5 features:
  - testsApi (5 endpoints)
  - resultsApi (5 endpoints)
  - lecturesApi (5 endpoints)
  - categoriesApi (2 endpoints)
  - userListsApi (7 endpoints)
- ✅ Все компоненты мигрированы на RTK Query hooks
- ✅ Устранено ~450 строк boilerplate кода (-79%)

### ✅ Phase 3: UI Kit (ЧАСТИЧНО ЗАВЕРШЕНО)
- ✅ Создано 6 UI компонентов: Button, Card, Input, Modal, Spinner, Badge
- ⚠️ **Осталось:** Создать еще 15-20 компонентов (см. Phase 6 ниже)

---

## 🎯 Оставшиеся фазы для выполнения

### Phase 3: SEO оптимизация (1-2 недели)

#### 3.1 Dynamic Metadata для всех страниц

**Статус:** ❌ НЕ НАЧАТО

**Задачи:**

- [ ] **Добавить `generateMetadata()` для всех страниц:**
  ```typescript
  // app/(dashboard)/tests/[id]/page.tsx
  export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: { categories: { include: { category: true } } }
    });

    return {
      title: `${test.title} - REST API Trainer`,
      description: `${test.description}. Сложность: ${test.difficulty}`,
      keywords: [test.title, 'REST API', test.difficulty, ...test.tags],
      openGraph: {
        title: test.title,
        description: test.description,
        type: 'website',
        url: `https://rest-api-trainer.com/tests/${test.id}`,
        images: [{
          url: `/api/og?title=${encodeURIComponent(test.title)}`,
          width: 1200,
          height: 630,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: test.title,
        description: test.description,
      },
    };
  }
  ```

**Файлы для обновления:**
- [ ] `app/(dashboard)/tests/page.tsx` - generateMetadata для списка тестов
- [ ] `app/(dashboard)/tests/[id]/page.tsx` - generateMetadata для конкретного теста
- [ ] `app/(dashboard)/lectures/page.tsx` - generateMetadata для списка лекций
- [ ] `app/(dashboard)/lectures/[id]/page.tsx` - generateMetadata для конкретной лекции
- [ ] `app/(dashboard)/results/page.tsx` - generateMetadata для результатов
- [ ] `app/(dashboard)/my-lists/page.tsx` - generateMetadata для списков пользователя
- [ ] `app/(dashboard)/dashboard/page.tsx` - generateMetadata для дашборда
- [ ] `app/(dashboard)/combined-test/page.tsx` - generateMetadata для комбинированного теста

---

#### 3.2 Dynamic Open Graph Images

**Статус:** ❌ НЕ НАЧАТО

**Задачи:**

- [ ] **Создать `opengraph-image.tsx` для тестов:**
  ```typescript
  // app/(dashboard)/tests/[id]/opengraph-image.tsx
  import { ImageResponse } from 'next/og';

  export const runtime = 'edge';
  export const alt = 'REST API Trainer - Test';
  export const size = { width: 1200, height: 630 };
  export const contentType = 'image/png';

  export default async function Image({ params }: { params: { id: string } }) {
    const test = await getTest(params.id);

    return new ImageResponse(
      (
        <div style={{
          background: 'linear-gradient(to bottom, #667eea, #764ba2)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '80px',
        }}>
          <h1 style={{ fontSize: 72, fontWeight: 'bold' }}>
            {test.title}
          </h1>
          <p style={{ fontSize: 36, marginTop: 20 }}>
            Сложность: {test.difficulty}
          </p>
          <p style={{ fontSize: 28, marginTop: 20 }}>
            {test.questions.length} вопросов
          </p>
        </div>
      ),
      size
    );
  }
  ```

**Файлы для создания:**
- [ ] `app/(dashboard)/tests/[id]/opengraph-image.tsx` - OG image для тестов
- [ ] `app/(dashboard)/lectures/[id]/opengraph-image.tsx` - OG image для лекций
- [ ] `app/opengraph-image.tsx` - Главная OG image

---

#### 3.3 Sitemap и robots.txt

**Статус:** ❌ НЕ НАЧАТО

**Задачи:**

- [ ] **Создать динамический sitemap:**
  ```typescript
  // app/sitemap.ts
  import { MetadataRoute } from 'next';

  export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const tests = await prisma.test.findMany({
      select: { id: true, updatedAt: true }
    });

    const lectures = await prisma.lecture.findMany({
      select: { id: true, updatedAt: true }
    });

    const testUrls = tests.map(test => ({
      url: `https://rest-api-trainer.com/tests/${test.id}`,
      lastModified: test.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

    const lectureUrls = lectures.map(lecture => ({
      url: `https://rest-api-trainer.com/lectures/${lecture.id}`,
      lastModified: lecture.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [
      {
        url: 'https://rest-api-trainer.com',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      ...testUrls,
      ...lectureUrls,
    ];
  }
  ```

- [ ] **Создать robots.txt:**
  ```typescript
  // app/robots.ts
  import { MetadataRoute } from 'next';

  export default function robots(): MetadataRoute.Robots {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      sitemap: 'https://rest-api-trainer.com/sitemap.xml',
    };
  }
  ```

**Файлы для создания:**
- [ ] `app/sitemap.ts` - Динамический sitemap
- [ ] `app/robots.ts` - robots.txt

---

#### 3.4 Structured Data (JSON-LD)

**Статус:** ❌ НЕ НАЧАТО

**Задачи:**

- [ ] **Создать компоненты для Structured Data:**
  ```typescript
  // shared/components/StructuredData/TestStructuredData.tsx
  export const TestStructuredData = ({ test }: { test: Test }) => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: test.title,
      description: test.description,
      educationalLevel: test.difficulty,
      numberOfQuestions: test.questions.length,
      inLanguage: 'ru-RU',
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    );
  };
  ```

**Файлы для создания:**
- [ ] `shared/components/StructuredData/TestStructuredData.tsx`
- [ ] `shared/components/StructuredData/LectureStructuredData.tsx`
- [ ] `shared/components/StructuredData/OrganizationStructuredData.tsx`

**Добавить в страницы:**
- [ ] `app/(dashboard)/tests/[id]/page.tsx` - добавить TestStructuredData
- [ ] `app/(dashboard)/lectures/[id]/page.tsx` - добавить LectureStructuredData

---

### Phase 4: PWA поддержка (1 неделя)

**Статус:** ❌ НЕ НАЧАТО

#### 4.1 Настройка next-pwa

**Задачи:**

- [ ] **Установить next-pwa:**
  ```bash
  npm install next-pwa
  ```

- [ ] **Обновить next.config.ts:**
  ```typescript
  import withPWA from 'next-pwa';

  const nextConfig = {
    // ... существующий конфиг
  };

  export default withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/api\/tests\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-tests',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
    ],
  })(nextConfig);
  ```

**Файлы для обновления/создания:**
- [ ] `next.config.ts` - добавить withPWA конфигурацию
- [ ] `package.json` - добавить next-pwa зависимость

---

#### 4.2 Создание manifest.json

**Задачи:**

- [ ] **Создать manifest.json:**
  ```json
  {
    "name": "REST API Trainer",
    "short_name": "API Trainer",
    "description": "Платформа для изучения REST API через интерактивные тесты",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#667eea",
    "theme_color": "#667eea",
    "orientation": "portrait",
    "icons": [
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable any"
      }
    ],
    "categories": ["education", "productivity"],
    "shortcuts": [
      {
        "name": "Мои тесты",
        "url": "/tests",
        "icons": [{ "src": "/icons/tests-icon.png", "sizes": "96x96" }]
      }
    ]
  }
  ```

- [ ] **Создать иконки приложения:**
  - [ ] `/public/icons/icon-72x72.png`
  - [ ] `/public/icons/icon-96x96.png`
  - [ ] `/public/icons/icon-128x128.png`
  - [ ] `/public/icons/icon-144x144.png`
  - [ ] `/public/icons/icon-152x152.png`
  - [ ] `/public/icons/icon-192x192.png`
  - [ ] `/public/icons/icon-384x384.png`
  - [ ] `/public/icons/icon-512x512.png`

**Файлы для создания:**
- [ ] `public/manifest.json`
- [ ] Иконки приложения (8 размеров)

---

#### 4.3 Offline Page

**Задачи:**

- [ ] **Создать offline page:**
  ```typescript
  // app/offline/page.tsx
  export default function OfflinePage() {
    return (
      <div className={styles.offline}>
        <h1>🔌 Нет подключения к интернету</h1>
        <p>Некоторые функции могут быть недоступны</p>
        <ul>
          <li>Просматривать сохраненные тесты</li>
          <li>Видеть историю результатов</li>
          <li>Использовать Pomodoro таймер</li>
        </ul>
      </div>
    );
  }
  ```

**Файлы для создания:**
- [ ] `app/offline/page.tsx`
- [ ] `app/offline/page.module.scss`

---

### Phase 5: Performance оптимизация (1-2 недели)

**Статус:** ⚠️ ЧАСТИЧНО ВЫПОЛНЕНО (нужна проверка)

#### 5.1 Code Splitting и Lazy Loading

**Задачи:**

- [ ] **Проверить использование dynamic imports для модальных окон:**
  ```typescript
  const LectureModal = dynamic(() => import('@/components/lecture/LectureModal'), {
    loading: () => <ModalSkeleton />,
    ssr: false,
  });
  ```

- [ ] **Создать loading.tsx для всех страниц:**
  - [ ] `app/(dashboard)/tests/loading.tsx`
  - [ ] `app/(dashboard)/tests/[id]/loading.tsx`
  - [ ] `app/(dashboard)/lectures/loading.tsx`
  - [ ] `app/(dashboard)/lectures/[id]/loading.tsx`
  - [ ] `app/(dashboard)/results/loading.tsx`
  - [ ] `app/(dashboard)/my-lists/loading.tsx`

**Пример loading.tsx:**
```typescript
// app/(dashboard)/tests/loading.tsx
export default function TestsLoading() {
  return <TestsSkeleton />;
}
```

---

#### 5.2 Оптимизация изображений

**Задачи:**

- [ ] **Проверить использование `next/image` вместо `<img>`:**
  ```typescript
  import Image from 'next/image';

  <Image
    src="/logo.png"
    alt="Logo"
    width={200}
    height={50}
    priority
    placeholder="blur"
  />
  ```

- [ ] **Настроить конфигурацию изображений в next.config.ts:**
  ```typescript
  export default {
    images: {
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
  };
  ```

- [ ] **Найти и заменить все `<img>` теги на `<Image>`:**
  - Использовать поиск по проекту: `grep -r "<img" src/`
  - Заменить на `next/image` компонент

---

#### 5.3 React Server Components (RSC)

**Задачи:**

- [ ] **Проверить правильное разделение Server/Client Components:**
  - Server Components по умолчанию (без 'use client')
  - Client Components только для интерактивности

- [ ] **Оптимизировать страницы с данными:**
  ```typescript
  // Server Component
  async function getTests() {
    const tests = await prisma.test.findMany();
    return tests;
  }

  export default async function TestsPage() {
    const tests = await getTests();
    return <TestsList tests={tests} />;
  }
  ```

**Файлы для проверки:**
- [ ] `app/(dashboard)/tests/page.tsx` - может быть Server Component
- [ ] `app/(dashboard)/lectures/page.tsx` - может быть Server Component
- [ ] `app/(dashboard)/results/page.tsx` - может быть Server Component

---

#### 5.4 Мemoization и оптимизация re-renders

**Задачи:**

- [ ] **Добавить мемоизацию в компоненты списков:**
  ```typescript
  export const TestCard = memo(({ test }: Props) => {
    return <div>{test.title}</div>;
  });
  ```

- [ ] **Использовать useMemo для тяжелых вычислений:**
  ```typescript
  const filteredTests = useMemo(() => {
    return tests.filter(t => t.title.includes(search));
  }, [tests, search]);
  ```

- [ ] **Использовать useCallback для функций:**
  ```typescript
  const handleSelect = useCallback((testId: string) => {
    router.push(`/tests/${testId}`);
  }, [router]);
  ```

**Файлы для оптимизации:**
- [ ] `features/tests/components/TestCard` - добавить memo
- [ ] `app/(dashboard)/tests/page.tsx` - добавить useMemo для фильтрации
- [ ] Все компоненты списков - проверить на re-renders

---

### Phase 6: Расширение Component Library (1-2 недели)

**Статус:** ⚠️ ЧАСТИЧНО ВЫПОЛНЕНО (6 из ~25 компонентов)

**Уже созданы:** Button, Card, Input, Modal, Spinner, Badge

**Нужно создать:**

#### 6.1 Навигация и меню
- [ ] **Tabs** - табы для навигации
  ```typescript
  <Tabs defaultValue="all">
    <TabsList>
      <TabsTrigger value="all">Все</TabsTrigger>
      <TabsTrigger value="beginner">Начальный</TabsTrigger>
    </TabsList>
    <TabsContent value="all">...</TabsContent>
  </Tabs>
  ```

- [ ] **Dropdown** - выпадающее меню
- [ ] **Breadcrumbs** - хлебные крошки

#### 6.2 Формы
- [ ] **Select** - выпадающий список
- [ ] **Checkbox** - чекбокс
- [ ] **Radio** - радио кнопка
- [ ] **Switch** - переключатель
- [ ] **Textarea** - многострочное поле ввода

#### 6.3 Обратная связь
- [ ] **Toast/Notification** - всплывающие уведомления
  ```typescript
  const toast = useToast();
  toast.success('Тест отправлен!');
  ```

- [ ] **Alert** - алерт сообщения
- [ ] **Progress** - прогресс бар
- [ ] **Skeleton** - скелетоны загрузки

#### 6.4 Оверлеи
- [ ] **Tooltip** - подсказки
- [ ] **Popover** - всплывающее окно
- [ ] **Dialog** - диалоговое окно (расширение Modal)

#### 6.5 Отображение данных
- [ ] **Table** - таблица
- [ ] **Pagination** - пагинация
- [ ] **Accordion** - аккордеон
- [ ] **Avatar** - аватар пользователя

#### 6.6 Утилиты
- [ ] **Divider** - разделитель
- [ ] **Empty State** - пустое состояние
- [ ] **Error Boundary** - обработка ошибок

**Структура каждого компонента:**
```
shared/ui/ComponentName/
├── ComponentName.tsx
├── ComponentName.module.scss
├── ComponentName.test.tsx
└── index.ts
```

---

### Phase 7: Тестирование (опционально, 2 недели)

**Статус:** ❌ НЕ НАЧАТО

#### 7.1 Unit тесты (Vitest)

**Задачи:**

- [ ] **Установить Vitest:**
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom
  ```

- [ ] **Настроить vitest.config.ts:**
  ```typescript
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      environment: 'jsdom',
    },
  });
  ```

- [ ] **Написать тесты для UI компонентов:**
  - [ ] Button.test.tsx
  - [ ] Card.test.tsx
  - [ ] Modal.test.tsx
  - [ ] Badge.test.tsx
  - [ ] Spinner.test.tsx

- [ ] **Написать тесты для hooks:**
  - [ ] useTestTimer.test.ts
  - [ ] useTestProgress.test.ts
  - [ ] useTestSubmit.test.ts

**Цель:** Покрытие тестами 60%+

---

#### 7.2 E2E тесты (Playwright - опционально)

**Задачи:**

- [ ] **Установить Playwright:**
  ```bash
  npm install -D @playwright/test
  ```

- [ ] **Создать E2E тесты для критичных флоу:**
  ```typescript
  // tests/e2e/test-flow.spec.ts
  test('complete test flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await page.goto('/tests');
    await page.click('text=HTTP методы');
    // ...
  });
  ```

**Тесты для создания:**
- [ ] `tests/e2e/auth-flow.spec.ts` - авторизация
- [ ] `tests/e2e/test-completion.spec.ts` - прохождение теста
- [ ] `tests/e2e/results-view.spec.ts` - просмотр результатов

---

### Phase 8: Документация (1 неделя)

**Статус:** ❌ НЕ НАЧАТО

**Задачи:**

- [ ] **Создать ARCHITECTURE.md** - описание архитектуры проекта
- [ ] **Создать UI_KIT.md** - документация всех UI компонентов
- [ ] **Создать API_DOCUMENTATION.md** - документация API endpoints
- [ ] **Обновить CLAUDE.md** с новой структурой проекта
- [ ] **Создать CONTRIBUTING.md** - гайд для контрибьюторов

---

## 📊 Оставшиеся метрики для достижения

### Performance (Phase 5)
| Метрика | Сейчас | Цель | Осталось |
|---------|--------|------|----------|
| **First Contentful Paint** | ~2.5s | ~0.8s | -68% |
| **JavaScript Bundle** | ~450kb | ~180kb | -60% |
| **Lighthouse Score** | 65-70 | 90-95 | +25-30 |

### SEO (Phase 3)
| Метрика | Сейчас | Цель | Осталось |
|---------|--------|------|----------|
| **Индексация страниц** | ~5 | ~100+ | +95 страниц |
| **Core Web Vitals** | Fail | Pass | Нужно исправить |

### Component Library (Phase 6)
| Метрика | Сейчас | Цель | Осталось |
|---------|--------|------|----------|
| **UI компонентов** | 6 | 25 | +19 компонентов |

---

## 🚀 Приоритетный план выполнения

### 🔥 Высокий приоритет (следующие 2-3 недели)

1. **Phase 3: SEO оптимизация** (1-2 недели)
   - Критично для индексации и органического трафика
   - generateMetadata() для всех страниц
   - sitemap.ts и robots.ts
   - Open Graph images

2. **Phase 5: Performance оптимизация** (1 неделя)
   - Проверить и исправить loading.tsx
   - Добавить мемоизацию
   - Оптимизировать изображения

3. **Phase 6: Расширение Component Library** (1 неделя)
   - Создать критичные компоненты: Tabs, Select, Toast
   - Довести UI Kit до 15+ компонентов

### 📅 Средний приоритет (через 3-4 недели)

4. **Phase 4: PWA поддержка** (1 неделя)
   - next-pwa настройка
   - manifest.json
   - Offline page

### 💡 Низкий приоритет (опционально)

5. **Phase 7: Тестирование** (2 недели)
   - Unit тесты с Vitest
   - E2E тесты с Playwright

6. **Phase 8: Документация** (1 неделя)
   - ARCHITECTURE.md
   - UI_KIT.md
   - API_DOCUMENTATION.md

---

## ✅ Критерии завершения всего рефакторинга

**Проект считается полностью завершенным когда:**

### SEO (Phase 3)
- ✅ generateMetadata() во всех страницах
- ✅ sitemap.ts и robots.ts созданы
- ✅ Open Graph images для тестов и лекций
- ✅ Structured data (JSON-LD) добавлена

### PWA (Phase 4)
- ✅ next-pwa настроен
- ✅ manifest.json создан
- ✅ Иконки приложения (8 размеров)
- ✅ Offline page создана

### Performance (Phase 5)
- ✅ loading.tsx для всех страниц
- ✅ next/image везде вместо <img>
- ✅ Мемоизация критичных компонентов
- ✅ Lighthouse Score 90+

### Component Library (Phase 6)
- ✅ 25+ UI компонентов созданы
- ✅ Документация для всех компонентов

---

**Общее время выполнения оставшихся фаз:** 5-7 недель
**Высокий приоритет (SEO + Performance + UI):** 3-4 недели

**Дата обновления:** 2026-01-27
**Версия:** 2.0
**Статус:** 🚀 Готов к продолжению
