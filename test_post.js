const data = {
    timestamp_coleta: new Date().toISOString(),
    disparos_ativos: [
        {
            idDisparo: "999999992",
            idCliente: "14404",
            prioridade: null,
            data: "01/03/2026",
            hora: "00:20",
            evento: "E130",
            patrimonio: "16009",
            particao: "000",
            agrupamento: "Alarmes",
            nome: "TESTE MANUAL SCRIPT NODE",
            endereco: "RUA Z"
        }
    ]
};

fetch("https://patrimonium-n8n.cloudfy.live/webhook/iris-ingestor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
})
    .then(res => res.json())
    .then(console.log)
    .catch(console.error);
