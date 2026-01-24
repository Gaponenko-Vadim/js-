import { LoginForm } from '@/components/auth/LoginForm';
import styles from '../auth.module.scss';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <LoginForm />
      </div>
    </div>
  );
}
