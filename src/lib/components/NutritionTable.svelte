<script lang="ts">
	import { users } from '$lib/config/users';
	import { pl } from '$lib/i18n/pl';
	import { formatKcal, formatMacro, type Nutrition } from '$lib/nutrition';

	type Props = {
		/** Per-user nutrition of one portion; `null` marks a person who does not eat the meal. */
		perUser: Record<string, Nutrition | null>;
		/** Per-user kcal already eaten; when given, the kcal cell reads "eaten / planned". */
		eatenKcal?: Record<string, number>;
	};

	let { perUser, eatenKcal }: Props = $props();
</script>

<table>
	<thead>
		<tr>
			<th scope="col"><span class="visually-hidden">{pl.nutrition.person}</span></th>
			<th scope="col">{pl.nutrition.kcal}</th>
			<th scope="col"><abbr title={pl.nutrition.protein}>{pl.nutrition.proteinShort}</abbr></th>
			<th scope="col"><abbr title={pl.nutrition.fat}>{pl.nutrition.fatShort}</abbr></th>
			<th scope="col"><abbr title={pl.nutrition.carbs}>{pl.nutrition.carbsShort}</abbr></th>
		</tr>
	</thead>
	<tbody>
		{#each users as user (user.key)}
			{@const n = perUser[user.key] ?? null}
			<tr>
				<th scope="row">
					<span class="dot" style:background={user.color}></span>
					{user.name}
				</th>
				{#if n}
					<td class="kcal">
						{#if eatenKcal}
							{pl.nutrition.eatenOfPlanned(
								formatKcal(eatenKcal[user.key] ?? 0),
								formatKcal(n.kcal)
							)}
						{:else}
							{formatKcal(n.kcal)}
						{/if}
					</td>
					<td>{formatMacro(n.protein)}</td>
					<td>{formatMacro(n.fat)}</td>
					<td>{formatMacro(n.carbs)}</td>
				{:else}
					<td colspan="4" class="excluded">{pl.nutrition.excluded}</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-secondary);
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: var(--space-2) var(--space-1);
		text-align: right;
	}
	thead th {
		color: var(--color-muted);
		font-size: var(--font-size-label);
		font-weight: 700;
	}
	abbr {
		text-decoration: none;
	}
	tbody tr + tr {
		border-top: 1px solid var(--color-divider);
	}
	tbody th {
		font-weight: 600;
		text-align: left;
	}
	.dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-right: var(--space-1);
		border-radius: var(--radius-pill);
		vertical-align: middle;
	}
	.kcal {
		font-weight: 700;
	}
	.excluded {
		color: var(--color-muted);
		text-align: center;
	}
</style>
