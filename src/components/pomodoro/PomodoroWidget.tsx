'use client';

import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { startTimer, pauseTimer, TIMER_SETTINGS } from '@/store/pomodoroSlice';
import { useEffect, useState, useRef } from 'react';
import styles from './PomodoroWidget.module.scss';

export default function PomodoroWidget() {
  const dispatch = useAppDispatch();
  const { mode, timeLeft, isRunning, hasStarted } = useAppSelector((state) => state.pomodoro);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Ждем монтирования компонента на клиенте для избежания ошибок гидрации
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Восстанавливаем позицию из localStorage или устанавливаем по умолчанию
    const savedPosition = localStorage.getItem('pomodoroWidgetPosition');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        console.error('Error parsing saved position:', e);
        // Устанавливаем позицию по умолчанию в правом верхнем углу
        setPosition({ x: window.innerWidth - 220, y: 20 });
      }
    } else {
      // Устанавливаем позицию по умолчанию в правом верхнем углу
      setPosition({ x: window.innerWidth - 220, y: 20 });
    }
  }, []);

  // Обработчики drag and drop
  const handleMouseDown = (e: React.MouseEvent) => {
    // Игнорируем клики по кнопке управления
    if ((e.target as HTMLElement).closest('button') || !position) {
      return;
    }

    setIsDragging(true);
    hasMovedRef.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: position.x,
      elemY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      // Определяем, было ли движение больше 5 пикселей
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > 5) {
        hasMovedRef.current = true;
      }

      const newX = dragRef.current.elemX + deltaX;
      const newY = dragRef.current.elemY + deltaY;

      // Ограничиваем движение границами экрана
      const maxX = window.innerWidth - 200; // примерная ширина виджета
      const maxY = window.innerHeight - 100; // примерная высота виджета

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Сохраняем позицию в localStorage
        localStorage.setItem('pomodoroWidgetPosition', JSON.stringify(position));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  // Функция форматирования времени
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Не рендерим на сервере для избежания ошибок гидрации
  if (!mounted || !position) {
    return null;
  }

  // Определяем начальное время для текущего режима
  const initialTime = TIMER_SETTINGS[mode];

  // Показываем виджет если:
  // - таймер запущен ИЛИ
  // - таймер был запущен хотя бы раз (hasStarted) ИЛИ
  // - время не равно начальному (значит таймер был изменен)
  if (!isRunning && !hasStarted && timeLeft === initialTime) {
    return null;
  }

  const getModeLabel = () => {
    switch (mode) {
      case 'work':
        return '🎯 Работа';
      case 'short_break':
        return '☕ Перерыв';
      case 'long_break':
        return '🌟 Большой перерыв';
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work':
        return styles.work;
      case 'short_break':
        return styles.shortBreak;
      case 'long_break':
        return styles.longBreak;
    }
  };

  const handleWidgetClick = () => {
    // Переходим на страницу помодоро только если не было перетаскивания
    if (!hasMovedRef.current) {
      router.push('/pomodoro');
    }
    // Сбрасываем флаг движения после клика
    hasMovedRef.current = false;
  };

  return (
    <div
      className={`${styles.widget} ${getModeColor()} ${isDragging ? styles.dragging : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleWidgetClick}
    >
      <div className={styles.content}>
        <span className={styles.mode}>{getModeLabel()}</span>
        <span className={styles.time}>{formatTime(timeLeft)}</span>
      </div>
      <button
        className={styles.controlButton}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(isRunning ? pauseTimer() : startTimer());
        }}
      >
        {isRunning ? '⏸' : '▶'}
      </button>
    </div>
  );
}
