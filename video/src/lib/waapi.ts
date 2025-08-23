// Web Animations API helper (promise-based)
export const animate = (
  el: Element,
  keyframes: Keyframe[],
  opts: KeyframeAnimationOptions
) =>
  new Promise<void>((resolve) => {
    const a = (el as HTMLElement).animate(keyframes, { fill: 'forwards', ...opts });
    a.addEventListener('finish', () => resolve());
  });
