import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const alt = 'Тест по REST API';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Image({ params }: Props) {
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
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontFamily: 'sans-serif',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 'bold' }}>Тест не найден</div>
          </div>
        ),
        { ...size }
      );
    }

    const difficultyLabels: Record<string, string> = {
      beginner: 'Начальный',
      intermediate: 'Средний',
      advanced: 'Продвинутый'
    };

    const difficultyLabel = difficultyLabels[test.difficulty] || test.difficulty;
    const difficultyColors: Record<string, string> = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    const difficultyColor = difficultyColors[test.difficulty] || '#6366f1';
    const questionCount = test.questions.length;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '60px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: 40,
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              REST API Trainer
            </div>
          </div>

          {/* Content Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: 'white',
              borderRadius: '20px',
              padding: '50px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            {/* Difficulty Badge */}
            <div
              style={{
                display: 'flex',
                marginBottom: '30px',
              }}
            >
              <div
                style={{
                  background: difficultyColor,
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: 24,
                  fontWeight: 'bold',
                }}
              >
                {difficultyLabel}
              </div>
              <div
                style={{
                  marginLeft: '20px',
                  background: '#e5e7eb',
                  color: '#374151',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: 24,
                  fontWeight: 'bold',
                }}
              >
                {questionCount} вопросов
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '20px',
                lineHeight: 1.2,
              }}
            >
              {test.title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 28,
                color: '#6b7280',
                lineHeight: 1.4,
              }}
            >
              {test.description}
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 'bold' }}>REST API Trainer</div>
          <div style={{ fontSize: 36, marginTop: '20px' }}>Интерактивные тесты по REST API</div>
        </div>
      ),
      { ...size }
    );
  }
}
