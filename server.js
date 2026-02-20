const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '8259804573:AAGGkoqbU9iyyp5o5vkgFX7mdx44i5LfwaQ';

// ========== БАЗА ДАННЫХ ==========
const db = new sqlite3.Database('./game.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS players (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    balance INTEGER DEFAULT 10000,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    exp_to_next INTEGER DEFAULT 1000,
    last_active DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game TEXT,
    player_id INTEGER,
    bet INTEGER,
    win INTEGER,
    multiplier REAL,
    result TEXT,
    time DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS jackpot_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id TEXT,
    winner_id INTEGER,
    total_pot INTEGER,
    players_count INTEGER,
    round_time DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS jackpot_bets (
    round_id TEXT,
    player_id INTEGER,
    bet INTEGER,
    win BOOLEAN DEFAULT 0
  )`);
});

// ========== БОТ ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'игрок';
  const lastName = msg.from.last_name || '';
  const username = msg.from.username || '';
  
  // Сохраняем игрока в БД
  db.get('SELECT * FROM players WHERE telegram_id = ?', [userId], (err, player) => {
    if (!player) {
      db.run(`INSERT INTO players (telegram_id, username, first_name, last_name, balance, last_active)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, username, firstName, lastName, 10000, new Date().toISOString()]);
    } else {
      db.run(`UPDATE players SET username = ?, first_name = ?, last_name = ?, last_active = ?
        WHERE telegram_id = ?`,
        [username, firstName, lastName, new Date().toISOString(), userId]);
    }
  });
  
  bot.sendMessage(chatId, 
    `🎮 Добро пожаловать в YETER GAMES, ${firstName}!\n\n` +
    `👇 Нажми кнопку, чтобы открыть игры:`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 ИГРЫ', web_app: { url: `https://yeter-game.onrender.com/index.html?user=${userId}` } }
      ]]
    }
  });
});

// Команда /balance
bot.onText(/\/balance/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  db.get('SELECT balance FROM players WHERE telegram_id = ?', [userId], (err, player) => {
    const balance = player ? player.balance : 10000;
    bot.sendMessage(chatId, `💰 Твой баланс: ${balance} 🧩`);
  });
});

// Команда /profile
bot.onText(/\/profile/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  db.get('SELECT * FROM players WHERE telegram_id = ?', [userId], (err, player) => {
    if (player) {
      const level = player.level || 1;
      const exp = player.exp || 0;
      const expToNext = player.exp_to_next || 1000;
      const progress = Math.floor((exp / expToNext) * 100);
      
      bot.sendMessage(chatId, 
        `📊 **ТВОЙ ПРОФИЛЬ**\n\n` +
        `👤 Имя: ${player.first_name} ${player.last_name || ''}\n` +
        `💰 Баланс: ${player.balance} 🧩\n` +
        `📈 Уровень: ${level} (${progress}% до ${level + 1})\n` +
        `🎮 Игр сыграно: ${exp} опыта`, 
        { parse_mode: 'Markdown' }
      );
    } else {
      bot.sendMessage(chatId, '❌ Профиль не найден. Напиши /start');
    }
  });
});

// Команда /top
bot.onText(/\/top/, (msg) => {
  const chatId = msg.chat.id;
  
  db.all('SELECT first_name, balance FROM players ORDER BY balance DESC LIMIT 10', [], (err, rows) => {
    if (rows && rows.length > 0) {
      let text = '🏆 **ТОП 10 ИГРОКОВ**\n\n';
      rows.forEach((p, i) => {
        text += `${i+1}. ${p.first_name} — ${p.balance} 🧩\n`;
      });
      bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '❌ Пока нет игроков');
    }
  });
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '🎮 **YETER GAMES**\n\n' +
    '**Команды:**\n' +
    '/start - Запустить бота\n' +
    '/balance - Проверить баланс\n' +
    '/profile - Твой профиль\n' +
    '/top - Топ игроков\n' +
    '/help - Помощь\n\n' +
    '**Игры:**\n' +
    '• Джекпот — общий банк, победитель забирает всё\n' +
    '• Мины — испытай удачу\n' +
    '• Dice — играй в кости\n\n' +
    '💰 1 🧩 = 1 Telegram звезда'
  );
});

// ========== API ДЛЯ САЙТА ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздаем статические файлы
app.use(express.static(__dirname));

// API: получить игрока
app.get('/api/player/:id', (req, res) => {
  const userId = req.params.id;
  
  db.get('SELECT * FROM players WHERE telegram_id = ?', [userId], (err, player) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else if (player) {
      res.json(player);
    } else {
      res.json({ 
        telegram_id: userId,
        first_name: 'Игрок',
        balance: 10000,
        level: 1,
        exp: 0,
        exp_to_next: 1000
      });
    }
  });
});

// API: обновить баланс
app.post('/api/update-balance', (req, res) => {
  const { userId, amount, reason } = req.body;
  
  db.run('UPDATE players SET balance = balance + ?, last_active = ? WHERE telegram_id = ?',
    [amount, new Date().toISOString(), userId], function(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to update balance' });
      } else {
        res.json({ success: true });
      }
    });
});

// API: добавить опыт
app.post('/api/add-exp', (req, res) => {
  const { userId, amount } = req.body;
  
  db.get('SELECT level, exp, exp_to_next FROM players WHERE telegram_id = ?', [userId], (err, player) => {
    if (err || !player) {
      res.status(500).json({ error: 'Player not found' });
      return;
    }
    
    let newExp = (player.exp || 0) + amount;
    let newLevel = player.level || 1;
    let newExpToNext = player.exp_to_next || 1000;
    
    while (newExp >= newExpToNext) {
      newExp -= newExpToNext;
      newLevel++;
      newExpToNext = Math.floor(newExpToNext * 1.5);
    }
    
    db.run('UPDATE players SET exp = ?, level = ?, exp_to_next = ? WHERE telegram_id = ?',
      [newExp, newLevel, newExpToNext, userId]);
    
    res.json({ success: true, level: newLevel, exp: newExp, expToNext: newExpToNext });
  });
});

// API: сохранить результат игры
app.post('/api/save-game', (req, res) => {
  const { game, playerId, bet, win, multiplier, result } = req.body;
  
  db.run(`INSERT INTO game_history (game, player_id, bet, win, multiplier, result, time)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [game, playerId, bet, win, multiplier, result, new Date().toISOString()]);
  
  res.json({ success: true });
});

// API: сохранить раунд джекпота
app.post('/api/save-jackpot', (req, res) => {
  const { roundId, winnerId, totalPot, playersCount, bets } = req.body;
  
  db.run(`INSERT INTO jackpot_rounds (round_id, winner_id, total_pot, players_count, round_time)
    VALUES (?, ?, ?, ?, ?)`,
    [roundId, winnerId, totalPot, playersCount, new Date().toISOString()]);
  
  const stmt = db.prepare('INSERT INTO jackpot_bets (round_id, player_id, bet, win) VALUES (?, ?, ?, ?)');
  bets.forEach(b => {
    stmt.run([roundId, b.playerId, b.bet, b.win ? 1 : 0]);
  });
  stmt.finalize();
  
  res.json({ success: true });
});

// API: получить историю игрока
app.get('/api/history/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all('SELECT * FROM game_history WHERE player_id = ? ORDER BY time DESC LIMIT 20',
    [userId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json(rows);
      }
    });
});

// API: получить топ игроков
app.get('/api/top', (req, res) => {
  db.all('SELECT first_name, balance, level FROM players ORDER BY balance DESC LIMIT 50', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows);
    }
  });
});

// ========== ЗАПУСК ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Бот работает`);
  console.log(`✅ База данных подключена`);
});
