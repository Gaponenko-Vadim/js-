'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './DashboardHeader.module.scss';

export default function DashboardHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <h1 className={styles.title} onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }}>
          Мамин программист
        </h1>
      </div>

      <nav className={styles.nav}>
        <Link href="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}>
          Главная
        </Link>
        <Link href="/tests" className={`${styles.navLink} ${isActive('/tests') ? styles.active : ''}`}>
          Тесты
        </Link>
        <Link href="/my-lists" className={`${styles.navLink} ${isActive('/my-lists') ? styles.active : ''}`}>
          📋 Мои списки
        </Link>
        <Link href="/results" className={`${styles.navLink} ${isActive('/results') ? styles.active : ''}`}>
          Результаты
        </Link>
        <Link href="/pomodoro" className={`${styles.navLink} ${isActive('/pomodoro') ? styles.active : ''}`}>
          Помодоро
        </Link>
      </nav>

      <div className={styles.rightSection}>
        <span className={styles.userName}>
          {session?.user?.name || session?.user?.email}
        </span>
        <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.logoutButton}>
          Выйти
        </button>
      </div>
    </header>
  );
}
