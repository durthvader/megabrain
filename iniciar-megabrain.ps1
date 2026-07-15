param(
    [ValidateRange(1024, 65535)]
    [int]$Porta = 5500
)

$ErrorActionPreference = "Stop"
$url = "http://127.0.0.1:$Porta/"

Set-Location -LiteralPath $PSScriptRoot
Write-Host "Megabrain local: $url"
Write-Host "Pressione Ctrl+C para encerrar."
Start-Process $url
python -m http.server $Porta --bind 127.0.0.1
