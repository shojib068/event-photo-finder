import type { ReactNode } from 'react';

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error'; children: ReactNode }) {
  const style = tone === 'error' ? 'bg-red-50 text-red-800 ring-red-200' : 'bg-amber-50 text-amber-900 ring-amber-200';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl p-4 text-sm ring-1 ${style}`}>
      {children}
    </div>
  );
}
