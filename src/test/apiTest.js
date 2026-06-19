fetch('/api/copilot/models')
  .then(res => res.json())
  .then(data => {
    console.log('Modelos disponíveis:', data);
  })
  .catch(error => {
    console.error('Erro ao buscar modelos:', error);
  });