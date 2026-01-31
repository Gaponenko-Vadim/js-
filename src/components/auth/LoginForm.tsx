'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import styles from './AuthForm.module.scss';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Обработка URL параметров для отображения сообщений
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');
    const emailParam = searchParams.get('email');

    // Верификация email
    if (successParam === 'EmailVerified') {
      setInfo('Email успешно подтвержден! Теперь можете войти.');
    } else if (successParam === 'AlreadyVerified') {
      setInfo('Email уже был подтвержден.');
    } else if (successParam === 'RegistrationSuccess' && emailParam) {
      setInfo(
        `Регистрация успешна! На email ${emailParam} отправлено письмо с подтверждением. Перейдите по ссылке из письма.`
      );
    }
    // Ошибки
    else if (errorParam === 'TokenExpired') {
      setError('Ссылка подтверждения истекла. Попробуйте зарегистрироваться заново.');
    } else if (errorParam === 'InvalidToken' || errorParam === 'TokenNotFound') {
      setError('Недействительная ссылка подтверждения.');
    } else if (errorParam === 'VerificationFailed') {
      setError('Не удалось подтвердить email. Попробуйте позже.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Вход</h2>

        {error && <div className={styles.error}>{error}</div>}
        {info && <div className={styles.info}>{info}</div>}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />

        <Input
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </Button>

        <p className={styles.link}>
          Нет аккаунта? <a href="/register">Зарегистрироваться</a>
        </p>
      </form>
    </Card>
  );
}
