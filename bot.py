#!/usr/bin/env python
# bot.py - Tyron Market Bot для Render (Webhook + Flask)

import logging
import os
from flask import Flask, request, Response
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

# ========== НАСТРОЙКИ ==========
BOT_TOKEN = "8768464184:AAE32xJKSIhTM-USAbWAnlnr3eP9AIq_Vb0"
SITE_URL = "https://yeter-game.vercel.app"
WELCOME_PHOTO = "https://i.yapx.ru/dXczP.jpg"
COMMUNITY_URL = "https://t.me/tyron_community"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== FLASK СЕРВЕР ==========
app_flask = Flask(__name__)

# ========== TELEGRAM БОТ ==========
application = Application.builder().token(BOT_TOKEN).build()

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

application.add_handler(CommandHandler("start", start))

# ========== WEBHOOK ENDPOINT ==========
@app_flask.route(f'/{BOT_TOKEN}', methods=['POST'])
async def webhook():
    if request.method == 'POST':
        update = Update.de_json(request.get_json(force=True), application.bot)
        await application.process_update(update)
    return Response('OK', status=200)

@app_flask.route('/')
def home():
    return Response('Tyron Market Bot is running', mimetype='text/plain')

# ========== ЗАПУСК ==========
if __name__ == "__main__":
    import asyncio
    
    RENDER_URL = os.environ.get("RENDER_EXTERNAL_URL", "https://yeter-game-115o.onrender.com")
    
    async def set_webhook():
        webhook_url = f"{RENDER_URL}/{BOT_TOKEN}"
        await application.bot.set_webhook(url=webhook_url)
        print(f"✅ Webhook установлен: {webhook_url}")
    
    asyncio.run(set_webhook())
    
    port = int(os.environ.get("PORT", 10000))
    app_flask.run(host='0.0.0.0', port=port)
