// Background Service Worker for Apex AI Accounting Extension
console.log('Apex AI Extension Background Loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FETCH_APEX_DATA') {
    // Comunicar com a API local da Apex para obter dados de empresas
    fetch('http://localhost:5173/api/accounting/automation-data')
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
});
