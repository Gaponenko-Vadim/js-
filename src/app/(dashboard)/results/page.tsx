import type { Metadata } from 'next';
import ResultsPageContent from './ResultsPageContent';

export const metadata: Metadata = {
  title: 'Результаты тестов - REST API Trainer',
  description: 'История пройденных тестов: статистика по каждому тесту, лучшие результаты, все попытки прохождения. Просмотр результатов обычных и комбинированных тестов с детализацией ответов.',
  openGraph: {
    title: 'Результаты тестов - REST API Trainer',
    description: 'История и статистика пройденных тестов по REST API',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function ResultsPage() {
  return <ResultsPageContent />;
}
