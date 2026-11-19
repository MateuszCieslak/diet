# Project Guidelines

## Language

All comments, rules, and documentation in this file (AGENTS.md) must be written in English.

## Overview

This is simple diet application for two people which allows to create meal plan for the week, 
write down recipe for the meal or create shopping list.

## Tech stack

- **Language:** TypeScript (`strict` mode, ES2022 target).
- **Framework:** SvelteKit with Svelte 5 (runes).
- **UI:** Own components library styled with base css file which contains utils and css variables.
- **Unit tests:** vitest with browser mode.
- **Lint:** oxlint for TS.
- **Formatting:** Prettier with `prettier-plugin-svelte`.
- **E2E tests:** None for now (may add Playwright later).
- **Package manager:** pnpm 10 (pinned in `package.json`).
- **Runtime:** Node 22 LTS (`engines.node: ">=22"` in `package.json`).
- **CI/CD:** GitHub Actions: lint, test, build. Deployment (copy `build/` to the VPS over SSH and restart the app process under PM2/systemd) is planned for the beta phase and not set up yet.
- **Database:** MySQL.
- **Data access:** Drizzle ORM (`drizzle-orm/mysql2` driver); schema defined in TypeScript, migrations generated with `drizzle-kit` and reviewed before applying.
- **Hosting:** Self-managed VPS (owned by the project author). Built with `@sveltejs/adapter-node`, run as a plain Node process under PM2/systemd (no Docker).
- **Database connection:** Existing MySQL instance on the VPS; the app connects via a connection string from an environment variable (`DATABASE_URL`).
- **Photo storage:** Meal photos stored on the VPS local disk (directory configured via environment variable).
- **Photo processing:** On upload, `sharp` resizes to max 800px on the longer side and converts to WebP (quality ~75). Originals are not kept.
- **Validation:** `valibot` schemas shared between forms and server actions/endpoints.
- **UI language:** Polish only. All user-facing strings live in a single module (e.g. `src/lib/i18n/pl.ts`) so another language can be added later; never hardcode UI text in components. Code, comments and docs stay in English.
- **Shopping list refresh:** Client-side polling of a JSON endpoint (`+server.ts`) every 5s, replacing only the list state (no page reload, no `invalidateAll`). Active only on touch/mobile devices while `document.visibilityState === 'visible'`. No WebSockets.
- **Auth:** Single shared password for the whole app; a successful login sets a long-lived session cookie. No per-user accounts.

## UI design

- Approved phone mockups: https://claude.ai/artifact/BzKWJtaJ9xQQ8FmHx82rNb (private to the author). The full description (tokens, rules, per-screen notes) is in the "UI design" section of `docs/superpowers/specs/2026-11-18-diet-app-design.md`; build from that.
- Phone-first. Light theme only for now. Inter font (self-hosted via `@fontsource/inter`).
- Colors, radius, spacing and font sizes come from CSS variables in `src/lib/styles/base.css`. Never hardcode hex values in components. Per-person colors (`color`, `tint`) come from `src/lib/config/users.ts`.
- One green accent (`--color-accent`) for actions and selection. White cards with a hairline border on an off-white background.
- Touch targets at least 44×44px; inputs use 16px text.
- Icons are inline stroke SVG components in `src/lib/components/icons/`. No emoji, no icon font.
- Use real `<button>`, `<a>`, `<label>` and `<table>` elements; icon-only buttons get `aria-label`; toggles use `aria-pressed`.
- Bottom navigation with four tabs: Plan, Posiłki, Składniki, Zakupy. Sub-pages show a back arrow in the header.
- The cooking view (`/plan/[planMealId]`) keeps the phone screen on (Screen Wake Lock API) while open.

## Code conventions

- Shared constants (exported config lists, limits, durations) use camelCase, e.g. `users`, `mealTypes`, `sessionTtlMs`. Do not use SCREAMING_CASE. External names keep their own casing (environment variables such as `DATABASE_URL`, MySQL error codes such as `ER_DUP_ENTRY`).
