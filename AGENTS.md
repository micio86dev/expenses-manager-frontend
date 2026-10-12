# AGENTS.md: frontend

Follows the stack, layers and rules defined in the superproject `AGENTS.md`.
The HTTP contract is `contracts/openapi.yaml` in the superproject, copied here by `make contract`
(or `pnpm contract`, which also regenerates `src/api/schema.d.ts`). Never edit either copy by hand.

## Stack

Vite, Vue 3 (`<script setup lang="ts">` only), Pinia, vue-router, vue-i18n, dayjs, Vitest +
@vue/test-utils + happy-dom, Playwright + axe, ESLint (typescript-eslint strict, vue,
vuejs-accessibility), Prettier, vue-tsc. TypeScript is `strict` + `noUncheckedIndexedAccess` +
`exactOptionalPropertyTypes`. TypeScript is pinned to 6.0 because typescript-eslint does not yet
support 7.x.

## Commands

| Command                        | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `make setup`                   | Install dependencies                                        |
| `make test` / `make coverage`  | Unit tests / tests with the 90% gate                        |
| `make lint` / `make typecheck` | ESLint + Prettier / vue-tsc                                 |
| `make e2e`                     | Playwright fast suite (mocked API, desktop and mobile, axe) |
| `make build`                   | Production build and the 150 kB gzip initial-JS budget      |
| `make review`                  | Guardian Angel review of the PR (`gga run --pr-mode`)       |
| `pnpm e2e:fullstack`           | Playwright against the running docker stack (real API)      |
| `pnpm lighthouse`              | Mobile Lighthouse (>= 90) on the production build           |

## Rules

- Layers: `pages` (thin, lazy) compose `views` (containers) which compose `components`
  (`atoms`, `molecules`, `organisms`; presentational). Logic lives in `composables`, `stores`,
  `domain` and `api`, never in components.
- `src/domain` is pure TypeScript with no framework imports.
- Dates: only `src/lib/dates.ts` may use dayjs, `new Date` or `Date.*`. Calendar dates are ISO
  `YYYY-MM-DD` strings elsewhere.
- API: all requests go through `src/api/client.ts` (one place for the auth header and
  `Accept-Language`). Responses are camelized; failures throw `ApiError` (Problem Details).
- i18n: use `useTranslate()` or `translate()` with typed `MessageKey`s. Every user-facing string
  lives in `src/i18n/locales`. Italian is allowed only in `locales/it.ts`. Sentence-case, plain copy.
- Styling: use design tokens (`var(--...)` from `src/styles/tokens.css`). No hard-coded colours.
  Targets are at least 44px, focus is visible, colour is never the only signal, motion respects
  `prefers-reduced-motion`.
- TDD: write the failing test first. Thresholds are 90% on lines, functions, statements and
  branches; never lower them, never add lint or type ignores to pass a gate.
- Playwright specs install the mocked API with `installApp` from `e2e/support/mock-api.ts` (it pins
  the date) and check accessibility with `expectNoViolations` from `e2e/support/axe.ts`.
- The full-stack suite (`e2e-fullstack/`) never starts the stack: run `./start.sh` or
  `docker compose up -d --wait` plus the migrations first; `E2E_API_URL`, `E2E_BASE_URL` or
  `API_PORT` select the ports. It registers a unique user per run.
- Lighthouse (`lighthouse/`, thresholds in `lighthouserc.json`) audits in a tab it opens itself,
  where `page.route` cannot reach, so it uses `lighthouse/mock-server.ts` (built from the e2e
  fixtures) instead of `installApp`. Axe already covers the same pages in `e2e/smoke.spec.ts` and `e2e/dashboard.spec.ts`; Lighthouse only scores.
- Tests that need the whole app use `renderWithApp` and `expectNoA11yViolations` from
  `tests/helpers.ts`; auth API mocks live in `tests/api-mock.ts`.

## Review rules

Guardian Angel (`gga run`, configured in `.gga`) checks staged files against this list. Each rule
is checkable on a diff.

- No `any`, no `@ts-ignore`, no `eslint-disable`: use `unknown` plus type guards.
- Components use `<script setup lang="ts">`.
- Components are presentational: no business logic and no API calls; data arrives by props from views (only `ToastRegion` reads a store).
  Logic lives in composables, stores and `src/domain`.
- Dates only through `src/lib/dates.ts`. No `new Date`, `Date.*` or dayjs import elsewhere.
- Money is an integer number of cents, formatted with `Intl` (`useFormatters`); never floats.
- Every user-facing string goes through a typed `MessageKey` and exists in both `it` and `en`.
- Accessibility: every control has a label, focus is visible and managed in dialogs, targets are
  at least 44px, colour is never the only signal.
- No hard-coded colours (design tokens only), no dead or duplicated code, English-only code
  and comments (Italian only in `locales/it.ts`).
- Every change ships with a test (unit, and e2e when a user flow changes).

## Definition of done

Tests pass · coverage ≥90% · ESLint, Prettier, vue-tsc clean · build within the bundle budget ·
contract in sync · docs updated · no dead or duplicated code · clean tree before merge.
