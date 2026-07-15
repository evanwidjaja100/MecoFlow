$ErrorActionPreference = 'Stop'

foreach ($command in @('node', 'corepack', 'docker')) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "Required tool '$command' was not found on PATH."
  }
}

if (-not (Test-Path -LiteralPath '.env')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env'
  Write-Output 'Created .env from local-development example. Review credentials before non-local use.'
} else {
  Write-Output 'Existing .env preserved.'
}

corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm compose:up
corepack pnpm db:migrate
corepack pnpm db:seed

Write-Output 'MECO Flow local foundation is ready:'
Write-Output '  Web:      http://localhost:3000'
Write-Output '  API:      http://localhost:3001/health/live'
Write-Output '  Keycloak: http://localhost:8180'
Write-Output '  MinIO:    http://localhost:9001'
Write-Output '  Mailpit:  http://localhost:8025'
