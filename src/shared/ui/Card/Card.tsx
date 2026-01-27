import { ReactNode } from 'react';
import styles from './Card.module.scss';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = ''
}: CardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]} ${styles[padding]} ${className}`}>
      {children}
    </div>
  );
}
