const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Хранилище ставок (все видят всё)
let currentRound = {
    players: [],
    totalPot: 0,
    roundActive: true,
    timerStarted: false,
    roundEndTime: null
};

// Раздаем статику
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket соединения
wss.on('connection', (ws) => {
    console.log('Новый клиент подключился');
    
    // Отправляем текущее состояние новому клиенту
    ws.send(JSON.stringify({
        type: 'init',
        data: currentRound
    }));

    // Получаем сообщения от клиента
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'newBet') {
                // Добавляем ставку
                const existingIndex = currentRound.players.findIndex(p => p.id === data.player.id);
                if (existingIndex !== -1) {
                    currentRound.players[existingIndex] = data.player;
                } else {
                    currentRound.players.push(data.player);
                }
                
                // Пересчитываем общий банк
                currentRound.totalPot = currentRound.players.reduce((sum, p) => sum + p.bet, 0);
                
                // Запускаем таймер если есть 2+ игрока
                if (currentRound.players.length >= 2 && !currentRound.timerStarted) {
                    currentRound.timerStarted = true;
                    currentRound.roundEndTime = Date.now() + 15000; // 15 секунд
                }
                
                // Рассылаем ВСЕМ клиентам обновление
                broadcast({
                    type: 'update',
                    data: currentRound
                });
            }
            
            if (data.type === 'roundEnd') {
                // Выбираем победителя
                const winner = pickWinner(currentRound.players);
                
                broadcast({
                    type: 'winner',
                    winner: winner,
                    totalPot: currentRound.totalPot
                });
                
                // Новый раунд через 5 секунд
                setTimeout(() => {
                    currentRound = {
                        players: [],
                        totalPot: 0,
                        roundActive: true,
                        timerStarted: false,
                        roundEndTime: null
                    };
                    
                    broadcast({
                        type: 'newRound',
                        data: currentRound
                    });
                }, 5000);
            }
            
        } catch (e) {
            console.error('Ошибка:', e);
        }
    });
});

// Функция рассылки всем
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Выбор победителя (чем больше ставка, тем выше шанс)
function pickWinner(players) {
    let pool = [];
    players.forEach(p => {
        for (let i = 0; i < p.bet; i++) {
            pool.push(p);
        }
    });
    return pool[Math.floor(Math.random() * pool.length)];
}

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
});
