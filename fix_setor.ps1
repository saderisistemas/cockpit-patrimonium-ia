$ErrorActionPreference = "Stop"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDkzMTU3M2EtM2MxMi00NjMyLWIyZmQtMmRmYWExNGRiOTQwIiwiaWF0IjoxNzc0MDA3OTE5fQ.yhGbBdL2TtrRjKAZ6diyjEPwtfLJ5NVH_YfWUIl9ef0"
$wfId = "SmS0C5f3mQbervfm"
$base = "https://patrimonium-n8n.cloudfy.live/api/v1"
$h = @{ "X-N8N-API-KEY" = $token }

Write-Host "1. Baixando workflow..."
$wf = Invoke-RestMethod "$base/workflows/$wfId" -Headers $h -Method Get -TimeoutSec 20
Write-Host "   OK: $($wf.nodes.Count) nos"

# Ler novo codigo do Resumo Historico IA
$novoResumo = Get-Content ".\novo_resumo_historico.js" -Raw
Write-Host "2. Codigo novo do Resumo carregado ($($novoResumo.Length) chars)"

Write-Host "3. Corrigindo nos..."
foreach ($node in $wf.nodes) {
    $nome = $node.name
    
    # Resumo Historico IA - substituir codigo inteiro
    if ($nome -match "Resumo Hist") {
        $node.parameters.jsCode = $novoResumo
        Write-Host "   CORRIGIDO: $nome (codigo inteiro substituido)"
    }
    
    # Enrich + Extrair Plano - remover campos setor do objeto
    if ($nome -eq "Enrich + Extrair Plano") {
        $c = $node.parameters.jsCode
        $linhas = $c -split "`n"
        $novas = @()
        foreach ($l in $linhas) {
            if ($l -match "mesmo_setor:") { continue }
            if ($l -match "recorrencia_elevada_mesmo_setor:") { continue }
            if ($l -match "setor:\s*h\.setor") { continue }
            $novas += $l
        }
        $node.parameters.jsCode = $novas -join "`n"
        Write-Host "   CORRIGIDO: $nome (3 linhas setor removidas)"
    }
    
    # Map IA Result - remover campos setor
    if ($nome -eq "Map IA Result") {
        $c = $node.parameters.jsCode
        $linhas = $c -split "`n"
        $novas = @()
        foreach ($l in $linhas) {
            if ($l -match "setor:\s*evento\.setor") { continue }
            if ($l -match "mesmoSetor") { continue }
            if ($l -match "setorAtual\s*=") { continue }
            $novas += $l
        }
        $node.parameters.jsCode = $novas -join "`n"
        Write-Host "   CORRIGIDO: $nome (linhas setor removidas)"
    }
    
    # Decidir Abertura OS - remover campos setor
    if ($nome -eq "Decidir Abertura OS") {
        $c = $node.parameters.jsCode
        $linhas = $c -split "`n"
        $novas = @()
        foreach ($l in $linhas) {
            if ($l -match "mesmoSetor" -or $l -match "mesmo_setor" -or $l -match "recorrencia_elevada_mesmo_setor" -or $l -match "setorAtual") { continue }
            $novas += $l
        }
        $node.parameters.jsCode = $novas -join "`n"
        Write-Host "   CORRIGIDO: $nome (linhas setor removidas)"
    }
}

# Verificar se ainda tem setor
Write-Host "4. Verificacao pos-correcao..."
$ainda = $false
foreach ($node in $wf.nodes) {
    if ($node.parameters.jsCode -match "setor") {
        Write-Host "   ALERTA: $($node.name) ainda tem setor!"
        $ainda = $true
    }
}
if (-not $ainda) { Write-Host "   LIMPO! Nenhum no com setor." }

# Montar body do PUT
Write-Host "5. Enviando PUT..."
$body = @{
    name = $wf.name
    nodes = $wf.nodes
    connections = $wf.connections
    settings = $wf.settings
    staticData = $wf.staticData
}
$jsonBody = $body | ConvertTo-Json -Depth 100 -Compress
$hPut = @{ "X-N8N-API-KEY" = $token; "Content-Type" = "application/json" }
$result = Invoke-RestMethod "$base/workflows/$wfId" -Headers $hPut -Method Put -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonBody)) -TimeoutSec 30
Write-Host "   PUT OK! updatedAt=$($result.updatedAt)"

# Verificacao final - re-baixar e checar
Write-Host "6. Verificacao final (re-download)..."
$wf2 = Invoke-RestMethod "$base/workflows/$wfId" -Headers $h -Method Get -TimeoutSec 20
$temSetor = $false
foreach ($node in $wf2.nodes) {
    if ($node.parameters.jsCode -match "setor") {
        Write-Host "   FALHA: $($node.name) AINDA tem setor!"
        $temSetor = $true
    }
}
if (-not $temSetor) { Write-Host "   SUCESSO TOTAL! Workflow limpo de setor." }
