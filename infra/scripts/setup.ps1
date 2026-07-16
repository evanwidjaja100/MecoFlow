$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string[]]$ArgumentList
  )

  & $FilePath @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "Command '$FilePath $($ArgumentList -join ' ')' failed with exit code $LASTEXITCODE."
  }
}

Push-Location -LiteralPath $repositoryRoot
try {
  foreach ($command in @('node', 'corepack', 'docker')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
      throw "Required tool '$command' was not found on PATH."
    }
  }

  Invoke-CheckedCommand -FilePath 'docker' -ArgumentList @('compose', 'version')

  if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Write-Output 'Created .env from local-development example. Review credentials before non-local use.'
  } else {
    Write-Output 'Existing .env preserved.'
  }

  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('prepare', 'pnpm@11.13.0', '--activate')
  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('pnpm', 'install', '--frozen-lockfile')
  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('pnpm', 'compose:up')
  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('pnpm', 'db:migrate')
  Invoke-CheckedCommand -FilePath 'corepack' -ArgumentList @('pnpm', 'db:seed')

  Write-Output 'MECO Flow infrastructure and database foundation are ready.'
  Write-Output 'Run pnpm dev to start the web, API, and worker processes:'
  Write-Output '  Web:      http://localhost:3000'
  Write-Output '  API:      http://localhost:3001/health/live'
  Write-Output '  Keycloak: http://localhost:8180'
  Write-Output '  MinIO:    http://localhost:9001'
  Write-Output '  Mailpit:  http://localhost:8025'
} finally {
  Pop-Location
}
