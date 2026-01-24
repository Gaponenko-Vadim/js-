# 🎯 Руководство по работе с новой архитектурой Many-to-Many

## ✅ Что было сделано

### Изменения в базе данных

1. **Добавлены новые таблицы:**
   - `CategoryTest` - связь Category ↔ Test (Many-to-Many)
   - `Collection` - коллекции (сборные программы обучения)
   - `CollectionTest` - связь Collection ↔ Test (Many-to-Many)

2. **Обновлены существующие модели:**
   - `Category` - добавлена иерархия (parent/children)
   - `Test` - теперь может быть в нескольких категориях и коллекциях

3. **Созданы коллекции:**
   - 📊 Системный аналитик (38 тестов)
   - 🧪 QA Engineer (37 тестов)
   - 💻 Frontend Developer (18 тестов)
   - ⚙️ Backend Developer (39 тестов)
   - 🌐 Fullstack Developer (40 тестов)

---

## 📊 Текущее состояние

```
КАТЕГОРИИ (2):
├─ 🌐 REST API (24 теста)
└─ 📋 Требования к ПО (27 тестов)

КОЛЛЕКЦИИ (5):
├─ 📊 Системный аналитик (38 тестов)
├─ 🧪 QA Engineer (37 тестов)
├─ 💻 Frontend Developer (18 тестов)
├─ ⚙️ Backend Developer (39 тестов)
└─ 🌐 Fullstack Developer (40 тестов)

ТЕСТЫ: 51 уникальный тест
```

---

## 🚀 Как использовать новую архитектуру

### 1. Добавление теста в несколько категорий

```typescript
// Создаем тест
const newTest = await prisma.test.create({
  data: {
    title: "Новый тест",
    description: "Описание",
    difficulty: "beginner",
    tags: ["backend", "frontend"]
  }
});

// Добавляем в категорию REST API
await prisma.categoryTest.create({
  data: {
    categoryId: restApiCategoryId,
    testId: newTest.id,
    order: 1
  }
});

// Добавляем в категорию Requirements
await prisma.categoryTest.create({
  data: {
    categoryId: requirementsCategoryId,
    testId: newTest.id,
    order: 1
  }
});

// Один тест теперь в ДВУ категориях! ✅
```

### 2. Получение категории с тестами

```typescript
const category = await prisma.category.findUnique({
  where: { slug: 'rest-api' },
  include: {
    tests: {
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true
          }
        }
      },
      orderBy: { order: 'asc' }
    }
  }
});

// Доступ к тестам:
category.tests.forEach(ct => {
  console.log(ct.test.title); // Название теста
  console.log(ct.order);      // Порядок в категории
});
```

### 3. Получение коллекции с тестами

```typescript
const collection = await prisma.collection.findUnique({
  where: { slug: 'system-analyst-full' },
  include: {
    tests: {
      include: {
        test: true
      },
      orderBy: { order: 'asc' }
    }
  }
});

console.log(collection.name);           // "Системный аналитик: Полная программа"
console.log(collection.estimatedHours); // 35
console.log(collection.tests.length);   // 38
```

### 4. Получение всех категорий, в которых находится тест

```typescript
const testWithCategories = await prisma.test.findUnique({
  where: { id: testId },
  include: {
    categories: {
      include: {
        category: true
      }
    },
    collections: {
      include: {
        collection: true
      }
    }
  }
});

console.log('Тест находится в категориях:');
testWithCategories.categories.forEach(ct => {
  console.log(`- ${ct.category.name}`);
});

console.log('Тест находится в коллекциях:');
testWithCategories.collections.forEach(ct => {
  console.log(`- ${ct.collection.name}`);
});
```

### 5. Создание новой категории

```typescript
const newCategory = await prisma.category.create({
  data: {
    name: "Базы данных",
    slug: "databases",
    description: "SQL, NoSQL, ORM, индексы",
    icon: "💾",
    order: 3
  }
});

// Добавляем существующие тесты
await prisma.categoryTest.createMany({
  data: [
    { categoryId: newCategory.id, testId: test1Id, order: 1 },
    { categoryId: newCategory.id, testId: test2Id, order: 2 }
  ]
});
```

### 6. Создание новой коллекции

```typescript
const newCollection = await prisma.collection.create({
  data: {
    name: "DevOps Engineer: Полная программа",
    slug: "devops-engineer-full",
    description: "Docker, Kubernetes, CI/CD",
    icon: "🔧",
    type: "profession",
    targetRole: "devops",
    estimatedHours: 45,
    level: "advanced",
    order: 6
  }
});

// Добавляем тесты из разных категорий
await prisma.collectionTest.createMany({
  data: [
    {
      collectionId: newCollection.id,
      testId: dockerTestId,
      order: 1,
      isRequired: true
    },
    {
      collectionId: newCollection.id,
      testId: k8sTestId,
      order: 2,
      isRequired: true
    },
    {
      collectionId: newCollection.id,
      testId: cicdTestId,
      order: 3,
      isRequired: false // Опциональный тест!
    }
  ]
});
```

### 7. Перемещение теста между категориями

```typescript
// Удаляем из старой категории
await prisma.categoryTest.delete({
  where: {
    categoryId_testId: {
      categoryId: oldCategoryId,
      testId: testId
    }
  }
});

// Добавляем в новую
await prisma.categoryTest.create({
  data: {
    categoryId: newCategoryId,
    testId: testId,
    order: 1
  }
});
```

### 8. Изменение порядка тестов в категории

```typescript
// Обновляем порядок
await prisma.categoryTest.update({
  where: {
    categoryId_testId: {
      categoryId: categoryId,
      testId: testId
    }
  },
  data: {
    order: 5 // Новый порядок
  }
});
```

---

## 📋 Полезные скрипты

### Проверка состояния БД

```bash
npx tsx scripts/check-categories.ts
```

### Создание новых коллекций

```bash
npx tsx scripts/create-example-collections.ts
```

### Восстановление связей (если что-то пошло не так)

```bash
npx tsx scripts/restore-category-links.ts
```

---

## 🎨 Примеры UI queries

### Страница категорий

```typescript
// GET /api/categories
const categories = await prisma.category.findMany({
  include: {
    _count: {
      select: { tests: true }
    }
  },
  orderBy: { order: 'asc' }
});
```

### Страница тестов категории

```typescript
// GET /api/categories/[slug]
const category = await prisma.category.findUnique({
  where: { slug },
  include: {
    tests: {
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            tags: true
          }
        }
      },
      orderBy: { order: 'asc' }
    }
  }
});
```

### Страница коллекций

```typescript
// GET /api/collections
const collections = await prisma.collection.findMany({
  where: { isPublished: true },
  include: {
    _count: {
      select: { tests: true }
    }
  },
  orderBy: { order: 'asc' }
});
```

### Страница коллекции с тестами

```typescript
// GET /api/collections/[slug]
const collection = await prisma.collection.findUnique({
  where: { slug },
  include: {
    tests: {
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            tags: true
          }
        }
      },
      orderBy: { order: 'asc' }
    }
  }
});
```

---

## 🔍 Отладка и проверка

### Открыть Prisma Studio

```bash
npx prisma studio
```

Там можно визуально посмотреть:
- Таблицу `CategoryTest` - связи категорий и тестов
- Таблицу `CollectionTest` - связи коллекций и тестов
- Таблицу `Collection` - все коллекции

### Проверить связи теста

```typescript
const test = await prisma.test.findUnique({
  where: { id: 'test-id' },
  include: {
    categories: {
      include: { category: true }
    },
    collections: {
      include: { collection: true }
    }
  }
});

console.log('Категории:', test.categories.map(ct => ct.category.name));
console.log('Коллекции:', test.collections.map(ct => ct.collection.name));
```

---

## ✅ Преимущества новой архитектуры

1. **Гибкость:**
   - Один тест может быть в нескольких категориях
   - Легко создавать сборные программы обучения
   - Нет дублирования тестов

2. **Масштабируемость:**
   - Добавить новую категорию = 1 запрос
   - Добавить новую коллекцию = 2 запроса
   - Легко управлять большим количеством контента

3. **Переиспользование:**
   - Изменения в тесте автоматически отражаются везде
   - Не нужно обновлять копии

4. **Персонализация:**
   - Коллекции для разных профессий
   - Опциональные и обязательные тесты
   - Порядок тестов настраивается индивидуально

---

## 📚 Следующие шаги

1. **Обновить API endpoints:**
   - ✅ GET `/api/categories` - список категорий
   - ⏳ GET `/api/categories/[slug]` - категория с тестами
   - ⏳ GET `/api/collections` - список коллекций
   - ⏳ GET `/api/collections/[slug]` - коллекция с тестами

2. **Обновить UI:**
   - ⏳ Страница выбора категорий
   - ⏳ Страница коллекций
   - ⏳ Навигация между категориями и коллекциями

3. **Создать админку:**
   - ⏳ Управление категориями
   - ⏳ Управление коллекциями
   - ⏳ Drag & drop для изменения порядка тестов

---

## 💡 Советы

- Используйте `order` поле для управления порядком тестов
- Используйте `isRequired` в коллекциях для опциональных тестов
- Используйте `type` и `targetRole` в коллекциях для фильтрации
- Индексы на связях обеспечивают быструю сортировку

---

**🎉 Готово! Новая архитектура готова к использованию!**
