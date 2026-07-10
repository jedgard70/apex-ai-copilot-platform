document.getElementById('btn-autofill').addEventListener('click', () => {
  const status = document.getElementById('status-text');
  status.textContent = 'Iniciando preenchimento...';
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'START_AUTOFILL' }, (response) => {
        if (chrome.runtime.lastError) {
          status.textContent = 'Erro: Verifique se está em um portal compatível.';
        } else {
          status.textContent = 'Preenchimento concluído!';
        }
      });
    }
  });
});

document.getElementById('btn-sync').addEventListener('click', () => {
  const status = document.getElementById('status-text');
  status.textContent = 'Sincronizando com Apex AI...';
  
  chrome.runtime.sendMessage({ action: 'FETCH_APEX_DATA' }, (response) => {
    if (response && response.success) {
      status.textContent = 'Dados sincronizados com sucesso!';
    } else {
      status.textContent = 'Erro ao sincronizar. API local ativa?';
    }
  });
});

document.getElementById('btn-webhook').addEventListener('click', () => {
  const status = document.getElementById('status-text');
  status.textContent = 'Enviando Webhook para Apex AI...';
  
  chrome.runtime.sendMessage({ 
    action: 'SEND_WEBHOOK',
    payload: {
      processo_id: 'PR-2024-0001',
      dbe_recibo: 'REC-' + Math.floor(Math.random() * 1000000),
      dbe_identificacao: 'ID-' + Math.floor(Math.random() * 1000000)
    }
  }, (response) => {
    if (response && response.success) {
      status.textContent = 'Webhook enviado! Status atualizado.';
    } else {
      status.textContent = 'Erro ao enviar webhook.';
    }
  });
});
