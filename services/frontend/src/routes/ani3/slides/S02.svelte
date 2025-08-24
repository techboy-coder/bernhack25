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
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white relative">
		<div class="space-y-6">
			<h1
				style="view-transition-name: slide-header"
				class="text-5xl md:text-7xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"
			>
				Your 2024 at a Glance
			</h1>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
			<div
				style="view-transition-name: stat-card-spent"
				class="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
			>
				<div style="view-transition-name: emoji-spent" class="text-4xl mb-4">💸</div>
				<div class="text-3xl font-bold text-red-400">{formatCurrency(data?.totalSpent || 0)}</div>
				<div class="text-lg text-white">Total Spent</div>
			</div>

			<div
				style="view-transition-name: stat-card-earned"
				class="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
			>
				<div style="view-transition-name: emoji-earned" class="text-4xl mb-4">💰</div>
				<div class="text-3xl font-bold text-green-400">
					{formatCurrency(data?.totalEarned || 0)}
				</div>
				<div class="text-lg text-white">Total Earned</div>
			</div>

			<div
				style="view-transition-name: stat-card-accounts"
				class="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
			>
				<div style="view-transition-name: emoji-accounts" class="text-4xl mb-4">🏦</div>
				<div class="text-3xl font-bold text-blue-400">{data?.accounts?.length || 0}</div>
				<div class="text-lg text-white">Bank Accounts</div>
			</div>
		</div>

		<div class="text-xl text-white max-w-2xl mx-auto">
			This year, you made <span class="font-bold text-yellow-400"
				>{data?.totalTransactions || 0}</span
			> transactions across all your accounts. Let's dive deeper into your spending journey!
		</div>
	</div>
</Slide>
