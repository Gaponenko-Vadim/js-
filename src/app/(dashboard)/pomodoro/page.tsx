'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import styles from './pomodoro.module.scss';

export default function PomodoroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <DashboardHeader />

      <div className={styles.pageHeader}>
        <h1>Таймер Помодоро</h1>
        <p>Используйте технику Помодоро для продуктивного обучения</p>
      </div>

      <main className={styles.main}>
        <PomodoroTimer />

        <div className={styles.infoCard}>
          <h2>Как работает техника Помодоро?</h2>
          <ol>
            <li>Работайте 25 минут без отвлечений</li>
            <li>Сделайте короткий перерыв 5 минут</li>
            <li>После 4 помодоро - длинный перерыв 15 минут</li>
            <li>Повторяйте цикл для максимальной продуктивности</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
