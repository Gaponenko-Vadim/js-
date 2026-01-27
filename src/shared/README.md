# Shared - Общие ресурсы

Эта директория содержит **переиспользуемые компоненты, хуки и утилиты**, которые используются в разных features.

## Структура

```
shared/
├── ui/              # UI Kit компоненты
│   ├── Button/
│   ├── Card/
│   ├── Modal/
│   ├── Input/
│   ├── Spinner/
│   └── ...
├── layouts/         # Layout компоненты
│   ├── DashboardLayout/
│   └── AuthLayout/
├── hooks/           # Переиспользуемые hooks
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
├── api/
│   └── middleware/
│       └── authMiddleware.ts  # API middleware
├── utils/           # Вспомогательные функции
│   ├── format.ts
│   └── validation.ts
└── types/           # Общие TypeScript типы
    └── index.ts
```

## UI Kit компоненты (shared/ui)

Все компоненты в `shared/ui` должны:
- ✅ Использовать design tokens из `styles/tokens.scss`
- ✅ Быть полностью переиспользуемыми
- ✅ Иметь чёткий API (props interface)
- ✅ Поддерживать различные варианты (variants)
- ✅ Иметь примеры использования в комментариях

### Пример структуры UI компонента

```
shared/ui/Button/
├── Button.tsx           # Основной компонент
├── Button.module.scss   # Стили
├── Button.types.ts      # TypeScript типы
└── index.ts             # Barrel export
```

### Пример Button компонента

```typescript
// Button.types.ts
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Button.tsx
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  onClick
}: ButtonProps) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
}
```

## Hooks (shared/hooks)

Переиспользуемые хуки для общей логики:

```typescript
// useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

## API Middleware (shared/api/middleware)

Централизованная логика для API запросов:

```typescript
// authMiddleware.ts
export async function withAuth(handler: AuthHandler) {
  return async (req: Request, context: any) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return handler(req, { user, session, params: context.params });
  };
}
```

## Правила

### ✅ DO
- Создавать компоненты максимально generic
- Документировать props interface
- Использовать design tokens
- Тестировать переиспользуемые компоненты

### ❌ DON'T
- Не добавлять бизнес-логику в shared компоненты
- Не создавать слишком специфичные компоненты
- Не дублировать код между shared и features
