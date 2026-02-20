const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '8259804573:AAGGkoqbU9iyyp5o5vkgFX7mdx44i5LfwaQ';

// ========== БОТ ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'игрок';
  
  bot.sendMessage(chatId, 
    `🎮 Добро пожаловать в YETER GAMES, ${firstName}!\n\n` +
    `👇 Нажми кнопку, чтобы открыть игры:`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 ИГРЫ', web_app: { url: `https://yeter-game.onrender.com/index.html` } }
      ]]
    }
  });
});

// ========== САЙТ ==========
// Раздаем статические файлы из корня
app.use(express.static(__dirname));

// ВСЕ запросы, которые не нашли файл, отправляем на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Сайт доступен: https://yeter-game.onrender.com`);
});
