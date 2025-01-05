const backendUrl = 'https://rss-aggregator-cmdg.onrender.com';

document.getElementById('addFeed').addEventListener('click', () => {
const form = document.getElementById('rssForm');
const feedCount = document.querySelectorAll('input[type="url"]').length;

if (feedCount < 5) {
const newLabel = document.createElement('label');
newLabel.innerText = Feed ${feedCount + 1}:;
const newInput = document.createElement('input');
newInput.type = 'url';
newInput.id = feed${feedCount + 1};
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
// Envia os feeds para o backend e recebe os resultados agregados
const response = await fetch(${backendUrl}/aggregate, {
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
content_copy
download
 Use code with caution.

} catch (error) {
console.error('Error:', error);
}
});

// Adiciona a funcionalidade para gerar e exibir o link do feed RSS em XML
document.getElementById('generateRss').addEventListener('click', async () => {
const feeds = Array.from(document.querySelectorAll('input[type="url"]')).map(input => input.value);

try {
// Envia os feeds para o backend e recebe o link do feed RSS gerado
const response = await fetch(${backendUrl}/generate-rss, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ feeds }),
});

const data = await response.json();
if (data.error) {
  alert(data.error);
} else {
  // Exibe o link do XML gerado
  const rssLinkDiv = document.getElementById('rssLink');
  rssLinkDiv.innerHTML = `<a href="${data.url}" target="_blank">Download RSS Feed</a>`;
}
content_copy
download
 Use code with caution.

} catch (error) {
console.error('Error:', error);
}
});