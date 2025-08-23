<script lang="ts">
  import { Slide, Transition } from '@animotion/core';
  import { animate } from '$lib/waapi';

  let t2: HTMLParagraphElement;

  // --- Bubble data (tweak values/colors as you like) ---
  type Metric = { value: number; color: string; label?: string };
  const metrics: Metric[] = [
    { value: 32, color: '#3a86ff', label: 'A' },
    { value: 68, color: '#ff006e', label: 'B' },
    { value: 91, color: '#8338ec', label: 'C' }
  ];

  // Refs for the three bubbles and their number spans
  let bubbleEls: HTMLDivElement[] = [];
  let numberEls: HTMLSpanElement[] = [];

  // Overlay ref
  let overlayEl: HTMLDivElement;

  // Tunables
  const DURATION = 8000;     // ms for each bubble count/float (slower)
  const STAGGER  = 220;      // ms between bubbles (slightly more stagger)
  const MIN_R = 38;          // px minimum bubble radius
  const MAX_R = 120;         // px maximum bubble radius (smaller than before)
  const START_Y = 50;        // px starting offset (down)
  const END_Y = -20;         // px end offset (up)

  // Overlay tunables
  const NUM_BG_BUBBLES = 28;   // how many tiny intro bubbles
  const BG_MIN = 4;            // px (even smaller min)
  const BG_MAX = 54;           // px (much larger max for more size difference)
  const BG_SPAN_MS = [1800, 3400]; // duration range per bubble (slower)
  const BG_DELAY_MS = [0, 1200];    // launch window (slightly longer)
  const BG_FADE_MS = 380;          // fade the whole overlay out at the end (slower)

  // helpers
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
  const map = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
    outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin || 1);
  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  // --- INTRO OVERLAY: quick burst of tiny rising bubbles ---
  async function introBubblesOverlay() {
    if (!overlayEl) return;

    const promises: Promise<unknown>[] = [];
    overlayEl.innerHTML = ''; // reset
    overlayEl.style.opacity = '1';

    for (let i = 0; i < NUM_BG_BUBBLES; i++) {
      const b = document.createElement('div');
      b.className = 'bg-bubble';

      // randomize size/x/blur/sway and color tint borrowed from your palette
      const s = rand(BG_MIN, BG_MAX);
      const x = rand(2, 98); // vw %
      const blur = Math.random() < 0.35 ? rand(1, 3) : 0;
      const tint = ['#3a86ff', '#ff006e', '#8338ec'][Math.floor(Math.random()*3)];
      const dur = rand(BG_SPAN_MS[0], BG_SPAN_MS[1]);
      const delay = rand(BG_DELAY_MS[0], BG_DELAY_MS[1]);
      const sway = rand(-10, 10); // px x drift

      b.style.width = `${s}px`;
      b.style.height = `${s}px`;
      b.style.left = `${x}vw`;
      b.style.filter = blur ? `blur(${blur}px)` : '';
      b.style.background = `radial-gradient(60% 60% at 35% 35%, ${tint}99, ${tint})`;
      b.style.boxShadow = '0 6px 18px #0003';

      overlayEl.appendChild(b);

      // WAAPI float-up per bubble
      const anim = b.animate(
        [
          { transform: `translate(-${sway/2}px, 8vh) scale(0.9)`, opacity: 0 },
          { transform: `translate(${sway/2}px, -72vh) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${sway}px, -92vh) scale(1.05)`, opacity: 0 }
        ],
        { duration: dur, delay, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'both' }
      ).finished;

      promises.push(anim);
    }

    // wait for all to finish, then fade out container and clear it
    await Promise.all(promises);
    await overlayEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: BG_FADE_MS, easing: 'ease-out', fill: 'forwards' }).finished;
    overlayEl.innerHTML = '';
  }

  async function runBubbles() {
    // find max to map size
    const maxVal = Math.max(...metrics.map(m => m.value));

    // schedule each bubble with a small stagger
    await Promise.all(
      metrics.map((m, i) => animateBubble(i, m, maxVal, STAGGER * i))
    );
  }

  function animateBubble(index: number, metric: Metric, maxVal: number, delay: number) {
    const el = bubbleEls[index];
    const numEl = numberEls[index];
    if (!el || !numEl) return Promise.resolve();

    // prepare
    const finalR = map(metric.value, 0, maxVal, MIN_R, MAX_R);
    const startR = MIN_R;

    // initial styles
    el.style.width = `${startR * 2}px`;
    el.style.height = `${startR * 2}px`;
    el.style.transform = `translateY(${START_Y}px) scale(0.9)`;
    el.style.background = `radial-gradient(60% 60% at 35% 35%, ${metric.color}99, ${metric.color})`;
    el.style.boxShadow = `0 16px 48px #0003`;
    numEl.textContent = '0';

    // position animation (rise + slight scale) — WAAPI
    const rising = el.animate(
      [
        { transform: `translateY(${START_Y}px) scale(0.90)` },
        { transform: `translateY(${END_Y}px)  scale(1.00)` }
      ],
      { duration: DURATION, delay, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
    ).finished;

    // number counting + radius growth with rAF (to stay in sync with WAAPI time)
    const startTime = performance.now() + delay;

    return new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = clamp((now - startTime) / DURATION, 0, 1);
        if (t <= 0) {
          requestAnimationFrame(tick);
          return;
        }

        // ease for counting/growth (same curve)
        const eased = cubicBezier(0.22, 1, 0.36, 1)(t);

        // update number
        const current = Math.round(eased * metric.value);
        numEl.textContent = String(current);

        // grow bubble
        const r = lerp(startR, finalR, eased);
        el.style.width = `${r * 2}px`;
        el.style.height = `${r * 2}px`;

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(tick);
    }).then(() => rising);
  }

  // cubic-bezier evaluator for rAF side
  // Lightweight implementation via unit-cubic Bezier; fine for this use.
  function cubicBezier(p0x: number, p0y: number, p1x: number, p1y: number) {
    // From https://drafts.csswg.org/css-easing/#cubic-bezier-algo (compact)
    const cx = 3 * p0x, bx = 3 * (p1x - p0x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p0y, by = 3 * (p1y - p0y) - cy, ay = 1 - cy - by;
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
    const slopeX  = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

    function solveT(x: number) {
      let t = x, i = 0;
      for (; i < 8; i++) {
        const x2 = sampleX(t) - x;
        const d = slopeX(t);
        if (Math.abs(x2) < 1e-6 || d === 0) break;
        t -= x2 / d;
      }
      return t;
    }

    return (x: number) => sampleY(solveT(x));
  }
</script>

<Slide class="relative h-full place-content-center place-items-center">

  <!-- Overlay for intro bubbles (now triggered together with big bubbles) -->
  <div
    class="overlay pointer-events-none"
    bind:this={overlayEl}
    aria-hidden="true"
  ></div>

  <!-- Title -->
  <Transition
    do={async () => {
      t2.style.opacity = '0';
      t2.style.filter = 'blur(12px)';
      await animate(
        t2,
        [
          { opacity: 0, filter: 'blur(12px)', transform: 'scale(0.96)' },
          { opacity: 1, filter: 'blur(0px)',  transform: 'scale(1.02)' }
        ],
        { duration: 500, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
      await animate(t2, [{ transform: 'scale(1.02)' }, { transform: 'scale(1.00)' }], { duration: 250, easing: 'ease-out' });
    }}
  >
    <p bind:this={t2} class="text-6xl md:text-7xl font-bold drop-shadow-sm text-center">
      Most buyed products
    </p>
  </Transition>

  <!-- Bubbles -->
  <Transition class="mt-16" do={async () => { await Promise.all([introBubblesOverlay(), runBubbles()]); }}>
    <div class="bubbles">
      {#each metrics as m, i}
        <div class="bubble" bind:this={bubbleEls[i]}>
          <span class="num" bind:this={numberEls[i]}></span>
          {#if m.label}
            <span class="label">{m.label}</span>
          {/if}
        </div>
      {/each}
    </div>
  </Transition>
</Slide>

<style>
  /* overlay covers the slide while intro bubbles run, then fades */
  .overlay {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 10; /* above content but pointer-events-none */
  }
  :global(.bg-bubble) {
    position: absolute;
    bottom: 0;
    border-radius: 9999px;
    opacity: 0;
    will-change: transform, opacity;
  }

  .bubbles {
    margin-top: 2.5rem;
    display: flex;
    gap: 2.5rem;
    align-items: end;
    justify-content: center;
    min-height: 220px; /* space for the rise */
  }
  .bubble {
    border-radius: 9999px;
    display: grid;
    place-items: center;
    color: white;
    position: relative;
    filter: drop-shadow(0 10px 28px rgba(0,0,0,0.18));
    will-change: transform, width, height;
    user-select: none;
  }
  .num {
    font-weight: 800;
    font-size: clamp(1.25rem, 2.4vw, 2.25rem);
    line-height: 1;
    text-shadow: 0 2px 10px rgba(0,0,0,0.25);
  }
  .label {
    position: absolute;
    bottom: -1.6rem;
    font-size: 0.9rem;
    color: #ffffffcc;
    text-shadow: 0 1px 6px rgba(0,0,0,0.2);
  }
</style>
