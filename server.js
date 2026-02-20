const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Токен бота
const BOT_TOKEN = process.env.BOT_TOKEN || '8259804573:AAGGkoqbU9iyyp5o5vkgFX7mdx44i5LfwaQ';

// ========== БОТ ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'игрок';
  
  bot.sendMessage(chatId, 
    `🎮 Добро пожаловать в YETER GAMES, ${firstName}!\n\n` +
    `💰 Твой баланс: 10000 🧩\n` +
    `👇 Нажми кнопку, чтобы начать игру:`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎰 Джекпот', web_app: { url: `https://yeter-game.onrender.com/jackpot.html?user=${msg.from.id}` } }
      ]]
    }
  });
});

// Команда /balance
bot.onText(/\/balance/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `💰 Твой баланс: 10000 🧩`);
});

// ========== САЙТ ==========
// Раздаем статические файлы из КОРНЕВОЙ папки
app.use(express.static(__dirname));

// Для всех остальных запросов отдаем index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== ЗАПУСК ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Сайт доступен: https://yeter-game.onrender.com`);
  console.log(`✅ Бот работает с токеном: ${BOT_TOKEN.substring(0, 10)}...`);
});
