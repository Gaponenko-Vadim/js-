import type { Metadata } from 'next';
import { Suspense } from 'react';
import CombinedTestContent from './CombinedTestContent';

export const metadata: Metadata = {
  title: 'Комбинированный тест - REST API Trainer',
  description: 'Комбинированный тест из нескольких тестов: объедините вопросы из разных тем в один тест. Создавайте персонализированные программы обучения из ваших списков тестов.',
  openGraph: {
    title: 'Комбинированный тест - REST API Trainer',
    description: 'Комбинированный тест из нескольких тем по REST API',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function CombinedTestPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>}>
      <CombinedTestContent />
    </Suspense>
  );
}
