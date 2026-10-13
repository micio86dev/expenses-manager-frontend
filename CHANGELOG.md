# Changelog

## [0.2.3] - 2026-10-13

- chore: stop tracking the generated Gentle AI cache
- test(validation): cover the first failed rule per field and the passing path
- fix(validation): reject failed rules that belong to no field and key field notes by index
- refactor(domain): validate expense and category forms with zod

## [0.2.2] - 2026-10-13

- test(register): preload the dashboard route so the post-submit navigation is deterministic

## [0.2.1] - 2026-10-13

- test(e2e): expose the ETag header from the mock API like the backend does

## [0.2.0] - 2026-10-13

- ci(frontend): run on push and pull request, skip the review without an API key
- docs(ci): describe the manual CI triggers without the remote caveat
- feat(forms): validate sign-in, registration and expense input with zod
- test(api): assert the request URL from the configured base URL
- ci(frontend): pin the dormant gga job to a reviewed commit
- docs(frontend): format CHANGELOG with Prettier
- docs(frontend): complete the component README with recipes and tooling
- ci(frontend): add dormant Guardian Angel review job
- docs(frontend): add checkable review rules to AGENTS.md
- chore(tooling): run gga last in pre-commit and add review and memory-sync targets
- chore(tooling): add Engram project config and Guardian Angel setup

## [0.1.0] - 2026-10-12

- docs(frontend): document test layers, lighthouse, env and CI
- ci(frontend): add dependabot config
- ci(frontend): add dormant workflow
- test(lighthouse): add repeatable mobile audit of login and dashboard
- test(e2e): add full-stack suite
- fix(docker): start the dev server without pnpm exec
- test(e2e): cover dashboard flows
- feat(dashboard): add top expenses, states and dashboard view
- feat(charts): add lazy chart wrappers with text alternatives
- feat(dashboard): add period selector and kpi strip
- feat(stats): add dashboard store with etag caching
- feat(api): add conditional requests and stats endpoints
- feat(domain): add dashboard view models
- chore(deps): add chart.js and vue-chartjs
- chore(api): regenerate types for top expenses
- chore(contract): sync top expenses endpoint
- docs(frontend): document e2e helpers and cover unknown categories
- test(e2e): cover categories and expenses flows
- feat(expenses): add amount-first expense sheet with FAB and recent categories
- feat(expenses): add grouped list, period navigation and filters
- feat(categories): add categories page, bottom sheet and confirm dialog
- feat(sync): add optimistic updates with rollback, stores and composables
- feat(api): add categories and expenses endpoints
- feat(domain): add money parsing, period resolution and expense selectors
- chore(hooks): activate repository hooks from make setup
- docs: document the frontend foundation
- chore(contract): sync openapi contract and regenerate types
- chore(hooks): add conventional commit and pre-commit hooks
- chore(docker): add frontend dev and prod images
- test(e2e): use per-theme fixtures and shared axe helper
- test(e2e): add playwright smoke suite with axe checks
- feat(auth): add routing, guards, auth pages and responsive app shell
- feat(components): add atoms, molecules and form submit helpers
- feat(auth): add auth and locale stores with language switching
- feat(api): add typed client with problem details and case mappers
- feat(i18n): add typed locale registry with lazy chunks and money domain
- feat(dates): add dayjs facade with ISO week helpers
- feat(styles): add design tokens and self-hosted font
- chore(tooling): add pnpm project, lint, test and build setup
- chore: initialize frontend repository
