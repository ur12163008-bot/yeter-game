#!/usr/bin/env python
# bot.py - Tyron Market Bot

import logging
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# ========== НАСТРОЙКИ ==========
BOT_TOKEN = "8768464184:AAE32xJKSIhTM-USAbWAnlnr3eP9AIq_Vb0"
SITE_URL = "https://yeter-game.vercel.app"
WELCOME_PHOTO = "https://i.yapx.ru/dXczP.jpg"
COMMUNITY_URL = "https://t.me/tyron_community"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== КОМАНДА /start ==========
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    first_name = user.first_name or "игрок"
    
    caption = (
        f"🎮 Welcome to Tyron Market, {first_name}!\n\n"
        f"Buy and sell NFT gifts\n"
        f"Great deals!"
    )
    
    inline_keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🚀 Open Tyron Market", web_app=WebAppInfo(url=SITE_URL))],
        [InlineKeyboardButton("💬 Come to our community", url=COMMUNITY_URL)]
    ])
    
    mini_app_keyboard = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton("🎮 Tyron Market", web_app=WebAppInfo(url=SITE_URL))]],
        resize_keyboard=True,
        is_persistent=True
    )
    
    try:
        await update.message.reply_photo(
            photo=WELCOME_PHOTO,
            caption=caption,
            reply_markup=inline_keyboard
        )
    except Exception as e:
        logger.error(f"Ошибка отправки фото: {e}")
        await update.message.reply_text(
            text=caption,
            reply_markup=inline_keyboard
        )
    
    await update.message.reply_text(
        text="​",
        reply_markup=mini_app_keyboard
    )

# ========== ЗАПУСК ==========
def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    
    print("✅ Бот запущен!")
    app.run_polling()

if __name__ == "__main__":
    main()
