const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '8768464184:AAE32xJKSIhTM-USAbWAnlnr3eP9AIq_Vb0';

// ========== НАСТРОЙКИ ==========
const WELCOME_PHOTO = 'https://i.yapx.ru/dXczP.jpg';
const COMMUNITY_URL = 'https://t.me/tyron_community';
const SITE_URL = 'https://yeter-game.onrender.com/index.html';

// ========== БОТ ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'игрок';
  
  const caption = 
    `Welcome to Tyron Market, ${firstName}!\n\n` +
    `Buy and sell NFT gifts\n` +
    `Great deals!`;
  
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

// ========== САЙТ ==========
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
