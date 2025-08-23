<script lang="ts">
  import { Slide, Transition } from '@animotion/core';
  import { animate } from '$lib/waapi';

  // Title ref
  let t2: HTMLParagraphElement;

  // Block refs
  let blockContainer: HTMLDivElement;
  let block1: HTMLDivElement;
  let block2: HTMLDivElement;
  let block3: HTMLDivElement;
  let block4: HTMLDivElement;

  const blockOrigWidth = 320;
  const blockOrigHeight = 100;

  const categoryData = [
    { category: 'Food',     cost: 100, percentage: 20, height: blockOrigHeight * 0.5 },
    { category: 'Rent',     cost: 200, percentage: 40, height: blockOrigHeight * 1.0 },
    { category: 'Travel',   cost: 300, percentage: 60, height: blockOrigHeight * 1.2 },
    { category: 'Shopping', cost: 50,  percentage: 10, height: blockOrigHeight * 1.8 }
  ];
</script>

<Slide class="h-full place-content-center place-items-center">
  <!-- 1) Text transition -->
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
      await animate(
        t2,
        [{ transform: 'scale(1.02)' }, { transform: 'scale(1.00)' }],
        { duration: 250, easing: 'ease-out' }
      );
    }}
  >
    <p bind:this={t2} class="text-6xl md:text-7xl font-bold drop-shadow-sm text-center">
      Category Ranking
    </p>
  </Transition>

  <!-- 2) Blocks -->
  <div bind:this={blockContainer} class="blockcontainer">
    <Transition
      class="mt-16"
      do={async () => {
        block1.style.opacity = '0';
        block1.style.width = '0px';
        block1.style.height = '0px';
        block1.style.background = '#3a86ff';
        block1.style.color = '#ffffffAA';
        block1.innerText = '' + categoryData[0].category;
        await animate(
          block1,
          [
            { opacity: 0, width: '0px', height: '0px', background: '#3a86ff' },
            { opacity: 1, width: '320px', height: categoryData[0].height + 'px', background: '#3a86ff' }
          ],
          { duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
        );
      }}
    >
      <div
        bind:this={block1}
        style="border-radius: 5px; margin: 0 auto; box-shadow: 0 4px 32px #0002; display: flex; align-items: center; justify-content: center;"
      ></div>
    </Transition>

    <Transition
      class="mt-2"
      do={async () => {
        block2.style.opacity = '0';
        block2.style.width = '0px';
        block2.style.height = '0px';
        block2.style.background = '#8338ec';
        block2.style.color = '#ffffffAA';
        block2.innerText = categoryData[1].category;
        await animate(
          block2,
          [
            { opacity: 0, width: '0px', height: '0px', background: '#8338ec' },
            { opacity: 1, width: '320px', height: categoryData[1].height + 'px', background: '#8338ec' }
          ],
          { duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
        );
      }}
    >
      <div
        bind:this={block2}
        style="border-radius: 5px; margin: 0 auto; box-shadow: 0 4px 32px #0002; display: flex; align-items: center; justify-content: center;"
      ></div>
    </Transition>

    <Transition
      class="mt-2"
      do={async () => {
        block3.style.opacity = '0';
        block3.style.width = '0px';
        block3.style.height = '0px';
        block3.style.background = '#ff006e';
        block3.style.color = '#ffffffAA';
        block3.innerText = categoryData[2].category;
        await animate(
          block3,
          [
            { opacity: 0, width: '0px', height: '0px', background: '#ff006e' },
            { opacity: 1, width: '320px', height: categoryData[2].height + 'px', background: '#ff006e' }
          ],
          { duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
        );
      }}
    >
      <div
        bind:this={block3}
        style="border-radius: 5px; margin: 0 auto; box-shadow: 0 4px 32px #0002; display: flex; align-items: center; justify-content: center;"
      ></div>
    </Transition>

    <Transition
      class="mt-2"
      do={async () => {
        block4.style.opacity = '0';
        block4.style.width = '0px';
        block4.style.height = '0px';
        block4.style.background = '#fb5607';
        block4.style.color = '#ffffffAA';
        block4.innerText = categoryData[3].category;
        await animate(
          block4,
          [
            { opacity: 0, width: '0px', height: '0px', background: '#fb5607' },
            { opacity: 1, width: '320px', height: categoryData[3].height + 'px', background: '#fb5607' }
          ],
          { duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
        );
      }}
    >
      <div
        bind:this={block4}
        style="border-radius: 5px; margin: 0 auto; box-shadow: 0 4px 32px #0002; display: flex; align-items: center; justify-content: center;"
      ></div>
    </Transition>
  </div>
</Slide>

<style>
  .blockcontainer { width: 100%; max-width: 480px; margin: 0 auto; }
</style>
