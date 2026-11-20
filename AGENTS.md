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
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`). Job `ci` runs on every push and pull request: lint, format check, type check, tests, build. Job `deploy` runs after it on pushes to `master`: builds, packs a self-contained release (`build/`, `drizzle/`, `scripts/`, production `node_modules`), copies it with `appleboy/scp-action`, then over `appleboy/ssh-action` applies migrations (`scripts/migrate.js`), switches the `current` symlink and restarts the service. Details in the "Deployment" section.
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

## Local setup

Requires Node 22 and pnpm 10 (the version pinned in `packageManager`), plus a local MySQL 8.

1. Create the database. Name columns rely on the database default collation for Polish sorting and
   case-insensitive uniqueness:
   ```sql
   CREATE DATABASE diet CHARACTER SET utf8mb4 COLLATE utf8mb4_pl_0900_ai_ci;
   ```
2. `cp .env.example .env` and set `DATABASE_URL` (and the other variables) for your machine.
3. `pnpm install`, then `pnpm exec playwright install chromium` for browser tests.
4. `pnpm db:migrate` applies the migrations in `drizzle/`. After changing
   `src/lib/server/db/schema.ts`, run `pnpm db:generate` and review the generated SQL before applying.
5. `pnpm start` (dev server). Checks: `pnpm lint`, `pnpm format:check`, `pnpm check`, `pnpm test`.

## Commands

| Command | What it does |
|---|---|
| `pnpm start` | Dev server (`vite dev`). |
| `pnpm build` | Production build into `build/` (adapter-node). |
| `pnpm preview` | Serves the production build locally. |
| `pnpm lint` | oxlint. |
| `pnpm format` / `pnpm format:check` | Prettier write / check. |
| `pnpm check` | `svelte-kit sync` + `svelte-check` (types). |
| `pnpm test` | Vitest: the `server` project (node, `*.test.ts`) and the `client` project (Chromium browser mode, `*.svelte.test.ts`). |
| `pnpm db:generate` | Generates a SQL migration in `drizzle/` from the schema. Review it before applying. |
| `pnpm db:migrate` | Applies the migrations in `drizzle/` to `DATABASE_URL`. |
| `pnpm db:studio` | Drizzle Studio. |

Before each commit run `pnpm lint && pnpm format:check && pnpm check && pnpm test` (CI also runs `pnpm build`).

## Environment variables

Read on the server through `$env/dynamic/private` (never `$env/static`). Copy `.env.example` to
`.env` for development; commit `.env.example`, never `.env`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL 8 connection string, e.g. `mysql://diet:password@localhost:3306/diet`. |
| `APP_PASSWORD` | The shared login password. |
| `SESSION_SECRET` | HMAC key for the session cookie. Changing it logs everyone out. |
| `PHOTOS_DIR` | Absolute path of the directory for meal photos (`<uuid>.webp`). |
| `TZ` | `Europe/Warsaw`. Decides "today" in the plan and the cleanup cutoff. |
| `BODY_SIZE_LIMIT` | adapter-node: `10M`. The 512K default rejects photo uploads. |

The built server (`node build`) does not read `.env`; PM2/systemd must provide the variables (or
use `node --env-file=.env build`).

## Running in production: one process only

Run exactly **one** app process (PM2 `fork` mode with 1 instance, or one systemd service; no
cluster mode). The daily cleanup (`src/lib/server/cleanup.ts`, started from `init` in
`hooks.server.ts`) runs inside the app process, and the login throttle is kept in memory, so
several processes would run the cleanup several times and each keep their own login limits.

## Project structure

```
src/
  hooks.server.ts            auth guard (cookie check, /login redirect, 401 for /api/*); init starts the daily cleanup
  lib/
    config/                  users (name, multiplier, colors), categories, meal-types, units
    i18n/pl.ts               every UI string
    styles/base.css          CSS variables (tokens) and utilities
    components/              app components (MealForm, MealPicker, WeekBar, PlanMealCard, NutritionTable, AmountPill…)
      ui/                    own UI library: Button, Chip, Dialog, TextField, NumberField, Select
      icons/                 inline stroke SVG icons
    schemas/                 valibot schemas shared by forms, actions and endpoints
    nutrition.ts, dates.ts, plan.ts, cooking.ts, shopping.ts, shopping-view.ts, list-poller.ts, wake-lock.ts
                             pure, unit-tested business logic (next to their *.test.ts)
    server/
      db/                    Drizzle schema, connection, DECIMAL and MySQL error helpers
      repositories/          thin query modules: ingredients, meals, plan, shopping
      auth.ts, photos.ts, cleanup.ts, meal-form.ts, meals-query.ts, pagination.ts, read-json.ts
  routes/
    login/, logout/          shared-password sign-in and sign-out
    plan/                    week bar + day (?date=), [planMealId] cooking view, [planMealId]/edit day copy
    meals/                   list, new, [id] details, [id]/edit
    ingredients/             list, new, [id]/edit (hide)
    shopping-list/           list page (client state + polling), from-plan
    photos/[file]/           serves PHOTOS_DIR files
    api/                     JSON: meals (picker pages), ingredients (search), shopping-list (+ items)
drizzle/                     generated SQL migrations (reviewed before applying)
docs/                        idea.md (product), superpowers/specs (technical design), superpowers/plans
```

## Deployment

Pushing to `master` deploys to the VPS when the `ci` job passes.

**GitHub configuration** (repository settings, environment `production`):

| Name | Kind | Value |
|---|---|---|
| `VPS_HOST` | secret | server host name or IP |
| `VPS_USER` | secret | SSH user that owns `DEPLOY_PATH` |
| `VPS_SSH_KEY` | secret | private key for that user |
| `VPS_PORT` | secret (optional) | SSH port, default 22 |
| `DEPLOY_PATH` | variable | app directory on the server, e.g. `/srv/diet` |
| `RESTART_COMMAND` | variable | e.g. `pm2 reload diet` or `sudo systemctl restart diet` |

**Server layout** under `DEPLOY_PATH`:

- `shared/.env`: the app's environment (`DATABASE_URL`, `APP_PASSWORD`, `SESSION_SECRET`, `PHOTOS_DIR`,
  `TZ`, `BODY_SIZE_LIMIT`, plus adapter-node's `ORIGIN`, `ADDRESS_HEADER=X-Forwarded-For` and `PORT` if
  needed). Managed on the server; never deployed.
- `releases/<commit sha>/`: one directory per deploy; the newest 5 are kept.
- `current`: symlink to the live release.

**Requirements on the server:** Node 22 on the deploy user's non-interactive `PATH`, linux-x64 (the
release's `node_modules` is installed on the GitHub runner), and the service started from the symlink with
the shared environment, as a **single process**, e.g.
`node --env-file=<DEPLOY_PATH>/shared/.env <DEPLOY_PATH>/current/build` (PM2: fork mode, 1 instance).

**Order of a deploy:** unpack into a new release directory → `node --env-file=shared/.env scripts/migrate.js`
→ switch `current` → `RESTART_COMMAND` → prune old releases. If the migration fails, `current` is not
switched and the old release keeps running. Migrations are the generated SQL files in `drizzle/`; review
them before pushing. `scripts/migrate.js` uses the same `__drizzle_migrations` table as `pnpm db:migrate`.
