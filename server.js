const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '8768464184:AAE32xJKSIhTM-USAbWAnlnr3eP9AIq_Vb0';

// ========== НАСТРОЙКИ ==========
const WELCOME_PHOTO = 'https://i.yapx.ru/dXczP.jpg';
const COMMUNITY_URL = 'https://t.me/tyron_community';
const SITE_URL = 'https://yeter-game.onrender.com/index.html';

// ========== ХРАНИЛИЩЕ МАРКЕТА ==========
let marketListings = [];
let connectedClients = new Set();

// ========== БОТ ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'игрок';
  
  const caption = 
    `Добро пожаловать в Tyron Market\n` +
    `Покупай и продовай NFT подарки\n` +
    `Удачных сделок!`;
  
  try {
    await bot.sendPhoto(chatId, WELCOME_PHOTO, {
      caption: caption,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть Tyron Market', web_app: { url: SITE_URL } }],
          [{ text: 'Присоеденится к сообществу', url: COMMUNITY_URL }]
        ]
      }
    });
  } catch (error) {
    console.error('Error sending photo:', error.message);
    await bot.sendMessage(chatId, caption, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть Tyron Market', web_app: { url: SITE_URL } }],
          [{ text: 'Присоеденится к сообществу', url: COMMUNITY_URL }]
        ]
      }
    });
  }
});

// ========== API ДЛЯ МАРКЕТА ==========
app.use(express.json());
app.use(express.static(__dirname));

// Получить все листинги
app.get('/api/market', (req, res) => {
  res.json({ listings: marketListings });
});

// Выставить NFT на продажу
app.post('/api/market/list', (req, res) => {
  const listing = req.body;
  
  if (!listing.id) {
    listing.id = Date.now() + Math.floor(Math.random() * 1000);
  }
  
  marketListings.push(listing);
  
  broadcast({
    type: 'listed',
    listing: listing
  });
  
  console.log(`📦 NFT "${listing.nftName}" listed by ${listing.sellerName}`);
  res.json({ success: true, id: listing.id });
});

// Купить NFT
app.post('/api/market/buy', (req, res) => {
  const { id, buyerId } = req.body;
  
  const index = marketListings.findIndex(l => l.id == id);
  if (index === -1) {
    return res.status(404).json({ error: 'ERROR' });
  }
  
  const listing = marketListings[index];
  
  if (listing.sellerId === buyerId) {
    return res.status(400).json({ error: 'Cannot buy your own NFT' });
  }
  
  marketListings.splice(index, 1);
  
  broadcast({
    type: 'bought',
    id: id,
    listing: listing
  });
  
  console.log(`💰 NFT "${listing.nftName}" bought by ${buyerId}`);
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== WEBSOCKET СЕРВЕР ==========
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket running on ws://0.0.0.0:${PORT}`);
});

const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const message = JSON.stringify(data);
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws, req) => {
  console.log('🔌 New client connected');
  connectedClients.add(ws);
  
  // Отправляем текущее состояние маркета
  ws.send(JSON.stringify({
    type: 'init',
    listings: marketListings
  }));
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    connectedClients.delete(ws);
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    connectedClients.delete(ws);
  });
});
