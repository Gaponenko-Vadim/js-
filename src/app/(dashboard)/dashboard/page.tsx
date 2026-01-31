import type { Metadata } from 'next';
import DashboardPageContent from './DashboardPageContent';

export const metadata: Metadata = {
  title: 'Дашборд - REST API Trainer',
  description: 'Главная панель REST API Trainer: быстрый доступ к тестам, лекциям, таймеру Помодоро и результатам. Изучайте информационные технологии эффективно.',
  openGraph: {
    title: 'Дашборд - REST API Trainer',
    description: 'Главная панель для изучения REST API и Requirements Engineering',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function DashboardPage() {
  return <DashboardPageContent />;
}
