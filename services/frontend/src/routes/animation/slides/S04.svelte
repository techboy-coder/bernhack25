<script lang="ts">
	import { Slide } from '@animotion/core';

	let { data } = $props();

	const getTransactionFacts = (count: number) => {
		if (count > 1000)
			return { main: 'Transaction Master! 🏆', sub: "You're a financial powerhouse!" };
		if (count > 500) return { main: 'Super Active! 🚀', sub: 'You keep your money moving!' };
		if (count > 200) return { main: 'Regular User! 👍', sub: 'Consistent financial activity!' };
		if (count > 50) return { main: 'Getting Started! 🌱', sub: 'Building good habits!' };
		return { main: 'Minimalist! ✨', sub: 'Quality over quantity!' };
	};

	const transactionFacts = $derived(getTransactionFacts(data?.totalTransactions || 0));
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white">
		<div class="space-y-6">
			<div style="view-transition-name: emoji-transactions" class="text-6xl">📊</div>
			<h1
				style="view-transition-name: slide-header"
				class="text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent"
			>
				Transaction Master
			</h1>
		</div>

		<div class="space-y-6">
			<div
				style="view-transition-name: stat-card-transactions"
				class="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 max-w-lg mx-auto"
			>
				<div class="text-6xl md:text-8xl font-black text-blue-400 tabular-nums">
					{(data?.totalTransactions || 0).toLocaleString()}
				</div>
				<div class="text-xl text-gray-300 mt-4">transactions in 2024</div>
			</div>
		</div>

		<div class="max-w-2xl mx-auto space-y-4">
			<div class="text-2xl text-yellow-300 font-semibold">
				{transactionFacts.main}
			</div>
			<div class="text-lg text-gray-400">
				{transactionFacts.sub}
			</div>
		</div>
	</div>
</Slide>
