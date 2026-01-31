# Руководство по внесению вклада

Спасибо за интерес к проекту REST API Trainer! Этот документ поможет вам начать разработку.

---

## 🚀 Быстрый старт

### 1. Клонируйте репозиторий

```bash
git clone <repository-url>
cd rest-api-trainer
npm install
```

### 2. Настройте окружение

Создайте `.env` файл:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rest_api_trainer"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Запустите БД и применить миграции

```bash
npx prisma migrate dev
npm run seed
```

### 4. Запустите dev сервер

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

---

## 📚 Изучите документацию

**Начните с этих документов:**

1. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Полная архитектура проекта
   - Структура папок и файлов
   - Технологический стек
   - Архитектурные паттерны
   - Модели данных

2. **[docs/FEATURE_DEVELOPMENT_GUIDE.md](docs/FEATURE_DEVELOPMENT_GUIDE.md)** - Как добавлять новые фичи
   - Создание новых страниц
   - Добавление API endpoints
   - Работа с БД
   - Примеры кода

3. **[CLAUDE.md](CLAUDE.md)** - Быстрая справка
   - Основные команды
   - Структура проекта
   - Ключевые паттерны

---

## 🎯 Что можно улучшить

### Добавить новые тесты
- Создайте TypeScript скрипт в `scripts/`
- Следуйте [docs/QUESTION_CREATION_GUIDE.md](docs/QUESTION_CREATION_GUIDE.md)
- Проверьте на дублирование вопросов

### Добавить новые лекции
- Создайте TypeScript скрипт в `scripts/`
- Следуйте [docs/LECTURE_CREATION_GUIDE.md](docs/LECTURE_CREATION_GUIDE.md)
- Markdown контент с примерами

### Добавить новую фичу
- Изучите [docs/FEATURE_DEVELOPMENT_GUIDE.md](docs/FEATURE_DEVELOPMENT_GUIDE.md)
- Следуйте Feature-based архитектуре
- Создайте модель → API → UI

### Улучшить UI/UX
- CSS Modules + SCSS
- Design tokens в `src/styles/tokens.scss`
- Responsive дизайн обязателен

---

## 🔄 Процесс разработки

### 1. Создайте ветку

```bash
git checkout -b feature/your-feature-name
```

### 2. Разработка

```bash
npm run dev          # Dev сервер
npm run lint         # Проверка линтером
npm run build        # Проверка сборки
```

### 3. Commit

```bash
git add .
git commit -m "feat: добавить новую фичу"
```

**Формат commit message:**
- `feat:` - новая фича
- `fix:` - исправление бага
- `docs:` - изменения документации
- `style:` - форматирование, отступы
- `refactor:` - рефакторинг кода
- `test:` - добавление тестов
- `chore:` - обновление зависимостей

### 4. Push и Pull Request

```bash
git push origin feature/your-feature-name
```

Создайте Pull Request с описанием:
- Что добавлено/исправлено
- Скриншоты (если UI изменения)
- Проверьте чек-лист

---

## ✅ Чек-лист перед PR

- [ ] Код следует существующим паттернам
- [ ] TypeScript без ошибок
- [ ] `npm run build` проходит успешно
- [ ] `npm run lint` без ошибок
- [ ] Responsive дизайн работает
- [ ] Консоль браузера без ошибок
- [ ] Prisma миграции созданы (если добавлена модель)
- [ ] Документация обновлена (если нужно)

---

## 📝 Code Style

### TypeScript

```typescript
// ✅ ХОРОШО
interface User {
  id: string;
  email: string;
  name: string | null;
}

// ❌ ПЛОХО
interface User {
  id: any;
  email: any;
}
```

### React Components

```typescript
// ✅ ХОРОШО: Server Component → Client Component
// page.tsx
export default function Page() {
  return <PageContent />;
}

// PageContent.tsx
'use client';
export function PageContent() {
  const [state, setState] = useState();
}

// ❌ ПЛОХО: 'use client' в page.tsx
'use client';
export default function Page() {
  const [state, setState] = useState();
}
```

### CSS/SCSS

```scss
// ✅ ХОРОШО: использование токенов
@use '@/styles/tokens.scss' as *;

.button {
  padding: $spacing-md;
  background: $color-primary;
}

// ❌ ПЛОХО: хардкод
.button {
  padding: 16px;
  background: #667eea;
}
```

---

## 🤔 Вопросы?

- Откройте [Issue](https://github.com/your-repo/issues)
- Изучите документацию в `docs/`
- Посмотрите существующий код для примеров

---

**Спасибо за вклад в проект!** 🎉
