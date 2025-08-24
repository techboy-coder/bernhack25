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

	const getAccountEmoji = (type: string): string => {
		const emojiMap: Record<string, string> = {
			personal: '🏦',
			savings: '💰',
			retirement: '🏛️',
			marriage: '💍',
			checking: '🏦',
			investment: '📈'
		};
		return emojiMap[type.toLowerCase()] || '🏦';
	};

	const getAccountGradient = (type: string, index: number) => {
		const gradients = [
			'from-blue-500 to-purple-600',
			'from-green-500 to-teal-600',
			'from-orange-500 to-red-600',
			'from-pink-500 to-rose-600',
			'from-indigo-500 to-blue-600',
			'from-purple-500 to-pink-600'
		];
		return gradients[index % gradients.length];
	};

	const accounts = $derived(data?.accounts || []);
	const totalNetWorth = $derived(
		accounts.reduce((sum: number, acc: any) => sum + acc.account.currentBalance, 0)
	);

	const wealthInsight = $derived(() => {
		if (totalNetWorth > 100000) return { text: "You're building serious wealth! 💰", emoji: '🚀' };
		if (totalNetWorth > 50000) return { text: 'Great financial foundation! 🏗️', emoji: '📈' };
		if (totalNetWorth > 25000) return { text: "You're on the right track! 🛤️", emoji: '⭐' };
		if (totalNetWorth > 10000) return { text: 'Building your nest egg! 🥚', emoji: '🌱' };
		return { text: 'Every journey starts somewhere! 🌟', emoji: '🎯' };
	});
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white">
		<div class="space-y-6">
			<h1
				class="text-4xl md:text-6xl font-black bg-gradient-to-r from-emerald-400 to-cyan-600 bg-clip-text text-transparent"
			>
				Your Financial Empire
			</h1>
			<p class="text-xl text-gray-300">All your accounts at a glance</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
			{#each accounts as account, index}
				<div
					class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all"
				>
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="text-3xl">{getAccountEmoji(account.account.type)}</div>
							<div class="text-xs text-gray-400 uppercase tracking-wider">
								{account.account.type}
							</div>
						</div>

						<div class="space-y-2">
							<h3 class="text-lg font-semibold text-white">
								{account.account.name}
							</h3>
							<div
								class="text-2xl font-bold bg-gradient-to-r {getAccountGradient(
									account.account.type,
									index
								)} bg-clip-text text-transparent"
							>
								{formatCurrency(account.account.currentBalance)}
							</div>
						</div>

						<div class="pt-2 border-t border-white/10">
							<div class="text-sm text-gray-400">
								{account.transactionCount || 0} transactions this year
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="max-w-2xl mx-auto">
			<div
				class="bg-gradient-to-br from-emerald-500/20 to-cyan-600/20 backdrop-blur-sm rounded-3xl p-12 border border-emerald-300/30"
			>
				<div class="space-y-6">
					<div class="text-4xl">💎</div>
					<div class="space-y-2">
						<div class="text-lg text-gray-300">Total Net Worth</div>
						<div class="text-5xl md:text-6xl font-black text-emerald-400 tabular-nums">
							{formatCurrency(totalNetWorth)}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="max-w-2xl mx-auto space-y-4">
			<div class="text-2xl text-yellow-300 font-semibold flex items-center justify-center gap-3">
				<span>{wealthInsight().emoji}</span>
				<span>{wealthInsight().text}</span>
			</div>
			<div class="text-lg text-gray-400">
				You're managing {accounts.length} accounts across different financial goals. That's smart diversification!
			</div>
		</div>
	</div>
</Slide>
