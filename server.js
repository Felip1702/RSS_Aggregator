const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const RSS = require('rss');
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

// Endpoint para gerar e salvar o feed RSS em XML
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
      feed_url: 'https://rss-aggregator-1.onrender.com/rss_feed.xml',
      site_url: 'https://rss-aggregator-1.onrender.com',
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

    // Gera o nome do arquivo
    const files = fs.readdirSync(xmlFolder);
    const nextFileNumber = files.length + 1;
    const fileName = `rss_feed${nextFileNumber}.xml`;
    const filePath = path.join(xmlFolder, fileName);

    // Salva o arquivo XML
    fs.writeFileSync(filePath, feed.xml());

    // Retorna o link do arquivo gerado
    res.json({ url: `https://rss-aggregator-1.onrender.com/rss_feeds/${fileName}` });
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