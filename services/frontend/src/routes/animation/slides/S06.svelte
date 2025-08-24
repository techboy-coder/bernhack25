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

	const getMonthEmoji = (month: string) => {
		const emojiMap: Record<string, string> = {
			January: '❄️',
			February: '💝',
			March: '🌸',
			April: '🌷',
			May: '🌞',
			June: '☀️',
			July: '🏖️',
			August: '🌻',
			September: '🍂',
			October: '🎃',
			November: '🦃',
			December: '🎄'
		};
		return emojiMap[month] || '📅';
	};

	const biggestMonth = $derived(data?.biggestMonth || { month: 'January', amount: 0 });
	const monthlySpending = $derived(data?.monthlySpending || []);
	const maxSpending = $derived(Math.max(...monthlySpending));

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
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="space-y-6">
		<h1
			class="text-4xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent"
		>
			Your Spending Peak
		</h1>
		<p class="text-xl text-gray-300">The month that broke the bank</p>
	</div>

	<div class="max-w-2xl mx-auto">
		<div
			class="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm rounded-3xl p-12 border border-cyan-300/30"
		>
			<div class="space-y-6">
				<div class="text-6xl">
					{getMonthEmoji(biggestMonth.month)}
				</div>
				<h2 class="text-3xl md:text-5xl font-black text-cyan-300">
					{biggestMonth.month}
				</h2>
				<div class="text-5xl md:text-6xl font-black text-white tabular-nums">
					{formatCurrency(biggestMonth.amount)}
				</div>
				<div class="text-lg text-gray-300">your biggest spending month</div>
			</div>
		</div>
	</div>

	<div class="max-w-4xl mx-auto bg-white/5 rounded-2xl p-8">
		<div class="flex items-end justify-between h-32 gap-1">
			{#each monthlySpending as spending, index}
				<div class="flex-1 flex flex-col items-center gap-2">
					<div
						class="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t-sm min-h-1"
						style="height: {Math.max(4, (spending / maxSpending) * 100)}%"
					></div>
					<div class="text-xs text-gray-400 font-medium">
						{months[index]}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="max-w-2xl mx-auto space-y-4">
		<div class="text-2xl text-yellow-300 font-semibold">That was quite the splurge month! 💳</div>
		<div class="text-lg text-gray-400">
			Maybe it was holiday season, or you treated yourself to something special!
		</div>
	</div>
</Slide>
