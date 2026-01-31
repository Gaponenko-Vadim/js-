import type { Metadata } from 'next';
import TestsPageContent from './TestsPageContent';

export const metadata: Metadata = {
  title: 'Тесты по REST API - REST API Trainer',
  description: 'Интерактивные тесты по REST API и требованиям к ПО: три уровня сложности (Beginner, Intermediate, Advanced), марафоны для разных профессий, автосохранение прогресса. Два режима прохождения: обучение с доступом к лекциям и экзамен с ограничением по времени.',
  openGraph: {
    title: 'Тесты по REST API - REST API Trainer',
    description: 'Интерактивные тесты по REST API: три уровня сложности, марафоны для разных профессий, автосохранение прогресса',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function TestsPage() {
  return <TestsPageContent />;
}
