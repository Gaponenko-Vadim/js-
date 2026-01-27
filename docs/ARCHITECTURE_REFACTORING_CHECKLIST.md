# 🏗️ Чек-лист рефакторинга архитектуры REST API Trainer

**Цель:** Избавиться от монолита, устранить дублирование, внедрить Redux, создать общие стили

**Статус:** 🚀 В процессе
**Дата начала:** 2026-01-26

---

## 📊 Текущее состояние проекта

### Критические проблемы (найдены анализом)

**🔴 Монолитные компоненты (КРИТИЧНО):**
- ❌ `combined-test/page.tsx` - **703 строки**
- ❌ `LectureModal.tsx` - **672 строки**
- ❌ `tests/[id]/page.tsx` - **669 строк**
- ⚠️ `tests/page.tsx` - **522 строки**
- ⚠️ `results/page.tsx` - **479 строк**
- ⚠️ `my-lists/page.tsx` - **383 строки**

**🔴 Дублирование кода:**
- ❌ 58 повторений `getServerSession()` в 17 API routes
- ❌ Дублированная логика таймера в `tests/[id]` и `combined-test`
- ❌ Дублированная логика submit теста
- ❌ Дублированные стили кнопок, карточек, модальных окон

**🔴 Неоптимальное использование Redux:**
- ❌ Redux используется только для Pomodoro и UserLists
- ❌ Состояние тестов управляется через `useState` + sessionStorage
- ❌ Нет централизованного API layer (RTK Query)
- ❌ Множественные `fetch()` вызовы в компонентах

**🔴 Отсутствие общих стилей:**
- ❌ Дублирование CSS в каждом `.module.scss` файле
- ❌ Нет design tokens (цвета, отступы, шрифты)
- ❌ Нет единой системы компонентов
- ❌ Hardcoded значения цветов и размеров

---

## 🎯 Фазы рефакторинга

### ✅ Фаза 0: Подготовка (1-2 дня)
- [ ] Создать систему Design Tokens
- [ ] Создать общие SCSS переменные
- [ ] Настроить feature-based структуру директорий
- [ ] Создать Auth Middleware для API

### 🚀 Фаза 1: Разбивка монолитов (1 неделя)
- [ ] Разбить `tests/[id]/page.tsx` на компоненты
- [ ] Разбить `combined-test/page.tsx` на компоненты
- [ ] Разбить `LectureModal.tsx` на компоненты
- [ ] Создать переиспользуемые компоненты

### 🔄 Фаза 2: Внедрение Redux + RTK Query (1 неделя)
- [ ] Настроить RTK Query
- [ ] Создать API endpoints для тестов
- [ ] Создать API endpoints для результатов
- [ ] Мигрировать компоненты на Redux hooks

### 🎨 Фаза 3: Общие стили и UI Kit (3-5 дней)
- [ ] Создать Design System
- [ ] Рефакторить существующие UI компоненты
- [ ] Создать недостающие UI компоненты
- [ ] Применить общие стили везде

### 🧹 Фаза 4: Устранение дублирования (2-3 дня)
- [ ] Внедрить Auth Middleware во всех API
- [ ] Извлечь общую логику таймера
- [ ] Извлечь общую логику submit теста
- [ ] Удалить дублированный код

---

## 📝 Детальный чек-лист

## Фаза 0: Подготовка

### 0.1. Создать систему Design Tokens
**Файл:** `src/styles/tokens.scss`

- [ ] Создать цветовую палитру
  ```scss
  // Primary colors
  $color-primary: #007bff;
  $color-primary-hover: #0056b3;
  $color-primary-light: #e7f3ff;

  // Semantic colors
  $color-success: #28a745;
  $color-error: #dc3545;
  $color-warning: #ffc107;
  $color-info: #17a2b8;

  // Neutral colors
  $color-text-primary: #212529;
  $color-text-secondary: #6c757d;
  $color-background: #f8f9fa;
  $color-border: #dee2e6;
  ```

- [ ] Создать spacing tokens
  ```scss
  $spacing-xs: 0.25rem;  // 4px
  $spacing-sm: 0.5rem;   // 8px
  $spacing-md: 1rem;     // 16px
  $spacing-lg: 1.5rem;   // 24px
  $spacing-xl: 2rem;     // 32px
  $spacing-xxl: 3rem;    // 48px
  ```

- [ ] Создать typography tokens
  ```scss
  $font-size-xs: 0.75rem;   // 12px
  $font-size-sm: 0.875rem;  // 14px
  $font-size-md: 1rem;      // 16px
  $font-size-lg: 1.125rem;  // 18px
  $font-size-xl: 1.5rem;    // 24px
  $font-size-xxl: 2rem;     // 32px

  $font-weight-normal: 400;
  $font-weight-medium: 500;
  $font-weight-bold: 700;
  ```

- [ ] Создать border radius tokens
  ```scss
  $border-radius-sm: 0.25rem;  // 4px
  $border-radius-md: 0.5rem;   // 8px
  $border-radius-lg: 1rem;     // 16px
  $border-radius-full: 9999px; // круглые кнопки
  ```

- [ ] Создать shadow tokens
  ```scss
  $shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  $shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  $shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  ```

- [ ] Создать breakpoint tokens
  ```scss
  $breakpoint-mobile: 320px;
  $breakpoint-tablet: 768px;
  $breakpoint-desktop: 1024px;
  $breakpoint-wide: 1280px;
  ```

**Критерий готовности:** ✅ Файл `tokens.scss` создан, все переменные определены

---

### 0.2. Создать глобальные SCSS утилиты
**Файл:** `src/styles/utilities.scss`

- [ ] Создать mixins для флексбокса
  ```scss
  @mixin flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @mixin flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  ```

- [ ] Создать mixins для адаптивности
  ```scss
  @mixin mobile {
    @media (max-width: $breakpoint-tablet - 1) { @content; }
  }

  @mixin tablet {
    @media (min-width: $breakpoint-tablet) { @content; }
  }

  @mixin desktop {
    @media (min-width: $breakpoint-desktop) { @content; }
  }
  ```

- [ ] Создать utility классы
  ```scss
  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .mb-sm { margin-bottom: $spacing-sm; }
  .mb-md { margin-bottom: $spacing-md; }
  .mb-lg { margin-bottom: $spacing-lg; }
  ```

**Критерий готовности:** ✅ Файл `utilities.scss` создан и импортирован в `globals.scss`

---

### 0.3. Настроить feature-based структуру
**Цель:** Создать модульную архитектуру

- [ ] Создать директорию `src/features/`
- [ ] Создать структуру для feature `tests`
  ```
  src/features/tests/
  ├── components/
  │   ├── TestCard/
  │   │   ├── TestCard.tsx
  │   │   └── TestCard.module.scss
  │   ├── TestFilters/
  │   ├── TestQuestion/
  │   └── TestTimer/
  ├── hooks/
  │   ├── useTestTimer.ts
  │   ├── useTestSubmit.ts
  │   └── useTestProgress.ts
  ├── store/
  │   ├── testsSlice.ts
  │   └── testsApi.ts (RTK Query)
  ├── types/
  │   └── index.ts
  └── utils/
      └── testHelpers.ts
  ```

- [ ] Создать структуру для feature `results`
  ```
  src/features/results/
  ├── components/
  │   ├── ResultCard/
  │   ├── ResultFilters/
  │   └── ResultChart/
  ├── store/
  │   └── resultsApi.ts
  └── types/
      └── index.ts
  ```

- [ ] Создать структуру для feature `lectures`
  ```
  src/features/lectures/
  ├── components/
  │   ├── LectureContent/
  │   ├── LectureNavigation/
  │   └── LectureTasks/
  ├── store/
  │   └── lecturesApi.ts
  └── types/
      └── index.ts
  ```

- [ ] Создать `src/shared/` для общих ресурсов
  ```
  src/shared/
  ├── ui/              # UI Kit компоненты
  ├── layouts/         # Layout компоненты
  ├── hooks/           # Общие hooks
  ├── api/
  │   └── middleware/
  │       └── authMiddleware.ts
  └── utils/           # Утилиты
  ```

**Критерий готовности:** ✅ Все директории созданы, структура готова к миграции

---

### 0.4. Создать Auth Middleware для API
**Файл:** `src/shared/api/middleware/authMiddleware.ts`

- [ ] Создать типы для middleware
  ```typescript
  export interface AuthContext {
    user: User;
    session: Session;
    params?: any;
  }

  export type AuthHandler = (
    req: Request,
    context: AuthContext
  ) => Promise<Response>;
  ```

- [ ] Реализовать `withAuth` middleware
  ```typescript
  export async function withAuth(handler: AuthHandler) {
    return async (req: Request, context: any) => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return handler(req, {
        user,
        session,
        params: context.params
      });
    };
  }
  ```

- [ ] Создать пример использования
  ```typescript
  // app/api/tests/route.ts
  export const GET = withAuth(async (req, { user }) => {
    const tests = await prisma.test.findMany({
      where: { userId: user.id }
    });
    return NextResponse.json(tests);
  });
  ```

**Критерий готовности:** ✅ Middleware создан, протестирован на 1 API route

---

## Фаза 1: Разбивка монолитов

### 1.1. Разбить `tests/[id]/page.tsx` (669 строк → ~80 строк)

**Анализ:** Этот файл содержит:
- Логику таймера
- Логику прогресса теста
- Логику submit
- UI вопросов
- UI результатов
- Восстановление из sessionStorage

**План разбивки:**

- [ ] Создать `src/features/tests/hooks/useTestTimer.ts`
  ```typescript
  export function useTestTimer(
    testStarted: boolean,
    isExamMode: boolean,
    examDuration: number
  ) {
    const [timeLeft, setTimeLeft] = useState(examDuration);
    const [endTime, setEndTime] = useState<number | null>(null);

    // ... вся логика таймера

    return { timeLeft, isTimeUp };
  }
  ```

- [ ] Создать `src/features/tests/hooks/useTestProgress.ts`
  ```typescript
  export function useTestProgress(testId: string) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);

    // Автосохранение в sessionStorage
    useEffect(() => {
      if (!showResults) {
        sessionStorage.setItem(`test_${testId}_state`, JSON.stringify({
          currentQuestionIndex,
          userAnswers,
          // ...
        }));
      }
    }, [currentQuestionIndex, userAnswers]);

    // Восстановление из sessionStorage
    useEffect(() => {
      const saved = sessionStorage.getItem(`test_${testId}_state`);
      if (saved) {
        const state = JSON.parse(saved);
        setCurrentQuestionIndex(state.currentQuestionIndex);
        // ...
      }
    }, [testId]);

    return {
      currentQuestionIndex,
      userAnswers,
      setCurrentQuestionIndex,
      setUserAnswers,
      // ...
    };
  }
  ```

- [ ] Создать `src/features/tests/hooks/useTestSubmit.ts`
  ```typescript
  export function useTestSubmit() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitTest = async (testId: string, answers: number[]) => {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/tests/${testId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        });
        const result = await response.json();
        return result;
      } finally {
        setIsSubmitting(false);
      }
    };

    return { submitTest, isSubmitting };
  }
  ```

- [ ] Создать `src/features/tests/components/TestQuestion/TestQuestion.tsx`
  ```typescript
  interface TestQuestionProps {
    question: QuestionWithOptions;
    questionNumber: number;
    totalQuestions: number;
    selectedAnswer: number | null;
    onAnswerSelect: (index: number) => void;
    isExamMode: boolean;
  }

  export function TestQuestion({
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    onAnswerSelect,
    isExamMode
  }: TestQuestionProps) {
    return (
      <div className={styles.questionContainer}>
        <div className={styles.questionHeader}>
          <span>Вопрос {questionNumber} из {totalQuestions}</span>
        </div>
        <h2>{question.text}</h2>
        <div className={styles.options}>
          {question.options.map((option, index) => (
            <button
              key={index}
              className={cn(
                styles.option,
                selectedAnswer === index && styles.selected
              )}
              onClick={() => onAnswerSelect(index)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] Создать `src/features/tests/components/TestTimer/TestTimer.tsx`
  ```typescript
  interface TestTimerProps {
    timeLeft: number;
    isWarning: boolean;
  }

  export function TestTimer({ timeLeft, isWarning }: TestTimerProps) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <div className={cn(
        styles.timer,
        isWarning && styles.warning
      )}>
        ⏱️ {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    );
  }
  ```

- [ ] Создать `src/features/tests/components/TestNavigation/TestNavigation.tsx`
  ```typescript
  interface TestNavigationProps {
    currentIndex: number;
    totalQuestions: number;
    hasAnswer: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onSubmit: () => void;
  }

  export function TestNavigation({
    currentIndex,
    totalQuestions,
    hasAnswer,
    onPrevious,
    onNext,
    onSubmit
  }: TestNavigationProps) {
    const isFirstQuestion = currentIndex === 0;
    const isLastQuestion = currentIndex === totalQuestions - 1;

    return (
      <div className={styles.navigation}>
        <button
          onClick={onPrevious}
          disabled={isFirstQuestion}
        >
          ← Назад
        </button>

        {isLastQuestion ? (
          <button
            onClick={onSubmit}
            disabled={!hasAnswer}
            className={styles.submitButton}
          >
            Завершить тест
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!hasAnswer}
          >
            Далее →
          </button>
        )}
      </div>
    );
  }
  ```

- [ ] Создать `src/features/tests/components/TestResults/TestResults.tsx`
  ```typescript
  interface TestResultsProps {
    score: number;
    totalQuestions: number;
    correctAnswers: number[];
    userAnswers: number[];
    questions: Question[];
    onRestart: () => void;
  }

  export function TestResults({
    score,
    totalQuestions,
    correctAnswers,
    userAnswers,
    questions,
    onRestart
  }: TestResultsProps) {
    return (
      <div className={styles.results}>
        <h2>Результаты теста</h2>
        <div className={styles.scoreCircle}>
          {score}%
        </div>

        <div className={styles.questionReview}>
          {questions.map((q, index) => (
            <QuestionReviewCard
              key={q.id}
              question={q}
              userAnswer={userAnswers[index]}
              correctAnswer={correctAnswers[index]}
              questionNumber={index + 1}
            />
          ))}
        </div>

        <button onClick={onRestart}>
          Пройти заново
        </button>
      </div>
    );
  }
  ```

- [ ] Обновить `app/(dashboard)/tests/[id]/page.tsx` - использовать новые компоненты
  ```typescript
  export default function TestPage({ params }: Props) {
    const { data: test, isLoading } = useGetTestQuery(params.id);

    const [testMode, setTestMode] = useState<'learning' | 'exam' | null>(null);
    const [showResults, setShowResults] = useState(false);

    const {
      currentQuestionIndex,
      userAnswers,
      handleAnswerSelect,
      handleNext,
      handlePrevious
    } = useTestProgress(params.id);

    const { timeLeft, isTimeUp } = useTestTimer(
      !!testMode,
      testMode === 'exam',
      (test?.questions.length || 0) * 20
    );

    const { submitTest, isSubmitting } = useTestSubmit();

    // Компактная логика - только оркестровка

    if (isLoading) return <LoadingSpinner />;

    if (!testMode) {
      return <TestModeSelector onSelect={setTestMode} />;
    }

    if (showResults) {
      return <TestResults {...resultsData} />;
    }

    return (
      <div>
        {testMode === 'exam' && (
          <TestTimer timeLeft={timeLeft} isWarning={timeLeft < 60} />
        )}

        <TestQuestion
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={test.questions.length}
          selectedAnswer={userAnswers[currentQuestionIndex]}
          onAnswerSelect={handleAnswerSelect}
          isExamMode={testMode === 'exam'}
        />

        <TestNavigation
          currentIndex={currentQuestionIndex}
          totalQuestions={test.questions.length}
          hasAnswer={userAnswers[currentQuestionIndex] !== undefined}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }
  ```

**Критерий готовности:**
- ✅ Файл `tests/[id]/page.tsx` сокращен до ~80-100 строк
- ✅ Все компоненты извлечены и работают
- ✅ Тесты проходят без ошибок
- ✅ Автосохранение работает корректно

---

### 1.2. Разбить `combined-test/page.tsx` (703 строки → ~80 строк)

**План:**
- [ ] Использовать те же hooks что и для обычных тестов (`useTestTimer`, `useTestProgress`, `useTestSubmit`)
- [ ] Создать `CombinedTestQuestion` компонент (отличие - показывает sourceTestId)
- [ ] Переиспользовать `TestNavigation`, `TestTimer`, `TestResults`
- [ ] Обновить основной файл - убрать дублирование

**Критерий готовности:**
- ✅ Файл сокращен до ~80-100 строк
- ✅ Переиспользуются компоненты из `tests/[id]`
- ✅ Нет дублирования логики

---

### 1.3. Разбить `LectureModal.tsx` (672 строки → ~150 строк)

**Анализ:** Компонент содержит:
- Markdown рендеринг
- Навигацию по разделам
- Логику задач (tasks)
- Модальное окно

**План:**
- [ ] Создать `src/features/lectures/components/LectureContent/LectureContent.tsx`
  - Только markdown рендеринг
  - Без логики навигации

- [ ] Создать `src/features/lectures/components/LectureNavigation/LectureNavigation.tsx`
  - Навигация по разделам
  - TOC (table of contents)

- [ ] Создать `src/features/lectures/components/LectureTasks/LectureTasks.tsx`
  - Отображение задач
  - Прогресс выполнения

- [ ] Создать `src/shared/ui/Modal/Modal.tsx`
  - Универсальный модальный компонент
  - Переиспользуемый для всех модалок

- [ ] Обновить `LectureModal.tsx` - собрать из компонентов

**Критерий готовности:**
- ✅ Файл сокращен до ~150 строк
- ✅ Компоненты извлечены
- ✅ Модальное окно работает

---

### 1.4. Создать переиспользуемые UI компоненты

- [ ] `src/shared/ui/Button/Button.tsx`
  - Варианты: primary, secondary, danger, ghost
  - Размеры: sm, md, lg
  - States: loading, disabled

- [ ] `src/shared/ui/Card/Card.tsx`
  - Обновить существующий
  - Добавить варианты: default, outlined, elevated

- [ ] `src/shared/ui/Input/Input.tsx`
  - Обновить существующий
  - Добавить error states, icons

- [ ] `src/shared/ui/Modal/Modal.tsx`
  - Универсальное модальное окно
  - Close on ESC, backdrop click

- [ ] `src/shared/ui/Spinner/Spinner.tsx`
  - Индикатор загрузки
  - Варианты: inline, fullscreen

- [ ] `src/shared/ui/Badge/Badge.tsx`
  - Бейджи для статусов
  - Варианты: success, error, warning, info

- [ ] `src/shared/ui/Tabs/Tabs.tsx`
  - Табы для навигации
  - Для страницы tests (фильтры)

**Критерий готовности:**
- ✅ Все компоненты созданы
- ✅ Используют design tokens
- ✅ Документированы в Storybook (опционально)

---

## Фаза 2: Внедрение Redux + RTK Query

### 2.1. Настроить RTK Query
**Файл:** `src/store/api.ts`

- [ ] Создать базовый API slice
  ```typescript
  import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

  export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    tagTypes: ['Tests', 'Results', 'Lectures', 'Categories', 'UserLists'],
    endpoints: () => ({}),
  });
  ```

- [ ] Добавить в store
  ```typescript
  export const store = configureStore({
    reducer: {
      pomodoro: pomodoroReducer,
      userLists: userListsReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
  ```

**Критерий готовности:** ✅ RTK Query настроен, store обновлен

---

### 2.2. Создать API endpoints для тестов
**Файл:** `src/features/tests/store/testsApi.ts`

- [ ] Создать queries и mutations
  ```typescript
  export const testsApi = api.injectEndpoints({
    endpoints: (builder) => ({
      getTests: builder.query<Test[], FilterParams>({
        query: (params) => ({
          url: '/tests',
          params: {
            difficulty: params.difficulty,
            category: params.category,
            // ...
          }
        }),
        providesTags: ['Tests'],
      }),

      getTestById: builder.query<TestWithQuestions, string>({
        query: (id) => `/tests/${id}`,
        providesTags: (result, error, id) => [{ type: 'Tests', id }],
      }),

      submitTest: builder.mutation<TestResult, SubmitTestDto>({
        query: ({ testId, answers }) => ({
          url: `/tests/${testId}/submit`,
          method: 'POST',
          body: { answers },
        }),
        invalidatesTags: ['Results', 'Tests'],
      }),
    }),
  });

  export const {
    useGetTestsQuery,
    useGetTestByIdQuery,
    useSubmitTestMutation,
  } = testsApi;
  ```

**Критерий готовности:** ✅ API endpoints работают, данные кэшируются

---

### 2.3. Создать API endpoints для результатов
**Файл:** `src/features/results/store/resultsApi.ts`

- [ ] Создать queries
  ```typescript
  export const resultsApi = api.injectEndpoints({
    endpoints: (builder) => ({
      getResults: builder.query<TestResult[], void>({
        query: () => '/results',
        providesTags: ['Results'],
      }),

      getResultById: builder.query<TestResultDetailed, string>({
        query: (id) => `/results/${id}`,
        providesTags: (result, error, id) => [{ type: 'Results', id }],
      }),
    }),
  });

  export const {
    useGetResultsQuery,
    useGetResultByIdQuery,
  } = resultsApi;
  ```

**Критерий готовности:** ✅ API endpoints работают

---

### 2.4. Мигрировать компоненты на Redux hooks

- [ ] Обновить `tests/page.tsx`
  - Заменить `fetch()` на `useGetTestsQuery()`
  - Удалить useState для tests, loading, error

- [ ] Обновить `tests/[id]/page.tsx`
  - Использовать `useGetTestByIdQuery(params.id)`
  - Использовать `useSubmitTestMutation()`

- [ ] Обновить `results/page.tsx`
  - Использовать `useGetResultsQuery()`

- [ ] Обновить `lectures/page.tsx`
  - Создать `lecturesApi.ts`
  - Использовать `useGetLecturesQuery()`

**Критерий готовности:**
- ✅ Все fetch вызовы заменены на RTK Query
- ✅ Автоматическое кэширование работает
- ✅ Загрузка ускорилась благодаря кэшу

---

## Фаза 3: Общие стили и UI Kit

### 3.1. Создать Design System файл
**Файл:** `src/styles/design-system.scss`

- [ ] Импортировать все tokens
  ```scss
  @import './tokens.scss';
  @import './utilities.scss';
  ```

- [ ] Создать компонентные стили
  ```scss
  // Button variants
  .button {
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-md;
    font-weight: $font-weight-medium;
    transition: all 0.2s ease;

    &-primary {
      background: $color-primary;
      color: white;

      &:hover {
        background: $color-primary-hover;
      }
    }

    &-secondary {
      background: transparent;
      border: 1px solid $color-border;
      color: $color-text-primary;
    }
  }

  // Card variants
  .card {
    background: white;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    box-shadow: $shadow-md;
  }
  ```

**Критерий готовности:** ✅ Design system файл создан

---

### 3.2. Рефакторить UI компоненты

- [ ] Обновить `Button.tsx` и `Button.module.scss`
  - Использовать tokens вместо hardcoded значений
  - Добавить варианты (primary, secondary, danger)
  - Добавить размеры (sm, md, lg)

- [ ] Обновить `Card.tsx` и `Card.module.scss`
  - Использовать tokens
  - Добавить варианты (default, outlined, elevated)

- [ ] Обновить `Input.tsx` и `Input.module.scss`
  - Использовать tokens
  - Добавить error states

**Критерий готовности:**
- ✅ Компоненты используют design tokens
- ✅ Нет hardcoded цветов/размеров

---

### 3.3. Создать недостающие UI компоненты

- [ ] `LoadingSpinner.tsx` - индикатор загрузки
- [ ] `Badge.tsx` - бейджи для статусов
- [ ] `Tabs.tsx` - табы
- [ ] `Select.tsx` - выпадающий список
- [ ] `Checkbox.tsx` - чекбокс
- [ ] `Radio.tsx` - радио кнопка
- [ ] `Tooltip.tsx` - тултип
- [ ] `Alert.tsx` - уведомления

**Критерий готовности:** ✅ UI Kit содержит 15+ компонентов

---

### 3.4. Применить общие стили везде

- [ ] Обновить все `.module.scss` файлы
  - Заменить hardcoded цвета на `$color-*`
  - Заменить размеры на `$spacing-*`
  - Использовать mixins

- [ ] Удалить дублирование стилей
  - Извлечь повторяющиеся паттерны в utilities

**Критерий готовности:**
- ✅ Нет hardcoded значений
- ✅ Все используют design tokens

---

## Фаза 4: Устранение дублирования

### 4.1. Внедрить Auth Middleware во всех API

**Затронутые файлы (17 API routes):**
- [ ] `app/api/tests/route.ts`
- [ ] `app/api/tests/[id]/route.ts`
- [ ] `app/api/tests/[id]/submit/route.ts`
- [ ] `app/api/results/route.ts`
- [ ] `app/api/combined-results/route.ts`
- [ ] `app/api/combined-test/route.ts`
- [ ] `app/api/pomodoro/route.ts`
- [ ] `app/api/lectures/route.ts`
- [ ] `app/api/lectures/[id]/route.ts`
- [ ] `app/api/lectures/by-question/[questionId]/route.ts`
- [ ] `app/api/lectures/[id]/tasks-progress/route.ts`
- [ ] `app/api/categories/route.ts`
- [ ] `app/api/user-lists/route.ts`
- [ ] `app/api/user-lists/[id]/route.ts`
- [ ] `app/api/user-lists/[id]/items/route.ts`
- [ ] `app/api/user/route.ts`
- [ ] `app/api/user/settings/route.ts`

**Для каждого файла:**
1. Импортировать `withAuth`
2. Обернуть handler
3. Удалить `getServerSession()` и `prisma.user.findUnique()`
4. Использовать `user` из контекста

**Критерий готовности:**
- ✅ Все 17 API routes используют `withAuth`
- ✅ 58 дублирований устранены → 1 реализация
- ✅ Код сократился на ~400 строк

---

### 4.2. Извлечь общую логику таймера

**Файл:** `src/features/tests/hooks/useTestTimer.ts`

- [ ] Создать универсальный hook
  ```typescript
  export function useTestTimer(
    isActive: boolean,
    duration: number,
    onTimeUp?: () => void
  ) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [endTime, setEndTime] = useState<number | null>(null);

    // endTime pattern для точности
    useEffect(() => {
      if (isActive && !endTime) {
        setEndTime(Date.now() + timeLeft * 1000);
      }
    }, [isActive]);

    useEffect(() => {
      if (!isActive || !endTime) return;

      const interval = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.ceil((endTime - Date.now()) / 1000)
        );
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval);
          onTimeUp?.();
        }
      }, 100);

      return () => clearInterval(interval);
    }, [isActive, endTime, onTimeUp]);

    return {
      timeLeft,
      isTimeUp: timeLeft === 0,
      reset: () => {
        setTimeLeft(duration);
        setEndTime(null);
      }
    };
  }
  ```

- [ ] Использовать в `tests/[id]/page.tsx`
- [ ] Использовать в `combined-test/page.tsx`
- [ ] Удалить дублированную логику

**Критерий готовности:**
- ✅ Один hook для всех таймеров
- ✅ Нет дублирования

---

### 4.3. Извлечь общую логику submit теста

**Файл:** `src/features/tests/hooks/useTestSubmit.ts`

- [ ] Создать универсальный hook с RTK Query
  ```typescript
  export function useTestSubmit() {
    const [submitTest, { isLoading: isSubmitting }] = useSubmitTestMutation();

    const handleSubmit = async (
      testId: string,
      answers: number[],
      mode: 'learning' | 'exam'
    ) => {
      try {
        const result = await submitTest({
          testId,
          answers,
          mode
        }).unwrap();

        // Очистка sessionStorage
        sessionStorage.removeItem(`test_${testId}_state`);

        return result;
      } catch (error) {
        console.error('Submit failed:', error);
        throw error;
      }
    };

    return { handleSubmit, isSubmitting };
  }
  ```

**Критерий готовности:**
- ✅ Один hook для submit
- ✅ Используется во всех тестах

---

## 📊 Метрики успеха

### До рефакторинга
- ❌ Средний размер компонента: **500+ строк**
- ❌ Дублирование кода: **58 раз auth, ~200 строк таймер**
- ❌ Компонентов в UI Kit: **3**
- ❌ Design tokens: **0**
- ❌ API layer: **fetch в компонентах**

### После рефакторинга (цель)
- ✅ Средний размер компонента: **80-150 строк**
- ✅ Дублирование устранено: **auth 1 раз, таймер 1 раз**
- ✅ Компонентов в UI Kit: **15+**
- ✅ Design tokens: **полная система**
- ✅ API layer: **RTK Query с кэшированием**

### Улучшение производительности (ожидаемое)
- ⚡ Bundle size: **-40%** (code splitting)
- ⚡ Re-renders: **-60%** (мемоизация)
- ⚡ API calls: **-70%** (RTK Query кэш)

---

## 🚀 План выполнения (по неделям)

### Неделя 1: Фундамент
- День 1-2: Фаза 0 (Design Tokens, структура)
- День 3-4: Начало Фазы 1 (разбить 1 монолит)
- День 5: Тестирование и фиксы

### Неделя 2: Компоненты
- День 1-3: Фаза 1 (разбить оставшиеся монолиты)
- День 4-5: Создать UI Kit компоненты

### Неделя 3: Redux
- День 1-2: Фаза 2 (настроить RTK Query)
- День 3-4: Мигрировать на RTK Query
- День 5: Тестирование

### Неделя 4: Финализация
- День 1-2: Фаза 3 (общие стили)
- День 3-4: Фаза 4 (устранить дублирование)
- День 5: Финальное тестирование и документация

---

## ✅ Критерии завершения

**Проект считается завершенным когда:**

1. ✅ Все монолитные компоненты разбиты (<150 строк каждый)
2. ✅ Auth Middleware внедрен во все 17 API routes
3. ✅ RTK Query используется для всех API вызовов
4. ✅ Design System полностью внедрен
5. ✅ UI Kit содержит 15+ компонентов
6. ✅ Нет дублирования кода (auth, таймер, submit)
7. ✅ Все тесты проходят
8. ✅ Производительность улучшена (измерено через Lighthouse)

---

## 📚 Документация

После завершения создать:
- [ ] `ARCHITECTURE.md` - описание новой архитектуры
- [ ] `UI_KIT.md` - документация UI компонентов
- [ ] `REDUX_GUIDE.md` - гайд по Redux в проекте
- [ ] Обновить `CLAUDE.md` с новой структурой

---

**Автор:** Claude Code
**Дата создания:** 2026-01-26
**Статус:** 🚀 Готов к выполнению
