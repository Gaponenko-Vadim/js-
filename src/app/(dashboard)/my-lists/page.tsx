import type { Metadata } from 'next';
import MyListsPageContent from './MyListsPageContent';

export const metadata: Metadata = {
  title: 'Мои списки - REST API Trainer',
  description: 'Пользовательские списки тестов: создавайте собственные коллекции тестов для персонализированного обучения. Объединяйте тесты по темам и проходите комбинированные тесты из ваших списков.',
  openGraph: {
    title: 'Мои списки - REST API Trainer',
    description: 'Создание и управление персональными списками тестов',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function MyListsPage() {
  return <MyListsPageContent />;
}
