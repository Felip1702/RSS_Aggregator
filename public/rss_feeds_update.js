const backendUrl = 'https://rss-aggregator-cmdg.onrender.com';

async function fetchAndDisplayRssLinks() {
  try {
      const response = await fetch(`${backendUrl}/list-rss`);
      const data = await response.json();
      const rssListDiv = document.getElementById('rssList');
      if(rssListDiv) rssListDiv.innerHTML = "";

      if (data.error) {
          rssListDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
      } else {
          const listDiv = document.createElement('ul');
          data.forEach(item => {
               const listItem = document.createElement('li');
              listItem.innerHTML = `
                <strong>ID:</strong> ${item.id}<br>
                <strong>Data de Criação:</strong> ${item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Não disponível'}<br>
                <strong>Feeds:</strong> ${item.feeds.join(', ')}<br>
                <strong>Última Atualização:</strong> <span id="lastUpdate-${item.id}">Carregando...</span><br>
                <button id="update-${item.id}">Atualizar</button>
                <br><br><a href="${item.url}" target="_blank">Link XML</a>
               `;
                listDiv.appendChild(listItem);

                const updateButton = document.getElementById(`update-${item.id}`);
                 updateButton.addEventListener('click', async () => {
                      await updateRssFeed(item.id);
                 });

               getLastUpdate(item.id);
          });
          if(rssListDiv) rssListDiv.appendChild(listDiv);
      }

  } catch (error) {
    console.error('Error fetching RSS links:', error);
  }
}

async function updateRssFeed(id) {
    try {
      const response = await fetch(`${backendUrl}/update-rss/${id}`, {
        method: 'POST'
      });
      const data = await response.json();
      if(data.error) {
        alert(`Erro ao atualizar o Feed ${id}: ${data.error}`);
      }else {
          getLastUpdate(id);
          alert(`Feed ${id} atualizado com sucesso`);
      }
    } catch (error) {
         console.error('Erro ao atualizar RSS links:', error);
        alert(`Erro ao atualizar o Feed ${id}: ${error}`);
    }
}

async function getLastUpdate(id) {
     try {
        const response = await fetch(`${backendUrl}/last-update/${id}`);
        const data = await response.json();
        if(data.error){
            const lastUpdateSpan = document.getElementById(`lastUpdate-${id}`);
           if(lastUpdateSpan) lastUpdateSpan.innerText = "Erro ao buscar a data"
        }else {
           const lastUpdateSpan = document.getElementById(`lastUpdate-${id}`);
            if(lastUpdateSpan && data.lastUpdate)  lastUpdateSpan.innerText =  data.lastUpdate ? new Date(data.lastUpdate.seconds * 1000).toLocaleString() : 'Não foi atualizado ainda';
           else if(lastUpdateSpan)  lastUpdateSpan.innerText = 'Não foi atualizado ainda';
        }

      }catch (error) {
           console.error('Erro ao buscar última atualização:', error);
      }
}

// Inicializa ao carregar a página
fetchAndDisplayRssLinks();