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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric'
		});
	};

	const getPurchaseReaction = (amount: number) => {
		if (amount > 5000) return { emoji: '🤯', text: 'Holy expenses, Batman!' };
		if (amount > 2000) return { emoji: '😱', text: 'Whoa, that was bold!' };
		if (amount > 1000) return { emoji: '😮', text: 'That was a big one!' };
		if (amount > 500) return { emoji: '🙈', text: 'Ouch, that stung!' };
		return { emoji: '😊', text: 'Not too shabby!' };
	};

	const biggestSpend = $derived(
		data?.biggestSpend || { amount: 0, date: new Date().toISOString(), category: 'other' }
	);
	const reaction = $derived(getPurchaseReaction(Math.abs(biggestSpend.amount)));
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white relative">
		<div class="space-y-6">
			<h1
				class="text-4xl md:text-6xl font-black bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent"
			>
				Your Biggest Splurge
			</h1>
			<p class="text-xl text-gray-300">The purchase that made your wallet weep</p>
		</div>

		<div class="max-w-2xl mx-auto">
			<div
				class="bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-sm rounded-3xl p-12 border border-red-300/30 relative overflow-hidden"
			>
				<div class="relative space-y-6">
					<div class="text-6xl">
						{reaction.emoji}
					</div>
					<div class="text-6xl md:text-8xl font-black text-red-400 tabular-nums">
						{formatCurrency(Math.abs(biggestSpend.amount))}
					</div>
					<div class="space-y-2">
						<div class="text-lg text-gray-300">
							on {formatDate(biggestSpend.date)}
						</div>
						<div class="text-sm text-red-300 capitalize font-medium">
							{biggestSpend.category} category
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="max-w-2xl mx-auto space-y-4">
			<div class="text-2xl text-yellow-300 font-semibold">
				{reaction.text}
			</div>
			<div class="text-lg text-gray-400">
				Sometimes you've got to treat yourself to the finer things in life!
			</div>
		</div>
	</div>
</Slide>
