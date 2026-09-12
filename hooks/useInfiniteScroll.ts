import { useEffect, RefObject } from 'react';

export function useInfiniteScroll(
  ref: RefObject<HTMLElement | null>,
  onIntersect: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersect();
      },
      { rootMargin: '200px', threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, onIntersect, enabled]);
}
