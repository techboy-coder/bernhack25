<script lang="ts">
  import { Slide, Transition } from '@animotion/core';
  import { animate } from '$lib/waapi';
  import { onMount } from 'svelte';

  // 👉 data (adjust or pass in as props)
  const { healthyAmount = 120, unhealthyAmount = 80 } = $props();

  // refs
  let t3: HTMLParagraphElement;
  let healthyBox: HTMLDivElement;
  let unhealthyBox: HTMLDivElement;

  type Drop = {
    char: string;
    el?: HTMLSpanElement | null;
    // target position
    x?: number; y?: number;
    // per-drop delay
    d?: number;
    // pile assignment
    col?: number; level?: number;
  };

  const healthyPalette = ['🍎','🥑','🥕','🥦','🍓','🥜','🥬','🍇'];
  const unhealthyPalette = ['🍔','🍟','🍕','🍩','🍪','🌭','🥤','🧁'];

  const DUR = { headline: 650, drop: 500, gap: 80 };

  const total = Math.max(healthyAmount + unhealthyAmount, 1);
  const healthyRatio = healthyAmount / total;
  const unhealthyRatio = unhealthyAmount / total;

  let healthyDrops = $state<Drop[]>([]);
  let unhealthyDrops = $state<Drop[]>([]);
  $effect(() => { unhealthyDrops; });

  function makeDrops(count: number, palette: string[]): Drop[] {
    return Array.from({ length: count }, (_, i) => ({
      char: palette[i % palette.length],
      d: i * DUR.gap
    }));
  }

  /**
   * Lay out drops as piles along the bottom of the box.
   * We create N virtual columns. Each incoming drop is assigned the lowest
   * available level in a column (stack), then we compute (x, y).
   */
  function layoutPiles(box: HTMLDivElement, drops: Drop[]) {
    const rect = box.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // compute column count based on width & emoji size
    const approxEmoji = Math.max(24, Math.min(40, w * 0.035)); // px
    const colWidth = approxEmoji * 1.2; // some breathing space
    const columns = Math.max(3, Math.floor((w - 24) / colWidth)); // min 3 cols
    const padX = 12;
    const padY = 12;
    const baseY = h - padY; // floor
    const levelStep = approxEmoji * 0.9;

    // track levels per column
    const heights = Array(columns).fill(0);

    // bias toward center columns for nicer heap shapes
    const centerBias = () => {
      const r = Math.random();
      // quadratic bias toward center index
      const idx = Math.floor(((r + Math.random()) / 2) * columns);
      const center = Math.floor(columns / 2);
      return Math.min(columns - 1, Math.max(0, Math.round((idx + center) / 2)));
    };

    for (const d of drops) {
      const col = centerBias();
      const level = heights[col]++;
      d.col = col;
      d.level = level;

      const xCenter = padX + col * colWidth + colWidth / 2;
      const jitterX = (Math.random() - 0.5) * (colWidth * 0.35);
      const jitterR = (Math.random() - 0.5) * 8;

      d.x = xCenter + jitterX;
      d.y = baseY - level * levelStep;
      if (d.el) {
        d.el.style.left = `${d.x}px`;
        d.el.style.top = `${d.y}px`;
        d.el.style.opacity = '0';
        d.el.style.transform = `translateY(-24px) scale(0.92) rotate(${jitterR}deg)`;
      }
    }
  }

  async function countUp(node: HTMLElement, hVal: number, uVal: number, lag = 140, duration = 900) {
    const start = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    return new Promise<void>((resolve) => {
      function step(now: number) {
        const t = now - start;
        const pH = Math.min(1, t / duration);
        const pU = Math.min(1, Math.max(0, (t - lag) / duration));
        const h = Math.round(hVal * ease(pH));
        const u = Math.round(uVal * ease(pU));
        node.textContent = `🍎 ${h}    |     ${u} 🍔`;
        if (pH < 1 || pU < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  // soft "bounce" fall to target
  async function dropIn(d: Drop) {
    if (!d.el || d.y == null) return;
    const startTop = -32 - Math.random() * 24; // start slightly above
    const targetY = d.y;
    await animate(
      d.el,
      [
        { opacity: 0, transform: `translateY(${startTop - targetY}px) scale(0.92)` },
        { opacity: 1, offset: 0.4, transform: `translateY(${(startTop - targetY) * 0.2}px) scale(1)` },
        { opacity: 1, offset: 0.78, transform: `translateY(${(startTop - targetY) * -0.06}px) scale(1)` },
        { opacity: 1, transform: 'translateY(0px) scale(1)' }
      ],
      { duration: DUR.drop, delay: d.d ?? 0, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
    );
  }

  async function run() {
    // headline in
    t3.style.opacity = '0';
    await animate(
      t3,
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: DUR.headline, easing: 'cubic-bezier(0.22,1,0.36,1)' }
    );

    // decide how many emojis to drop (proportional)
    const MAX = 28; // tweak
    const hCount = Math.max(4, Math.round(MAX * healthyRatio));
    const uCount = Math.max(4, Math.round(MAX * unhealthyRatio));
    healthyDrops = makeDrops(hCount, healthyPalette);
    unhealthyDrops = makeDrops(uCount, unhealthyPalette);

    // wait a tick so the each-block renders, then layout
    await Promise.resolve();
    layoutPiles(healthyBox, healthyDrops);
    layoutPiles(unhealthyBox, unhealthyDrops);

    // animate drops + counter
    const all = [...healthyDrops.map(dropIn), ...unhealthyDrops.map(dropIn)];
    void countUp(t3, healthyAmount, unhealthyAmount, 160, 1000);
    await Promise.all(all);
  }

  // reflow piles on resize
  let ro: ResizeObserver;
  onMount(() => {
    ro = new ResizeObserver(() => {
      layoutPiles(healthyBox, healthyDrops);
      layoutPiles(unhealthyBox, unhealthyDrops);
    });
    ro.observe(healthyBox);
    ro.observe(unhealthyBox);
    return () => ro.disconnect();
  });
</script>

<style>
  .basket {
    position: relative;
    overflow: visible; /* allow slight overshoot on bounce */
    border-radius: 20px;
    /* transparent look (no background / border / shadow) */
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 8px;
  }

  .basket-emoji {
    position: absolute;
    font-size: clamp(20px, 3.6vw, 36px);
    line-height: 1;
    user-select: none;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.12));
    will-change: transform, opacity;
    transform-origin: center bottom;
  }

  /* optional thin floor line for visual grounding (transparent by default) */
  .floor::after {
    content: "";
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 8px;
    height: 1px;
    background: rgba(0,0,0,0.08);
    border-radius: 999px;
  }

  .label {
    position: absolute;
    top: 2px;
    left: 3px;
    font-weight: 600;
    color: rgba(0,0,0,0.6);
  }
</style>

<Slide class="h-full place-content-center place-items-center">
  <Transition do={run}>
    <div class="flex flex-col items-center gap-6">
      <!-- headline -->
      <p bind:this={t3} class="text-4xl md:text-6xl font-bold drop-shadow-sm text-center"></p>

      <!-- piles (transparent) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-[92vw] max-w-[1100px]">
        <!-- healthy -->
        <div class="basket floor md:h-[360px] h-[280px]" bind:this={healthyBox} aria-label="Healthy pile">
          <div class="label" style="margin-left:50%">Healthy</div>
          {#each healthyDrops as d (d)}
            <span class="basket-emoji" bind:this={d.el}>{d.char}</span>
          {/each}
        </div>

        <!-- unhealthy -->
        <div class="basket floor md:h-[360px] h-[280px]" bind:this={unhealthyBox} aria-label="Unhealthy pile">
          <div class="label" style="margin-right:50%">Unhealthy</div>
          {#each unhealthyDrops as d (d)}
            <span class="basket-emoji" bind:this={d.el}>{d.char}</span>
          {/each}
        </div>
      </div>
    </div>
  </Transition>
</Slide>
