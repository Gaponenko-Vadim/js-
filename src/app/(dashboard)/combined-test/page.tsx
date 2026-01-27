'use client';

import { Suspense } from 'react';
import CombinedTestContent from './CombinedTestContent';

export default function CombinedTestPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>}>
      <CombinedTestContent />
    </Suspense>
  );
}
