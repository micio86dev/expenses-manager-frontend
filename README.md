# Expenses Manager: frontend

Vue 3 + TypeScript (strict) single-page app for the Expenses Manager API.
The HTTP contract lives in `contracts/openapi.yaml` (copied from the superproject).

## Requirements

- Node 24 and pnpm 11 (`corepack enable` or `npm i -g pnpm@11.22.0`)
- Docker, optional, for the dev stack and production image

## Getting started

```bash
cp .env.example .env     # VITE_API_BASE_URL, defaults to http://localhost:8000/api/v1
make setup               # pnpm install --frozen-lockfile
pnpm dev                 # http://localhost:5173
```

Enable the repository hooks once with `git config core.hooksPath .githooks`
(Conventional Commits check, plus lint and typecheck before each commit).

## Commands

| Command                     | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev` / `pnpm preview` | Vite dev server / preview of the production build                       |
| `pnpm build`                | Typecheck, production build, then the bundle budget check               |
| `pnpm typecheck`            | `vue-tsc --noEmit`                                                      |
| `pnpm lint` / `pnpm format` | ESLint + Prettier check / Prettier write                                |
| `pnpm test`                 | Vitest unit tests (happy-dom)                                           |
| `pnpm coverage`             | Unit tests with a 90% gate on lines, functions, statements and branches |
| `pnpm e2e`                  | Playwright fast suite against the built app with a mocked API           |
| `pnpm e2e:fullstack`        | Playwright against the running docker stack (real API)                  |
| `pnpm lighthouse`           | Mobile Lighthouse (performance, accessibility, best practices >= 90)    |
| `pnpm contract`             | Copy `../contracts/openapi.yaml` and regenerate `src/api/schema.d.ts`   |
| `pnpm gen:api`              | Regenerate the API types from the local contract copy                   |
| `pnpm budget`               | Fail when initial JS exceeds 150 kB gzip (run after `vite build`)       |

`make setup|test|coverage|lint|typecheck|e2e|build|format` wrap the same commands.
The first e2e run needs a browser: `pnpm exec playwright install chromium`.

## Environment

| Variable            | Used by                | Default                                                 |
| ------------------- | ---------------------- | ------------------------------------------------------- |
| `VITE_API_BASE_URL` | the app (build or dev) | `http://localhost:8000/api/v1`                          |
| `E2E_API_URL`       | `pnpm e2e:fullstack`   | `http://localhost:${API_PORT:-8000}`                    |
| `E2E_BASE_URL`      | `pnpm e2e:fullstack`   | `http://localhost:5173`                                 |
| `API_PORT`          | `pnpm e2e:fullstack`   | `8000` (same variable as the root `docker-compose.yml`) |

## Tests

Three layers, from fastest to most realistic:

1. **Unit** (`pnpm test`, `pnpm coverage`): Vitest and Testing Library style component tests in
   `src/**/*.test.ts` and `tests/`. Coverage must stay at or above 90%.
2. **Mocked e2e** (`pnpm e2e`): Playwright against the production build, desktop and mobile, with
   the API mocked per spec (`e2e/support/mock-api.ts`) and axe checks. No backend needed.
3. **Full-stack e2e** (`pnpm e2e:fullstack`): one Playwright journey against the real SPA and
   API: register a unique user, add a category and expenses, check the dashboard totals, filter
   by date range, sign out. It never starts the stack and fails fast with instructions when the
   API or the SPA is unreachable. Start the stack from the superproject root first:

   ```bash
   ./start.sh        # or: docker compose up -d --build --wait
   docker compose exec -T -u www-data php php artisan migrate --force
   pnpm e2e:fullstack                                   # default ports 8000 and 5173
   API_PORT=8100 pnpm e2e:fullstack                     # when the API is published elsewhere
   ```

   The SPA container must have been started with the same `API_PORT`, because it bakes the API
   URL into `VITE_API_BASE_URL`. Reports go to `playwright-report-fullstack/`.

## Lighthouse

`pnpm lighthouse` builds the production app, serves it with `vite preview` and audits the login
page and the signed-in dashboard with the mobile profile (simulated slow 4G, mid-range phone).
The dashboard is signed in through a token in `localStorage` and served by a small mock API
(`lighthouse/mock-server.ts`, built from the e2e fixtures), so no backend is needed. Pages and
thresholds live in `lighthouserc.json`; the run fails when performance, accessibility or best
practices drop below 90. HTML reports are written to `lighthouse-report/`. Scores vary by a
few points between runs.

Chromium comes from Playwright (`pnpm exec playwright install chromium`).

## Continuous integration

`.github/workflows/frontend.yml` (install, typecheck, lint, coverage, build with budget,
`pnpm audit --prod`, mocked e2e) is dormant: it only runs on `workflow_dispatch` until the
repository has a remote and the commented `push` and `pull_request` triggers are enabled.
Dependabot (`.github/dependabot.yml`) proposes weekly npm and GitHub Actions updates.

See the [root README](../README.md) for the whole project (stack, `docker compose`, Git Flow).

## Architecture

```
src/
  components/{atoms,molecules,organisms}   presentational; props down, events up
  views/        feature compositions (containers: talk to stores and composables)
  pages/        thin, lazy-loaded route entries
  layouts/      app shell (tab bar / sidebar) and auth shell
  composables/  reusable behavior
  stores/       Pinia (auth, locale, categories, expenses, notices, expense sheet)
  api/          typed fetch client, generated types, snake/camel mappers, Problem Details
  domain/       pure TypeScript (money, periods, filters, grouping, validation, optimistic updates)
  router/       routes, guards, document titles
  i18n/         vue-i18n, typed keys, language registry, lazy locale chunks
  lib/dates.ts  the only module allowed to use dayjs
  styles/       design tokens, self-hosted font, base styles
```

Key rules, enforced by ESLint and tests:

- `new Date`, `Date.*` and any dayjs import are banned outside `src/lib/dates.ts`.
- Translation keys are typed (`MessageKey`); `it` and `en` must have identical key sets.
- Every CSS custom property in use must be declared in `src/styles/tokens.css`.
- Initial JavaScript stays under 150 kB gzip.

## Categories and expenses

- **Money** is an integer number of cents. `parseAmount` (`src/domain/money.ts`) reads `12,50`,
  `12.5` and `1.234,56`, and rejects zero, negatives, more than two decimals and anything above
  the contract maximum (99,999,999,999 cents).
- **Periods** (day, week with ISO Monday start, month, custom past range) live in the URL query
  (`?period=month&from=2026-10-01&to=2026-10-31&category=...&q=...`), so they survive a reload and
  the back button. `from` and `to` are always sent because the contract requires them.
- **Optimistic updates**: create, update, archive and delete change the store immediately
  (`runOptimistic` in `src/domain/optimistic.ts`) and roll back on failure with an error in the
  live region of the app shell. A rejected form (422) is reopened with the draft and the server's
  messages.
- **Add expense** opens one bottom sheet from a floating button (mobile) or the header button
  (desktop). The amount comes first; recent categories are remembered per user in `localStorage`
  (`expenses.recent-categories.<user id>`).
- **Dialogs** (`BottomSheet`, `ConfirmDialog`) trap focus, close on Escape and return focus to
  the control that opened them.
- Playwright specs mock the API with `e2e/support/mock-api.ts` and pin the date to 12 Oct 2026.

## Internationalization

`it` is the default and `en` is available. The choice is stored in `localStorage`, saved on the
account when signed in, and kept in sync with `<html lang>` and the dayjs locale.
To add a language: create `src/i18n/locales/<code>.ts`, add one line to `src/i18n/registry.ts`
and one loader line to `src/lib/dates.ts` (the type checker and the parity test fail until both exist).

## Authentication

The bearer token is kept in `localStorage` (trade-off documented in `src/stores/auth.ts`).
A `401` from the API signs the user out and redirects to the login page.

## Docker

`docker/Dockerfile` has two targets:

- `dev`: Vite on `0.0.0.0:5173` (used by the root `docker-compose.yml`)
- `prod`: static build served by `nginx-unprivileged` on port 8080 as a non-root user.
  Set `API_ORIGIN` (default `http://localhost:8000`) to allow the API in the CSP `connect-src`.

```bash
docker build --target prod -f docker/Dockerfile -t expenses-frontend .
```
