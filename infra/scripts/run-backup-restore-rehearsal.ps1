[CmdletBinding()]
param(
  [string]$BackupId = "restore-rehearsal-$([DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ'))",
  [string]$RuntimeDirectory = '.runtime/staging',
  [string]$SourceProject = 'mecoflow-staging',
  [string]$TargetProject = 'mecoflow-restore-rehearsal'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$runtimePath = [IO.Path]::GetFullPath((Join-Path $repositoryRoot $RuntimeDirectory))
$repositoryPrefix = $repositoryRoot.TrimEnd('\') + '\'
if (-not $runtimePath.StartsWith($repositoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'RuntimeDirectory must resolve inside the repository workspace.'
}
if ($BackupId -notmatch '^[A-Za-z0-9._-]+$') {
  throw 'BackupId contains unsupported characters.'
}
if ($SourceProject -notmatch '^mecoflow-staging$') {
  throw 'SourceProject must be the documented mecoflow-staging project.'
}
if ($TargetProject -notmatch '^mecoflow-restore-rehearsal$') {
  throw 'TargetProject must be the dedicated mecoflow-restore-rehearsal project.'
}
if ($SourceProject -eq $TargetProject) {
  throw 'Source and target Compose projects must be different.'
}

$environmentFile = Join-Path $runtimePath 'staging.env'
$baseCompose = Join-Path $repositoryRoot 'compose.staging.yaml'
$restoreCompose = Join-Path $repositoryRoot 'compose.restore-rehearsal.yaml'
foreach ($requiredPath in @($environmentFile, $baseCompose, $restoreCompose)) {
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
    throw "Required rehearsal input is missing: $requiredPath"
  }
}

$settings = @{}
Get-Content -LiteralPath $environmentFile | ForEach-Object {
  if ($_ -and -not $_.StartsWith('#')) {
    $name, $value = $_ -split '=', 2
    $settings[$name] = $value
  }
}
$appVersion = $settings.APP_VERSION
if (-not $appVersion) {
  throw 'APP_VERSION is missing from the staging environment file.'
}

function Invoke-Compose {
  param(
    [Parameter(Mandatory)] [string]$Project,
    [Parameter(Mandatory)] [string[]]$Arguments,
    [switch]$RestoreTarget
  )
  $composeArguments = @(
    'compose',
    '--project-name', $Project,
    '--env-file', $environmentFile,
    '--file', $baseCompose
  )
  if ($RestoreTarget) {
    $composeArguments += @('--file', $restoreCompose)
  }
  $composeArguments += $Arguments
  & docker @composeArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose failed for project $Project with exit code $LASTEXITCODE."
  }
}

Push-Location $repositoryRoot
$previousBackupVolume = $env:RESTORE_SOURCE_BACKUP_VOLUME
try {
  $sourceBackupVolume = "${SourceProject}_backup-staging-data"
  $env:RESTORE_SOURCE_BACKUP_VOLUME = $sourceBackupVolume

  Invoke-Compose -Project $SourceProject -Arguments @(
    '--profile', 'operations', 'build', 'api', 'backup', 'staging-smoke-prepare'
  )
  Invoke-Compose -Project $SourceProject -Arguments @(
    '--profile', 'operations', 'up', '-d', '--wait',
    'postgres', 'keycloak-db', 'redis', 'minio', 'clamav', 'keycloak'
  )
  Invoke-Compose -Project $SourceProject -Arguments @('run', '--rm', 'minio-init')
  Invoke-Compose -Project $SourceProject -Arguments @(
    '--profile', 'operations', 'run', '--rm', 'migrate'
  )
  Invoke-Compose -Project $SourceProject -Arguments @(
    '--profile', 'operations', 'run', '--rm', 'seed'
  )
  Invoke-Compose -Project $SourceProject -Arguments @(
    'up', '-d', '--wait', 'api', 'worker', 'web', 'proxy'
  )

  & powershell -NoProfile -ExecutionPolicy Bypass -File `
    (Join-Path $repositoryRoot 'infra/scripts/run-staging-smoke.ps1') `
    -RuntimeDirectory $RuntimeDirectory `
    -Mode BackupSource `
    -BackupRehearsalId $BackupId
  if ($LASTEXITCODE -ne 0) {
    throw "Representative source-data creation failed with exit code $LASTEXITCODE."
  }

  Invoke-Compose -Project $SourceProject -Arguments @(
    'stop', 'proxy', 'web', 'api', 'worker'
  )
  Invoke-Compose -Project $SourceProject -Arguments @(
    '--profile', 'operations', 'run', '--rm', 'staging-smoke-prepare'
  )
  Invoke-Compose -Project $SourceProject -Arguments @(
    '--profile', 'operations', 'run', '--rm', '-e', "BACKUP_ID=$BackupId", 'backup'
  )
  Invoke-Compose -Project $SourceProject -Arguments @(
    '--profile', 'operations', 'run', '--rm', '-e', "BACKUP_SET=$BackupId", 'restore'
  )
  Invoke-Compose -Project $SourceProject -Arguments @('stop')

  & docker volume inspect $sourceBackupVolume *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Source backup volume does not exist: $sourceBackupVolume"
  }

  Invoke-Compose -Project $TargetProject -RestoreTarget -Arguments @(
    '--profile', 'operations', 'down', '--volumes', '--remove-orphans'
  )
  Invoke-Compose -Project $TargetProject -RestoreTarget -Arguments @(
    '--profile', 'operations', 'up', '-d', '--wait',
    'postgres', 'keycloak-db', 'minio'
  )
  Invoke-Compose -Project $TargetProject -RestoreTarget -Arguments @(
    'run', '--rm', 'minio-init'
  )

  $recoveryStartedAt = [DateTime]::UtcNow
  Invoke-Compose -Project $TargetProject -RestoreTarget -Arguments @(
    '--profile', 'operations', 'run', '--rm',
    '-e', "BACKUP_SET=$BackupId",
    '-e', 'RESTORE_VALIDATE_ONLY=false',
    '-e', 'RESTORE_CONFIRM=RESTORE_STAGING',
    '-e', 'RESTORE_ALLOW_OBJECT_DELETE=true',
    '-e', 'RESTORE_REQUIRE_EMPTY=true',
    'restore'
  )
  Invoke-Compose -Project $TargetProject -RestoreTarget -Arguments @(
    '--profile', 'operations', 'run', '--rm', 'migrate'
  )
  Invoke-Compose -Project $TargetProject -RestoreTarget -Arguments @(
    '--profile', 'operations', 'up', '-d', '--wait',
    'redis', 'clamav', 'keycloak'
  )
  Invoke-Compose -Project $TargetProject -RestoreTarget -Arguments @(
    'up', '-d', '--wait', 'api', 'worker', 'web', 'proxy'
  )

  & powershell -NoProfile -ExecutionPolicy Bypass -File `
    (Join-Path $repositoryRoot 'infra/scripts/run-staging-smoke.ps1') `
    -RuntimeDirectory $RuntimeDirectory `
    -Mode RestoredTarget `
    -BackupRehearsalId $BackupId
  if ($LASTEXITCODE -ne 0) {
    throw "Restored-target smoke verification failed with exit code $LASTEXITCODE."
  }
  $recoveryVerifiedAt = [DateTime]::UtcNow
  $duration = [Math]::Round(
    ($recoveryVerifiedAt - $recoveryStartedAt).TotalSeconds,
    3
  )

  Write-Output "backup_id=$BackupId"
  Write-Output "application_version=$appVersion"
  Write-Output "source_compose_project=$SourceProject"
  Write-Output "target_compose_project=$TargetProject"
  Write-Output "recovery_started_at=$($recoveryStartedAt.ToString('o'))"
  Write-Output "recovery_verified_at=$($recoveryVerifiedAt.ToString('o'))"
  Write-Output "recovery_duration_seconds=$duration"
  Write-Output 'backup_restore_rehearsal=PASS'
} finally {
  $env:RESTORE_SOURCE_BACKUP_VOLUME = $previousBackupVolume
  Pop-Location
}
