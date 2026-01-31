type TestStructuredDataProps = {
  test: {
    title: string;
    description: string;
    difficulty: string;
    questions: Array<{ id?: string }>;
  };
};

export default function TestStructuredData({ test }: TestStructuredDataProps) {
  const difficultyLabels: Record<string, string> = {
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый'
  };

  const difficultyLabel = difficultyLabels[test.difficulty] || test.difficulty;
  const questionCount = test.questions.length;
  const examDuration = questionCount * 20; // секунды

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: test.title,
    description: test.description,
    educationalLevel: difficultyLabel,
    numberOfQuestions: questionCount,
    timeRequired: `PT${Math.floor(examDuration / 60)}M${examDuration % 60}S`,
    educationalUse: 'assessment',
    inLanguage: 'ru',
    provider: {
      '@type': 'Organization',
      name: 'REST API Trainer',
      description: 'Платформа для изучения REST API и Requirements Engineering'
    },
    learningResourceType: 'Interactive Assessment',
    interactivityType: 'active',
    about: {
      '@type': 'Thing',
      name: 'REST API',
      description: 'REST API, HTTP методы, статус коды, архитектурные паттерны'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
