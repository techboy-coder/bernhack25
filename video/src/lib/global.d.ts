declare module 'svelte-apexcharts' {
  import type { SvelteComponentTyped } from 'svelte';
  import type { ApexOptions } from 'apexcharts';

  export default class ApexCharts extends SvelteComponentTyped<{
    options?: ApexOptions;
    series?: any[];
    type?: string;
    width?: number | string;
    height?: number | string;
  }> {}
}
