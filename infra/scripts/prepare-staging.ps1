[CmdletBinding()]
param(
  [string]$ApplicationVersion = '0.1.0-staging.1',
  [string]$RuntimeDirectory = '.runtime/staging',
  [switch]$RotateS3Credentials,
  [switch]$RotateSecrets
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$runtimePath = [IO.Path]::GetFullPath((Join-Path $repositoryRoot $RuntimeDirectory))
$repositoryPrefix = $repositoryRoot.TrimEnd('\') + '\'
if (-not $runtimePath.StartsWith($repositoryPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'RuntimeDirectory must resolve inside the repository workspace.'
}

$secretPath = Join-Path $runtimePath 'secrets'
$tlsPath = Join-Path $runtimePath 'tls'
New-Item -ItemType Directory -Force -Path $secretPath, $tlsPath | Out-Null

function New-RandomValue {
  param([int]$ByteCount = 36)
  $bytes = [byte[]]::new($ByteCount)
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', 'A').Replace('/', 'B')
}

function ConvertTo-Pem {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][byte[]]$Bytes
  )
  $base64 = [Convert]::ToBase64String($Bytes)
  $lines = [regex]::Matches($base64, '.{1,64}') | ForEach-Object { $_.Value }
  return "-----BEGIN $Label-----`n$($lines -join "`n")`n-----END $Label-----`n"
}

function Write-SecretFile {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value,
    [switch]$Force
  )
  $path = Join-Path $secretPath $Name
  if ((Test-Path -LiteralPath $path) -and -not $RotateSecrets -and -not $Force) {
    return
  }
  [IO.File]::WriteAllText($path, $Value, [Text.UTF8Encoding]::new($false))
}

Write-SecretFile -Name 'postgres_password' -Value (New-RandomValue)
Write-SecretFile -Name 'keycloak_database_password' -Value (New-RandomValue)
Write-SecretFile -Name 'keycloak_admin_password' -Value (New-RandomValue)
Write-SecretFile -Name 'redis_password' -Value (New-RandomValue)
Write-SecretFile -Name 'minio_root_user' -Value ('root' + (New-RandomValue -ByteCount 12))
Write-SecretFile -Name 'minio_root_password' -Value (New-RandomValue)
Write-SecretFile `
  -Name 's3_access_key' `
  -Value ('app' + (New-RandomValue -ByteCount 12)) `
  -Force:$RotateS3Credentials
Write-SecretFile `
  -Name 's3_secret_key' `
  -Value (New-RandomValue) `
  -Force:$RotateS3Credentials
Write-SecretFile -Name 'session_secret' -Value (New-RandomValue -ByteCount 48)
Write-SecretFile -Name 'staging_internal_password' -Value (New-RandomValue)
Write-SecretFile -Name 'staging_supplier_a_password' -Value (New-RandomValue)
Write-SecretFile -Name 'staging_supplier_b_password' -Value (New-RandomValue)

$certificatePath = Join-Path $tlsPath 'tls.crt'
$privateKeyPath = Join-Path $tlsPath 'tls.key'
if (
  $RotateSecrets -or
  -not (Test-Path -LiteralPath $certificatePath) -or
  -not (Test-Path -LiteralPath $privateKeyPath)
) {
  $rsa = [Security.Cryptography.RSA]::Create(2048)
  try {
    $request = [Security.Cryptography.X509Certificates.CertificateRequest]::new(
      'CN=mecoflow.localhost',
      $rsa,
      [Security.Cryptography.HashAlgorithmName]::SHA256,
      [Security.Cryptography.RSASignaturePadding]::Pkcs1
    )
    $san = [Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
    $san.AddDnsName('mecoflow.localhost')
    $san.AddDnsName('localhost')
    $san.AddIpAddress([Net.IPAddress]::Parse('127.0.0.1'))
    $request.CertificateExtensions.Add($san.Build())
    $request.CertificateExtensions.Add(
      [Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new(
        $false,
        $false,
        0,
        $true
      )
    )
    $request.CertificateExtensions.Add(
      [Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new(
        [Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature,
        $true
      )
    )
    $certificate = $request.CreateSelfSigned(
      [DateTimeOffset]::UtcNow.AddMinutes(-5),
      [DateTimeOffset]::UtcNow.AddDays(30)
    )
    try {
      [IO.File]::WriteAllText(
        $certificatePath,
        (ConvertTo-Pem -Label 'CERTIFICATE' -Bytes (
          $certificate.Export(
            [Security.Cryptography.X509Certificates.X509ContentType]::Cert
          )
        )),
        [Text.UTF8Encoding]::new($false)
      )
      $rsaCng = [Security.Cryptography.RSACng]$rsa
      [IO.File]::WriteAllText(
        $privateKeyPath,
        (ConvertTo-Pem -Label 'PRIVATE KEY' -Bytes (
          $rsaCng.Key.Export(
            [Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob
          )
        )),
        [Text.UTF8Encoding]::new($false)
      )
    } finally {
      $certificate.Dispose()
    }
  } finally {
    $rsa.Dispose()
  }
}

$environmentPath = Join-Path $runtimePath 'staging.env'
$revision = (& git -C $repositoryRoot rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) {
  $revision = 'unknown'
}
$buildDate = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
$environment = @(
  "APP_VERSION=$ApplicationVersion"
  "BUILD_DATE=$buildDate"
  "VCS_REF=$revision"
  'STAGING_PUBLIC_URL=https://mecoflow.localhost:8443'
  'STAGING_BIND_ADDRESS=127.0.0.1'
  'STAGING_HTTPS_PORT=8443'
  "STAGING_RUNTIME_DIR=$($RuntimeDirectory.Replace('\', '/'))"
  'POSTGRES_DB=mecoflow'
  'POSTGRES_USER=mecoflow'
  'KEYCLOAK_DATABASE_NAME=keycloak'
  'KEYCLOAK_DATABASE_USER=keycloak'
  'KEYCLOAK_ADMIN_USERNAME=mecoflow-staging-admin'
  'KEYCLOAK_REALM=mecoflow-staging'
  'OIDC_CLIENT_ID=mecoflow-web'
  'S3_REGION=us-east-1'
  'LOG_LEVEL=info'
) -join "`n"
[IO.File]::WriteAllText(
  $environmentPath,
  "$environment`n",
  [Text.UTF8Encoding]::new($false)
)

Write-Output "Prepared external staging configuration at $runtimePath"
Write-Output 'No secret value was printed or written to a tracked path.'
if ($RotateSecrets) {
  Write-Warning 'Secrets and the local staging certificate were rotated. Existing encrypted sessions and service credentials are no longer valid.'
} elseif ($RotateS3Credentials) {
  Write-Warning 'The staging S3 application credential pair was rotated. Re-run minio-init before starting application containers.'
}
