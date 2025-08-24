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

	const getGoalEmoji = (category: string): string => {
		const emojiMap: Record<string, string> = {
			emergency: '🚨',
			vacation: '🏖️',
			house: '🏠',
			car: '🚗',
			wedding: '💒',
			education: '🎓',
			retirement: '🌅',
			general: '🎯'
		};
		return emojiMap[category.toLowerCase()] || '💰';
	};

	const savingsProfiles = $derived(data?.savingsProfiles || []);
	const totalSavingsTarget = $derived(
		savingsProfiles.reduce((sum: number, profile: any) => sum + profile.targetAmount, 0)
	);
	const totalCurrentSavings = $derived(
		savingsProfiles.reduce((sum: number, profile: any) => sum + profile.currentAmount, 0)
	);
	const overallProgress = $derived(
		totalSavingsTarget > 0 ? (totalCurrentSavings / totalSavingsTarget) * 100 : 0
	);

	const completedGoals = $derived(
		savingsProfiles.filter((profile: any) => profile.currentAmount >= profile.targetAmount).length
	);

	const savingsMotivation = $derived(() => {
		if (overallProgress >= 100) return { text: 'Goals crushed! 🎉', emoji: '👑' };
		if (overallProgress >= 75) return { text: 'Almost there! 🔥', emoji: '🚀' };
		if (overallProgress >= 50) return { text: 'Halfway hero! 💪', emoji: '⭐' };
		if (overallProgress >= 25) return { text: 'Building momentum! 📈', emoji: '🌱' };
		return { text: 'Every start counts! 🌟', emoji: '🎯' };
	});
</script>

<Slide class="h-full place-content-center place-items-center">
	<div class="text-center space-y-12 text-white">
		<div class="space-y-6">
			<h1
				class="text-4xl md:text-6xl font-black bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent"
			>
				Dream Chaser
			</h1>
			<p class="text-xl text-gray-300">Your savings goals progress</p>
		</div>

		{#if savingsProfiles.length > 0}
			<!-- Overall Progress Ring -->
			<div class="flex justify-center">
				<div class="relative">
					<svg width="200" height="200" class="transform -rotate-90">
						<circle
							cx="100"
							cy="100"
							r="90"
							stroke="rgba(255,255,255,0.1)"
							stroke-width="12"
							fill="none"
						/>
						<circle
							cx="100"
							cy="100"
							r="90"
							stroke="url(#progressGradient)"
							stroke-width="12"
							fill="none"
							stroke-linecap="round"
							stroke-dasharray="565.48"
							stroke-dashoffset={565.48 - (overallProgress / 100) * 565.48}
						/>
						<defs>
							<linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" style="stop-color:#fbbf24" />
								<stop offset="100%" style="stop-color:#f97316" />
							</linearGradient>
						</defs>
					</svg>
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="text-center">
							<div class="text-3xl font-black text-amber-400">
								{overallProgress.toFixed(0)}%
							</div>
							<div class="text-sm text-gray-300">Complete</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Goals Summary -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
				<div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
					<div class="text-3xl mb-3">🎯</div>
					<div class="text-2xl font-bold text-amber-400">{savingsProfiles.length}</div>
					<div class="text-sm text-gray-300">Active Goals</div>
				</div>
				<div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
					<div class="text-3xl mb-3">✅</div>
					<div class="text-2xl font-bold text-green-400">{completedGoals}</div>
					<div class="text-sm text-gray-300">Completed</div>
				</div>
				<div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
					<div class="text-3xl mb-3">💰</div>
					<div class="text-xl font-bold text-blue-400">{formatCurrency(totalCurrentSavings)}</div>
					<div class="text-sm text-gray-300">Total Saved</div>
				</div>
			</div>

			<!-- Individual Goals -->
			<div class="space-y-4 max-w-3xl mx-auto">
				{#each savingsProfiles as goal, index}
					{@const progress =
						goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0}
					<div class="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
						<div class="flex items-center gap-6">
							<div class="text-3xl">{getGoalEmoji(goal.category)}</div>
							<div class="flex-1 space-y-2">
								<div class="flex justify-between items-center">
									<h3 class="text-lg font-semibold text-white">{goal.name}</h3>
									<span class="text-sm text-amber-400 font-medium">
										{progress.toFixed(0)}%
									</span>
								</div>
								<div class="w-full bg-white/10 rounded-full h-3">
									<div
										class="h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
										style="width: {Math.min(100, progress)}%"
									></div>
								</div>
								<div class="flex justify-between text-sm text-gray-400">
									<span>{formatCurrency(goal.currentAmount)}</span>
									<span>{formatCurrency(goal.targetAmount)}</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- No Goals State -->
			<div class="max-w-2xl mx-auto space-y-6">
				<div class="text-6xl">🎯</div>
				<div class="text-2xl text-amber-400">No Savings Goals Set</div>
				<div class="text-lg text-gray-400">
					But that's okay! You're still managing your finances well. Setting goals is the next step
					to supercharge your savings!
				</div>
			</div>
		{/if}

		<div class="max-w-2xl mx-auto space-y-4">
			<div class="text-2xl text-yellow-300 font-semibold flex items-center justify-center gap-3">
				<span>{savingsMotivation().emoji}</span>
				<span>{savingsMotivation().text}</span>
			</div>
			<div class="text-lg text-gray-400">
				{savingsProfiles.length > 0
					? `You're actively working towards ${savingsProfiles.length} financial goals. That's the spirit of a true planner!`
					: "Every financial journey is unique. You're doing great just by staying aware of your spending!"}
			</div>
		</div>
	</div>
</Slide>
