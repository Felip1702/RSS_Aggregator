const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const RSS = require('rss');
const fs = require('fs');
const path = require('path');
const parser = new Parser();
const admin = require('firebase-admin'); // Importa o Admin SDK

// Inicialização do Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // Inicializa o Firestore

const app = express();
app.use(cors());
app.use(express.json());

// Pasta para salvar os arquivos XML
const xmlFolder = path.join(__dirname, 'public', 'rss_feeds');
if (!fs.existsSync(xmlFolder)) {
    fs.mkdirSync(xmlFolder, { recursive: true });
}

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

      // Salva o link no Firestore
      const docRef = db.collection('rss_feeds').doc();
      await docRef.set({
          url: `https://rss-aggregator-cmdg.onrender.com/rss_feeds/${fileName}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          feeds: feeds
      });

      // Retorna o link e o ID do documento
     res.json({ url: `https://rss-aggregator-cmdg.onrender.com/rss_feeds/${fileName}`, id: docRef.id });

  } catch (error) {
    console.error("Erro ao gerar ou salvar RSS:", error);
      res.status(500).json({ error: 'Falha ao gerar ou salvar o feed RSS.' });
  }
});

// Endpoint para listar todos os feeds
app.get('/list-rss', async (req, res) => {
    try {
        const snapshot = await db.collection('rss_feeds').orderBy('createdAt', 'desc').get();
        const feeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(feeds);
    } catch (error) {
        console.error("Erro ao listar feeds:", error); // Verifique se esse console.error está nos seus logs
        res.status(500).json({ error: 'Falha ao listar feeds.' });
    }
});


// Endpoint para atualizar um feed
app.post('/update-rss/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const docRef = db.collection('rss_feeds').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Feed não encontrado' });
        }
        const data = doc.data();
        const {feeds} = data;
        const feed = await generateRssFeed(feeds);

        const files = fs.readdirSync(xmlFolder);
        const nextFileNumber = files.length + 1;
        const fileName = `rss_feed${nextFileNumber}.xml`;
        const filePath = path.join(xmlFolder, fileName);

    // Salva o arquivo XML
        fs.writeFileSync(filePath, feed.xml());

        await docRef.update({
           url:  `https://rss-aggregator-cmdg.onrender.com/rss_feeds/${fileName}`,
           lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
       });
       res.json({ message: 'Feed atualizado com sucesso' });

    } catch (error) {
        console.error("Erro ao atualizar o feed:", error);
        res.status(500).json({ error: 'Falha ao atualizar o feed RSS.' });
    }
});


// Endpoint para pegar a data da ultima atualização do Feed
app.get('/last-update/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const docRef = db.collection('rss_feeds').doc(id);
        const doc = await docRef.get();
        if(!doc.exists) {
           return res.status(404).json({ error: 'Feed não encontrado' });
        }
        const data = doc.data();
       res.json({ lastUpdate: data.lastUpdate });

     } catch (error) {
          console.error("Erro ao buscar a última atualização do feed:", error);
         res.status(500).json({ error: 'Falha ao buscar a última atualização do feed.' });
    }
});

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});