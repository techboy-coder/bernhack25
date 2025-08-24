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

	// Calculate some fun year-end insights
	const getYearInsight = () => {
		const totalSpent = data?.totalSpent || 0;
		const totalTransactions = data?.totalTransactions || 0;
		const avgTransaction = totalTransactions > 0 ? totalSpent / totalTransactions : 0;

		if (avgTransaction > 200) return 'You prefer quality over quantity! 💎';
		if (avgTransaction > 100) return 'You balance treats with necessities! ⚖️';
		if (avgTransaction > 50) return "You're a mindful spender! 🧘‍♀️";
		return 'You watch every franc! 🔍';
	};

	const currentYear = new Date().getFullYear();
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white relative overflow-hidden">
		<div class="space-y-8">
			<div class="text-6xl mb-6">🎉</div>
			<h1
				class="text-5xl md:text-7xl font-black bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent"
			>
				That's a Wrap!
			</h1>
			<p class="text-2xl md:text-3xl font-light text-gray-300">
				Your {currentYear} Spendcast Wrapped
			</p>
		</div>

		<div class="max-w-4xl mx-auto">
			<div
				class="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-3xl p-12 border border-purple-300/30"
			>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div class="space-y-4">
						<div class="text-4xl">📊</div>
						<div class="space-y-2">
							<div class="text-lg text-gray-300">Your Financial Year</div>
							<div class="text-2xl font-bold text-purple-400">
								{data?.totalTransactions || 0} transactions
							</div>
							<div class="text-2xl font-bold text-pink-400">
								{formatCurrency(data?.totalSpent || 0)} spent
							</div>
						</div>
					</div>

					<div class="space-y-4">
						<div class="text-4xl">🎯</div>
						<div class="space-y-2">
							<div class="text-lg text-gray-300">Top Achievement</div>
							<div class="text-xl font-semibold text-yellow-300">
								{data?.topCategory?.name
									? `${data.topCategory.name.charAt(0).toUpperCase()}${data.topCategory.name.slice(1)} Champion`
									: 'Financial Awareness'}
							</div>
							<div class="text-sm text-gray-400">
								{getYearInsight()}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="max-w-3xl mx-auto space-y-8">
			<div class="text-2xl md:text-3xl text-yellow-300 font-semibold">
				You've been amazing with your finances! 🌟
			</div>

			<div class="text-lg md:text-xl text-gray-300 leading-relaxed">
				Every transaction tells a story, every decision shapes your future, and every day is a new
				opportunity to build the financial life you want.
			</div>

			<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
				<div class="text-xl font-semibold text-white mb-4">
					Here's to an even better {currentYear + 1}! 🥂
				</div>
				<div class="text-gray-300">
					May your savings grow, your goals be achieved, and your financial journey be filled with
					smart decisions and happy moments.
				</div>
			</div>

			<div class="flex justify-center space-x-2 text-3xl">
				<span class="animate-bounce" style="animation-delay: 0ms;">🎊</span>
				<span class="animate-bounce" style="animation-delay: 100ms;">💰</span>
				<span class="animate-bounce" style="animation-delay: 200ms;">🚀</span>
				<span class="animate-bounce" style="animation-delay: 300ms;">✨</span>
			</div>
		</div>

		<div class="text-sm text-gray-500 pt-8">
			Generated with ❤️ by Spendcast • Your AI Financial Companion
		</div>
	</div>
</Slide>
