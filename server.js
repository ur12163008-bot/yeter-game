const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Токен твоего бота (вставь свой)
const BOT_TOKEN = 'ТВОЙ_ТОКЕН_БОТА';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// База данных
const db = new sqlite3.Database('game.db');

// Создаем таблицу игроков, если её нет
db.run(`
  CREATE TABLE IF NOT EXISTS players (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    avatar_url TEXT,
    balance INTEGER DEFAULT 10000,
    last_active DATETIME
  )
`);

// Middleware для JSON
app.use(express.json());

// Раздаем статические файлы (твои HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// API для получения данных игрока
app.get('/api/player/:telegramId', async (req, res) => {
  const telegramId = req.params.telegramId;
  
  // Получаем данные из БД
  db.get('SELECT * FROM players WHERE telegram_id = ?', [telegramId], async (err, player) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    if (player) {
      res.json(player);
    } else {
      // Если игрока нет в БД, создаем нового
      try {
        const chat = await bot.getChat(telegramId);
        const photos = await bot.getUserProfilePhotos(telegramId);
        let avatarUrl = null;
        
        if (photos.total_count > 0) {
          const file = await bot.getFile(photos.photos[0][0].file_id);
          avatarUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
        }
        
        const newPlayer = {
          telegram_id: telegramId,
          username: chat.username || chat.first_name,
          first_name: chat.first_name,
          avatar_url: avatarUrl,
          balance: 10000,
          last_active: new Date()
        };
        
        db.run(`
          INSERT INTO players (telegram_id, username, first_name, avatar_url, balance, last_active)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [telegramId, newPlayer.username, newPlayer.first_name, avatarUrl, 10000, new Date()]);
        
        res.json(newPlayer);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get user data' });
      }
    }
  });
});

// API для обновления баланса
app.post('/api/update-balance', (req, res) => {
  const { telegramId, newBalance } = req.body;
  
  db.run('UPDATE players SET balance = ?, last_active = ? WHERE telegram_id = ?', 
    [newBalance, new Date(), telegramId], 
    function(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to update balance' });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// API для получения всех игроков (для отображения в джекпоте)
app.get('/api/players', (req, res) => {
  db.all('SELECT * FROM players ORDER BY last_active DESC LIMIT 50', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows);
    }
  });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Обработка команд бота
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  bot.sendMessage(chatId, 'Привет! Нажми кнопку, чтобы открыть игру:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 Играть в Джекпот', web_app: { url: `https://твой-сайт.com/?user=${userId}` } }
      ]]
    }
  });
});