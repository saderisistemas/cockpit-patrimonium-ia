$ErrorActionPreference = "Stop"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDkzMTU3M2EtM2MxMi00NjMyLWIyZmQtMmRmYWExNGRiOTQwIiwiaWF0IjoxNzc0MDA3OTE5fQ.yhGbBdL2TtrRjKAZ6diyjEPwtfLJ5NVH_YfWUIl9ef0"
$wfId = "SmS0C5f3mQbervfm"
$base = "https://patrimonium-n8n.cloudfy.live/api/v1"
$h = @{ "X-N8N-API-KEY" = $token }

Write-Host "1-GET..."
$wf = Invoke-RestMethod "$base/workflows/$wfId" -Headers $h -Method Get -TimeoutSec 20
Write-Host "OK $($wf.nodes.Count) nos"

$novoResumo = Get-Content ".\novo_resumo_historico.js" -Raw -Encoding UTF8

Write-Host "2-FIX..."
foreach ($node in $wf.nodes) {
    if (-not $node.parameters.jsCode) { continue }
    $nome = $node.name
    
    if ($nome -match "Resumo Hist") {
        $node.parameters.jsCode = $novoResumo
        Write-Host "  OK: $nome"
    }
    elseif ($nome -eq "Enrich + Extrair Plano") {
        $linhas = ($node.parameters.jsCode -split "`n") | Where-Object {
            $_.Trim() -notmatch "^mesmo_setor:" -and
            $_.Trim() -notmatch "^recorrencia_elevada_mesmo_setor:" -and
            $_.Trim() -notmatch "^setor:\s*h\.setor"
        }
        $node.parameters.jsCode = $linhas -join "`n"
        Write-Host "  OK: $nome"
    }
    elseif ($nome -eq "Map IA Result") {
        $linhas = ($node.parameters.jsCode -split "`n") | Where-Object {
            $_.Trim() -notmatch "^setor:\s*evento\.setor" -and
            $_.Trim() -notmatch "^const mesmoSetor" -and
            $_.Trim() -notmatch "^const setorAtual"
        }
        $node.parameters.jsCode = $linhas -join "`n"
        Write-Host "  OK: $nome"
    }
    elseif ($nome -eq "Decidir Abertura OS") {
        $linhas = $node.parameters.jsCode -split "`n"
        $novas = @()
        $skip = $false
        foreach ($l in $linhas) {
            if ($l.Trim() -match "^const setor\s*=") { $skip = $true; continue }
            if ($skip) { if ($l.Trim() -match "null;$") { $skip = $false }; continue }
            if ($l.Trim() -match "^const mesmoSetor7d") { continue }
            if ($l.Trim() -match "^const recorrenciaElevadaMesmoSetor") { continue }
            if ($l.Trim() -eq "setor,") { continue }
            $novas += $l
        }
        $node.parameters.jsCode = $novas -join "`n"
        Write-Host "  OK: $nome"
    }
}

Write-Host "3-CHECK..."
$ok = $true
foreach ($n in $wf.nodes) { if ($n.parameters.jsCode -match "setor") { Write-Host "  ALERTA: $($n.name)"; $ok = $false } }
if ($ok) { Write-Host "  LIMPO!" }

Write-Host "4-PUT..."
$body = @{ name=$wf.name; nodes=$wf.nodes; connections=$wf.connections; settings=$wf.settings; staticData=$wf.staticData }
$json = $body | ConvertTo-Json -Depth 50 -Compress
$hPut = @{ "X-N8N-API-KEY" = $token; "Content-Type" = "application/json; charset=utf-8" }
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
Write-Host "  Body: $($bytes.Length) bytes"
$r = Invoke-RestMethod "$base/workflows/$wfId" -Headers $hPut -Method Put -Body $bytes -TimeoutSec 60
Write-Host "  PUT OK! updated=$($r.updatedAt)"

Write-Host "5-VERIFY..."
$wf2 = Invoke-RestMethod "$base/workflows/$wfId" -Headers $h -Method Get -TimeoutSec 20
$clean = $true
foreach ($n in $wf2.nodes) { if ($n.parameters.jsCode -match "setor") { Write-Host "  FAIL: $($n.name)"; $clean = $false } }
if ($clean) { Write-Host "  SUCESSO TOTAL!" }
