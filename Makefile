.PHONY: setup up down dev test verify reset

setup:
	powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/setup.ps1

up:
	pnpm compose:up

down:
	pnpm compose:down

dev:
	pnpm dev

test:
	pnpm test

verify:
	pnpm verify

reset:
	pnpm db:reset
