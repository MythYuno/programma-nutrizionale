import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// jsdom non implementa le Web Animations che Svelte usa per le transizioni:
// basta un'animazione che finisce subito.
if (!Element.prototype.animate) {
  Element.prototype.animate = function () {
    const anim = {
      onfinish: null as null | (() => void),
      cancel() {},
      finish() {},
      currentTime: 0,
      finished: Promise.resolve(),
    };
    queueMicrotask(() => anim.onfinish?.());
    return anim as unknown as Animation;
  };
}
