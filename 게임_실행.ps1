$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$gameUrl = "http://localhost:3000"

function Test-GameReady {
    try {
        $response = Invoke-WebRequest -Uri $gameUrl -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content.Contains("한국학 인사팀의 이상한 모험")
    }
    catch {
        return $false
    }
}

if (-not (Test-GameReady)) {
    $npm = Get-Command npm.cmd -ErrorAction Stop
    Start-Process -FilePath $npm.Source -ArgumentList @("run", "start") -WorkingDirectory $projectRoot -WindowStyle Hidden

    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 250
        if (Test-GameReady) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        throw "게임 서버가 10초 안에 시작되지 않았습니다."
    }
}

Start-Process $gameUrl
