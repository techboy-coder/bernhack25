<script lang="ts">
  import { Slide, Transition } from '@animotion/core';
  import { animate } from '$lib/waapi';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css'; // make sure this CSS is bundled

  let mapEl: HTMLDivElement;
  let map: maplibregl.Map | null = null;

  // point this to your Maputnik-exported style (local file or URL)
  const STYLE_URL = '/styles/my-maputnik-style.json';

  async function initMap() {
    // Create the map
    map = new maplibregl.Map({
      container: mapEl,
      style: STYLE_URL,
      center: [8.5417, 47.3769], // Zurich example
      zoom: 9,
      attributionControl: false
    });

    // wait for style to finish loading
    await new Promise<void>((resolve) => {
      map!.once('load', () => resolve());
    });
  }

  async function animateCamera() {
    if (!map) return;
    // Example: quick cinematic fly
    map.flyTo({
      center: [8.55, 47.37],
      zoom: 12,
      pitch: 60,
      bearing: 20,
      duration: 1800,
      essential: true
    });
  }

  function teardown() {
    map?.remove();
    map = null;
  }
</script>

<Slide class="h-full w-full grid place-content-center relative overflow-hidden">
  <Transition
    do={async () => {
      // start hidden for a smooth reveal
      mapEl.style.opacity = '0';
      mapEl.style.transform = 'translateY(12px) scale(0.98)';

      await initMap();

      // container intro animation
      await animate(
        mapEl,
        [
          { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ],
        { duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );

      // then move the camera
      await animateCamera();
    }}
    undo={teardown}  >
    <!-- Map container fills most of the slide -->
    <div class="relative h-[80vh] w-[90vw] max-w-[1200px] rounded-2xl shadow overflow-hidden">
      <div bind:this={mapEl} class="absolute inset-0"></div>

      <!-- Optional title that also appears nicely -->
      <div
        class="absolute top-4 left-4 z-10 px-3 py-1 rounded-lg bg-black/50 text-white text-lg font-semibold shadow"
        aria-hidden="true"
      >
        Map
      </div>
    </div>
  </Transition>
</Slide>
