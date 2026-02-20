const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Токен бота
const BOT_TOKEN = process.env.BOT_TOKEN || '8259804573:AAGGkoqbU9iyyp5o5vkgFX7mdx44i5LfwaQ';

// ========== БОТ БЕЗ POLLING (ТОЛЬКО WEBHOOK) ==========
const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL 
  ? `${process.env.RENDER_EXTERNAL_URL}/webhook` 
  : `https://yeter-game.onrender.com/webhook`;

// Устанавливаем вебхук
bot.setWebHook(WEBHOOK_URL).then(() => {
  console.log(`✅ Webhook установлен на ${WEBHOOK_URL}`);
}).catch(err => {
  console.error('❌ Ошибка установки webhook:', err.message);
});

// ========== БАЗА ДАННЫХ ==========
const db = new sqlite3.Database('./game.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS players (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    avatar_url TEXT,
    balance INTEGER DEFAULT 10000,
    last_active DATETIME
  )`);
});

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ========== API ==========
app.get('/api/player/:telegramId', (req, res) => {
  const telegramId = req.params.telegramId;
  
  db.get('SELECT * FROM players WHERE telegram_id = ?', [telegramId], (err, player) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    if (player) {
      res.json(player);
    } else {
      const newPlayer = {
        telegram_id: telegramId,
        username: `user_${telegramId}`,
        first_name: 'Player',
        avatar_url: null,
        balance: 10000,
        last_active: new Date().toISOString()
      };
      
      db.run(`INSERT INTO players (telegram_id, username, first_name, avatar_url, balance, last_active)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [telegramId, newPlayer.username, newPlayer.first_name, newPlayer.avatar_url, 10000, new Date().toISOString()]);
      
      res.json(newPlayer);
    }
  });
});

app.post('/api/update-balance', (req, res) => {
  const { telegramId, newBalance } = req.body;
  
  db.run(`UPDATE players SET balance = ?, last_active = ? WHERE telegram_id = ?`,
    [newBalance, new Date().toISOString(), telegramId], function(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to update balance' });
      } else {
        res.json({ success: true });
      }
    });
});

// ========== ВЕБХУК ==========
app.post('/webhook', (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.sendStatus(200);
  }
});

// ========== КОМАНДЫ БОТА ==========
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'Player';
  
  bot.sendMessage(chatId, 
    `🎮 Добро пожаловать в YETER GAMES, ${firstName}!\n\n` +
    `💰 Твой баланс: 10000 🧩\n` +
    `👇 Нажми кнопку, чтобы начать игру:`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎰 Джекпот', web_app: { url: `https://yeter-game.onrender.com/jackpot.html?user=${userId}` } }
      ]]
    }
  });
});

bot.onText(/\/balance/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  db.get('SELECT balance FROM players WHERE telegram_id = ?', [userId], (err, player) => {
    const balance = player ? player.balance : 10000;
    bot.sendMessage(chatId, `💰 Твой баланс: ${balance} 🧩`);
  });
});

// ========== ЗАПУСК ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Webhook URL: ${WEBHOOK_URL}`);
});
