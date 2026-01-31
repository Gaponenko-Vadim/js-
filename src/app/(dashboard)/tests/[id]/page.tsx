import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import TestPageContent from './TestPageContent';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const test = await prisma.test.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        difficulty: true,
        questions: {
          select: { id: true }
        }
      }
    });

    if (!test) {
      return {
        title: 'Тест не найден - REST API Trainer',
        description: 'Запрошенный тест не найден'
      };
    }

    const difficultyLabels: Record<string, string> = {
      beginner: 'Начальный',
      intermediate: 'Средний',
      advanced: 'Продвинутый'
    };

    const difficultyLabel = difficultyLabels[test.difficulty] || test.difficulty;
    const questionCount = test.questions.length;

    return {
      title: `${test.title} - REST API Trainer`,
      description: `${test.description} | Уровень сложности: ${difficultyLabel} | Вопросов: ${questionCount} | Два режима прохождения: обучение с доступом к лекциям и экзамен с ограничением по времени (${questionCount * 20} секунд).`,
      openGraph: {
        title: `${test.title} - REST API Trainer`,
        description: `${test.description} | ${difficultyLabel} уровень | ${questionCount} вопросов`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${test.title} - REST API Trainer`,
        description: `${test.description} | ${difficultyLabel} уровень`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Тест - REST API Trainer',
      description: 'Интерактивный тест по REST API'
    };
  }
}

export default function TestPage() {
  return <TestPageContent />;
}
