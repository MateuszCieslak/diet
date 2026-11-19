import { render } from 'vitest-browser-svelte';
import NumberField from './NumberField.svelte';

test('shows unit label next to the input', async () => {
	const screen = render(NumberField, { name: 'amount', label: 'Ilość', unit: 'pcs' });
	await expect.element(screen.getByText('szt.')).toBeVisible();
	await expect.element(screen.getByLabelText('Ilość')).toHaveAttribute('inputmode', 'decimal');
});

test('shows the error and marks the input invalid', async () => {
	const screen = render(NumberField, { name: 'amount', label: 'Ilość', error: 'Błąd' });
	await expect.element(screen.getByText('Błąd')).toBeVisible();
	await expect.element(screen.getByLabelText('Ilość')).toHaveAttribute('aria-invalid', 'true');
});
