[CmdletBinding()]
param([string]$RuntimeDirectory = '.runtime/staging')

$ErrorActionPreference = 'Stop'
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$runtimePath = [IO.Path]::GetFullPath((Join-Path $repositoryRoot $RuntimeDirectory))
if (-not $runtimePath.StartsWith($repositoryRoot.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
  throw 'RuntimeDirectory must resolve inside the repository workspace.'
}
$environmentFile = Join-Path $runtimePath 'staging.env'
if (-not (Test-Path -LiteralPath $environmentFile)) {
  throw "Missing staging environment file: $environmentFile"
}
$settings = @{}
Get-Content -LiteralPath $environmentFile | ForEach-Object {
  if ($_ -and -not $_.StartsWith('#')) {
    $name, $value = $_ -split '=', 2
    $settings[$name] = $value
  }
}
function Read-Secret([string]$Name) {
  return [IO.File]::ReadAllText((Join-Path $runtimePath "secrets\$Name"), [Text.Encoding]::UTF8).Trim()
}
$composeArguments = @('--env-file', $environmentFile, '-f', 'compose.staging.yaml', '--profile', 'operations')
$previous = @{
  APP_VERSION = $env:APP_VERSION
  STAGING_INTERNAL_PASSWORD = $env:STAGING_INTERNAL_PASSWORD
  STAGING_PUBLIC_URL = $env:STAGING_PUBLIC_URL
  STAGING_SUPPLIER_A_PASSWORD = $env:STAGING_SUPPLIER_A_PASSWORD
  STAGING_SUPPLIER_B_PASSWORD = $env:STAGING_SUPPLIER_B_PASSWORD
}
try {
  & pnpm pilot:check
  if ($LASTEXITCODE -ne 0) { throw "Pilot artifact check failed with exit code $LASTEXITCODE" }
  & docker compose @composeArguments run --rm pilot-prepare
  if ($LASTEXITCODE -ne 0) { throw "Pilot provisioning failed with exit code $LASTEXITCODE" }
  $env:APP_VERSION = $settings.APP_VERSION
  $env:STAGING_PUBLIC_URL = $settings.STAGING_PUBLIC_URL
  $env:STAGING_INTERNAL_PASSWORD = Read-Secret 'staging_internal_password'
  $env:STAGING_SUPPLIER_A_PASSWORD = Read-Secret 'staging_supplier_a_password'
  $env:STAGING_SUPPLIER_B_PASSWORD = Read-Secret 'staging_supplier_b_password'
  & pnpm exec playwright test --config playwright.staging.config.ts tests/staging/pilot-acceptance.spec.ts
  if ($LASTEXITCODE -ne 0) { throw "Pilot acceptance failed with exit code $LASTEXITCODE" }
} finally {
  foreach ($name in $previous.Keys) {
    [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process')
  }
}
