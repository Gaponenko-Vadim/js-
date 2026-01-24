'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './LectureModal.module.scss';

interface Lecture {
  id: string;
  title: string;
  topic: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface LectureModalProps {
  questionId?: string;
  lectureId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LectureModal({ questionId, lectureId, isOpen, onClose }: LectureModalProps) {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!questionId && !lectureId) return;

    const fetchLecture = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = '';
        if (questionId) {
          url = `/api/lectures/by-question/${questionId}`;
        } else if (lectureId) {
          url = `/api/lectures/${lectureId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Не удалось загрузить лекцию');
        }

        const data = await response.json();
        setLecture(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchLecture();
  }, [isOpen, questionId, lectureId]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{lecture?.title || 'Лекция'}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Загрузка лекции...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>❌ {error}</p>
            </div>
          )}

          {lecture && !loading && (
            <div className={styles.markdown}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lecture.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
