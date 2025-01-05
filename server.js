const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const RSS = require('rss'); // Biblioteca para gerar RSS
const parser = new Parser();

const app = express();
app.use(cors());
app.use(express.json());

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

// Endpoint para gerar e retornar um feed RSS agregado em XML
app.post('/generate-rss', async (req, res) => {
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

    // Retorna o feed RSS em XML
    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml());
  } catch (error) {
    res.status(500).json({ error: 'Falha ao gerar o feed RSS.' });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});