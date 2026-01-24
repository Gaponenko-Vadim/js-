import { RegisterForm } from '@/components/auth/RegisterForm';
import styles from '../auth.module.scss';

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <RegisterForm />
      </div>
    </div>
  );
}
