param(
    [ValidateRange(1024, 65535)]
    [int]$Porta = 5500
)

$ErrorActionPreference = "Stop"
$url = "http://127.0.0.1:$Porta/"
$servidorIniciado = $null

Set-Location -LiteralPath $PSScriptRoot

function Testar-Megabrain {
    try {
        $resposta = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1
        return $resposta.StatusCode -eq 200 -and $resposta.Content -match "<title>Megabrain"
    }
    catch {
        return $false
    }
}

function Abrir-NoChrome {
    $candidatos = @()
    $comandoChrome = Get-Command chrome.exe -ErrorAction SilentlyContinue
    if ($comandoChrome) {
        $candidatos += $comandoChrome.Source
    }
    if ($env:ProgramFiles) {
        $candidatos += Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"
    }
    if (${env:ProgramFiles(x86)}) {
        $candidatos += Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"
    }
    if ($env:LOCALAPPDATA) {
        $candidatos += Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe"
    }

    $chrome = $candidatos | Where-Object {
        $_ -and (Test-Path -LiteralPath $_)
    } | Select-Object -First 1

    if ($chrome) {
        Start-Process -FilePath $chrome -ArgumentList @("--new-tab", $url)
        return
    }

    Start-Process $url
}

try {
    $portaEmUso = Get-NetTCPConnection -State Listen -LocalPort $Porta -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($portaEmUso) {
        if (-not (Testar-Megabrain)) {
            throw "A porta $Porta já está sendo usada por outro programa."
        }
    }
    else {
        $python = (Get-Command python -ErrorAction Stop).Source
        $servidorIniciado = Start-Process `
            -FilePath $python `
            -ArgumentList @("-m", "http.server", "$Porta", "--bind", "127.0.0.1") `
            -WorkingDirectory $PSScriptRoot `
            -WindowStyle Hidden `
            -PassThru

        $pronto = $false
        for ($tentativa = 0; $tentativa -lt 30; $tentativa++) {
            if (Testar-Megabrain) {
                $pronto = $true
                break
            }
            Start-Sleep -Milliseconds 200
        }

        if (-not $pronto) {
            throw "O servidor local não respondeu na porta $Porta."
        }
    }

    Abrir-NoChrome
}
catch {
    if ($servidorIniciado -and -not $servidorIniciado.HasExited) {
        Stop-Process -Id $servidorIniciado.Id -Force -ErrorAction SilentlyContinue
    }
    $mensagem = "Não foi possível abrir o Megabrain.`n`n$($_.Exception.Message)"
    $shell = New-Object -ComObject WScript.Shell
    $null = $shell.Popup($mensagem, 0, "Megabrain", 16)
    exit 1
}
