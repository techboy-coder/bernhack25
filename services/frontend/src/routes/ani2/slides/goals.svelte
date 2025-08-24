<script lang="ts">
  import { Slide, Transition } from '@animotion/core';
  import { animate } from '$lib/waapi';

  type Props = {
    achieved?: number;
    total?: number;
    stepMs?: number;
    cursorStiffness?: number;
  };
  const { achieved = 7, total = 10, stepMs = 60, cursorStiffness = 10 } = $props();

  let titleEl = $state<HTMLParagraphElement | null>(null);
  let markerEl = $state<HTMLDivElement | null>(null);
  let countEl  = $state<HTMLSpanElement | null>(null);

  let achievedListEl = $state<HTMLUListElement | null>(null);
  let missedListEl   = $state<HTMLUListElement | null>(null);

  const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const posPct = (a: number, t: number) => (1 - clamp(t === 0 ? 0 : a / t)) * 100;

  const safeAchieved = Math.max(0, Math.min(achieved, total));
  const missedCount = Math.max(0, total - safeAchieved);

  // Limit the number of displayed goals
  const achievedGoals = Array.from({ length: Math.min(safeAchieved, 3) }, (_, i) => `Goal ${i + 1}`);
  const missedGoals = Array.from({ length: Math.min(missedCount, 2) }, (_, i) => `Goal ${safeAchieved + i + 1}`);

  let showAchievedHeader = $state(false);
  let showMissedHeader = $state(false);
  let achievedShown = $state(0);
  let missedShown = $state(0);

  let hasRun = $state(false);

  function buildSequence(target: number, n: number) {
    const tMinus3 = Math.max(0, target - 3);
    const seq: number[] = [];
    for (let i = 0; i <= n; i++) seq.push(i);
    for (let i = n - 1; i >= tMinus3; i--) seq.push(i);
    for (let i = tMinus3 + 1; i <= target; i++) seq.push(i);
    const out: number[] = [];
    for (const v of seq) if (out[out.length - 1] !== v) out.push(v);
    return out;
  }

  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

  async function revealHeader(el: HTMLElement | null) {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    await animate(
      el,
      [
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0px)' }
      ],
      { duration: 350, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
    );
  }

  async function revealListItems(
    listEl: HTMLUListElement | null,
    count: number,
    incShown: () => void,
    perItemMs = 120
  ) {
    if (!listEl) return;
    for (let i = 0; i < count; i++) {
      incShown();
      await nextFrame();
      const li = listEl.querySelector('li:last-child') as HTMLLIElement | null;
      if (li) {
        li.style.opacity = '0';
        li.style.transform = 'translateY(6px) scale(0.98)';
        await animate(
          li,
          [
            { opacity: 0, transform: 'translateY(6px) scale(0.98)' },
            { opacity: 1, transform: 'translateY(0px) scale(1)' }
          ],
          { duration: 250, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
        );
      }
      await delay(perItemMs);
    }
  }

  async function runAnimations() {
    if (hasRun) return;
    hasRun = true;

    if (!titleEl || !markerEl || !countEl) await nextFrame();
    if (!titleEl || !markerEl || !countEl) return;

    titleEl.style.opacity = '0';
    titleEl.style.transform = 'translateY(8px)';
    countEl.textContent = '0';
    markerEl.style.left = `${posPct(0, total)}%`;

    animate(
      titleEl,
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0px)' }
      ],
      { duration: 600, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
    );

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      countEl.textContent = String(safeAchieved);
      markerEl.style.left = `${posPct(safeAchieved, total)}%`;
      showAchievedHeader = true;
      achievedShown = achievedGoals.length;
      showMissedHeader = true;
      missedShown = missedGoals.length;
      return;
    }

    let targetValue = 0;
    let markerLeft = posPct(0, total);
    let last = performance.now();
    let rafId = 0;

    const smooth = (now: number) => {
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      const targetLeft = posPct(targetValue, total);
      const distance = Math.abs(targetLeft - markerLeft);
      const dynamicStiffness = cursorStiffness * (0.3 + 0.7 * clamp(distance / 100, 0, 1));
      const alpha = 1 - Math.exp(-dynamicStiffness * dt);
      markerLeft += (targetLeft - markerLeft) * alpha;
      markerEl!.style.left = `${markerLeft}%`;
      rafId = requestAnimationFrame(smooth);
    };

    rafId = requestAnimationFrame(smooth);

    const seq = buildSequence(safeAchieved, total);
    for (const v of seq) {
      targetValue = v;
      countEl.textContent = String(v);
      await delay(stepMs);
    }

    //cancelAnimationFrame(rafId);
    countEl.textContent = String(safeAchieved);
    markerEl.style.left = `${posPct(safeAchieved, total)}%`;

    // --- wait longer before lists start ---
    await delay(1500);

    if (achievedGoals.length > 0) {
      showAchievedHeader = true;
      await nextFrame();
      await revealHeader(achievedListEl?.previousElementSibling as HTMLElement | null);
      await revealListItems(achievedListEl, achievedGoals.length, () => (achievedShown += 1), 110);
    }

    if (missedGoals.length > 0) {
      showMissedHeader = true;
      await nextFrame();
      await revealHeader(missedListEl?.previousElementSibling as HTMLElement | null);
      await revealListItems(missedListEl, missedGoals.length, () => (missedShown += 1), 110);
    }
  }
</script>

<Slide class="h-full place-content-center place-items-center gap-6">
  <Transition do={runAnimations}>
    <div class="flex flex-col items-center gap-4 w-full max-w-3xl">
      <p bind:this={titleEl} class="text-4xl md:text-5xl font-bold drop-shadow-sm text-center">
        Reached Saving Goals
      </p>

      <p class="text-lg md:text-xl font-medium text-neutral-800">
        You have reached <span bind:this={countEl} class="tabular-nums">0</span> / {total} saving goals
      </p>

      <!-- Gradient bar -->
      <div class="relative w-full h-6 md:h-7 rounded-full overflow-hidden shadow-sm" aria-label="Savings progress bar">
        <div class="absolute inset-0"
             style="background:linear-gradient(to right,#2563eb 0%,#22c55e 25%,#eab308 50%,#f97316 75%,#ef4444 100%);"></div>
        <div class="absolute inset-0 pointer-events-none"
             style="background:linear-gradient(to bottom,rgba(255,255,255,0.25),rgba(0,0,0,0));mix-blend:overlay;"></div>
        <div bind:this={markerEl}
             class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
             style="left: 100%;"
             aria-label="Current position"
             aria-live="polite">
          <div class="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white ring-2 ring-black/20 shadow-sm"></div>
        </div>
        <div class="absolute inset-0 rounded-full ring-1 ring-black/10 pointer-events-none"></div>
      </div>

      <!-- Lists -->
      <div class="w-full mt-2 space-y-2">
        {#if showAchievedHeader}
          <h3 class="text-base md:text-lg font-semibold text-neutral-900">You have achieved:</h3>
          <ul bind:this={achievedListEl} style="list-style-type: none;" class="list-disc pl-6 space-y-1">
            {#each achievedGoals.slice(0, achievedShown) as label (label)}
              <li class="text-sm md:text-base text-neutral-800">{label}</li>
            {/each}
          </ul>
        {/if}

        {#if showMissedHeader}
          <div class="mt-6">
            <h3 class="text-base md:text-lg font-semibold text-neutral-900">In progress:</h3>
            <ul bind:this={missedListEl} style="list-style-type: none;" class="list-disc pl-6 space-y-1">
              {#each missedGoals.slice(0, missedShown) as label (label)}
                <li class="text-sm md:text-base text-neutral-800">{label}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  </Transition>
</Slide>
