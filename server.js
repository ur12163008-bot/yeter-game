const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '8768464184:AAE32xJKSIhTM-USAbWAnlnr3eP9AIq_Vb0';

// ========== БОТ ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Фото для /start
const WELCOME_PHOTO = 'https://i.yapx.ru/dXczP.jpg';

// Клавиатура с кнопкой Mini App (слева от поля ввода)
const miniAppKeyboard = {
  keyboard: [
    [{ text: ' Tyron Market', web_app: { url: 'https://yeter-game.onrender.com/index.html' } }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'игрок';
  
  const caption = 
    `Welcome to Tyron Market, ${firstName}!\n\n` +
    `Buy and sell NFT gifts\n` +
    `Great deals!`;

  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: ' Open Tyron Market', web_app: { url: 'https://yeter-game.onrender.com/index.html' } }],
      [{ text: ' Come to our community', url: 'https://t.me/tyron_community' }]
    ]
  };

  // Отправляем фото с инлайн-кнопками
  bot.sendPhoto(chatId, WELCOME_PHOTO, {
    caption: caption,
    reply_markup: inlineKeyboard
  }).catch(err => {
    console.error('Ошибка отправки фото:', err.message);
    bot.sendMessage(chatId, caption, { reply_markup: inlineKeyboard });
  });

  // Устанавливаем клавиатуру с кнопкой Mini App (без лишнего сообщения)
  bot.sendMessage(chatId, '​', { // невидимый символ, чтобы клавиатура появилась без текста
    reply_markup: miniAppKeyboard
  }).then(msg => bot.deleteMessage(chatId, msg.message_id)).catch(() => {});
});

// ========== САЙТ ==========
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Сайт доступен: https://yeter-game.onrender.com`);
});
