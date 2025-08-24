<!-- src/lib/components/CO2RadialSlide.svelte -->
<script lang="ts">
  import { Slide, Transition } from '@animotion/core';
  import { animate } from '$lib/waapi';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import type { ApexOptions } from 'apexcharts';

  type Datum = { label: string; kg: number };

  // default data if none is passed in
  const defaultData: Datum[] = [
    { label: 'Travel',    kg: 420 },
    { label: 'Food',      kg: 280 },
    { label: 'Shopping',  kg: 190 },
    { label: 'Utilities', kg: 150 },
    { label: 'Services',  kg: 110 }
  ];

  // Runes props (no `export let`)
  let { data = defaultData } = $props<{ data?: Datum[] }>();

  // refs (Runes)
  let t1        = $state<HTMLParagraphElement | null>(null);
  let chartWrap = $state<HTMLDivElement | null>(null);
  let chartEl   = $state<HTMLDivElement | null>(null);

  let t2: HTMLParagraphElement | null = null;

  // ApexCharts instance handle
  let chartInstance: any = null;

  // reactive derived values
  const total: number     = $derived(data.reduce((sum: number, d: Datum) => sum + d.kg, 0));
  const series: number[]  = $derived(data.map((d: Datum) => d.kg));
  const labels: string[]  = $derived(data.map((d: Datum) => d.label));

  // make options reactive so it tracks `labels`/`total`
  const options = $derived<ApexOptions>({
    chart: { type: 'radialBar', animations: { enabled: false }, toolbar: { show: false } },
    labels,
    plotOptions: {
      radialBar: {
        dataLabels: {
          name:  { fontSize: '14px' },
          value: { fontSize: '16px', formatter: (v: number) => `${Math.round(v)} kg` },
          total: { show: true, label: 'Total', formatter: () => `${total} kg` }
        }
      }
    },
    stroke: { lineCap: 'round' },
    legend: { show: true, position: 'bottom' },
    tooltip: { y: { formatter: (v: number) => `${v} kg CO₂e` } }
  });

  onMount(async () => {
    if (!browser) return;

    // entrance animations
    if (t1) {
      t1.style.opacity = '0';
      await animate(
        t1,
        [
          { opacity: 0, transform: 'translateY(16px) scale(0.98)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ],
        { duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
    }
    if (chartWrap) {
      chartWrap.style.opacity = '0';
      await animate(
        chartWrap,
        [
          { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ],
        { duration: 600, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
    }

    // dynamically load ApexCharts core (browser-only)
    const Apex = await import('apexcharts');
    const ApexChartsCtor = (Apex as any).default;

    if (chartInstance?.destroy) chartInstance.destroy();
    chartInstance = new ApexChartsCtor(chartEl, { ...options, series });
    await chartInstance.render();
  });

  onDestroy(() => {
    if (chartInstance?.destroy) chartInstance.destroy();
    chartInstance = null;
  });

  // keep chart in sync if `data` (series/labels/total) changes after mount
  $effect(() => {
    if (browser && chartInstance) {
      chartInstance.updateOptions({ ...options, series }, false, true, false);
    }
  });
</script>

<!-- Render normally; no SSR issues since Apex loads in onMount -->
<Slide class="h-full place-content-center place-items-center p-4">
    <Transition
    do={async () => {
      if (t2) {
        t2.style.opacity = '0';
        await animate(
          t2,
          [
            { opacity: 0, transform: 'translateY(16px) scale(0.98)' },
            { opacity: 1, transform: 'translateY(0px) scale(1)' }
          ],
          { duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
        );
      }
    }}
  >
    <p bind:this={t2} class="text-7xl md:text-8xl font-bold drop-shadow-sm text-center">
      CO₂-Footprint
    </p>
  </Transition>
  <Transition>
    <div class="w-full max-w-3xl mx-auto grid gap-6">

      <div bind:this={chartWrap}>
        <div class="w-full rounded-lg border-0 p-4">
          <div class="pb-2">
            <h3 class="text-xl font-semibold leading-none tracking-tight">
              CO₂ by Spending Category
            </h3>
            <p class="text-sm text-muted-foreground">
              Total: <span class="font-semibold">{total} kg CO₂e</span>
            </p>
          </div>

          <div class="pt-2">
            <!-- Apex mount target needs explicit size -->
            <div bind:this={chartEl} style="width:100%; height:380px;" class="rounded-md"></div>

            <div class="mt-4 flex flex-wrap gap-2">
              {#each data as c}
                <span class="rounded-full border-0 px-3 py-1 transparent text-xs">
                  {c.label}: {c.kg} kg
                </span>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</Slide>
