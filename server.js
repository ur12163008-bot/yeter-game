const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы из КОРНЕВОЙ папки (где лежат все HTML)
app.use(express.static(__dirname));

// Для всех остальных запросов отдаем index.html из корня
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Сайт доступен по адресу: https://yeter-game.onrender.com`);
});
