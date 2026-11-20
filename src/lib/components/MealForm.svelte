<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import ImageIcon from '$lib/components/icons/ImageIcon.svelte';
	import XIcon from '$lib/components/icons/XIcon.svelte';
	import IngredientPicker from '$lib/components/IngredientPicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import NumberField from '$lib/components/ui/NumberField.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { mealTypes, type MealTypeKey } from '$lib/config/meal-types';
	import { pl } from '$lib/i18n/pl';
	import { formatKcal, formatMacro, mealNutrition } from '$lib/nutrition';
	import { nameMaxLength } from '$lib/schemas/common';
	import type { Ingredient } from '$lib/schemas/ingredient';
	import { preparationMaxLength, type MealItem } from '$lib/schemas/meal';

	type Props = {
		/** `planMeal` edits a planned copy: no photo upload and no types. */
		mode: 'meal' | 'planMeal';
		initial?: {
			name: string;
			types?: MealTypeKey[];
			items: MealItem[];
			preparation: string | null;
			photo?: string | null;
		};
		errors?: Record<string, string>;
		title: string;
		backHref: string;
		action?: string;
	};

	let { mode, initial, errors = {}, title, backHref, action }: Props = $props();

	type Row = { key: number; ingredient: Ingredient; amount: string };

	const amountFormat = new Intl.NumberFormat('pl-PL', {
		maximumFractionDigits: 2,
		useGrouping: false
	});
	let nextKey = 0;

	// Editable copies of the initial values. They survive a failed submit (the page data does not
	// change then) and reset when the page passes a different meal.
	let name = $derived(initial?.name ?? '');
	let types = $derived<MealTypeKey[]>(initial?.types ?? []);
	let preparation = $derived(initial?.preparation ?? '');
	let rows = $derived<Row[]>(
		(initial?.items ?? []).map((i) => ({
			key: nextKey++,
			ingredient: i.ingredient,
			amount: amountFormat.format(i.amount)
		}))
	);

	let previewUrl = $state<string | null>(null);
	let submitting = $state(false);
	const formId = $props.id();

	const shownPhoto = $derived(previewUrl ?? (initial?.photo ? `/photos/${initial.photo}` : null));
	const itemsJson = $derived(
		JSON.stringify(rows.map((r) => ({ ingredientId: r.ingredient.id, amount: r.amount })))
	);
	const summary = $derived(
		mealNutrition(rows.map((r) => ({ ingredient: r.ingredient, amount: parseAmount(r.amount) })))
	);

	/** The live summary counts unfinished input (`1,`, `abc`) as 0; the server validates properly. */
	function parseAmount(text: string): number {
		const trimmed = text.trim();
		return /^\d+([.,]\d+)?$/.test(trimmed) ? Number(trimmed.replace(',', '.')) : 0;
	}

	function toggleType(type: MealTypeKey) {
		types = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
	}

	function addRow(ingredient: Ingredient) {
		rows = [...rows, { key: nextKey++, ingredient, amount: '' }];
	}

	function removeRow(key: number) {
		rows = rows.filter((r) => r.key !== key);
	}

	function setAmount(key: number, amount: string) {
		rows = rows.map((r) => (r.key === key ? { ...r, amount } : r));
	}

	function handlePhotoChange(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = file ? URL.createObjectURL(file) : null;
	}

	$effect(() => () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
	});
</script>

<header class="header">
	<Button href={backHref} variant="ghost" iconOnly aria-label={pl.common.back}>
		<ArrowLeftIcon />
	</Button>
	<h1>{title}</h1>
	<Button type="submit" form={formId} disabled={submitting}>{pl.common.save}</Button>
</header>

<form
	id={formId}
	method="POST"
	{action}
	enctype="multipart/form-data"
	class="stack form"
	novalidate
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			// Keep the typed values after a failed submit; a success redirects anyway.
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	{#if errors.form}
		<p class="error" role="alert">{errors.form}</p>
	{/if}

	{#if mode === 'meal'}
		<div class="field">
			<label class="photo" class:has-photo={shownPhoto}>
				{#if shownPhoto}
					<img src={shownPhoto} alt="" />
					<span class="photo-action">{pl.meals.photoChange}</span>
				{:else}
					<ImageIcon size={28} />
					<span class="photo-action">{pl.meals.photoAdd}</span>
					<span class="muted hint">{pl.meals.photoHint}</span>
				{/if}
				<input
					class="visually-hidden"
					type="file"
					name="photo"
					accept="image/*"
					aria-invalid={errors.photo ? 'true' : undefined}
					onchange={handlePhotoChange}
				/>
			</label>
			{#if errors.photo}
				<p class="error">{errors.photo}</p>
			{/if}
		</div>
	{/if}

	<TextField
		name="name"
		label={pl.meals.name}
		bind:value={name}
		error={errors.name}
		placeholder={pl.meals.namePlaceholder}
		autocomplete="off"
		maxlength={nameMaxLength}
		required
	/>

	{#if mode === 'meal'}
		<fieldset class="field">
			<legend class="label">{pl.meals.types}</legend>
			<div class="chips">
				{#each mealTypes as type (type)}
					<Chip pressed={types.includes(type)} onclick={() => toggleType(type)}>
						{pl.mealTypes[type]}
					</Chip>
				{/each}
			</div>
			{#each types as type (type)}
				<input type="hidden" name="types" value={type} />
			{/each}
			{#if errors.types}
				<p class="error">{errors.types}</p>
			{/if}
		</fieldset>
	{/if}

	<section class="stack" aria-labelledby="{formId}-ingredients">
		<h2 class="section-label" id="{formId}-ingredients">{pl.meals.ingredients}</h2>
		<input type="hidden" name="items" value={itemsJson} />

		{#if rows.length > 0}
			<ul class="rows">
				{#each rows as row, i (row.key)}
					<li>
						<div class="amount">
							<NumberField
								name="amount-{i}"
								label={row.ingredient.name}
								unit={row.ingredient.unit}
								bind:value={() => row.amount, (amount) => setAmount(row.key, amount)}
								error={errors[`items.${i}.amount`] ?? errors[`items.${i}.ingredientId`]}
							/>
						</div>
						<Button
							variant="ghost"
							iconOnly
							aria-label={pl.meals.removeItem(row.ingredient.name)}
							onclick={() => removeRow(row.key)}
						>
							<XIcon size={20} />
						</Button>
					</li>
				{/each}
			</ul>
		{/if}

		<IngredientPicker onPick={addRow} pickedIds={rows.map((r) => r.ingredient.id)} />

		{#if errors.items}
			<p class="error">{errors.items}</p>
		{/if}

		<div class="summary">
			<p class="section-label">{pl.meals.perPortion}</p>
			<dl>
				<div>
					<dt>{pl.nutrition.kcal}</dt>
					<dd>{formatKcal(summary.kcal)}</dd>
				</div>
				<div>
					<dt>{pl.nutrition.protein}</dt>
					<dd>{formatMacro(summary.protein)}</dd>
				</div>
				<div>
					<dt>{pl.nutrition.fat}</dt>
					<dd>{formatMacro(summary.fat)}</dd>
				</div>
				<div>
					<dt>{pl.nutrition.carbs}</dt>
					<dd>{formatMacro(summary.carbs)}</dd>
				</div>
			</dl>
		</div>
	</section>

	<div class="field">
		<label class="label" for="{formId}-preparation">{pl.meals.preparation}</label>
		<textarea
			id="{formId}-preparation"
			name="preparation"
			rows="6"
			maxlength={preparationMaxLength}
			placeholder={pl.meals.preparationPlaceholder}
			bind:value={preparation}
			aria-invalid={errors.preparation ? 'true' : undefined}></textarea>
		{#if errors.preparation}
			<p class="error">{errors.preparation}</p>
		{/if}
	</div>
</form>

<style>
	.header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--gutter);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	h1 {
		flex: 1;
		margin: 0;
		font-size: var(--font-size-subtitle);
		font-weight: 700;
	}
	.form {
		gap: var(--space-5);
		padding: var(--space-4) var(--gutter);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	fieldset {
		margin: 0;
		padding: 0;
		border: none;
	}
	.label {
		padding: 0;
		color: var(--color-muted);
		font-size: var(--font-size-secondary);
		font-weight: 600;
	}
	.photo {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		min-height: 160px;
		border: 1.5px dashed var(--color-border-strong);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-muted);
		overflow: hidden;
		cursor: pointer;
	}
	.photo:focus-within {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
	.photo.has-photo {
		border-style: solid;
		border-color: var(--color-border);
	}
	.photo img {
		width: 100%;
		max-height: 240px;
		object-fit: cover;
	}
	.photo-action {
		color: var(--color-accent);
		font-weight: 600;
	}
	.has-photo .photo-action {
		position: absolute;
		right: var(--space-2);
		bottom: var(--space-2);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-pill);
		background: var(--color-surface);
	}
	.hint {
		font-size: var(--font-size-label);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.rows {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}
	.rows li {
		display: flex;
		align-items: flex-end;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
	}
	.rows li + li {
		border-top: 1px solid var(--color-divider);
	}
	.amount {
		flex: 1;
		min-width: 0;
	}
	.summary {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--color-accent-soft);
	}
	.summary dl {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-2);
		margin: 0;
	}
	.summary dl div {
		display: flex;
		flex-direction: column-reverse;
		align-items: center;
	}
	.summary dt {
		color: var(--color-muted);
		font-size: var(--font-size-label);
	}
	.summary dd {
		margin: 0;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	textarea {
		min-height: 140px;
		padding: var(--space-3);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-ink);
		line-height: 1.5;
		resize: vertical;
	}
	textarea:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
	}
	textarea[aria-invalid='true'] {
		border-color: var(--color-danger);
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
	}
</style>
