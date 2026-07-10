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
