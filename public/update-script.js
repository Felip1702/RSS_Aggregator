const backendUrl = 'https://rss-aggregator-1.onrender.com';

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

// Função para carregar e exibir a lista de arquivos XML
const loadXmlFiles = async () => {
  try {
    const response = await fetch(`${backendUrl}/list-xml-files`);
    const data = await response.json();

    const tableBody = document.getElementById('xml-files-table').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados

    data.forEach(file => {
      const row = tableBody.insertRow();
      const cellName = row.insertCell(0);
      const cellLastUpdated = row.insertCell(1);

      cellName.textContent = file.name;
      cellLastUpdated.textContent = new Date(file.lastUpdated).toLocaleString();
    });
  } catch (error) {
    console.error('Erro ao carregar a lista de arquivos XML:', error);
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
      await loadLastUpdateDate(); // Recarrega a data da última atualização
      await loadXmlFiles(); // Recarrega a lista de arquivos XML
    } else {
      document.getElementById('update-result').innerHTML = `<p style="color: red;">Erro ao atualizar os feeds.</p>`;
    }
  } catch (error) {
    console.error('Erro ao atualizar os feeds:', error);
    document.getElementById('update-result').innerHTML = `<p style="color: red;">Erro ao atualizar os feeds.</p>`;
  }
};

// Carrega a data da última atualização e a lista de arquivos XML ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  await loadLastUpdateDate();
  await loadXmlFiles();
});

// Adiciona o evento de clique ao botão de atualização
document.getElementById('update-feeds').addEventListener('click', updateFeeds);