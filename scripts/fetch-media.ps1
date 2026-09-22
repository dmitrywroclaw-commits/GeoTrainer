$ErrorActionPreference = 'Stop'
$env:HTTP_PROXY = ''
$env:HTTPS_PROXY = ''
$env:ALL_PROXY = ''

$assets = @(
  @{ id='flag-mexico'; title='Flag of Mexico.svg'; kind='flag'; file='flags/mexico.svg' },
  @{ id='flag-india'; title='Flag of India.svg'; kind='flag'; file='flags/india.svg' },
  @{ id='flag-brazil'; title='Flag of Brazil.svg'; kind='flag'; file='flags/brazil.svg' },
  @{ id='flag-canada'; title='Flag of Canada (Pantone).svg'; kind='flag'; file='flags/canada.svg' },
  @{ id='emblem-mexico'; title='Coat of arms of Mexico.svg'; kind='emblem'; file='emblems/mexico.svg' },
  @{ id='emblem-india'; title='Emblem of India.svg'; kind='emblem'; file='emblems/india.svg' },
  @{ id='emblem-brazil'; title='Coat of arms of Brazil.svg'; kind='emblem'; file='emblems/brazil.svg' },
  @{ id='emblem-south-africa'; title='Coat of arms of South Africa.svg'; kind='emblem'; file='emblems/south-africa.svg' },
  @{ id='landmark-grand-canyon'; title='Grand Canyon Powell Point Evening Light 02 2013.jpg'; kind='photo'; file='landmarks/grand-canyon.jpg' },
  @{ id='landmark-uluru'; title='Uluṟu (Ayers Rock), Sunset.jpg'; kind='photo'; file='landmarks/uluru.jpg' },
  @{ id='landmark-fuji'; title='Mount Fuji at sunset, March 2025.jpg'; kind='photo'; file='landmarks/fuji.jpg' },
  @{ id='landmark-victoria-falls'; title='Cataratas Victoria, Zambia-Zimbabue, 2018-07-27, DD 30-34 PAN.jpg'; kind='photo'; file='landmarks/victoria-falls.jpg' }
)
New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot '../content') -Force | Out-Null

function PlainText($value) {
  if (-not $value) { return '' }
  $withoutTags = [regex]::Replace($value, '<[^>]+>', ' ')
  return [System.Net.WebUtility]::HtmlDecode($withoutTags).Trim()
}

function RequestWithRetry($uri, $destination) {
  for ($attempt = 1; $attempt -le 6; $attempt++) {
    try {
      if ($destination) { Invoke-WebRequest -Uri $uri -OutFile $destination -TimeoutSec 60 -UserAgent 'GeoTrainer/0.1 (educational prototype)' ; return }
      return Invoke-RestMethod -Uri $uri -TimeoutSec 30 -UserAgent 'GeoTrainer/0.1 (educational prototype)'
    } catch {
      if ($attempt -eq 6) { throw }
      Start-Sleep -Seconds (3 * $attempt)
    }
  }
}

$records = @()
foreach ($asset in $assets) {
  $title = [uri]::EscapeDataString('File:' + $asset.title)
  $apiUrl = "https://commons.wikimedia.org/w/api.php?action=query&titles=$title&prop=imageinfo&iiprop=url%7Cextmetadata%7Csize&iiurlwidth=1200&format=json"
  $response = RequestWithRetry $apiUrl $null
  $page = $response.query.pages.PSObject.Properties.Value | Select-Object -First 1
  if (-not $page.imageinfo) { throw "Missing Commons file: $($asset.title)" }
  $info = $page.imageinfo[0]
  $meta = $info.extmetadata
  $license = PlainText $meta.LicenseShortName.value
  if ($license -notmatch 'Public domain|CC') { throw "Review license for $($asset.title): $license" }
  $relative = '/media/' + $asset.file
  $destination = Join-Path $PSScriptRoot ('../public' + $relative)
  New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null
  $downloadUrl = if ($asset.kind -eq 'photo') { $info.thumburl } else { $info.url }
  if (-not $downloadUrl) { throw "Missing download URL for $($asset.title)" }
  if (-not (Test-Path $destination)) { RequestWithRetry $downloadUrl $destination }
  $records += [ordered]@{
    id = $asset.id
    kind = $asset.kind
    localPath = $relative
    sourcePageUrl = $info.descriptionurl
    originalAssetUrl = $info.url
    publisher = 'Wikimedia Commons'
    author = PlainText $meta.Artist.value
    license = $license
    rightsUrl = PlainText $meta.LicenseUrl.value
    attributionText = PlainText $meta.Attribution.value
    checkedAt = (Get-Date -Format 'yyyy-MM-dd')
  }
  Write-Output "$($asset.id): $license ($((Get-Item $destination).Length) bytes)"
  $records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PSScriptRoot '../content/media.json') -Encoding utf8
  Start-Sleep -Seconds 2
}
