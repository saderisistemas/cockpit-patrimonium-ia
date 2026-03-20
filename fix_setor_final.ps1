$ErrorActionPreference = "Stop"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDkzMTU3M2EtM2MxMi00NjMyLWIyZmQtMmRmYWExNGRiOTQwIiwiaWF0IjoxNzc0MDA3OTE5fQ.yhGbBdL2TtrRjKAZ6diyjEPwtfLJ5NVH_YfWUIl9ef0"
$wfId = "SmS0C5f3mQbervfm"
$base = "https://patrimonium-n8n.cloudfy.live/api/v1"
$h = @{ "X-N8N-API-KEY" = $token }

Write-Host "=== STEP 1: Baixando workflow ==="
$wf = Invoke-RestMethod "$base/workflows/$wfId" -Headers $h -Method Get -TimeoutSec 20
Write-Host "OK: $($wf.nodes.Count) nos"

Write-Host "`n=== STEP 2: Carregando novo codigo Resumo ==="
$novoResumo = Get-Content ".\novo_resumo_historico.js" -Raw -Encoding UTF8
Write-Host "OK: $($novoResumo.Length) chars"

Write-Host "`n=== STEP 3: Corrigindo nos ==="

foreach ($node in $wf.nodes) {
    $nome = $node.name
    if (-not $node.parameters.jsCode) { continue }
    
    # RESUMO HISTORICO IA - substituir codigo inteiro
    if ($nome -match "Resumo Hist") {
        $node.parameters.jsCode = $novoResumo
        Write-Host "  [OK] $nome -> codigo inteiro substituido"
    }
    
    # ENRICH + EXTRAIR PLANO - remover campos setor
    elseif ($nome -eq "Enrich + Extrair Plano") {
        $linhas = $node.parameters.jsCode -split "`n"
        $novas = @()
        foreach ($l in $linhas) {
            if ($l.Trim() -match "^mesmo_setor:") { continue }
            if ($l.Trim() -match "^recorrencia_elevada_mesmo_setor:") { continue }
            if ($l.Trim() -match "^setor:\s*h\.setor") { continue }
            $novas += $l
        }
        $node.parameters.jsCode = $novas -join "`n"
        Write-Host "  [OK] $nome -> linhas setor removidas"
    }
    
    # MAP IA RESULT - remover campos setor
    elseif ($nome -eq "Map IA Result") {
        $linhas = $node.parameters.jsCode -split "`n"
        $novas = @()
        foreach ($l in $linhas) {
            if ($l.Trim() -match "^setor:\s*evento\.setor") { continue }
            if ($l.Trim() -match "^const mesmoSetor") { continue }
            if ($l.Trim() -match "^const setorAtual") { continue }
            $novas += $l
        }
        $node.parameters.jsCode = $novas -join "`n"
        Write-Host "  [OK] $nome -> linhas setor removidas"
    }
    
    # DECIDIR ABERTURA OS - remover extracoes/calculos/saida de setor
    elseif ($nome -eq "Decidir Abertura OS") {
        $linhas = $node.parameters.jsCode -split "`n"
        $novas = @()
        $skipBlock = $false
        foreach ($l in $linhas) {
            # Pular bloco const setor = ... null;
            if ($l.Trim() -match "^const setor\s*=") { $skipBlock = $true; continue }
            if ($skipBlock) {
                if ($l.Trim() -match "null;$") { $skipBlock = $false; continue }
                continue
            }
            # Pular mesmoSetor7d
            if ($l.Trim() -match "^const mesmoSetor7d") { continue }
            # Pular recorrenciaElevadaMesmoSetor
            if ($l.Trim() -match "^const recorrenciaElevadaMesmoSetor") { continue }
            # Pular "setor," na saida
            if ($l.Trim() -eq "setor,") { continue }
            $novas += $l
        }
        $node.parameters.jsCode = $novas -join "`n"
        Write-Host "  [OK] $nome -> bloco setor removido"
    }
}

Write-Host "`n=== STEP 4: Verificacao pos-correcao ==="
$temSetor = $false
foreach ($node in $wf.nodes) {
    if ($node.parameters.jsCode -and $node.parameters.jsCode -match "setor") {
        $linhasSetor = ($node.parameters.jsCode -split "`n") | Select-String "setor" | Select-Object -First 3
        Write-Host "  ALERTA: $($node.name)"
        $linhasSetor | ForEach-Object { Write-Host "    $($_.Line.Trim())" }
        $temSetor = $true
    }
}
if (-not $temSetor) { Write-Host "  LIMPO!" }

Write-Host "`n=== STEP 5: Salvando JSON local ==="
$body = @{
    name = $wf.name
    nodes = $wf.nodes
    connections = $wf.connections
    settings = $wf.settings
    staticData = $wf.staticData
}
$jsonBody = $body | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText("$PWD\workflow_put_body.json", $jsonBody, [System.Text.Encoding]::UTF8)
Write-Host "Salvo: workflow_put_body.json ($($jsonBody.Length) chars)"

Write-Host "`n=== STEP 6: Enviando PUT ==="
$hPut = @{ "X-N8N-API-KEY" = $token; "Content-Type" = "application/json; charset=utf-8" }
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
$result = Invoke-RestMethod "$base/workflows/$wfId" -Headers $hPut -Method Put -Body $bodyBytes -TimeoutSec 60
Write-Host "PUT OK! updatedAt=$($result.updatedAt)"

Write-Host "`n=== STEP 7: Verificacao final (re-download) ==="
$wf2 = Invoke-RestMethod "$base/workflows/$wfId" -Headers $h -Method Get -TimeoutSec 20
$final = $false
foreach ($node in $wf2.nodes) {
    if ($node.parameters.jsCode -and $node.parameters.jsCode -match "setor") {
        Write-Host "  FALHA: $($node.name) ainda tem setor!"
        $final = $true
    }
}
if (-not $final) { Write-Host "  SUCESSO TOTAL! Workflow 100% limpo de setor." }
