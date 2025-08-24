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

	const monthlySpending = $derived(data?.monthlySpending || []);
	const maxSpending = $derived(Math.max(...monthlySpending));
	const minSpending = $derived(Math.min(...monthlySpending.filter((s: number) => s > 0)));
	const avgSpending = $derived(monthlySpending.reduce((sum: number, s: number) => sum + s, 0) / 12);

	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	// Calculate trend
	const getTrend = (spending: number[]) => {
		const firstHalf = spending.slice(0, 6).reduce((sum, s) => sum + s, 0) / 6;
		const secondHalf = spending.slice(6).reduce((sum, s) => sum + s, 0) / 6;

		if (secondHalf > firstHalf * 1.1)
			return { direction: 'up', emoji: '📈', text: 'trending upward' };
		if (secondHalf < firstHalf * 0.9)
			return { direction: 'down', emoji: '📉', text: 'trending downward' };
		return { direction: 'stable', emoji: '➡️', text: 'staying steady' };
	};

	const trend = $derived(getTrend(monthlySpending));
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="space-y-6">
		<h1
			class="text-4xl md:text-6xl font-black bg-gradient-to-r from-green-400 to-cyan-600 bg-clip-text text-transparent"
		>
			Your Spending Journey
		</h1>
		<p class="text-xl text-gray-300">Month by month through 2024</p>
	</div>

	<div class="max-w-4xl mx-auto bg-white/5 rounded-3xl p-8">
		<!-- Bar Chart -->
		<div class="relative mb-8">
			<div class="flex items-end justify-between h-48 gap-2">
				{#each monthlySpending as spending, index}
					<div class="flex-1 flex flex-col items-center gap-2">
						<div
							class="w-full bg-gradient-to-t from-green-500 to-cyan-400 rounded-t-lg min-h-2"
							style="height: {Math.max(8, (spending / maxSpending) * 100)}%"
						></div>
						<div class="text-xs text-gray-400 font-medium">
							{months[index]}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-6 text-sm">
			<div class="space-y-1">
				<div class="text-green-400 font-semibold">Highest</div>
				<div class="text-white">{formatCurrency(maxSpending)}</div>
			</div>
			<div class="space-y-1">
				<div class="text-blue-400 font-semibold">Average</div>
				<div class="text-white">{formatCurrency(avgSpending)}</div>
			</div>
			<div class="space-y-1">
				<div class="text-purple-400 font-semibold">Lowest</div>
				<div class="text-white">{formatCurrency(minSpending)}</div>
			</div>
		</div>
	</div>

	<div class="max-w-2xl mx-auto space-y-4">
		<div class="text-2xl text-yellow-300 font-semibold flex items-center justify-center gap-3">
			<span>{trend.emoji}</span>
			<span>Your spending is {trend.text}</span>
		</div>
		<div class="text-lg text-gray-400">
			{trend.direction === 'up'
				? "You've been treating yourself more as the year went on!"
				: trend.direction === 'down'
					? "You've been getting more mindful with your money!"
					: "You've maintained a consistent spending pattern throughout the year!"}
		</div>
	</div>
</Slide>
