/**
 * LectureContent Component
 *
 * Renders lecture markdown content
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './LectureContent.module.scss';
import type { LectureContentProps } from '../../types';

export function LectureContent({ content }: LectureContentProps) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
