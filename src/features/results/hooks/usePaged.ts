import { useState } from 'react';

/** Renders a list progressively so large result sets don't load every thumbnail at once. */
export function usePaged<T>(items: T[], pageSize: number) {
  const [count, setCount] = useState(pageSize);
  return {
    visible: items.slice(0, count),
    hasMore: count < items.length,
    showMore: () => setCount((n) => n + pageSize),
  };
}
