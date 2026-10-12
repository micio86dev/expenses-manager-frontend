SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help setup test coverage lint typecheck e2e e2e-fullstack lighthouse build format

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Install dependencies and activate git hooks
	pnpm install --frozen-lockfile
	git config core.hooksPath .githooks

test: ## Run unit tests
	pnpm test

coverage: ## Run unit tests with the 90% coverage gate
	pnpm coverage

lint: ## Run ESLint and Prettier checks
	pnpm lint

typecheck: ## Run vue-tsc
	pnpm typecheck

e2e: ## Run Playwright suites
	pnpm e2e

e2e-fullstack: ## Playwright against the running docker stack (start it first)
	pnpm e2e:fullstack

lighthouse: ## Mobile Lighthouse audit (>= 90) of the production build
	pnpm lighthouse

build: ## Production build and bundle budget check
	pnpm build

format: ## Format sources with Prettier
	pnpm format
