const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const RSS = require('rss'); // Biblioteca para gerar RSS
const fs = require('fs');
const path = require('path');
const parser = new Parser();

const app = express();
app.use(cors());
app.use(express.json());

// Pasta para salvar os arquivos XML
const xmlFolder = path.join(__dirname, 'public', 'rss_feeds');
if (!fs.existsSync(xmlFolder)) {
  fs.mkdirSync(xmlFolder, { recursive: true });
}

// Variável para armazenar a data da última atualização
let lastUpdateDate = null;

// Função para gerar um feed RSS
const generateRssFeed = async (feeds) => {
  const aggregatedFeed = [];
  for (const feedUrl of feeds) {
    const feed = await parser.parseURL(feedUrl);
    aggregatedFeed.push(...feed.items);
  }

  aggregatedFeed.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Cria um novo feed RSS
  const feed = new RSS({
    title: 'RSS Aggregator',
    description: 'Feed RSS agregado a partir de múltiplas fontes.',
    feed_url: 'https://rss-aggregator-cmdg.onrender.com/generate-rss',
    site_url: 'https://rss-aggregator-cmdg.onrender.com',
    language: 'pt-br',
  });

  // Adiciona os itens ao feed
  aggregatedFeed.forEach(item => {
    feed.item({
      title: item.title,
      description: item.contentSnippet || item.description,
      url: item.link,
      date: item.pubDate,
    });
  });

  return feed;
};

// Função para atualizar todos os arquivos XML
const updateAllRssFeeds = async () => {
  try {
    const feeds = [
      'https://www.artificialintelligence-news.com/feed/',
      'https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml',
    ];

    const files = fs.readdirSync(xmlFolder);
    for (const file of files) {
      if (file.endsWith('.xml')) {
        const filePath = path.join(xmlFolder, file);
        const feed = await generateRssFeed(feeds);
        fs.writeFileSync(filePath, feed.xml());
        console.log(`Arquivo ${file} atualizado com sucesso.`);
      }
    }

    // Atualiza a data da última atualização
    lastUpdateDate = new Date(); // <-- Certifique-se de que esta linha está presente
    console.log(`Feeds atualizados em: ${lastUpdateDate}`);
  } catch (error) {
    console.error('Erro ao atualizar os feeds RSS:', error);
  }
};

// Endpoint para retornar a data da última atualização
app.get('/last-update', (req, res) => {
  if (lastUpdateDate) {
    res.json({ lastUpdateDate });
  } else {
    res.json({ lastUpdateDate: null }); // Retorna null se a data não estiver definida
  }
});

// Endpoint para atualização manual dos feeds
app.post('/update-feeds', async (req, res) => {
  try {
    await updateAllRssFeeds();
    res.json({ success: true, lastUpdateDate });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao atualizar os feeds RSS.' });
  }
});

// Endpoint para listar os arquivos XML e suas datas de modificação
app.get('/list-xml-files', (req, res) => {
  try {
    const files = fs.readdirSync(xmlFolder);
    const xmlFiles = files
      .filter(file => file.endsWith('.xml'))
      .map(file => {
        const filePath = path.join(xmlFolder, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          lastUpdated: stats.mtime.toISOString(), // Data da última modificação
        };
      });

    res.json(xmlFiles);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao listar os arquivos XML.' });
  }
});

// Endpoint para agregar feeds e retornar JSON
app.post('/aggregate', async (req, res) => {
  const { feeds } = req.body;

  if (!feeds || feeds.length < 2 || feeds.length > 5) {
    return res.status(400).json({ error: 'Por favor, forneça entre 2 e 5 URLs de feeds RSS.' });
  }

  try {
    const aggregatedFeed = [];
    for (const feedUrl of feeds) {
      const feed = await parser.parseURL(feedUrl);
      aggregatedFeed.push(...feed.items);
    }

    aggregatedFeed.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    res.json(aggregatedFeed);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar ou analisar os feeds RSS.' });
  }
});

// Endpoint para gerar e salvar o feed RSS em XML
app.post('/generate-rss', async (req, res) => {
  const { feeds } = req.body;

  if (!feeds || feeds.length < 2 || feeds.length > 5) {
    return res.status(400).json({ error: 'Por favor, forneça entre 2 e 5 URLs de feeds RSS.' });
  }

  try {
    // Gera o nome do arquivo
    const files = fs.readdirSync(xmlFolder);
    const nextFileNumber = files.length + 1;
    const fileName = `rss_feed${nextFileNumber}.xml`;
    const filePath = path.join(xmlFolder, fileName);

    // Gera o feed RSS
    const feed = await generateRssFeed(feeds);

    // Salva o arquivo XML
    fs.writeFileSync(filePath, feed.xml());

    // Retorna o link do arquivo gerado
    res.json({ url: `https://rss-aggregator-cmdg.onrender.com/rss_feeds/${fileName}` });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao gerar o feed RSS.' });
  }
});

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});