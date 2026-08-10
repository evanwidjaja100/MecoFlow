[CmdletBinding()]
param(
  [string]$RuntimeDirectory = '.runtime/staging',
  [ValidateSet('Smoke', 'BackupSource', 'RestoredTarget')]
  [string]$Mode = 'Smoke',
  [string]$BackupRehearsalId = ''
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$runtimePath = [IO.Path]::GetFullPath((Join-Path $repositoryRoot $RuntimeDirectory))
$repositoryPrefix = $repositoryRoot.TrimEnd('\') + '\'
if (-not $runtimePath.StartsWith($repositoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'RuntimeDirectory must resolve inside the repository workspace.'
}

$settings = @{}
Get-Content -LiteralPath (Join-Path $runtimePath 'staging.env') | ForEach-Object {
  if ($_ -and -not $_.StartsWith('#')) {
    $name, $value = $_ -split '=', 2
    $settings[$name] = $value
  }
}

function Read-Secret {
  param([string]$Name)
  return [IO.File]::ReadAllText(
    (Join-Path $runtimePath "secrets\$Name"),
    [Text.Encoding]::UTF8
  ).Trim()
}

$previous = @{
  APP_VERSION = $env:APP_VERSION
  BACKUP_REHEARSAL_ID = $env:BACKUP_REHEARSAL_ID
  BACKUP_REHEARSAL_SOURCE_ID = $env:BACKUP_REHEARSAL_SOURCE_ID
  STAGING_INTERNAL_PASSWORD = $env:STAGING_INTERNAL_PASSWORD
  STAGING_PUBLIC_URL = $env:STAGING_PUBLIC_URL
  STAGING_SUPPLIER_A_PASSWORD = $env:STAGING_SUPPLIER_A_PASSWORD
  STAGING_SUPPLIER_B_PASSWORD = $env:STAGING_SUPPLIER_B_PASSWORD
}

try {
  if ($Mode -ne 'Smoke' -and $BackupRehearsalId -notmatch '^[A-Za-z0-9._-]+$') {
    throw 'BackupRehearsalId is required and must contain only safe identifier characters.'
  }
  $env:APP_VERSION = $settings.APP_VERSION
  $env:BACKUP_REHEARSAL_ID = if ($Mode -eq 'RestoredTarget') { $BackupRehearsalId } else { '' }
  $env:BACKUP_REHEARSAL_SOURCE_ID = if ($Mode -eq 'BackupSource') { $BackupRehearsalId } else { '' }
  $env:STAGING_PUBLIC_URL = $settings.STAGING_PUBLIC_URL
  $env:STAGING_INTERNAL_PASSWORD = Read-Secret 'staging_internal_password'
  $env:STAGING_SUPPLIER_A_PASSWORD = Read-Secret 'staging_supplier_a_password'
  $env:STAGING_SUPPLIER_B_PASSWORD = Read-Secret 'staging_supplier_b_password'
  $playwrightArguments = @(
    'exec',
    'playwright',
    'test',
    '--config',
    'playwright.staging.config.ts'
  )
  if ($Mode -eq 'BackupSource') {
    $playwrightArguments += 'tests/staging/backup-source.spec.ts'
  }
  & pnpm @playwrightArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Staging smoke test failed with exit code $LASTEXITCODE"
  }
} finally {
  foreach ($name in $previous.Keys) {
    [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process')
  }
}
