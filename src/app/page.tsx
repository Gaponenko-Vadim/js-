import Link from 'next/link';
import styles from './page.module.scss';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Мамин программист</h1>
        <p className={styles.description}>
          Изучайте информационные технологии с интерактивными тестами и таймером Помодоро
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>📚 Тесты</h3>
            <p>Интерактивные тесты по REST API и требованиям к ПО</p>
          </div>
          <div className={styles.feature}>
            <h3>📖 Лекции</h3>
            <p>Теоретические материалы по каждой теме</p>
          </div>
          <div className={styles.feature}>
            <h3>⏱️ Помодоро Таймер</h3>
            <p>Повышайте продуктивность обучения</p>
          </div>
          <div className={styles.feature}>
            <h3>📊 Результаты</h3>
            <p>История пройденных тестов</p>
          </div>
        </div>

        <div className={styles.buttons}>
          <Link href="/register" className={styles.primaryButton}>
            Начать обучение
          </Link>
          <Link href="/login" className={styles.secondaryButton}>
            Войти
          </Link>
        </div>
      </main>
    </div>
  );
}
