import type { Attachment } from 'svelte/attachments';

// Scorrimento orizzontale per passare al precedente (-1) o al successivo (1);
// le frecce restano per chi non lo usa. Uno scorrimento in verticale non conta.
export function swipe(onSwipe: (direction: -1 | 1) => void): Attachment<HTMLElement> {
  return (el) => {
    let start: { x: number; y: number } | null = null;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = t ? { x: t.clientX, y: t.clientY } : null;
    };
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!start || !t) return;
      const dx = t.clientX - start.x, dy = t.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
      onSwipe(dx > 0 ? -1 : 1);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  };
}
