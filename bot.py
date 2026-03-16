#!/usr/bin/env python
# bot.py - Telegram бот с Web App кнопкой

import logging
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(format='%(asime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)


BOT_TOKEN = "8259804573:AAGGkoqbU9iyyp5o5vkgFX7mdx44i5LfwaQ"  # 👈 ВСТАВЬ СВОЙ ТОКЕН

SITE_URL = "https://enchanting-biscuit-dcbc37.netlify.app"  # 👈 ВСТАВЬ СВОЮ ССЫЛКУ

# ======================================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    
    webapp_button = KeyboardButton(
        text="🛍️ ОТКРЫТЬ МАГАЗИН",
        web_app=WebAppInfo(url=SITE_URL)
    )
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[webapp_button]],
        resize_keyboard=True,      # Красивая кнопка
        one_time_keyboard=False    # Кнопка остаётся всегда
    )
    
    await update.message.reply_text(
        f"👋 Привет, {user.first_name}!\n\n"
        f"👇 Нажми на кнопку снизу, чтобы артём помог сделать магазин:",
        reply_markup=keyboard
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 Как пользоваться:\n"
        "1. Нажми кнопку '🛍️ ОТКРЫТЬ МАГАЗИН'\n"
        "2. Откроется Web App с магазином\n"
        "3. Покупай и выигрывай!"
    )

def main():
    # Проверяем, вставил ли пользователь токен
    if BOT_TOKEN == "7282716016:AAHwoFnpJXXXXXXXXXXXXXX" or "YOUR" in BOT_TOKEN:
        print("❌ ОШИБКА: Ты не вставил токен бота!")
        print("📝 Получи токен у @BotFather и вставь его в BOT_TOKEN")
        return
    
    if SITE_URL == "https://твой-сайт.ru/index.html":
        print("❌ ОШИБКА: Ты не вставил ссылку на сайт!")
        print("📝 Вставь свою ссылку в SITE_URL")
        return
    
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    
    print("✅ Бот запущен! Напиши ему /start в Telegram")
    app.run_polling()

if __name__ == "__main__":
    main()
