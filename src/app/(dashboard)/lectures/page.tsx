import type { Metadata } from 'next';
import LecturesPageContent from './LecturesPageContent';

export const metadata: Metadata = {
  title: 'Лекции - REST API Trainer',
  description: 'Теоретические материалы по REST API и требованиям к ПО. Лекции с простыми объяснениями, практическими сценариями из реальных проектов, разбором типичных ошибок и best practices. Markdown контент с подсветкой кода.',
  openGraph: {
    title: 'Лекции - REST API Trainer',
    description: 'Теоретические материалы по REST API и требованиям к ПО с практическими примерами',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function LecturesPage() {
  return <LecturesPageContent />;
}
