import { Resend } from 'resend';

/**
 * Отправить письмо с подтверждением email при регистрации
 * Использует Resend API (работает через HTTPS, не блокируется)
 */
export async function sendEmailVerificationEmail(email: string, token: string) {
  const confirmationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

  // Проверка наличия API ключа Resend
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY не настроен в .env');
    console.log(`
    ====================================
    📧 EMAIL ПОДТВЕРЖДЕНИЕ РЕГИСТРАЦИИ (DEV MODE)
    ====================================
    Кому: ${email}
    Тема: Подтверждение email в IT Skills Trainer

    Перейдите по ссылке для подтверждения вашего email:
    ${confirmationUrl}

    Ссылка действительна 24 часа.
    ====================================
    `);
    return;
  }

  // Инициализация Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Отправка через Resend API
    const { data, error } = await resend.emails.send({
      from: 'IT Skills Trainer <onboarding@resend.dev>', // Временный домен от Resend
      to: [email],
      subject: 'Подтверждение email в IT Skills Trainer',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f6f9fc;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              margin: 0 0 20px 0;
              font-size: 24px;
              color: #1a1a1a;
            }
            .content p {
              margin: 0 0 16px 0;
              color: #4a5568;
              font-size: 16px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 40px;
              background: #667eea;
              color: white !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
              transition: all 0.2s;
            }
            .button:hover {
              background: #5568d3;
              box-shadow: 0 6px 8px rgba(102, 126, 234, 0.4);
            }
            .link-box {
              background: #f7fafc;
              padding: 16px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .link-text {
              word-break: break-all;
              color: #667eea;
              font-size: 14px;
              margin: 0;
            }
            .warning {
              background: #fef3c7;
              padding: 16px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #f59e0b;
            }
            .warning p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              padding: 30px;
              background: #f7fafc;
              color: #718096;
              font-size: 14px;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 IT Skills Trainer</h1>
              <p>Образовательная платформа для IT-специалистов</p>
            </div>
            <div class="content">
              <h2>Добро пожаловать!</h2>
              <p>Спасибо за регистрацию на платформе <strong>IT Skills Trainer</strong>. Для завершения регистрации необходимо подтвердить ваш email адрес.</p>

              <div class="button-container">
                <a href="${confirmationUrl}" class="button">Подтвердить email</a>
              </div>

              <p style="text-align: center; color: #718096; font-size: 14px;">Или скопируйте ссылку ниже в браузер:</p>

              <div class="link-box">
                <p class="link-text">${confirmationUrl}</p>
              </div>

              <div class="warning">
                <p>⏰ <strong>Ссылка действительна 24 часа.</strong> После этого срока потребуется повторная регистрация.</p>
              </div>

              <p style="color: #a0aec0; font-size: 14px;">Если вы не регистрировались на IT Skills Trainer, просто проигнорируйте это письмо.</p>
            </div>
            <div class="footer">
              <p><strong>IT Skills Trainer</strong></p>
              <p>© 2026 Все права защищены</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Ошибка Resend API:', error);
      throw error;
    }

    console.log(`✅ Email подтверждения отправлен на ${email} (ID: ${data?.id})`);
  } catch (error) {
    console.error('❌ Ошибка отправки email через Resend:', error);
    // Логируем ссылку в консоль как fallback
    console.log(`
    ====================================
    ⚠️ FALLBACK: Email не отправлен, но вот ссылка подтверждения:
    ${confirmationUrl}
    ====================================
    `);
    // НЕ выбрасываем ошибку - разрешаем регистрацию продолжиться
  }
}
