document.getElementById('addFeed').addEventListener('click', () => {
    const form = document.getElementById('rssForm');
    const feedCount = document.querySelectorAll('input[type="url"]').length;
  
    if (feedCount < 5) {
      const newLabel = document.createElement('label');
      newLabel.innerText = `Feed ${feedCount + 1}:`;
      const newInput = document.createElement('input');
      newInput.type = 'url';
      newInput.id = `feed${feedCount + 1}`;
      newInput.required = true;
      form.insertBefore(newLabel, document.getElementById('addFeed'));
      form.insertBefore(newInput, document.getElementById('addFeed'));
    } else {
      alert('You can only add up to 5 feeds.');
    }
  });
  
  document.getElementById('rssForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const feeds = Array.from(document.querySelectorAll('input[type="url"]')).map(input => input.value);
  
    try {
      // Atualize a URL do backend aqui
      const response = await fetch('https://us-central1-your-project-id.cloudfunctions.net/api/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeds }),
      });
  
      const data = await response.json();
      const resultsDiv = document.getElementById('results');
      resultsDiv.innerHTML = '';
  
      if (data.error) {
        resultsDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
      } else {
        data.forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.innerHTML = `<h3>${item.title}</h3><p>${item.contentSnippet || item.description}</p><a href="${item.link}" target="_blank">Read more</a>`;
          resultsDiv.appendChild(itemDiv);
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });