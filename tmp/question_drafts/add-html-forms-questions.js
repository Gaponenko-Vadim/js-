const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const basicsQuestions = [
  {
    question: 'Какова основная роль тега `form` в HTML?',
    options: [
      'Объединяет поля и задаёт правила отправки данных',
      'Задаёт стили и оформление элементов формы',
      'Подключает обработчики событий через скрипты',
      'Заменяет любые контейнеры на странице'
    ],
    correctAnswer: 0,
    explanation: 'Тег `form` объединяет поля и определяет, как они отправляются. Стилизация, скрипты и структура страницы решаются другими элементами и технологиями.'
  },
  {
    question: 'Какой атрибут указывает адрес, куда отправляются данные формы?',
    options: ['action', 'method', 'enctype', 'target'],
    correctAnswer: 0,
    explanation: '`action` содержит URL отправки. `method` задаёт способ передачи, `enctype` отвечает за формат данных, а `target` — за окно ответа.'
  },
  {
    question: 'Какой метод отправки добавляет данные формы прямо в URL?',
    options: ['GET', 'POST', 'PUT', 'PATCH'],
    correctAnswer: 0,
    explanation: 'При `GET` параметры попадают в адресную строку. `POST` и другие методы передают данные в теле запроса.'
  },
  {
    question: 'В каком случае по лекции стоит выбирать `method="post"`?',
    options: [
      'При регистрации, оплате или передаче пароля',
      'При поиске по каталогу или фильтрации',
      'При переходе по внутренним ссылкам',
      'При загрузке стилей страницы'
    ],
    correctAnswer: 0,
    explanation: 'Для регистрации и паролей нужен `POST`, чтобы не светить данные в URL. Поиск и фильтры обычно оставляют на `GET`.'
  },
  {
    question: 'Какие поля браузер отправляет при сабмите формы?',
    options: [
      'Только поля с атрибутом `name`',
      'Все элементы внутри `form`, включая заголовки',
      'Только поля с `id`',
      'Только видимые поля на экране'
    ],
    correctAnswer: 0,
    explanation: 'Форма отправляет только пары `name=value`. `id` нужен для связи с `label`, но сам по себе не участвует в отправке.'
  },
  {
    question: 'Как правильно связать подпись и поле ввода?',
    options: [
      'Указать `for` у `label` и такой же `id` у поля',
      'Сделать `name` одинаковым у `label` и поля',
      'Использовать `placeholder` вместо `label`',
      'Поместить `label` в `head` документа'
    ],
    correctAnswer: 0,
    explanation: 'Связка `label for` и `input id` делает подпись кликабельной и понятной. `placeholder` и `name` не создают такой связи.'
  },
  {
    question: 'Почему `placeholder` не заменяет `label`?',
    options: [
      'Подсказка исчезает при вводе, а подпись должна быть видимой',
      'Placeholder запрещён в формах',
      'Placeholder отправляется на сервер как значение',
      'Placeholder автоматически делает поле обязательным'
    ],
    correctAnswer: 0,
    explanation: 'Placeholder исчезает, как только пользователь начинает ввод. Подпись `label` остаётся видимой и понятной всегда.'
  },
  {
    question: 'Какой тип `input` включает базовую проверку формата email?',
    options: ['email', 'text', 'mail', 'address'],
    correctAnswer: 0,
    explanation: 'Тип `email` включает базовую проверку формата и подсказки браузера. `text`, `mail` и `address` не дают такой встроенной проверки.'
  },
  {
    question: 'Какой тип `input` логичен для телефона, чтобы показывалась нужная клавиатура?',
    options: ['tel', 'number', 'phone', 'digits'],
    correctAnswer: 0,
    explanation: 'Тип `tel` подсказывает мобильную клавиатуру с цифрами. `number` и вымышленные типы не предназначены для телефонов.'
  },
  {
    question: 'Как скрыть ввод пароля в форме?',
    options: ['type="password"', 'type="secret"', 'type="hidden"', 'type="secure"'],
    correctAnswer: 0,
    explanation: 'Тип `password` скрывает вводимые символы. `hidden` вообще не показывает поле, а остальные типы отображают текст.'
  },
  {
    question: 'Что делает общий `name` у радиокнопок?',
    options: [
      'Объединяет их в одну группу с выбором одного варианта',
      'Делает выбор множественным как у чекбокса',
      'Скрывает значения при отправке',
      'Отключает валидацию этих полей'
    ],
    correctAnswer: 0,
    explanation: 'Общий `name` превращает радиокнопки в группу с одним выбором. Разные `name` делают их независимыми.'
  },
  {
    question: 'Когда нужно использовать `checkbox`, а не `radio`?',
    options: [
      'Когда пользователь может выбрать несколько вариантов',
      'Когда нужен один вариант из списка',
      'Когда поле должно быть скрыто',
      'Когда требуется обязательное заполнение'
    ],
    correctAnswer: 0,
    explanation: 'Checkbox позволяет выбрать несколько пунктов. Radio предназначен для выбора одного варианта из группы.'
  },
  {
    question: 'Какой элемент подходит для многострочного комментария?',
    options: ['textarea', 'input type="text"', 'select', 'option'],
    correctAnswer: 0,
    explanation: 'Для длинного текста используется `textarea`. `input` и `select` предназначены для коротких или фиксированных значений.'
  },
  {
    question: 'Какая связка тегов помогает логически группировать поля?',
    options: ['fieldset + legend', 'div + span', 'section + h1', 'table + tr'],
    correctAnswer: 0,
    explanation: 'Связка `fieldset` и `legend` группирует связанные поля и улучшает доступность. Обычные контейнеры не несут такого смысла.'
  },
  {
    question: 'Какой атрибут обязателен для отправки файлов через форму?',
    options: [
      'enctype="multipart/form-data"',
      'target="_blank"',
      'method="get"',
      'autocomplete="off"'
    ],
    correctAnswer: 0,
    explanation: 'Для файлов нужен `enctype="multipart/form-data"`. `method`, `target` и `autocomplete` не отвечают за передачу бинарных данных.'
  },
  {
    question: 'Что произойдёт, если добавить `input type="file"` без `enctype="multipart/form-data"`?',
    options: [
      'Файл не передастся корректно вместе с формой',
      'Форма автоматически переключится на POST',
      'Файл будет отправлен как обычный текст',
      'Браузер запретит отправку всей формы'
    ],
    correctAnswer: 0,
    explanation: 'Без `multipart/form-data` файл не отправится корректно. Браузер не переключает метод автоматически и не превращает файл в текст.'
  },
  {
    question: 'Какой тип кнопки НЕ отправляет форму?',
    options: ['button', 'submit', 'reset', 'image'],
    correctAnswer: 0,
    explanation: 'Кнопка `type="button"` не вызывает отправку. `submit` отправляет форму, `reset` сбрасывает значения, `image` работает как submit.'
  },
  {
    question: 'Какой тип у тега `button` внутри формы по умолчанию?',
    options: ['submit', 'button', 'reset', 'none'],
    correctAnswer: 0,
    explanation: 'Внутри формы `button` по умолчанию работает как submit. Поэтому важно явно задавать `type`, если это не отправка.'
  },
  {
    question: 'Если у `option` задан `value`, что уйдёт в запросе при выборе?',
    options: [
      'Значение `value` выбранной option',
      'Текст подписи рядом со списком',
      'ID элемента select',
      'Все варианты списка одной строкой'
    ],
    correctAnswer: 0,
    explanation: 'Если у `option` задан `value`, в запрос уходит именно оно. Текст опции может быть другим и не отправляется как значение.'
  },
  {
    question: 'Что запрещено делать с HTML‑формами?',
    options: [
      'Вкладывать одну форму в другую',
      'Размещать несколько форм на странице',
      'Использовать fieldset для групп',
      'Добавлять несколько кнопок отправки'
    ],
    correctAnswer: 0,
    explanation: 'Вкладывать одну форму в другую нельзя — это ломает отправку и валидацию. Несколько отдельных форм на странице допустимы.'
  }
];

const validationQuestions = [
  {
    question: 'Что делает атрибут `required` у поля?',
    options: [
      'Браузер не отправит форму, если поле пустое',
      'Автоматически исправляет ввод',
      'Скрывает поле до заполнения',
      'Ограничивает длину значения'
    ],
    correctAnswer: 0,
    explanation: 'Атрибут `required` блокирует отправку, пока поле пустое. Он не исправляет значение и не задаёт длину.'
  },
  {
    question: 'Как работает `required` для чекбокса?',
    options: [
      'Чекбокс должен быть отмечен',
      'Чекбокс должен быть скрыт',
      'Чекбокс становится радио‑кнопкой',
      'Чекбокс игнорируется при отправке'
    ],
    correctAnswer: 0,
    explanation: 'Для checkbox `required` означает, что галочка должна быть поставлена. Это не превращает его в radio и не скрывает поле.'
  },
  {
    question: 'Что даёт `type="email"` валидации?',
    options: [
      'Проверяет формат email и наличие @ и домена',
      'Разрешает ввод только латиницы',
      'Делает поле обязательным',
      'Шифрует введённый email'
    ],
    correctAnswer: 0,
    explanation: 'Тип `email` включает встроенную проверку формата и подсказки браузера. Он не делает поле обязательным и не шифрует ввод.'
  },
  {
    question: 'Что ограничивают `minlength` и `maxlength`?',
    options: [
      'Длину текстового значения',
      'Количество полей в форме',
      'Ширину поля на странице',
      'Скорость ввода'
    ],
    correctAnswer: 0,
    explanation: 'Эти атрибуты задают минимальную и максимальную длину строки. Они не управляют шириной поля или количеством элементов.'
  },
  {
    question: 'Для каких типов чаще применяются `min`, `max`, `step`?',
    options: [
      'number, date, range',
      'email, url, tel',
      'text, password, search',
      'checkbox, radio, file'
    ],
    correctAnswer: 0,
    explanation: 'Диапазоны применяют к числам, датам и слайдерам. Для текстовых и флажковых полей эти атрибуты не подходят.'
  },
  {
    question: 'Что задаёт атрибут `pattern`?',
    options: [
      'Шаблон формата через регулярное выражение',
      'Цвет подсветки ошибки',
      'Автозаполнение браузера',
      'Адрес отправки формы'
    ],
    correctAnswer: 0,
    explanation: '`pattern` задаёт регулярное выражение, которое проверяет формат. Он не влияет на цвет или адрес отправки.'
  },
  {
    question: 'Какой шаблон соответствует формату +7 и 10 цифр без пробелов?',
    options: [
      '\\+7[0-9]{10}',
      '\\+7[0-9]{3} [0-9]{3} [0-9]{2} [0-9]{2}',
      '7[0-9]{10}',
      '\\+7[0-9]{9}'
    ],
    correctAnswer: 0,
    explanation: 'Шаблон `\\+7[0-9]{10}` требует плюс, 7 и десять цифр подряд. Остальные варианты либо требуют пробелы, либо имеют неверную длину.'
  },
  {
    question: 'Зачем использовать `aria-describedby` у поля?',
    options: [
      'Связать поле с текстом подсказки или ошибки',
      'Сделать поле обязательным',
      'Скрыть поле от скринридеров',
      'Отключить встроенную валидацию'
    ],
    correctAnswer: 0,
    explanation: '`aria-describedby` связывает поле с подсказкой или ошибкой по `id`. Это делает сообщение доступным для скринридеров.'
  },
  {
    question: 'Что означает `aria-invalid="true"`?',
    options: [
      'Поле содержит ошибку и отмечено как невалидное',
      'Поле становится только для чтения',
      'Поле автоматически очищается',
      'Форма блокирует отправку навсегда'
    ],
    correctAnswer: 0,
    explanation: '`aria-invalid` сообщает, что поле содержит ошибку. Он не переводит поле в readonly и не очищает значение.'
  },
  {
    question: 'Какой атрибут помогает озвучивать динамические сообщения об ошибках?',
    options: ['aria-live', 'aria-hidden', 'aria-label', 'aria-expanded'],
    correctAnswer: 0,
    explanation: '`aria-live` предназначен для озвучивания динамических сообщений. Другие aria‑атрибуты решают другие задачи.'
  },
  {
    question: 'Что означает `aria-live="polite"`?',
    options: [
      'Сообщения озвучиваются без прерывания пользователя',
      'Сообщения озвучиваются немедленно и перебивают',
      'Сообщения игнорируются скринридером',
      'Сообщения видны только визуально'
    ],
    correctAnswer: 0,
    explanation: '`polite` озвучивает изменения без прерывания пользователя. Для мгновенного прерывания используется `assertive`.'
  },
  {
    question: 'Для чего нужен `autocomplete`?',
    options: [
      'Подставлять сохранённые данные браузера',
      'Запрещать ввод специальных символов',
      'Скрывать поле до заполнения',
      'Отправлять форму автоматически'
    ],
    correctAnswer: 0,
    explanation: '`autocomplete` разрешает браузеру подставлять сохранённые значения. Это ускоряет заполнение и снижает ошибки.'
  },
  {
    question: 'Что делает `inputmode`?',
    options: [
      'Подсказывает тип клавиатуры на мобильных',
      'Заменяет тип поля и его валидацию',
      'Ставит поле в режим чтения',
      'Определяет адрес отправки формы'
    ],
    correctAnswer: 0,
    explanation: '`inputmode` подсказывает тип клавиатуры на мобильных устройствах. Он не заменяет тип поля и не выполняет валидацию.'
  },
  {
    question: 'Что делает `novalidate` на теге `form`?',
    options: [
      'Отключает встроенную валидацию браузера для всей формы',
      'Делает все поля обязательными',
      'Удаляет сообщения об ошибках',
      'Отправляет форму в фоновом режиме'
    ],
    correctAnswer: 0,
    explanation: '`novalidate` отключает встроенную проверку у всей формы. Он не делает поля обязательными и не меняет метод отправки.'
  },
  {
    question: 'Что делает `formnovalidate` на кнопке?',
    options: [
      'Отключает проверку только для этой отправки',
      'Переключает метод на GET',
      'Сбрасывает форму перед отправкой',
      'Делает кнопку недоступной'
    ],
    correctAnswer: 0,
    explanation: '`formnovalidate` отключает проверку только для конкретной кнопки отправки. Остальные отправки формы всё равно проходят валидацию.'
  },
  {
    question: 'В каком случае уместно использовать `formnovalidate`?',
    options: [
      'При сохранении черновика без полной проверки',
      'При обычной регистрации пользователя',
      'Когда нужно усилить проверку',
      'Для блокировки отправки формы'
    ],
    correctAnswer: 0,
    explanation: 'Для черновика не требуется полное заполнение, поэтому `formnovalidate` уместен. Для основной отправки использовать его не нужно.'
  },
  {
    question: 'Чем `disabled` отличается от `readonly`?',
    options: [
      'disabled не отправляется и не фокусируется, readonly отправляется',
      'readonly не отправляется, disabled отправляется',
      'оба отправляются одинаково',
      'оба скрывают поле полностью'
    ],
    correctAnswer: 0,
    explanation: '`disabled` исключает поле из отправки и фокуса. `readonly` оставляет поле в форме и позволяет отправить его значение.'
  },
  {
    question: 'Когда лучше использовать `readonly`?',
    options: [
      'Когда значение нужно отправить, но редактировать нельзя',
      'Когда поле временно недоступно и не должно отправляться',
      'Когда нужно скрыть поле',
      'Когда нужно отключить автозаполнение'
    ],
    correctAnswer: 0,
    explanation: 'Если значение нужно показать и отправить, но запретить редактирование, используйте `readonly`. `disabled` удалит поле из отправки.'
  },
  {
    question: 'Почему нельзя показывать ошибку только цветом?',
    options: [
      'Часть пользователей не различает цвет, нужен текст',
      'Цвет автоматически выключает валидацию',
      'Цвет увеличивает размер формы',
      'Цвет запрещён в HTML'
    ],
    correctAnswer: 0,
    explanation: 'Ошибка только цветом недоступна для части пользователей и скринридеров. Текст ошибки и связь через `aria-describedby` делают её понятной.'
  },
  {
    question: 'Когда допустимо использовать `autocomplete="off"`?',
    options: [
      'Только если есть реальная причина безопасности',
      'Всегда по умолчанию',
      'Только для email',
      'Только для имени'
    ],
    correctAnswer: 0,
    explanation: 'Лекция рекомендует отключать автозаполнение только при реальной причине безопасности. По умолчанию `autocomplete` улучшает UX.'
  },
  {
    question: 'Какая проверка должна оставаться на сервере даже при HTML‑валидации?',
    options: [
      'Финальная проверка корректности и безопасности данных',
      'Проверка наличия `label`',
      'Проверка стилей формы',
      'Проверка наличия `div`'
    ],
    correctAnswer: 0,
    explanation: 'HTML‑валидация помогает пользователю, но финальная проверка всегда на сервере. Иначе можно обойти ограничения и отправить некорректные данные.'
  },
  {
    question: 'Какая комбинация улучшает ввод телефона и UX?',
    options: [
      '`inputmode="tel"` + `autocomplete="tel"` + `pattern`',
      '`minlength` + `maxlength` + `novalidate`',
      '`readonly` + `disabled`',
      '`formnovalidate` + `target="_blank"`'
    ],
    correctAnswer: 0,
    explanation: 'Для телефона полезны `inputmode` и `autocomplete`, а `pattern` задаёт формат. Другие комбинации не решают задачу удобного ввода.'
  },
  {
    question: 'Какой набор атрибутов соответствует паролю из лекции?',
    options: [
      '`required` + `minlength` + `maxlength` + `autocomplete="new-password"`',
      '`pattern` + `inputmode="tel"` + `readonly`',
      '`novalidate` + `disabled`',
      '`autocomplete="off"` + `type="text"`'
    ],
    correctAnswer: 0,
    explanation: 'В лекции пароль требует длину и `autocomplete="new-password"`, плюс обязательность. Другие варианты либо не проверяют длину, либо не связаны с паролем.'
  },
  {
    question: 'Где размещать общий текст ошибок, чтобы он был доступным?',
    options: [
      'В контейнере с `role="status"` и `aria-live`',
      'В `title` тега `form`',
      'В `head` документа',
      'Только в `placeholder`'
    ],
    correctAnswer: 0,
    explanation: 'Контейнер с `role="status"` и `aria-live` озвучивает ошибки и делает их доступными. `title` и `head` не предназначены для этого.'
  },
  {
    question: 'Чем опасен слишком строгий `pattern`?',
    options: [
      'Он блокирует корректные значения и повышает отказ',
      'Он автоматически удаляет все пробелы',
      'Он делает поле обязательным',
      'Он отключает автозаполнение'
    ],
    correctAnswer: 0,
    explanation: 'Слишком строгий `pattern` отсекает корректные варианты и повышает отказ. Поэтому шаблон нужно проверять на реальных данных.'
  },
  {
    question: 'Какой подход к `required` рекомендует лекция?',
    options: [
      'Делать обязательными только действительно нужные поля',
      'Ставить required везде, чтобы не было пустых полей',
      'Убирать required полностью',
      'Использовать required только для checkbox'
    ],
    correctAnswer: 0,
    explanation: 'Лучше требовать только действительно нужные поля, иначе пользователи бросают форму. Это прямо указано в best practices.'
  },
  {
    question: 'Что происходит со значением поля `disabled` при отправке?',
    options: [
      'Оно не отправляется вместе с формой',
      'Отправляется как пустая строка',
      'Отправляется как placeholder',
      'Автоматически становится readonly'
    ],
    correctAnswer: 0,
    explanation: '`disabled` полностью исключает значение из отправки формы. Поэтому сервер его не получит.'
  },
  {
    question: 'Если поле нужно временно отключить и не отправлять, что выбрать?',
    options: ['disabled', 'readonly', 'required', 'autocomplete'],
    correctAnswer: 0,
    explanation: 'Если поле временно недоступно и не должно отправляться, используется `disabled`. `readonly` оставит значение в отправке.'
  }
];

async function upsertQuestions({ testTitle, lectureTitle, questions }) {
  const test = await prisma.test.findFirst({ where: { title: testTitle } });
  if (!test) throw new Error(`Test not found: ${testTitle}`);

  const lecture = await prisma.lecture.findFirst({ where: { title: lectureTitle } });
  if (!lecture) throw new Error(`Lecture not found: ${lectureTitle}`);

  const maxOrder = await prisma.testQuestion.findFirst({
    where: { testId: test.id },
    orderBy: { order: 'desc' },
    select: { order: true }
  });

  let nextOrder = (maxOrder?.order || 0) + 1;

  for (const q of questions) {
    const existing = await prisma.question.findFirst({ where: { question: q.question } });
    let questionId;

    if (existing) {
      const updated = await prisma.question.update({
        where: { id: existing.id },
        data: {
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          lectureId: lecture.id
        }
      });
      questionId = updated.id;
      console.log(`updated: ${q.question}`);
    } else {
      const created = await prisma.question.create({
        data: {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          lectureId: lecture.id
        }
      });
      questionId = created.id;
      console.log(`created: ${q.question}`);
    }

    const linkExists = await prisma.testQuestion.findFirst({
      where: { testId: test.id, questionId }
    });

    if (!linkExists) {
      await prisma.testQuestion.create({
        data: {
          testId: test.id,
          questionId,
          order: nextOrder++
        }
      });
      console.log(`linked: ${testTitle} -> ${questionId}`);
    }
  }
}

async function main() {
  await upsertQuestions({
    testTitle: 'HTML: формы — основы',
    lectureTitle: 'HTML: формы — основы',
    questions: basicsQuestions
  });

  await upsertQuestions({
    testTitle: 'HTML: формы — валидация и UX',
    lectureTitle: 'HTML: формы — валидация и UX',
    questions: validationQuestions
  });
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
