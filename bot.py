#!/usr/bin/env python
# bot.py

import logging
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = "8768464184:AAE32xJKSIhTM-USAbWAnlnr3eP9AIq_Vb0"
SITE_URL = "https://yeter-game.onrender.com"  # 👈 замени на свою ссылку, если другая
WELCOME_PHOTO = "https://i.yapx.ru/dXczP.jpg"
COMMUNITY_URL = "https://t.me/tyron_community"

# ======================================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    first_name = user.first_name or "игрок"
    
    caption = (
        f"Welcome to Tyron Market, {first_name}!\n\n"
        f"Buy and sell NFT gifts\n"
        f"Great deals!"
    )
    
    # Инлайн-кнопки под фото
    inline_keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(" Open Tyron Market", web_app=WebAppInfo(url=SITE_URL))],
        [InlineKeyboardButton(" Come to our community", url=COMMUNITY_URL)]
    ])
    
    # Клавиатура с кнопкой Mini App (слева от поля ввода)
    mini_app_keyboard = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(" Tyron Market", web_app=WebAppInfo(url=SITE_URL))]],
        resize_keyboard=True,
        is_persistent=True
    )
    
    # Отправляем фото с инлайн-кнопками
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
    
    # Устанавливаем клавиатуру с кнопкой Mini App (без лишнего текста)
    await update.message.reply_text(
        text="​",  # невидимый символ
        reply_markup=mini_app_keyboard
    )

# ======================================================

def main():
    if BOT_TOKEN == "8768464184:AAE32xJKSIhTM-USAbWAnlnr3eP9AIq_Vb0":
        print("✅ Токен загружен")
    
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    
    print("✅ Бот запущен! Напиши ему /start в Telegram")
    app.run_polling()

if __name__ == "__main__":
    main()
