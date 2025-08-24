<script lang="ts">
	import { Presentation, Slide, Action, Transition } from '@animotion/core';
	import { animate } from '$lib/waapi';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { ApexOptions } from 'apexcharts';

	// Welcome slide refs
	let welcomeTitle: HTMLParagraphElement;

	// Blocks slide refs
	let blocksTitle: HTMLParagraphElement;
	let blockContainer: HTMLDivElement;
	let block1 = $state<HTMLDivElement | null>(null);
	let block2 = $state<HTMLDivElement | null>(null);
	let block3 = $state<HTMLDivElement | null>(null);
	let block4 = $state<HTMLDivElement | null>(null);

	const blockOrigWidth = 320;
	const blockOrigHeight = 100;

	const categoryData = [
		{ category: 'Food', cost: 100, percentage: 20, height: blockOrigHeight * 0.5 },
		{ category: 'Rent', cost: 200, percentage: 40, height: blockOrigHeight * 1.0 },
		{ category: 'Travel', cost: 300, percentage: 60, height: blockOrigHeight * 1.2 },
		{ category: 'Shopping', cost: 50, percentage: 10, height: blockOrigHeight * 1.8 }
	];

	// Bubbles slide refs and state
	let bubblesTitle: HTMLParagraphElement;

	type Metric = { value: number; color: string; label?: string };
	const metrics: Metric[] = [
		{ value: 32, color: '#3a86ff', label: 'A' },
		{ value: 68, color: '#ff006e', label: 'B' },
		{ value: 91, color: '#8338ec', label: 'C' }
	];

	let bubbleEls: HTMLDivElement[] = [];
	let numberEls: HTMLSpanElement[] = [];
	let overlayEl: HTMLDivElement;

	const DURATION = 8000;
	const STAGGER = 220;
	const MIN_R = 38;
	const MAX_R = 120;
	const START_Y = 50;
	const END_Y = -20;

	const NUM_BG_BUBBLES = 28;
	const BG_MIN = 4;
	const BG_MAX = 54;
	const BG_SPAN_MS = [1800, 3400];
	const BG_DELAY_MS = [0, 1200];
	const BG_FADE_MS = 380;

	const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
	const map = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
		outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin || 1);
	const rand = (a: number, b: number) => a + Math.random() * (b - a);

	// Food slide state
	const healthyAmount = 120;
	const unhealthyAmount = 80;
	let foodTitle: HTMLParagraphElement;
	let healthyBox: HTMLDivElement;
	let unhealthyBox: HTMLDivElement;

	type Drop = {
		char: string;
		el?: HTMLSpanElement | null;
		x?: number;
		y?: number;
		d?: number;
		col?: number;
		level?: number;
	};

	const healthyPalette = ['🍎', '🥑', '🥕', '🥦', '🍓', '🥜', '🥬', '🍇'];
	const unhealthyPalette = ['🍔', '🍟', '🍕', '🍩', '🍪', '🌭', '🥤', '🧁'];

	const DUR = { headline: 650, drop: 500, gap: 80 };

	const total = Math.max(healthyAmount + unhealthyAmount, 1);
	const healthyRatio = healthyAmount / total;
	const unhealthyRatio = unhealthyAmount / total;

	let healthyDrops = $state<Drop[]>([]);
	let unhealthyDrops = $state<Drop[]>([]);

	// Goals slide state
	const achieved = 7;
	const goalsTotal = 10;
	const stepMs = 60;
	const cursorStiffness = 10;

	let goalsTitle = $state<HTMLParagraphElement | null>(null);
	let markerEl = $state<HTMLDivElement | null>(null);
	let countEl = $state<HTMLSpanElement | null>(null);
	let achievedListEl = $state<HTMLUListElement | null>(null);
	let missedListEl = $state<HTMLUListElement | null>(null);

	const posPct = (a: number, t: number) => (1 - clamp(t === 0 ? 0 : a / t, 0, 1)) * 100;

	const safeAchieved = Math.max(0, Math.min(achieved, goalsTotal));
	const missedCount = Math.max(0, goalsTotal - safeAchieved);

	const achievedGoals = Array.from(
		{ length: Math.min(safeAchieved, 3) },
		(_, i) => `Goal ${i + 1}`
	);
	const missedGoals = Array.from(
		{ length: Math.min(missedCount, 2) },
		(_, i) => `Goal ${safeAchieved + i + 1}`
	);

	let showAchievedHeader = $state(false);
	let showMissedHeader = $state(false);
	let achievedShown = $state(0);
	let missedShown = $state(0);
	let hasRun = $state(false);

	// Graphs slide state
	const defaultData = [
		{ label: 'Travel', kg: 420 },
		{ label: 'Food', kg: 280 },
		{ label: 'Shopping', kg: 190 },
		{ label: 'Utilities', kg: 150 },
		{ label: 'Services', kg: 110 }
	];

	let graphsTitle = $state<HTMLParagraphElement | null>(null);
	let chartWrap = $state<HTMLDivElement | null>(null);
	let chartEl = $state<HTMLDivElement | null>(null);
	let chartInstance: any = null;

	const co2Total = $derived(defaultData.reduce((sum, d) => sum + d.kg, 0));
	const series = $derived(defaultData.map((d) => d.kg));
	const labels = $derived(defaultData.map((d) => d.label));

	const options = $derived<ApexOptions>({
		chart: { type: 'radialBar', animations: { enabled: false }, toolbar: { show: false } },
		labels,
		plotOptions: {
			radialBar: {
				dataLabels: {
					name: { fontSize: '14px' },
					value: { fontSize: '16px', formatter: (v: number) => `${Math.round(v)} kg` },
					total: { show: true, label: 'Total', formatter: () => `${co2Total} kg` }
				}
			}
		},
		stroke: { lineCap: 'round' },
		legend: { show: true, position: 'bottom' },
		tooltip: { y: { formatter: (v: number) => `${v} kg CO₂e` } }
	});

	// End slide refs
	let endTitle: HTMLParagraphElement;

	// Animation functions for bubbles
	async function introBubblesOverlay() {
		if (!overlayEl) return;

		const promises: Promise<unknown>[] = [];
		overlayEl.innerHTML = '';
		overlayEl.style.opacity = '1';

		for (let i = 0; i < NUM_BG_BUBBLES; i++) {
			const b = document.createElement('div');
			b.className = 'bg-bubble';

			const s = rand(BG_MIN, BG_MAX);
			const x = rand(2, 98);
			const blur = Math.random() < 0.35 ? rand(1, 3) : 0;
			const tint = ['#3a86ff', '#ff006e', '#8338ec'][Math.floor(Math.random() * 3)];
			const dur = rand(BG_SPAN_MS[0], BG_SPAN_MS[1]);
			const delay = rand(BG_DELAY_MS[0], BG_DELAY_MS[1]);
			const sway = rand(-10, 10);

			b.style.width = `${s}px`;
			b.style.height = `${s}px`;
			b.style.left = `${x}vw`;
			b.style.filter = blur ? `blur(${blur}px)` : '';
			b.style.background = `radial-gradient(60% 60% at 35% 35%, ${tint}99, ${tint})`;
			b.style.boxShadow = '0 6px 18px #0003';

			overlayEl.appendChild(b);

			const anim = b.animate(
				[
					{ transform: `translate(-${sway / 2}px, 8vh) scale(0.9)`, opacity: 0 },
					{
						transform: `translate(${sway / 2}px, -72vh) scale(1)`,
						opacity: 1,
						offset: 0.6
					},
					{ transform: `translate(${sway}px, -92vh) scale(1.05)`, opacity: 0 }
				],
				{
					duration: dur,
					delay,
					easing: 'cubic-bezier(0.22,1,0.36,1)',
					fill: 'both'
				}
			).finished;

			promises.push(anim);
		}

		await Promise.all(promises);
		await overlayEl.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: BG_FADE_MS,
			easing: 'ease-out',
			fill: 'forwards'
		}).finished;
		overlayEl.innerHTML = '';
	}

	async function runBubbles() {
		const maxVal = Math.max(...metrics.map((m) => m.value));
		await Promise.all(metrics.map((m, i) => animateBubble(i, m, maxVal, STAGGER * i)));
	}

	function animateBubble(index: number, metric: Metric, maxVal: number, delay: number) {
		const el = bubbleEls[index];
		const numEl = numberEls[index];
		if (!el || !numEl) return Promise.resolve();

		const finalR = map(metric.value, 0, maxVal, MIN_R, MAX_R);
		const startR = MIN_R;

		el.style.width = `${startR * 2}px`;
		el.style.height = `${startR * 2}px`;
		el.style.transform = `translateY(${START_Y}px) scale(0.9)`;
		el.style.background = `radial-gradient(60% 60% at 35% 35%, ${metric.color}99, ${metric.color})`;
		el.style.boxShadow = `0 16px 48px #0003`;
		numEl.textContent = '0';

		const rising = el.animate(
			[
				{ transform: `translateY(${START_Y}px) scale(0.90)` },
				{ transform: `translateY(${END_Y}px)  scale(1.00)` }
			],
			{
				duration: DURATION,
				delay,
				easing: 'cubic-bezier(0.22,1,0.36,1)',
				fill: 'forwards'
			}
		).finished;

		const startTime = performance.now() + delay;

		return new Promise<void>((resolve) => {
			const tick = (now: number) => {
				const t = clamp((now - startTime) / DURATION, 0, 1);
				if (t <= 0) {
					requestAnimationFrame(tick);
					return;
				}

				const eased = cubicBezier(0.22, 1, 0.36, 1)(t);

				const current = Math.round(eased * metric.value);
				numEl.textContent = String(current);

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

	function cubicBezier(p0x: number, p0y: number, p1x: number, p1y: number) {
		const cx = 3 * p0x,
			bx = 3 * (p1x - p0x) - cx,
			ax = 1 - cx - bx;
		const cy = 3 * p0y,
			by = 3 * (p1y - p0y) - cy,
			ay = 1 - cy - by;
		const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
		const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
		const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

		function solveT(x: number) {
			let t = x,
				i = 0;
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

	// Food slide functions
	function makeDrops(count: number, palette: string[]): Drop[] {
		return Array.from({ length: count }, (_, i) => ({
			char: palette[i % palette.length],
			d: i * DUR.gap
		}));
	}

	function layoutPiles(box: HTMLDivElement, drops: Drop[]) {
		const rect = box.getBoundingClientRect();
		const w = rect.width;
		const h = rect.height;

		const approxEmoji = Math.max(24, Math.min(40, w * 0.035));
		const colWidth = approxEmoji * 1.2;
		const columns = Math.max(3, Math.floor((w - 24) / colWidth));
		const padX = 12;
		const padY = 12;
		const baseY = h - padY;
		const levelStep = approxEmoji * 0.9;

		const heights = Array(columns).fill(0);

		const centerBias = () => {
			const r = Math.random();
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

	async function dropIn(d: Drop) {
		if (!d.el || d.y == null) return;
		const startTop = -32 - Math.random() * 24;
		const targetY = d.y;
		await animate(
			d.el,
			[
				{ opacity: 0, transform: `translateY(${startTop - targetY}px) scale(0.92)` },
				{
					opacity: 1,
					offset: 0.4,
					transform: `translateY(${(startTop - targetY) * 0.2}px) scale(1)`
				},
				{
					opacity: 1,
					offset: 0.78,
					transform: `translateY(${(startTop - targetY) * -0.06}px) scale(1)`
				},
				{ opacity: 1, transform: 'translateY(0px) scale(1)' }
			],
			{
				duration: DUR.drop,
				delay: d.d ?? 0,
				easing: 'cubic-bezier(0.22,1,0.36,1)',
				fill: 'forwards'
			}
		);
	}

	async function runFood() {
		foodTitle.style.opacity = '0';
		await animate(
			foodTitle,
			[
				{ opacity: 0, transform: 'translateY(8px)' },
				{ opacity: 1, transform: 'translateY(0)' }
			],
			{ duration: DUR.headline, easing: 'cubic-bezier(0.22,1,0.36,1)' }
		);

		const MAX = 28;
		const hCount = Math.max(4, Math.round(MAX * healthyRatio));
		const uCount = Math.max(4, Math.round(MAX * unhealthyRatio));
		healthyDrops = makeDrops(hCount, healthyPalette);
		unhealthyDrops = makeDrops(uCount, unhealthyPalette);

		await Promise.resolve();
		layoutPiles(healthyBox, healthyDrops);
		layoutPiles(unhealthyBox, unhealthyDrops);

		const all = [...healthyDrops.map(dropIn), ...unhealthyDrops.map(dropIn)];
		void countUp(foodTitle, healthyAmount, unhealthyAmount, 160, 1000);
		await Promise.all(all);
	}

	// Goals slide functions
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

	async function runGoals() {
		if (hasRun) return;
		hasRun = true;

		if (!goalsTitle || !markerEl || !countEl) await nextFrame();
		if (!goalsTitle || !markerEl || !countEl) return;

		goalsTitle.style.opacity = '0';
		goalsTitle.style.transform = 'translateY(8px)';
		countEl.textContent = '0';
		markerEl.style.left = `${posPct(0, goalsTotal)}%`;

		animate(
			goalsTitle,
			[
				{ opacity: 0, transform: 'translateY(8px)' },
				{ opacity: 1, transform: 'translateY(0px)' }
			],
			{ duration: 600, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' }
		);

		const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		if (reduce) {
			countEl.textContent = String(safeAchieved);
			markerEl.style.left = `${posPct(safeAchieved, goalsTotal)}%`;
			showAchievedHeader = true;
			achievedShown = achievedGoals.length;
			showMissedHeader = true;
			missedShown = missedGoals.length;
			return;
		}

		let targetValue = 0;
		let markerLeft = posPct(0, goalsTotal);
		let last = performance.now();

		const smooth = (now: number) => {
			const dt = Math.max(0, (now - last) / 1000);
			last = now;
			const targetLeft = posPct(targetValue, goalsTotal);
			const distance = Math.abs(targetLeft - markerLeft);
			const dynamicStiffness = cursorStiffness * (0.3 + 0.7 * clamp(distance / 100, 0, 1));
			const alpha = 1 - Math.exp(-dynamicStiffness * dt);
			markerLeft += (targetLeft - markerLeft) * alpha;
			markerEl!.style.left = `${markerLeft}%`;
			requestAnimationFrame(smooth);
		};

		requestAnimationFrame(smooth);

		const seq = buildSequence(safeAchieved, goalsTotal);
		for (const v of seq) {
			targetValue = v;
			countEl.textContent = String(v);
			await delay(stepMs);
		}

		countEl.textContent = String(safeAchieved);
		markerEl.style.left = `${posPct(safeAchieved, goalsTotal)}%`;

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

	// Charts functionality
	onMount(async () => {
		if (!browser) return;
	});

	onDestroy(() => {
		if (chartInstance?.destroy) chartInstance.destroy();
		chartInstance = null;
	});

	$effect(() => {
		if (browser && chartInstance) {
			chartInstance.updateOptions({ ...options, series }, false, true, false);
		}
	});
</script>

<svelte:head>
	<title>Banking Analytics Presentation</title>
</svelte:head>

<Presentation
	options={{ history: true, transition: 'slide', controls: true, progress: true }}
	class="dark h-screen bg-gradient-to-br from-background via-background to-primary/12"
>
	<!-- Slide 1: Welcome -->
	<Slide class="h-full place-content-center place-items-center">
		<Transition
			do={async () => {
				welcomeTitle.style.opacity = '0';
				await animate(
					welcomeTitle,
					[
						{ opacity: 0, transform: 'translateY(16px) scale(0.98)' },
						{ opacity: 1, transform: 'translateY(0px) scale(1)' }
					],
					{ duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
				);
			}}
		>
			<p
				bind:this={welcomeTitle}
				class="text-7xl md:text-8xl font-bold drop-shadow-sm text-center text-foreground"
			>
				Welcome ✨
			</p>
		</Transition>
	</Slide>

	<!-- Slide 2: Category Ranking (Blocks) -->
	<Slide class="h-full place-content-center place-items-center">
		<Transition
			do={async () => {
				blocksTitle.style.opacity = '0';
				blocksTitle.style.filter = 'blur(12px)';
				await animate(
					blocksTitle,
					[
						{ opacity: 0, filter: 'blur(12px)', transform: 'scale(0.96)' },
						{ opacity: 1, filter: 'blur(0px)', transform: 'scale(1.02)' }
					],
					{ duration: 500, easing: 'cubic-bezier(0.22,1,0.36,1)' }
				);
				await animate(blocksTitle, [{ transform: 'scale(1.02)' }, { transform: 'scale(1.00)' }], {
					duration: 250,
					easing: 'ease-out'
				});
			}}
		>
			<p
				bind:this={blocksTitle}
				class="text-6xl md:text-7xl font-bold drop-shadow-sm text-center text-foreground"
			>
				Category Ranking
			</p>
		</Transition>

		<div bind:this={blockContainer} class="blockcontainer">
			{#each categoryData as category, index}
				<Transition
					class="mt-2"
					do={async () => {
						const blockElements = [block1, block2, block3, block4];
						const block = blockElements[index];
						if (!block) return;

						block.style.opacity = '0';
						block.style.width = '0px';
						block.style.height = '0px';
						block.style.background = ['#3a86ff', '#8338ec', '#ff006e', '#fb5607'][index];
						block.style.color = '#ffffffAA';
						block.innerText = category.category;
						await animate(
							block,
							[
								{ opacity: 0, width: '0px', height: '0px' },
								{ opacity: 1, width: '320px', height: category.height + 'px' }
							],
							{ duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
						);
					}}
				>
					{#if index === 0}
						<div
							bind:this={block1}
							class="rounded-md mx-auto shadow-lg flex items-center justify-center text-white font-semibold text-lg"
						></div>
					{:else if index === 1}
						<div
							bind:this={block2}
							class="rounded-md mx-auto shadow-lg flex items-center justify-center text-white font-semibold text-lg"
						></div>
					{:else if index === 2}
						<div
							bind:this={block3}
							class="rounded-md mx-auto shadow-lg flex items-center justify-center text-white font-semibold text-lg"
						></div>
					{:else if index === 3}
						<div
							bind:this={block4}
							class="rounded-md mx-auto shadow-lg flex items-center justify-center text-white font-semibold text-lg"
						></div>
					{/if}
				</Transition>
			{/each}
		</div>
	</Slide>

	<!-- Slide 3: Most Bought Products (Bubbles) -->
	<Slide class="relative h-full place-content-center place-items-center">
		<div
			class="overlay pointer-events-none absolute inset-0 overflow-hidden z-10"
			bind:this={overlayEl}
			aria-hidden="true"
		></div>

		<Transition
			do={async () => {
				bubblesTitle.style.opacity = '0';
				bubblesTitle.style.filter = 'blur(12px)';
				await animate(
					bubblesTitle,
					[
						{ opacity: 0, filter: 'blur(12px)', transform: 'scale(0.96)' },
						{ opacity: 1, filter: 'blur(0px)', transform: 'scale(1.02)' }
					],
					{ duration: 500, easing: 'cubic-bezier(0.22,1,0.36,1)' }
				);
				await animate(bubblesTitle, [{ transform: 'scale(1.02)' }, { transform: 'scale(1.00)' }], {
					duration: 250,
					easing: 'ease-out'
				});
			}}
		>
			<p
				bind:this={bubblesTitle}
				class="text-6xl md:text-7xl font-bold drop-shadow-sm text-center text-foreground"
			>
				Most Bought Products
			</p>
		</Transition>

		<Transition
			class="mt-16"
			do={async () => {
				await Promise.all([introBubblesOverlay(), runBubbles()]);
			}}
		>
			<div class="bubbles flex gap-10 items-end justify-center min-h-[220px]">
				{#each metrics as m, i}
					<div
						class="bubble rounded-full grid place-items-center text-white relative filter drop-shadow-lg"
						bind:this={bubbleEls[i]}
					>
						<span class="num font-extrabold text-4xl leading-none" bind:this={numberEls[i]}></span>
						{#if m.label}
							<span class="label absolute -bottom-6 text-sm text-white/80">{m.label}</span>
						{/if}
					</div>
				{/each}
			</div>
		</Transition>
	</Slide>

	<!-- Slide 4: Food Analysis -->
	<Slide class="h-full place-content-center place-items-center">
		<Transition do={runFood}>
			<div class="flex flex-col items-center gap-6">
				<p
					bind:this={foodTitle}
					class="text-4xl md:text-6xl font-bold drop-shadow-sm text-center text-foreground"
				></p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-[92vw] max-w-[1100px]">
					<div
						class="basket relative overflow-visible rounded-2xl bg-transparent p-2 md:h-[360px] h-[280px]"
						bind:this={healthyBox}
					>
						<div
							class="label absolute top-2 left-3 font-semibold text-foreground/60"
							style="margin-left:50%"
						>
							Healthy
						</div>
						{#each healthyDrops as d (d)}
							<span
								class="basket-emoji absolute text-2xl md:text-4xl leading-none select-none filter drop-shadow-sm"
								bind:this={d.el}>{d.char}</span
							>
						{/each}
					</div>

					<div
						class="basket relative overflow-visible rounded-2xl bg-transparent p-2 md:h-[360px] h-[280px]"
						bind:this={unhealthyBox}
					>
						<div
							class="label absolute top-2 left-3 font-semibold text-foreground/60"
							style="margin-right:50%"
						>
							Unhealthy
						</div>
						{#each unhealthyDrops as d (d)}
							<span
								class="basket-emoji absolute text-2xl md:text-4xl leading-none select-none filter drop-shadow-sm"
								bind:this={d.el}>{d.char}</span
							>
						{/each}
					</div>
				</div>
			</div>
		</Transition>
	</Slide>

	<!-- Slide 5: Savings Goals Progress -->
	<Slide class="h-full place-content-center place-items-center gap-6">
		<Transition do={runGoals}>
			<div class="flex flex-col items-center gap-4 w-full max-w-3xl text-foreground">
				<p bind:this={goalsTitle} class="text-4xl md:text-5xl font-bold drop-shadow-sm text-center">
					Reached Saving Goals
				</p>

				<p class="text-lg md:text-xl font-medium">
					You have reached <span bind:this={countEl} class="tabular-nums">0</span> / {goalsTotal} saving
					goals
				</p>

				<div
					class="relative w-full h-6 md:h-7 rounded-full overflow-hidden shadow-sm bg-gradient-to-r from-blue-600 via-green-500 to-red-500"
				>
					<div
						class="absolute inset-0 bg-gradient-to-b from-white/25 to-black/0 mix-blend-overlay pointer-events-none"
					></div>
					<div
						bind:this={markerEl}
						class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
						style="left: 100%;"
					>
						<div
							class="w-4 h-4 md:w-5 md:h-5 rounded-full bg-background ring-2 ring-foreground/20 shadow-sm"
						></div>
					</div>
					<div
						class="absolute inset-0 rounded-full ring-1 ring-foreground/10 pointer-events-none"
					></div>
				</div>

				<div class="w-full mt-2 space-y-2">
					{#if showAchievedHeader}
						<h3 class="text-base md:text-lg font-semibold">You have achieved:</h3>
						<ul bind:this={achievedListEl} class="list-disc pl-6 space-y-1">
							{#each achievedGoals.slice(0, achievedShown) as label (label)}
								<li class="text-sm md:text-base">{label}</li>
							{/each}
						</ul>
					{/if}

					{#if showMissedHeader}
						<div class="mt-6">
							<h3 class="text-base md:text-lg font-semibold">In progress:</h3>
							<ul bind:this={missedListEl} class="list-disc pl-6 space-y-1">
								{#each missedGoals.slice(0, missedShown) as label (label)}
									<li class="text-sm md:text-base">{label}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		</Transition>
	</Slide>

	<!-- Slide 6: CO₂ Footprint -->
	<Slide class="h-full place-content-center place-items-center p-4">
		<Transition
			do={async () => {
				if (graphsTitle) {
					graphsTitle.style.opacity = '0';
					await animate(
						graphsTitle,
						[
							{ opacity: 0, transform: 'translateY(16px) scale(0.98)' },
							{ opacity: 1, transform: 'translateY(0px) scale(1)' }
						],
						{ duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
					);
				}
			}}
		>
			<p
				bind:this={graphsTitle}
				class="text-7xl md:text-8xl font-bold drop-shadow-sm text-center text-foreground"
			>
				CO₂-Footprint
			</p>
		</Transition>

		<Transition>
			<div class="w-full max-w-3xl mx-auto grid gap-6">
				<div bind:this={chartWrap} class="bg-card rounded-lg border p-6">
					<div class="pb-2">
						<h3 class="text-xl font-semibold leading-none tracking-tight text-card-foreground">
							CO₂ by Spending Category
						</h3>
						<p class="text-sm text-muted-foreground">
							Total: <span class="font-semibold">{co2Total} kg CO₂e</span>
						</p>
					</div>

					<div class="pt-2">
						<div bind:this={chartEl} style="width:100%; height:380px;" class="rounded-md"></div>

						<div class="mt-4 flex flex-wrap gap-2">
							{#each defaultData as c}
								<span
									class="rounded-full border px-3 py-1 text-xs bg-secondary text-secondary-foreground"
								>
									{c.label}: {c.kg} kg
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Slide>

	<!-- Slide 7: Map (Simplified without actual map) -->
	<Slide class="h-full w-full grid place-content-center relative overflow-hidden">
		<Transition
			do={async () => {
				// Simulate map loading and animation
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}}
		>
			<div
				class="relative h-[80vh] w-[90vw] max-w-[1200px] rounded-2xl shadow overflow-hidden bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 border"
			>
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="text-center text-foreground">
						<div class="text-6xl mb-4">🗺️</div>
						<h2 class="text-2xl font-bold">Interactive Map</h2>
						<p class="text-muted-foreground mt-2">Location-based spending analysis</p>
					</div>
				</div>

				<div
					class="absolute top-4 left-4 z-10 px-3 py-1 rounded-lg bg-black/50 text-white text-lg font-semibold shadow"
				>
					Map
				</div>
			</div>
		</Transition>
	</Slide>

	<!-- Slide 8: End -->
	<Slide class="h-full place-content-center place-items-center">
		<Transition
			do={async () => {
				endTitle.style.opacity = '0';
				await animate(
					endTitle,
					[
						{ opacity: 0, transform: 'translateY(8px)' },
						{ opacity: 1, transform: 'translateY(0px)' }
					],
					{ duration: 650, easing: 'cubic-bezier(0.22,1,0.36,1)' }
				);
			}}
		>
			<p
				bind:this={endTitle}
				class="text-6xl md:text-7xl font-bold drop-shadow-sm text-center text-foreground"
			>
				Thanks for watching
			</p>
		</Transition>
	</Slide>
</Presentation>

<style>
	.blockcontainer {
		width: 100%;
		max-width: 480px;
		margin: 0 auto;
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
		min-height: 220px;
	}

	.bubble {
		position: relative;
		will-change: transform, width, height;
		user-select: none;
	}

	.num {
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
	}

	.label {
		text-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
	}

	.basket-emoji {
		will-change: transform, opacity;
		transform-origin: center bottom;
	}
</style>
