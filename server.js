const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Токен бота (берется из переменных окружения Render)
const BOT_TOKEN = process.env.BOT_TOKEN || '8259804573:AAGGkoqbU9iyyp5o5vkgFX7mdx44i5LfwaQ';

// ========== НАСТРОЙКА БОТА (БЕЗ POLLING) ==========
const bot = new TelegramBot(BOT_TOKEN);
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL 
  ? `${process.env.RENDER_EXTERNAL_URL}/webhook` 
  : `https://yeter-game.onrender.com/webhook`;

// Устанавливаем вебхук при запуске
bot.setWebHook(WEBHOOK_URL).then(() => {
  console.log(`✅ Webhook установлен на ${WEBHOOK_URL}`);
}).catch(err => {
  console.error('❌ Ошибка установки webhook:', err.message);
});

// ========== БАЗА ДАННЫХ ==========
const db = new sqlite3.Database('./game.db');

// Создаем таблицы, если их нет
db.serialize(() => {
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

  db.run(`
    CREATE TABLE IF NOT EXISTS game_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id TEXT,
      winner_id INTEGER,
      total_pot INTEGER,
      round_time DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS round_players (
      round_id TEXT,
      player_id INTEGER,
      bet INTEGER,
      win BOOLEAN DEFAULT 0
    )
  `);
});

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздаем статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// ========== API ДЛЯ ИГРЫ ==========

// Получение данных игрока
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
      // Создаем нового игрока с дефолтными значениями
      const newPlayer = {
        telegram_id: telegramId,
        username: `user_${telegramId}`,
        first_name: 'Player',
        avatar_url: null,
        balance: 10000,
        last_active: new Date().toISOString()
      };
      
      db.run(`
        INSERT INTO players (telegram_id, username, first_name, avatar_url, balance, last_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [telegramId, newPlayer.username, newPlayer.first_name, newPlayer.avatar_url, 10000, new Date().toISOString()]);
      
      res.json(newPlayer);
    }
  });
});

// Обновление баланса игрока
app.post('/api/update-balance', (req, res) => {
  const { telegramId, newBalance, reason } = req.body;
  
  db.run(`
    UPDATE players 
    SET balance = ?, last_active = ? 
    WHERE telegram_id = ?
  `, [newBalance, new Date().toISOString(), telegramId], function(err) {
    if (err) {
      res.status(500).json({ error: 'Failed to update balance' });
    } else {
      res.json({ success: true });
    }
  });
});

// Получение всех активных игроков (для джекпота)
app.get('/api/players/active', (req, res) => {
  db.all(`
    SELECT * FROM players 
    WHERE last_active > datetime('now', '-5 minutes')
    ORDER BY balance DESC 
    LIMIT 50
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows);
    }
  });
});

// Сохранение результатов раунда
app.post('/api/save-round', (req, res) => {
  const { roundId, winnerId, totalPot, players } = req.body;
  
  db.run(`
    INSERT INTO game_history (round_id, winner_id, total_pot, round_time)
    VALUES (?, ?, ?, ?)
  `, [roundId, winnerId, totalPot, new Date().toISOString()], function(err) {
    if (err) {
      res.status(500).json({ error: 'Failed to save round' });
      return;
    }
    
    // Сохраняем ставки игроков
    const stmt = db.prepare(`
      INSERT INTO round_players (round_id, player_id, bet, win)
      VALUES (?, ?, ?, ?)
    `);
    
    players.forEach(p => {
      stmt.run([roundId, p.id, p.bet, p.id === winnerId ? 1 : 0]);
    });
    
    stmt.finalize();
    res.json({ success: true });
  });
});

// ========== ОБРАБОТЧИК ВЕБХУКА ДЛЯ ТЕЛЕГРАМ ==========
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ========== КОМАНДЫ БОТА ==========

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || `user_${userId}`;
  const firstName = msg.from.first_name || 'Player';
  
  console.log(`✅ Новый пользователь: @${username} (${userId})`);
  
  // Сохраняем или обновляем пользователя в БД
  db.get('SELECT * FROM players WHERE telegram_id = ?', [userId], (err, player) => {
    if (!player) {
      db.run(`
        INSERT INTO players (telegram_id, username, first_name, balance, last_active)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, username, firstName, 10000, new Date().toISOString()]);
    } else {
      db.run(`
        UPDATE players SET username = ?, first_name = ?, last_active = ?
        WHERE telegram_id = ?
      `, [username, firstName, new Date().toISOString(), userId]);
    }
  });
  
  // Отправляем приветствие с кнопкой
  bot.sendMessage(chatId, 
    `🎮 Добро пожаловать в YETER GAMES, ${firstName}!\n\n` +
    `💰 Твой баланс: 10000 🧩\n` +
    `👇 Нажми кнопку, чтобы начать игру:`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎰 Играть в Джекпот', web_app: { url: `https://yeter-game.onrender.com/jackpot.html?user=${userId}` } }
      ]]
    }
  });
});

// Команда /balance
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  db.get('SELECT balance FROM players WHERE telegram_id = ?', [userId], (err, player) => {
    const balance = player ? player.balance : 10000;
    bot.sendMessage(chatId, `💰 Твой баланс: ${balance} 🧩`);
  });
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '🎮 **YETER GAMES**\n\n' +
    'Команды:\n' +
    '/start - Начать игру\n' +
    '/balance - Проверить баланс\n' +
    '/help - Показать помощь\n\n' +
    'Как играть:\n' +
    '1️⃣ Нажми "Играть в Джекпот"\n' +
    '2️⃣ Сделай ставку\n' +
    '3️⃣ Жди розыгрыша\n' +
    '4️⃣ Забирай выигрыш!', 
    { parse_mode: 'Markdown' }
  );
});

// ========== ЗАПУСК СЕРВЕРА ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 ================================
  🚀 Сервер запущен на порту ${PORT}
  🚀 Сайт доступен по адресу: http://localhost:${PORT}
  🚀 Webhook: ${WEBHOOK_URL}
  🚀 ================================
  `);
});

// Обработка ошибок
process.on('uncaughtException', (err) => {
  console.error('❌ Непойманная ошибка:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Необработанный reject:', err.message);
});
