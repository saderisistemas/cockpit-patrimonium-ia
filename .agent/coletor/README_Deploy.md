# Guia de Implantação do Coletor IRIS (VM 24/7)

Este guia acompanha o script `iris_collector.js` para ser executado num servidor Windows ou Linux (VM 24/7) para coletar dados do IRIS Legacy de forma contínua e silenciosa.

## 1. Como Funciona a Captura
Como o IRIS não possui API aberta, usamos uma técnica chamada **Network Interception** (via Puppeteer).
O script abre um navegador "invisível" (Headless), acessa o painel do IRIS e **ouve o tráfego de rede** nos bastidores. 
Sempre que o painel do IRIS faz um *Fetch/XHR* interno para atualizar os alarmes na tela, o nosso script "pesca" esse JSON nativo e o despacha para o **Webhook do n8n**.

Isso garante que:
- Não precisamos fazer *Scraping de HTML* (que quebra fácil).
- Pegamos os dados 100% estruturados exatamente como o frontend do IRIS os recebe.

## 2. Pré-requisitos na VM
1. Instalar **Node.js** (versão 18+).
2. Se for Linux sem interface gráfica (Ubuntu Server, etc.), instalar as dependências do Chromium:
   `sudo apt install -y libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcb-dri3-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2`

## 3. Instalação e Configuração
Crie uma pasta na VM (ex: `C:\Iris_Collector` ou `/opt/iris_collector`) e coloque o arquivo `iris_collector.js` lá dentro.

Inicie o projeto Node e instale as libs:
```bash
npm init -y
npm install puppeteer axios dotenv
```

Crie um arquivo `.env` na mesma pasta com as variáveis:
```env
IRIS_URL=https://endereco-do-seu-iris.com.br/painel
IRIS_USER=login_do_operador_robo
IRIS_PWD=senha_do_operador_robo
N8N_WEBHOOK=https://seu-n8n.com/webhook/iris-ingestor
POLLING_INTERVAL=15000
```

## 4. Executando como Serviço (24/7)
Para garantir que o coletor rode para sempre e reinicie se a VM reiniciar, use o **PM2**:
```bash
npm install -g pm2
pm2 start iris_collector.js --name "iris-coletor"
pm2 save
pm2 startup
```

## 5. Dicas de Resiliência
- **Sessão Salva:** Na primeira vez que rodar, o Puppeteer vai criar uma pasta chamada `iris_browser_data`. Ela retém os cookies (Session ID). Assim, se a VM reiniciar, o login já estará feito, simulando um navegador real da pessoa.
- Se o IP da sua VM rodar atrás de firewall restritivo da portaria, libere o IP da VM para acessar o servidor do IRIS e porta 443 do seu servidor n8n.
