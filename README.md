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
| `pnpm contract`             | Copy `../contracts/openapi.yaml` and regenerate `src/api/schema.d.ts`   |
| `pnpm gen:api`              | Regenerate the API types from the local contract copy                   |
| `pnpm budget`               | Fail when initial JS exceeds 150 kB gzip (run after `vite build`)       |

`make setup|test|coverage|lint|typecheck|e2e|build|format` wrap the same commands.
The first e2e run needs a browser: `pnpm exec playwright install chromium`.

## Architecture

```
src/
  components/{atoms,molecules,organisms}   presentational; props down, events up
  views/        feature compositions (containers: talk to stores and composables)
  pages/        thin, lazy-loaded route entries
  layouts/      app shell (tab bar / sidebar) and auth shell
  composables/  reusable behavior
  stores/       Pinia (auth, locale)
  api/          typed fetch client, generated types, snake/camel mappers, Problem Details
  domain/       pure TypeScript (money formatting and parsing)
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
