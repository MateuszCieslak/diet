import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';
import Dialog from './Dialog.svelte';

const shortContent = createRawSnippet(() => ({ render: () => '<p>Krótko</p>' }));

test('a tall dialog keeps three quarters of the screen height whatever its content', async () => {
	const screen = render(Dialog, { open: true, tall: true, title: 'Dodaj', children: shortContent });
	await expect.element(screen.getByRole('dialog')).toBeVisible();
	const height = screen.getByRole('dialog').element().getBoundingClientRect().height;
	expect(height).toBeCloseTo(window.innerHeight * 0.75, 0);
});
