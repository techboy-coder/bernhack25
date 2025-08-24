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

	const getSpendingFact = (amount: number) => {
		if (amount > 50000) return "That's enough to buy a small car! 🚗";
		if (amount > 30000) return 'That could cover a nice vacation around the world! ✈️';
		if (amount > 20000) return "That's like buying 4,000 cups of coffee! ☕";
		if (amount > 10000) return 'You could buy about 200 pizzas with that! 🍕';
		return 'Every franc tells a story! 📖';
	};
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white">
		<div class="space-y-4">
			<div style="view-transition-name: emoji-spent" class="text-6xl mb-6">💸</div>
			<h1
				style="view-transition-name: slide-header"
				class="text-4xl md:text-6xl font-black bg-gradient-to-r from-red-400 to-pink-600 bg-clip-text text-transparent"
			>
				You Spent
			</h1>
		</div>

		<div style="view-transition-name: stat-card-spent" class="space-y-6">
			<div class="text-7xl md:text-9xl font-black text-red-400 tabular-nums tracking-tight">
				{formatCurrency(data?.totalSpent || 0)}
			</div>
			<div class="text-2xl text-gray-300">in 2024</div>
		</div>

		<div class="max-w-2xl mx-auto space-y-4">
			<div class="text-xl text-yellow-300 font-medium">
				{getSpendingFact(data?.totalSpent || 0)}
			</div>
			<div class="text-lg text-gray-400">
				But don't worry, we all need to spend to live our best lives! 🌟
			</div>
		</div>
	</div>
</Slide>
