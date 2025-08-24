<script lang="ts">
	import { Slide } from '@animotion/core';

	let { data } = $props();

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};

	const getCategoryEmoji = (category: string): string => {
		const emojiMap: Record<string, string> = {
			food: '🍕',
			groceries: '🛒',
			transport: '🚗',
			housing: '🏠',
			entertainment: '🎬',
			shopping: '🛍️',
			healthcare: '⚕️',
			utilities: '⚡',
			travel: '✈️',
			education: '📚',
			other: '💰'
		};
		return emojiMap[category.toLowerCase()] || '💳';
	};

	const getColors = () => [
		'#FF6B6B',
		'#4ECDC4',
		'#45B7D1',
		'#96CEB4',
		'#FFEAA7',
		'#DDA0DD',
		'#98D8C8',
		'#F7DC6F',
		'#BB8FCE',
		'#85C1E9'
	];

	// Create chart data from spending
	const categoryData = $derived(() => {
		if (!data?.categorySpending) return [];

		const entries = Object.entries(data.categorySpending) as [string, number][];
		const total = entries.reduce((sum, [, amount]) => sum + (amount as number), 0);

		return entries
			.filter(([, amount]) => (amount as number) > 0)
			.sort(([, a], [, b]) => (b as number) - (a as number))
			.slice(0, 6)
			.map(([category, amount], index) => ({
				category,
				amount: amount as number,
				percentage: ((amount as number) / total) * 100,
				color: getColors()[index % getColors().length],
				emoji: getCategoryEmoji(category)
			}));
	});

	const pieData = $derived(() => generatePieData(categoryData()));

	// Generate SVG pie chart data
	const generatePieData = (
		categories: Array<{
			category: string;
			amount: number;
			percentage: number;
			color: string;
			emoji: string;
		}>
	) => {
		let cumulativePercentage = 0;

		return categories.map((cat) => {
			const startAngle = cumulativePercentage * 3.6; // Convert to degrees
			const endAngle = (cumulativePercentage + cat.percentage) * 3.6;

			const startAngleRad = (startAngle - 90) * (Math.PI / 180);
			const endAngleRad = (endAngle - 90) * (Math.PI / 180);

			const largeArc = cat.percentage > 50 ? 1 : 0;
			const x1 = 150 + 120 * Math.cos(startAngleRad);
			const y1 = 150 + 120 * Math.sin(startAngleRad);
			const x2 = 150 + 120 * Math.cos(endAngleRad);
			const y2 = 150 + 120 * Math.sin(endAngleRad);

			const pathData = `M 150 150 L ${x1} ${y1} A 120 120 0 ${largeArc} 1 ${x2} ${y2} Z`;

			cumulativePercentage += cat.percentage;

			return {
				...cat,
				pathData
			};
		});
	};
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white">
		<div class="space-y-6">
			<h1
				class="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
			>
				Your Spending DNA
			</h1>
			<p class="text-xl text-gray-300">Where every franc found its home</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
			<!-- Pie Chart -->
			<div class="flex justify-center">
				<div class="relative">
					<svg width="300" height="300" viewBox="0 0 300 300">
						{#each pieData() as slice, index}
							<path
								d={slice.pathData}
								fill={slice.color}
								stroke="white"
								stroke-width="2"
								class="cursor-pointer hover:opacity-80 transition-opacity"
							/>
						{/each}
						<!-- Center circle -->
						<circle cx="150" cy="150" r="60" fill="rgba(255,255,255,0.1)" />
						<text x="150" y="145" text-anchor="middle" class="fill-blue-500 text-lg font-bold"
							>Your</text
						>
						<text x="150" y="165" text-anchor="middle" class="fill-gree-500 text-lg font-bold"
							>Money</text
						>
					</svg>
				</div>
			</div>

			<!-- Category List -->
			<div class="space-y-4">
				{#each categoryData() as category, index}
					<div
						class="flex items-center gap-4 bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
					>
						<div class="text-2xl">{category.emoji}</div>
						<div class="flex-1 space-y-1">
							<div class="flex justify-between items-center">
								<span class="text-white font-medium capitalize">{category.category}</span>
								<span class="text-white font-bold">{category.percentage.toFixed(1)}%</span>
							</div>
							<div class="flex justify-between items-center">
								<div class="w-full bg-white/10 rounded-full h-2 mr-4">
									<div
										class="h-2 rounded-full"
										style="width: {category.percentage}%; background-color: {category.color}"
									></div>
								</div>
								<span class="text-gray-300 text-sm whitespace-nowrap"
									>{formatCurrency(category.amount)}</span
								>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="max-w-2xl mx-auto space-y-4">
			<div class="text-2xl text-yellow-300 font-semibold">You're a well-rounded spender! 🌈</div>
			<div class="text-lg text-gray-400">
				Your money flows across {categoryData().length} different categories, showing a balanced approach
				to life's essentials and pleasures.
			</div>
		</div>
	</div>
</Slide>
