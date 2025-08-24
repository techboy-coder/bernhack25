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

	const getCategoryEmoji = (category: string) => {
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
		return emojiMap[category?.toLowerCase()] || '💳';
	};

	const getCategoryFact = (category: string, amount: number) => {
		const facts: Record<string, string[]> = {
			food: [
				`You're a foodie at heart! 🍽️`,
				`That's enough for ${Math.round(amount / 25)} restaurant meals!`
			],
			groceries: [
				`Home cooking champion! 👨‍🍳`,
				`You could fill ${Math.round(amount / 100)} shopping carts!`
			],
			transport: [
				`Always on the move! 🚀`,
				`That could fuel ${Math.round(amount / 80)} road trips!`
			],
			housing: [`Home is where the money goes! 🏡`, `Investing in your comfort zone!`],
			entertainment: [`Life's too short to be boring! 🎪`, `You know how to have fun!`],
			shopping: [`Retail therapy expert! 🛍️`, `You've got great taste!`],
			healthcare: [`Health is wealth! 💪`, `Taking care of yourself first!`],
			utilities: [`Keeping the lights on! 💡`, `Modern life essentials covered!`],
			travel: [`Adventure seeker! 🗺️`, `Collecting memories, not things!`],
			education: [`Investing in yourself! 🎓`, `Knowledge pays the best dividends!`]
		};

		const categoryFacts = facts[category?.toLowerCase()] || [
			`You're unique! 🌟`,
			`Every expense tells your story!`
		];
		return categoryFacts;
	};

	const topCategory = $derived(data?.topCategory || { name: 'other', amount: 0 });
	const categoryFacts = $derived(getCategoryFact(topCategory.name, topCategory.amount));
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white">
		<div class="space-y-6">
			<h1
				style="view-transition-name: slide-header"
				class="text-4xl md:text-6xl font-black bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent"
			>
				Your Biggest Weakness
			</h1>
			<p class="text-xl text-gray-300">The category that captured your wallet</p>
		</div>

		<div style="view-transition-name: emoji-category" class="text-8xl mb-8">
			{getCategoryEmoji(topCategory.name)}
		</div>

		<div class="max-w-2xl mx-auto">
			<div
				style="view-transition-name: stat-card-category"
				class="bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-sm rounded-3xl p-12 border border-orange-300/30"
			>
				<div class="space-y-6">
					<h2 class="text-3xl md:text-5xl font-black text-orange-300 capitalize">
						{topCategory.name || 'No data'}
					</h2>
					<div class="text-5xl md:text-7xl font-black text-white tabular-nums">
						{formatCurrency(topCategory.amount || 0)}
					</div>
					<div class="text-lg text-gray-300">spent in this category</div>
				</div>
			</div>
		</div>

		<div class="max-w-2xl mx-auto space-y-4">
			<div class="text-2xl text-yellow-300 font-semibold">
				{categoryFacts[0]}
			</div>
			<div class="text-lg text-gray-400">
				{categoryFacts[1]}
			</div>
		</div>
	</div>
</Slide>
