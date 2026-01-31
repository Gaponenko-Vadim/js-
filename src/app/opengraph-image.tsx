import { ImageResponse } from 'next/og';

export const alt = 'REST API Trainer - Изучайте REST API';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
        {/* Content Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            background: 'white',
            borderRadius: '20px',
            padding: '60px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            justifyContent: 'center',
          }}
        >
          {/* Logo/Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '30px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            REST API Trainer
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 40,
              color: '#374151',
              marginBottom: '40px',
              lineHeight: 1.4,
            }}
          >
            Интерактивное приложение для изучения REST API и Requirements Engineering
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f3f4f6',
                padding: '16px 28px',
                borderRadius: '12px',
                fontSize: 28,
                color: '#374151',
              }}
            >
              📚 42+ теста
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f3f4f6',
                padding: '16px 28px',
                borderRadius: '12px',
                fontSize: 28,
                color: '#374151',
              }}
            >
              📖 Теория
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f3f4f6',
                padding: '16px 28px',
                borderRadius: '12px',
                fontSize: 28,
                color: '#374151',
              }}
            >
              ⏱️ Помодоро
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            marginTop: '30px',
            fontSize: 24,
            color: 'white',
            opacity: 0.8,
          }}
        >
          Три уровня сложности • Марафоны • Автосохранение прогресса
        </div>
      </div>
    ),
    { ...size }
  );
}
