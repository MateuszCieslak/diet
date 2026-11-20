import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'node:fs';

// App version shown in the footer: `major.minor` from package.json plus the GitHub Actions run
// number as the patch (set automatically in CI), e.g. `0.1.42`. Local builds show `<version>-dev`.
const pkgVersion: string = JSON.parse(readFileSync('package.json', 'utf8')).version;
const runNumber = process.env.GITHUB_RUN_NUMBER;
const appVersion = runNumber
	? `${pkgVersion.split('.').slice(0, 2).join('.')}.${runNumber}`
	: `${pkgVersion}-dev`;

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(appVersion)
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			typescript: {
				config: (config) => {
					config.include.push('../drizzle.config.ts');
				}
			}
		})
	],
	test: {
		globals: true,
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.svelte.test.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.test.ts'],
					exclude: ['src/lib/server/**']
				}
			}
		]
	}
});
