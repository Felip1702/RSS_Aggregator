const backendUrl = 'https://rss-aggregator-cmdg.onrender.com';

// Função para carregar a data da última atualização
const loadLastUpdateDate = async () => {
  try {
    const response = await fetch(`${backendUrl}/last-update`);
    const data = await response.json();
    const lastUpdateDate = data.lastUpdateDate ? new Date(data.lastUpdateDate).toLocaleString() : 'Nunca';
    document.getElementById('last-update-date').textContent = lastUpdateDate;
  } catch (error) {
    console.error('Erro ao carregar a data da última atualização:', error);
    document.getElementById('last-update-date').textContent = 'Erro ao carregar';
  }
};

// Função para atualizar os feeds sob demanda
const updateFeeds = async () => {
  try {
    const response = await fetch(`${backendUrl}/update-feeds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (data.success) {
      document.getElementById('update-result').innerHTML = `<p style="color: green;">Feeds atualizados com sucesso!</p>`;
      loadLastUpdateDate(); // Recarrega a data da última atualização
    } else {
      document.getElementById('update-result').innerHTML = `<p style="color: red;">Erro ao atualizar os feeds.</p>`;
    }
  } catch (error) {
    console.error('Erro ao atualizar os feeds:', error);
    document.getElementById('update-result').innerHTML = `<p style="color: red;">Erro ao atualizar os feeds.</p>`;
  }
};

// Carrega a data da última atualização ao carregar a página
document.addEventListener('DOMContentLoaded', loadLastUpdateDate);

// Adiciona o evento de clique ao botão de atualização
document.getElementById('update-feeds').addEventListener('click', updateFeeds);