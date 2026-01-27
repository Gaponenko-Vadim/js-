import styles from './Spinner.module.scss';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white';
  fullscreen?: boolean;
  text?: string;
}

export function Spinner({
  size = 'md',
  variant = 'primary',
  fullscreen = false,
  text
}: SpinnerProps) {
  const spinnerElement = (
    <div className={`${styles.spinner} ${styles[size]} ${styles[variant]}`} role="status" aria-label="Загрузка">
      <div className={styles.spinnerCircle} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className={styles.fullscreen}>
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
}
