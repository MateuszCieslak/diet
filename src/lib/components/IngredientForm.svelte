<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import NumberField from '$lib/components/ui/NumberField.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { categories } from '$lib/config/categories';
	import { units, type Unit } from '$lib/config/units';
	import { pl } from '$lib/i18n/pl';
	import type { IngredientFormValues } from '$lib/schemas/ingredient';

	type Props = {
		title: string;
		values: IngredientFormValues;
		errors?: Record<string, string>;
		/** Set on edit: the unit is immutable, so it is shown read-only and not submitted. */
		lockedUnit?: Unit;
		action?: string;
	};

	let { title, values, errors = {}, lockedUnit, action }: Props = $props();

	// Editable copies of the fields; they reset when the page passes new values (after a failed submit).
	let name = $derived(values.name);
	let unit = $derived(values.unit);
	let category = $derived(values.category);
	let kcal = $derived(values.kcal);
	let protein = $derived(values.protein);
	let fat = $derived(values.fat);
	let carbs = $derived(values.carbs);

	const shownUnit = $derived(lockedUnit ?? (units.includes(unit as Unit) ? (unit as Unit) : 'g'));
	const unitOptions = units.map((u) => ({ value: u, label: pl.units[u] }));
	const categoryOptions = categories.map((c) => ({ value: c, label: pl.categories[c] }));
	const formId = $props.id();
</script>

<header class="header">
	<Button href="/ingredients" variant="ghost" iconOnly aria-label={pl.common.back}>
		<ArrowLeftIcon />
	</Button>
	<h1>{title}</h1>
	<Button type="submit" form={formId}>{pl.common.save}</Button>
</header>

<form id={formId} method="POST" {action} use:enhance class="stack form" novalidate>
	{#if errors.form}
		<p class="error" role="alert">{errors.form}</p>
	{/if}

	<TextField
		name="name"
		label={pl.ingredients.name}
		bind:value={name}
		error={errors.name}
		autocomplete="off"
		maxlength={120}
		required
	/>

	{#if lockedUnit}
		<div class="locked">
			<span class="label">{pl.ingredients.unit}</span>
			<span class="value">{pl.units[lockedUnit]}</span>
			<p class="muted hint">{pl.ingredients.unitLocked}</p>
		</div>
	{:else}
		<Select
			name="unit"
			label={pl.ingredients.unit}
			options={unitOptions}
			bind:value={unit}
			error={errors.unit}
			required
		/>
	{/if}

	<Select
		name="category"
		label={pl.ingredients.category}
		options={categoryOptions}
		placeholder={pl.ingredients.categoryPlaceholder}
		bind:value={category}
		error={errors.category}
		required
	/>

	<fieldset class="stack">
		<legend class="section-label">{pl.ingredients.nutritionLabel(shownUnit)}</legend>
		<div class="grid">
			<NumberField name="kcal" label={pl.ingredients.kcal} bind:value={kcal} error={errors.kcal} />
			<NumberField
				name="protein"
				label={pl.ingredients.protein}
				bind:value={protein}
				error={errors.protein}
			/>
			<NumberField name="fat" label={pl.ingredients.fat} bind:value={fat} error={errors.fat} />
			<NumberField
				name="carbs"
				label={pl.ingredients.carbs}
				bind:value={carbs}
				error={errors.carbs}
			/>
		</div>
	</fieldset>
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
		gap: var(--space-4);
		padding: var(--space-4) var(--gutter);
	}
	.locked {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.label {
		color: var(--color-muted);
		font-size: var(--font-size-secondary);
		font-weight: 600;
	}
	.value {
		font-weight: 600;
	}
	.hint {
		margin: 0;
		font-size: var(--font-size-secondary);
	}
	fieldset {
		/* Fieldsets default to `min-width: min-content`, which pushes the grid past the screen. */
		min-width: 0;
		margin: 0;
		padding: 0;
		border: none;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-3);
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
	}
</style>
