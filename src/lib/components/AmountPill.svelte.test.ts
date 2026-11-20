import { render } from 'vitest-browser-svelte';
import AmountPill from './AmountPill.svelte';

test('AmountPill shows the amount and opens editing on tap', async () => {
	const onclick = vi.fn<() => void>();
	const screen = render(AmountPill, { name: 'Mleko 2%', text: '500 ml', onclick });
	const pill = screen.getByRole('button', { name: 'Zmień ilość: Mleko 2%' });
	await expect.element(pill).toHaveTextContent('500 ml');
	await pill.click();
	expect(onclick).toHaveBeenCalledOnce();
});

test('AmountPill offers adding an amount when there is none', async () => {
	const onclick = vi.fn<() => void>();
	const screen = render(AmountPill, { name: 'Maliny', text: '', onclick });
	const pill = screen.getByRole('button', { name: 'Dodaj ilość: Maliny' });
	await expect.element(pill).toHaveTextContent('+ ilość');
	await pill.click();
	expect(onclick).toHaveBeenCalledOnce();
});
