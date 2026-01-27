# Features - Модульная архитектура

Эта директория содержит функциональные модули (features) приложения.

## Принципы feature-based архитектуры

Каждый feature - это **изолированный модуль** с собственными:
- **components/** - React компоненты
- **hooks/** - Custom React hooks
- **store/** - Redux slices и RTK Query API
- **types/** - TypeScript типы
- **utils/** - Вспомогательные функции

## Структура features

```
features/
├── tests/           # Тесты (прохождение, список, фильтры)
├── results/         # Результаты тестов
├── lectures/        # Лекции и теория
└── pomodoro/        # Pomodoro таймер
```

## Правила работы с features

### ✅ DO (Правильно)
- Каждый feature независим и самодостаточен
- Переиспользуемые компоненты выносим в `shared/ui`
- Используем RTK Query для всех API вызовов
- Импортируем design tokens из `styles/tokens.scss`

### ❌ DON'T (Неправильно)
- Не импортировать компоненты из других features напрямую
- Не дублировать код между features
- Не использовать `fetch()` напрямую (только RTK Query)
- Не хардкодить стили (использовать tokens)

## Пример feature структуры

```
features/tests/
├── components/
│   ├── TestCard/
│   │   ├── TestCard.tsx
│   │   ├── TestCard.module.scss
│   │   └── index.ts
│   ├── TestQuestion/
│   └── TestTimer/
├── hooks/
│   ├── useTestTimer.ts
│   ├── useTestProgress.ts
│   └── useTestSubmit.ts
├── store/
│   ├── testsSlice.ts       # Redux slice
│   └── testsApi.ts         # RTK Query API
├── types/
│   └── index.ts            # TypeScript типы
└── utils/
    └── testHelpers.ts      # Вспомогательные функции
```

## Импорты

### Из других features (через barrel exports)
```typescript
import { TestCard } from '@/features/tests';
```

### Из shared
```typescript
import { Button } from '@/shared/ui';
import { useAuth } from '@/shared/hooks';
```

### Design tokens
```scss
@import '@/styles/tokens.scss';
@import '@/styles/utilities.scss';
```
