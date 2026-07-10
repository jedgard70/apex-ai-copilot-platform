// Content Script to automate DOM filling in government portals
console.log('Apex AI Content Script Loaded on:', window.location.href);

// Função para preencher formulários do DBE
function autoFillDBE(data) {
  // Lógica fictícia baseada em IDs comuns da Redesim/DBE
  const cnpjInput = document.querySelector('#cnpj');
  const razaoSocialInput = document.querySelector('#razao_social');
  
  if (cnpjInput && data.cnpj) {
    cnpjInput.value = data.cnpj;
    cnpjInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  if (razaoSocialInput && data.razaoSocial) {
    razaoSocialInput.value = data.razaoSocial;
    razaoSocialInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  console.log('Preenchimento automático concluído com dados da Apex AI.');
}

// Escuta comandos do popup ou background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_AUTOFILL') {
    chrome.runtime.sendMessage({ action: 'FETCH_APEX_DATA' }, (response) => {
      if (response && response.success) {
        autoFillDBE(response.data);
        sendResponse({ status: 'Autofill triggered' });
      } else {
        console.error('Failed to fetch data from Apex API:', response?.error);
        sendResponse({ status: 'Error fetching data' });
      }
    });
    return true;
  }
});
