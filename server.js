const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Для всех остальных запросов отдаем index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Сайт доступен по адресу: https://yeter-game.onrender.com`);
});
