#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# setup-apex-vm-oracle.sh
# ═══════════════════════════════════════════════════════════════
# Configura uma VM Oracle Cloud (Ubuntu 24.04 ARM) para rodar
# o motor próprio Apex AI 2.0.
#
# USO:
#   1. Criar VM Oracle: Ubuntu 24.04 ARM, 4+ OCPU, 24+ GB RAM
#   2. SSH para a VM
#   3. curl -sL https://raw.githubusercontent.com/Apex-Global-LLC/apex-ai-copilot-platform/main/scripts/setup-apex-vm-oracle.sh | bash
#
# PRÉ-REQUISITOS:
#   - Oracle Cloud FREE tier (4 ARM + 24 GB RAM) ou superior
#   - Ubuntu 24.04 ARM
#   - Portas 11434 (Ollama) e 8888 (Apex Engine) liberadas no firewall
#
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Cores ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✘]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# ─── 1. System Packages ──────────────────────────────────────
info "Atualizando sistema..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
log "Sistema atualizado"

info "Instalando dependências..."
sudo apt-get install -y -qq \
    curl wget git build-essential \
    nginx certbot python3-certbot-nginx \
    ufw
log "Dependências instaladas"

# ─── 2. Node.js 24 ───────────────────────────────────────────
if ! command -v node &>/dev/null; then
    info "Instalando Node.js 24..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
    log "Node.js $(node -v) instalado"
else
    log "Node.js $(node -v) já instalado"
fi

# ─── 3. Ollama ────────────────────────────────────────────────
if ! command -v ollama &>/dev/null; then
    info "Instalando Ollama..."
    curl -fsSL https://ollama.com/install.sh | bash
    log "Ollama instalado"
else
    log "Ollama já instalado"
fi

# ─── 4. Baixar modelos ────────────────────────────────────────
info "Baixando modelo base Gemma 4 (8B)..."
ollama pull gemma4
log "Gemma 4 baixado"

info "Criando modelo Apex AI personalizado..."
# Cria Modelfile com o system prompt da Apex
cat > /tmp/Modelfile.apex << 'MODELFILE'
FROM gemma4

SYSTEM """Você é a Apex AI — plataforma profissional global de arquitetura, construção, BIM, marketing e gestão.
Criada pelo Dr. Edgard. Funciona em 3 plataformas: site (apexglobalai.com), app mobile (PWA) e desktop (.exe).
Responde em português ou no idioma do usuário. Tom: direto, técnico, profissional e confiante.

IDENTIDADE:
- Quando perguntarem "quem é você": responda "Sou a Apex AI. Como posso te ajudar?"
- Nunca diga que é um modelo de linguagem, LLM ou IA genérica.

CAPACIDADES REAIS DA PLATAFORMA:
- Chat inteligente com memória de conversa
- Geração de imagens e vídeos de arquitetura
- Visualização BIM 3D (IFC, RVT, GLB, OBJ, STL)
- Orçamentos SINAPI, Contratos, RDO/Field Ops
- EVM Scheduler, CRM Pipeline, Research Studio
- Integração WhatsApp/SMS, Stripe, MS Project
- Execução de comandos no PC via local-worker

REGRAS ABSOLUTAS:
- Nunca invente dados, APIs ou integrações que não existem.
- Responda diretamente. Sem introduções vazias."""
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
MODELFILE

ollama create apex-ai -f /tmp/Modelfile.apex
log "Modelo apex-ai criado"

# ─── 5. Clonar repositório ────────────────────────────────────
if [ ! -d "/opt/apex-ai" ]; then
    info "Clonando repositório Apex AI..."
    sudo git clone https://github.com/Apex-Global-LLC/apex-ai-copilot-platform.git /opt/apex-ai
    sudo chown -R "$USER:$USER" /opt/apex-ai
    log "Repositório clonado em /opt/apex-ai"
else
    info "Repositório já existe, atualizando..."
    cd /opt/apex-ai && git pull
fi

# ─── 6. Instalar dependências npm ─────────────────────────────
info "Instalando dependências npm..."
cd /opt/apex-ai
npm install --production --ignore-scripts 2>/dev/null || true
log "Dependências instaladas"

# ─── 7. Firewall ──────────────────────────────────────────────
info "Configurando firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8888/tcp  # Apex Engine API
sudo ufw --force enable
log "Firewall configurado"

# ─── 8. Systemd: Ollama ──────────────────────────────────────
# Garantir que Ollama escuta em todas as interfaces
sudo mkdir -p /etc/systemd/system/ollama.service.d
cat | sudo tee /etc/systemd/system/ollama.service.d/override.conf << 'OVERRIDE'
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
OVERRIDE
sudo systemctl daemon-reload
sudo systemctl restart ollama
log "Ollama configurado para escutar em todas as interfaces"

# ─── 9. Systemd: Apex Engine Proxy ───────────────────────────
info "Criando serviço systemd para Apex Engine Proxy..."
cat | sudo tee /etc/systemd/system/apex-engine.service << 'SERVICE'
[Unit]
Description=Apex AI Engine Proxy
After=network.target ollama.service
Requires=ollama.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/apex-ai
ExecStart=/usr/bin/node server/apex-engine-proxy.mjs
Environment="APEX_ENGINE_PROXY_PORT=8888"
Environment="OLLAMA_URL=http://127.0.0.1:11434"
Environment="APEX_ENGINE_MODEL=apex-ai"
Environment="OLLAMA_TIMEOUT=120000"
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable apex-engine
sudo systemctl restart apex-engine
sleep 3
log "Serviço apex-engine instalado"

# ─── 10. Nginx reverse proxy ─────────────────────────────────
info "Configurando Nginx..."
if [ -n "$(sudo ufw status | grep '80.*ALLOW')" ]; then
    cat | sudo tee /etc/nginx/sites-available/apex-engine << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://127.0.0.1:8888/health;
    }
}
NGINX

    sudo ln -sf /etc/nginx/sites-available/apex-engine /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    log "Nginx configurado como proxy reverso"
fi

# ─── 11. Teste ────────────────────────────────────────────────
info "Testando endpoints..."
sleep 3

echo ""
echo "═══ TESTE: Ollama ═══"
curl -s http://127.0.0.1:11434/api/tags | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f'  ✓ {m[\"name\"]}') for m in d.get('models',[])]" 2>/dev/null || warn "Ollama não respondeu"

echo ""
echo "═══ TESTE: Apex Engine Proxy ═══"
HEALTH=$(curl -s http://127.0.0.1:8888/health 2>/dev/null)
if echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('status')=='ok'; assert d.get('model')=='apex-ai'; print('✓ Proxy rodando, modelo:', d.get('model'))" 2>/dev/null; then
    log "Engine Proxy funcionando!"
else
    warn "Engine Proxy com problemas: $HEALTH"
fi

echo ""
echo "═══ TESTE: Chat de inferência ═══"
CHAT_TEST=$(curl -s --max-time 120 -X POST http://127.0.0.1:8888/ai/chat \
    -H "Content-Type: application/json" \
    -d '{"model":"apex-ai","messages":[{"role":"user","content":"O que é a Apex AI? Responde em 1 linha."}]}' 2>/dev/null)
if echo "$CHAT_TEST" | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d.get('reply',''))>0; print('✓ Resposta:', d['reply'][:80])" 2>/dev/null; then
    log "Motor próprio funcionando!"
else
    warn "Chat falhou: $CHAT_TEST"
fi

# ─── 12. Instruções finais ───────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   ✅ SETUP COMPLETO — Apex AI Engine na Oracle Cloud       ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  📍 IP da VM: $(curl -s ifconfig.me 2>/dev/null || echo '<descubra com: curl ifconfig.me>')"
echo "║                                                            ║"
echo "║  🔥 Endpoints:                                             ║"
echo "║    Health:   http://<IP>/health                            ║"
echo "║    Chat:     POST http://<IP>/ai/chat                      ║"
echo "║    OpenAI:   POST http://<IP>/v1/chat/completions          ║"
echo "║                                                            ║"
echo "║  📋 Próximos passos:                                       ║"
echo "║    1. Configure DNS: apex-api.seudominio.com → este IP     ║"
echo "║    2. SSL: sudo certbot --nginx -d apex-api.seudominio.com ║"
echo "║    3. No Vercel, adicione:                                 ║"
echo "║       APEX_OWN_ENGINE_URL = https://apex-api.seudominio.com║"
echo "║       APEX_API_TOKEN = <token secreto>                     ║"
echo "║    4. (Opcional) Faça fine-tuning com seus dados:          ║"
echo "║       Abra notebooks/real_finetune_gemma_apex_colab.ipynb  ║"
echo "║       no Google Colab, treine e baixe o .gguf              ║"
echo "║                                                            ║"
echo "║  📦 Modelos instalados:                                    ║"
ollama list 2>/dev/null | tail -n +2 | while read name rest; do
    echo "║     - $name"
done
echo "║                                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
