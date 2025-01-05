const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const parser = new Parser();

const app = express();
app.use(cors());
app.use(express.json());

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

// Configuração da porta
const PORT = process.env.PORT || 3000; // Usa a porta do Render ou 3000 localmente
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});