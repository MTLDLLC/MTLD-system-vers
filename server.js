const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// Database connection
const db = new sqlite3.Database('./matilda.db');

// Creating tables
db.serialize(() => {
    // Таблица пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT,
            description TEXT,
            online INTEGER DEFAULT 0,
            profileBackground TEXT,
            avatarBorder TEXT
        )
    `);

    // Таблица Premium пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS premium_users (
            username TEXT PRIMARY KEY,
            activatedAt INTEGER NOT NULL,
            expiresAt INTEGER NOT NULL,
            grantedByAdmin INTEGER DEFAULT 0
        )
    `);

    // Таблица блокировок
    db.run(`
        CREATE TABLE IF NOT EXISTS blocked_users (
            blocker TEXT NOT NULL,
            blocked TEXT NOT NULL,
            PRIMARY KEY (blocker, blocked)
        )
    `);

    // Вставка начальных данных, если таблицы пусты
    db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
        if (err) {
            console.error("Database error during initial user check:", err.message);
            return;
        }
        if (row.count === 0) {
            const initialUser = {
                username: 'admin',
                name: 'Администратор',
                password: 'admin2024', // В реальном приложении используйте хеширование паролей!
                avatar: '',
                description: 'Главный администратор мессенджера Матильда',
                profileBackground: '',
                avatarBorder: ''
            };
            const stmt = db.prepare("INSERT INTO users (username, name, password, avatar, description, profileBackground, avatarBorder) VALUES (?, ?, ?, ?, ?, ?, ?)");
            stmt.run(initialUser.username, initialUser.name, initialUser.password, initialUser.avatar, initialUser.description, initialUser.profileBackground, initialUser.avatarBorder);
            stmt.finalize();
            console.log("Initial admin user created.");
        }
        
        // Создаем ботов
        const bots = [
            { username: 'support_bot', name: 'Support', description: 'Бот поддержки Матильды', miniAppUrl: '', avatar: 'assets/support_bot.png' },
            { username: 'matilda_bot', name: 'Matilda', description: 'Официальный бот Матильды', miniAppUrl: '', avatar: 'assets/matilda_bot.png' },
            { username: 'sosocasino_bot', name: 'SosoCasino', description: 'Created by Soso Communications', miniAppUrl: 'https://s3.eponesh.com/games/22804/v9/', avatar: 'assets/sosocasino_bot.png' },
            { username: 'sosocoin_bot', name: 'SosoCoin', description: 'Бот криптовалюты SosoCoin', miniAppUrl: '', avatar: 'assets/sosocoin_bot.png' }
        ];
        
        bots.forEach(bot => {
            db.get("SELECT * FROM users WHERE username = ?", [bot.username], (err, row) => {
                if (err) {
                    console.error("Database error checking bot:", err.message);
                    return;
                }
                if (!row) {
                    const stmt = db.prepare("INSERT INTO users (username, name, password, avatar, description, profileBackground, avatarBorder) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    stmt.run(bot.username, bot.name, 'bot_password', bot.avatar, bot.description, '', '');
                    stmt.finalize();
                    console.log(`Bot ${bot.username} created.`);
                } else if (row.avatar !== bot.avatar) {
                    // Обновляем аватар если он изменился
                    const stmt = db.prepare("UPDATE users SET avatar = ? WHERE username = ?");
                    stmt.run(bot.avatar, bot.username);
                    stmt.finalize();
                    console.log(`Bot ${bot.username} avatar updated.`);
                }
            });
        });
    });

    db.get("SELECT COUNT(*) AS count FROM premium_users", (err, row) => {
        if (err) {
            console.error("Database error during initial premium user check:", err.message);
            return;
        }
        if (row.count === 0) {
            console.log("No initial premium users found.");
        }
    });
});


// In-memory storage (в реальном приложении используйте базу данных)
let users = {
    'admin': {
        password: 'admin2024',
        name: 'Администратор',
        avatar: '',
        description: 'Главный администратор мессенджера Матильда',
        createdAt: Date.now() - 86400000
    },
    'idinahui': {
        password: 'idinahui2024',
        name: 'Идинахуй',
        avatar: '',
        description: 'Просто иди нахуй',
        createdAt: Date.now() - 21600000
    }
};

// Список заблокированных юзернеймов для регистрации
const blockedUsernames = ['matilda'];

let chats = {};
let channels = {
    'matilda_official': {
        name: 'Matilda',
        username: 'matildanews',
        description: 'Официальный канал Матильды',
        isPublic: true,
        creator: null, // Нет администратора
        members: [], // Будет заполнено всеми пользователями автоматически
        createdAt: Date.now() - 86400000,
        lastMessage: 'Добро пожаловать в официальный канал Матильда!',
        lastMessageTime: Date.now() - 86400000,
        isDefault: true // Специальный флаг для дефолтного канала
    }
};

// Добавляем всех пользователей в официальный канал, кроме matilda
Object.keys(users).forEach(username => {
    if (username !== 'matilda' && channels['matilda_official'] && !channels['matilda_official'].members.includes(username)) {
        channels['matilda_official'].members.push(username);
    }
});
let messages = {
    'matilda_official': [{
        id: Date.now() - 86400000,
        sender: 'admin',
        text: 'ПРИВЕТСТВУЕМ ВСЕХ В ОФИЦИАЛЬНОМ КАНАЛЕ НАЦИАНАЛЬНОГО МЕССЕНДЖЕРА - МАТИЛЬДА',
        timestamp: Date.now() - 86400000
    }]
};
let blockedUsers = {};
let onlineUsers = new Set();

// Маршруты API

// API для получения всех пользователей
app.get('/api/users', (req, res) => {
    db.all('SELECT username, name, avatar, description, online, profileBackground, avatarBorder FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API для получения Premium пользователей
app.get('/api/premium-users', (req, res) => {
    db.all('SELECT * FROM premium_users WHERE expiresAt > ?', [Date.now()], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const premiumData = {};
        rows.forEach(row => {
            premiumData[row.username] = {
                activatedAt: row.activatedAt,
                expiresAt: row.expiresAt,
                grantedByAdmin: row.grantedByAdmin === 1
            };
        });
        res.json(premiumData);
    });
});

// API для выдачи Premium
app.post('/api/premium-users', (req, res) => {
    const { username, expiresAt, grantedByAdmin } = req.body;

    db.run(
        'INSERT OR REPLACE INTO premium_users (username, activatedAt, expiresAt, grantedByAdmin) VALUES (?, ?, ?, ?)',
        [username, Date.now(), expiresAt, grantedByAdmin ? 1 : 0],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            // Уведомляем Socket.IO об обновлении Premium статуса
            io.emit('premium_updated', { username, activatedAt: Date.now(), expiresAt, grantedByAdmin: grantedByAdmin === true });
            res.json({ success: true });
        }
    );
});

// API для отзыва Premium
app.delete('/api/premium-users/:username', (req, res) => {
    const { username } = req.params;

    db.run('DELETE FROM premium_users WHERE username = ?', [username], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Уведомляем Socket.IO об отзыве Premium
        io.emit('premium_revoked', { username });
        res.json({ success: true });
    });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Аутентификация
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        if (row && row.password === password) { // В реальном приложении сравнивайте хеши паролей
            res.json({
                success: true,
                user: {
                    username,
                    name: row.name,
                    avatar: row.avatar,
                    description: row.description,
                    profileBackground: row.profileBackground,
                    avatarBorder: row.avatarBorder
                }
            });
        } else {
            res.json({ success: false, message: 'Неверный логин или пароль' });
        }
    });
});

app.post('/api/register', (req, res) => {
    const { username, name, password } = req.body;

    if (username.includes(' ')) {
        res.json({ success: false, message: 'В юзернейме нельзя использовать пробелы' });
        return;
    }

    if (username.length < 5) {
        res.json({ success: false, message: 'Никнейм должен содержать минимум 5 символов' });
        return;
    }

    // Проверяем заблокированные юзернеймы
    if (blockedUsernames.includes(username)) {
        res.json({ success: false, message: 'Пользователь с таким именем уже существует' });
        return;
    }

    // Проверяем существование пользователя или канала с таким юзернеймом
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, userRow) => {
        if (err) {
            console.error("Database error during registration check:", err.message);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        const channelExists = Object.values(channels).some(channel => channel.username === username);

        if (userRow || channelExists) {
            res.json({ success: false, message: 'Пользователь с таким именем уже существует' });
            return;
        }

        const stmt = db.prepare("INSERT INTO users (username, name, password, avatar, description, profileBackground, avatarBorder) VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt.run(username, name, password, '', '', '', ''); // В реальном приложении хешируйте пароли
        stmt.finalize((err) => {
            if (err) {
                console.error("Database error during user insertion:", err.message);
                return res.status(500).json({ success: false, message: 'Ошибка при регистрации' });
            }

            // Автоматически добавляем пользователя в официальный канал Matilda (кроме самого аккаунта matilda)
            if (username !== 'matilda' && channels['matilda_official'] && !channels['matilda_official'].members.includes(username)) {
                channels['matilda_official'].members.push(username);
            }

            res.json({
                success: true,
                user: {
                    username,
                    name,
                    avatar: '',
                    description: '',
                    profileBackground: '',
                    avatarBorder: ''
                }
            });
        });
    });
});

// Поиск пользователей
app.get('/api/search/users/:query', (req, res) => {
    const query = req.params.query.toLowerCase();
    db.all('SELECT username, name, avatar, description, online, profileBackground, avatarBorder FROM users WHERE username != ?', ['matilda'], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const results = rows.filter(user =>
            user.username.toLowerCase().includes(query) ||
            user.name.toLowerCase().includes(query) ||
            (user.description && user.description.toLowerCase().includes(query))
        ).map(user => ({
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            description: user.description,
            online: user.online === 1,
            profileBackground: user.profileBackground,
            avatarBorder: user.avatarBorder
        }));
        res.json(results);
    });
});

// Получение данных пользователя
app.get('/api/user/:username', (req, res) => {
    const username = req.params.username;
    db.get('SELECT username, name, avatar, description, online, profileBackground, avatarBorder FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json({
                username,
                name: row.name,
                avatar: row.avatar,
                description: row.description,
                online: row.online === 1,
                profileBackground: row.profileBackground,
                avatarBorder: row.avatarBorder
            });
        } else {
            res.status(404).json({ message: 'Пользователь не найден' });
        }
    });
});

// Получение сообщений чата/канала
app.get('/api/messages/:chatId', (req, res) => {
    const chatId = req.params.chatId;
    const chatMessages = messages[chatId] || [];
    res.json(chatMessages);
});

// Получение чатов пользователя
app.get('/api/chats/:username', (req, res) => {
    const username = req.params.username;
    const userChats = Object.keys(chats)
        .filter(chatId => chats[chatId].participants && chats[chatId].participants.includes(username))
        .map(chatId => ({
            id: chatId,
            ...chats[chatId]
        }));

    const userChannels = Object.keys(channels)
        .filter(channelId => channels[channelId].members && channels[channelId].members.includes(username))
        .map(channelId => ({
            id: channelId,
            ...channels[channelId]
        }));

    res.json({ chats: userChats, channels: userChannels });
});

// API для блокировки пользователя
app.post('/api/block-user', (req, res) => {
    const { blockedBy, blockedUser } = req.body;
    
    db.run(
        'INSERT OR IGNORE INTO blocked_users (blocker, blocked) VALUES (?, ?)',
        [blockedBy, blockedUser],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Ошибка блокировки' });
            }
            res.json({ success: true });
        }
    );
});

// API для разблокировки пользователя
app.post('/api/unblock-user', (req, res) => {
    const { unblockedBy, unblockedUser } = req.body;
    
    db.run(
        'DELETE FROM blocked_users WHERE blocker = ? AND blocked = ?',
        [unblockedBy, unblockedUser],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Ошибка разблокировки' });
            }
            res.json({ success: true });
        }
    );
});

// API для проверки блокировки
app.get('/api/check-blocked/:sender/:receiver', (req, res) => {
    const { sender, receiver } = req.params;
    
    db.get(
        'SELECT * FROM blocked_users WHERE blocker = ? AND blocked = ?',
        [receiver, sender],
        (err, row) => {
            if (err) {
                return res.status(500).json({ blocked: false });
            }
            res.json({ blocked: !!row });
        }
    );
});

// Обновление профиля
app.put('/api/user/:username', (req, res) => {
    const username = req.params.username;
    const { name, description, avatar, profileBackground, avatarBorder } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const updatedName = name !== undefined ? name : row.name;
        const updatedDescription = description !== undefined ? description : row.description;
        const updatedAvatar = avatar !== undefined ? avatar : row.avatar;
        const updatedProfileBackground = profileBackground !== undefined ? profileBackground : row.profileBackground;
        const updatedAvatarBorder = avatarBorder !== undefined ? avatarBorder : row.avatarBorder;

        db.run(
            'UPDATE users SET name = ?, description = ?, avatar = ?, profileBackground = ?, avatarBorder = ? WHERE username = ?',
            [updatedName, updatedDescription, updatedAvatar, updatedProfileBackground, updatedAvatarBorder, username],
            function(err) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Ошибка при обновлении профиля' });
                }
                res.json({ success: true });

                // Уведомляем всех клиентов об обновлении профиля (кроме самого отправителя)
                io.emit('profile_updated', {
                    username,
                    name: updatedName,
                    description: updatedDescription,
                    avatar: updatedAvatar,
                    profileBackground: updatedProfileBackground,
                    avatarBorder: updatedAvatarBorder
                });
            }
        );
    });
});

// Каналы
app.get('/api/channels', (req, res) => {
    const channelList = Object.keys(channels).map(channelId => ({
        id: channelId,
        ...channels[channelId]
    }));
    res.json(channelList);
});

// Поиск каналов
app.get('/api/search/channels/:query', (req, res) => {
    const query = req.params.query.toLowerCase();
    const results = Object.keys(channels)
        .filter(channelId => {
            const channel = channels[channelId];
            return channel.isPublic && (
                (channel.name && channel.name.toLowerCase().includes(query)) ||
                (channel.username && channel.username.toLowerCase().includes(query)) ||
                (channel.description && channel.description.toLowerCase().includes(query))
            );
        })
        .map(channelId => ({
            id: channelId,
            ...channels[channelId]
        }));

    res.json(results);
});

// Проверка доступности юзернейма
app.get('/api/check-username/:username', (req, res) => {
    const username = req.params.username;
    const isBlocked = blockedUsernames.includes(username);
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, userRow) => {
        if (err) {
            console.error("Database error during username check:", err.message);
            return res.status(500).json({ taken: true, message: 'Ошибка сервера' });
        }
        const channelExists = Object.values(channels).some(channel => channel.username === username);

        res.json({ taken: isBlocked || userRow || channelExists });
    });
});

// Предложения юзернеймов
app.get('/api/suggest-usernames/:username', (req, res) => {
    const baseUsername = req.params.username;
    const suggestions = [];

    // Генерируем варианты
    for (let i = 1; i <= 5; i++) {
        const suggestion = `${baseUsername}${i}`;
        if (!blockedUsernames.includes(suggestion) && !users[suggestion] && !Object.values(channels).some(channel => channel.username === suggestion)) {
            suggestions.push(suggestion);
        }
    }

    const variations = [
        `${baseUsername}_user`,
        `${baseUsername}_2024`,
        `${baseUsername}_new`,
        `user_${baseUsername}`,
        `${baseUsername}_official`
    ].filter(name =>
        !blockedUsernames.includes(name) &&
        !users[name] &&
        !Object.values(channels).some(channel => channel.username === name) &&
        name.length >= 5
    );

    const allSuggestions = [...suggestions.slice(0, 3), ...variations.slice(0, 2)];
    res.json(allSuggestions);
});

app.post('/api/channels', (req, res) => {
    const { name, username, description, isPublic, creator } = req.body;

    // Валидация
    if (!name || name.trim().length === 0) {
        res.json({ success: false, message: 'Введите название канала' });
        return;
    }

    if (isPublic) {
        if (!username || username.trim().length === 0) {
            res.json({ success: false, message: 'Введите юзернейм канала' });
            return;
        }

        if (username.length < 5) {
            res.json({ success: false, message: 'Юзернейм канала должен содержать минимум 5 символов' });
            return;
        }

        if (username.includes(' ')) {
            res.json({ success: false, message: 'В юзернейме нельзя использовать пробелы' });
            return;
        }

        // Проверяем уникальность юзернейма
        const usernameExists = blockedUsernames.includes(username) || Object.values(channels).some(channel => channel.username === username) || users[username];
        if (usernameExists) {
            res.json({ success: false, message: 'Юзернейм уже занят' });
            return;
        }
    }

    const channelId = 'channel_' + Date.now().toString();
    const channelData = {
        name: name.trim(),
        username: isPublic ? username.trim() : '',
        description: description ? description.trim() : '',
        isPublic,
        creator,
        members: [creator],
        createdAt: Date.now(),
        lastMessage: 'Канал создан',
        lastMessageTime: Date.now()
    };

    if (!isPublic) {
        channelData.inviteLink = generatePrivateInviteLink();
    }

    channels[channelId] = channelData;
    messages[channelId] = [];

    res.json({ success: true, channelId, channel: channelData });
});

// Админская команда для отправки сообщений в канал Matildanews
function sendAdminMessage(text) {
    const channelId = 'matilda_official';
    const messageId = Date.now();
    const messageData = {
        id: messageId,
        sender: "Matilda NEWS", // Подпись отправителя
        text: text,
        timestamp: Date.now(),
        chatId: channelId,
        isServerMessage: true // Маркер что это серверное сообщение
    };

    if (!messages[channelId]) {
        messages[channelId] = [];
    }

    messages[channelId].push(messageData);

    if (channels[channelId]) {
        channels[channelId].lastMessage = text;
        channels[channelId].lastMessageTime = Date.now();

        // Отправляем всем участникам канала
        if (channels[channelId].members) {
            channels[channelId].members.forEach(username => {
                const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                if (userSocket) {
                    userSocket.emit('new_message', messageData);
                }
            });
        }
    }

    console.log(`Серверное сообщение отправлено в канал Matildanews: "${text}"`);
    console.log(`ID сообщения: ${messageId}`);
}

// Добавляем команды для админа
process.stdin.setEncoding('utf-8');
process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
        const command = chunk.trim();
        if (command.startsWith('/admin ')) {
            const message = command.substring(7);
            sendAdminMessage(message);
        } else if (command.startsWith('/delete ')) {
            const messageId = command.substring(8);
            deleteAdminMessage(messageId);
        } else if (command === '/help') {
            console.log('Доступные команды:');
            console.log('/admin <сообщение> - отправить сообщение в канал Matildanews');
            console.log('/delete <messageId> - удалить сообщение из канала Matildanews по ID');
            console.log('/help - показать эту справку');
        }
    }
});

// Функция для удаления сообщений из канала Matildanews
function deleteAdminMessage(messageId) {
    const channelId = 'matilda_official';

    // Очищаем ID от возможных лишних символов и текста
    const cleanId = messageId.replace(/[^0-9]/g, '');

    if (!messages[channelId]) {
        console.log('В канале Matildanews нет сообщений');
        return;
    }

    const messageIndex = messages[channelId].findIndex(m => m.id == cleanId);
    if (messageIndex === -1) {
        console.log(`Сообщение с ID ${cleanId} не найдено в канале Matildanews`);
        return;
    }

    // Удаляем сообщение
    messages[channelId].splice(messageIndex, 1);

    // Уведомляем всех участников канала об удалении
    if (channels[channelId] && channels[channelId].members) {
        channels[channelId].members.forEach(username => {
            const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
            if (userSocket) {
                userSocket.emit('message_deleted', { chatId: channelId, messageId: cleanId });
            }
        });
    }

    console.log(`Сообщение с ID ${cleanId} удалено из канала Matildanews`);
}

// Функция для очистки всех сообщений из канала Matildanews
function clearAllMessages() {
    const channelId = 'matilda_official';

    if (!messages[channelId] || messages[channelId].length === 0) {
        console.log('В канале Matildanews нет сообщений для удаления');
        return;
    }

    const messageCount = messages[channelId].length;
    messages[channelId] = []; // Очищаем все сообщения

    // Уведомляем всех участников канала об очистке
    if (channels[channelId] && channels[channelId].members) {
        channels[channelId].members.forEach(username => {
            const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
            if (userSocket) {
                userSocket.emit('channel_cleared', { chatId: channelId });
            }
        });
    }

    console.log(`Удалено ${messageCount} сообщений из канала Matildanews`);
}

console.log('Введите /help для списка админских команд');

// Socket.IO для реального времени
io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    socket.on('user_online', (username) => {
        onlineUsers.add(username);
        socket.username = username;
        db.run('UPDATE users SET online = 1 WHERE username = ?', [username], (err) => {
            if (err) console.error("DB error setting user online:", err.message);
        });
        socket.broadcast.emit('user_status_changed', { username, online: true });
    });

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
    });

    socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
    });

    socket.on('send_message', (data) => {
        const { chatId, message, sender, chatType, participants } = data;

        // Проверяем, не дублируется ли сообщение
        if (!messages[chatId]) {
            messages[chatId] = [];
        }

        const messageData = {
            id: Date.now() + Math.random(), // Добавляем случайность для уникальности
            sender,
            text: message.text,
            media: message.media,
            timestamp: Date.now(),
            chatId: chatId
        };

        messages[chatId].push(messageData);

        // Обновляем последнее сообщение
        const lastMessageText = message.text || (message.media ? `${message.media.type === 'image' ? 'Фото' : 'Видео'}` : '');

        if (chatType === 'channel' && channels[chatId]) {
            // Сообщение в канале - отправляем всем участникам канала кроме отправителя
            channels[chatId].lastMessage = lastMessageText;
            channels[chatId].lastMessageTime = Date.now();

            if (channels[chatId].members) {
                channels[chatId].members.forEach(username => {
                    if (username !== sender) { // Не отправляем обратно отправителю
                        const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                        if (userSocket) {
                            userSocket.emit('new_message', messageData);
                        }
                    }
                });
            }
        } else if (participants) {
            // Личное сообщение - создаем чат если не существует
            if (!chats[chatId]) {
                chats[chatId] = {
                    participants: participants,
                    createdAt: Date.now(),
                    lastMessage: lastMessageText,
                    lastMessageTime: Date.now()
                };
            } else {
                chats[chatId].lastMessage = lastMessageText;
                chats[chatId].lastMessageTime = Date.now();
            }

            // Отправляем всем участникам личного чата кроме отправителя
            participants.forEach(username => {
                if (username !== sender) { // Не отправляем обратно отправителю
                    const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                    if (userSocket) {
                        userSocket.emit('new_message', messageData);
                    }
                }
            });
            
            // Если это бот, отправляем автоответ
            const botUser = participants.find(p => p.endsWith('_bot'));
            if (botUser && botUser !== sender) {
                setTimeout(() => {
                    const botReply = {
                        id: Date.now() + Math.random(),
                        sender: botUser,
                        text: 'Этот бот тупой и не может отвечать на ваши сообщения',
                        timestamp: Date.now(),
                        chatId: chatId
                    };
                    
                    messages[chatId].push(botReply);
                    chats[chatId].lastMessage = botReply.text;
                    chats[chatId].lastMessageTime = Date.now();
                    
                    participants.forEach(username => {
                        if (username !== botUser) {
                            const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                            if (userSocket) {
                                userSocket.emit('new_message', botReply);
                            }
                        }
                    });
                }, 500);
            }
        }
    });

    socket.on('delete_chat_for_both', (data) => {
        const { chatId, participants, deletedBy } = data;

        // Удаляем чат из памяти сервера
        if (chats[chatId]) {
            delete chats[chatId];
        }
        if (messages[chatId]) {
            delete messages[chatId];
        }

        // Уведомляем всех участников чата об удалении
        participants.forEach(username => {
            if (username !== deletedBy) {
                const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                if (userSocket) {
                    userSocket.emit('chat_deleted_for_both', { chatId, deletedBy });
                }
            }
        });
    });

    socket.on('user_blocked', (data) => {
        const { blockedUser, blockedBy } = data;

        // Уведомляем заблокированного пользователя
        const blockedUserSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === blockedUser);
        if (blockedUserSocket) {
            blockedUserSocket.emit('user_blocked_you', { blockedBy });
        }
    });

    socket.on('user_unblocked', (data) => {
        const { unblockedUser, unblockedBy } = data;

        // Уведомляем разблокированного пользователя
        const unblockedUserSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === unblockedUser);
        if (unblockedUserSocket) {
            unblockedUserSocket.emit('user_unblocked_you', { unblockedBy });
        }
    });

    socket.on('delete_message', (data) => {
        const { chatId, messageId, sender } = data;

        if (messages[chatId]) {
            const messageIndex = messages[chatId].findIndex(m => m.id == messageId && m.sender === sender);
            if (messageIndex !== -1) {
                messages[chatId].splice(messageIndex, 1);

                // Уведомляем всех участников об удалении
                if (channels[chatId] && channels[chatId].members) {
                    channels[chatId].members.forEach(username => {
                        const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                        if (userSocket) {
                            userSocket.emit('message_deleted', { chatId, messageId });
                        }
                    });
                } else if (chats[chatId] && chats[chatId].participants) {
                    chats[chatId].participants.forEach(username => {
                        const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                        if (userSocket) {
                            userSocket.emit('message_deleted', { chatId, messageId });
                        }
                    });
                }
            }
        }
    });

    socket.on('edit_message', (data) => {
        const { chatId, messageId, sender, newText } = data;

        if (messages[chatId]) {
            const message = messages[chatId].find(m => m.id == messageId && m.sender === sender);
            if (message) {
                message.text = newText;
                message.edited = true;
                message.editedAt = Date.now();

                // Уведомляем всех участников об изменении
                if (channels[chatId] && channels[chatId].members) {
                    channels[chatId].members.forEach(username => {
                        const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                        if (userSocket) {
                            userSocket.emit('message_edited', { chatId, messageId, newText, editedAt: message.editedAt });
                        }
                    });
                } else if (chats[chatId] && chats[chatId].participants) {
                    chats[chatId].participants.forEach(username => {
                        const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === username);
                        if (userSocket) {
                            userSocket.emit('message_edited', { chatId, messageId, newText, editedAt: message.editedAt });
                        }
                    });
                }
            }
        }
    });

    socket.on('typing_start', (data) => {
        socket.to(data.chatId).emit('user_typing', { username: data.username, typing: true });
    });

    socket.on('typing_stop', (data) => {
        socket.to(data.chatId).emit('user_typing', {
            username: data.username,
            typing: false
        });
    });

    socket.on('premium_updated', (data) => {
        // Уведомляем всех пользователей об обновлении Premium
        io.emit('premium_updated', data);
    });

    socket.on('profile_updated', (userData) => {
        // Обновляем данные пользователя на сервере
        db.run(
            'UPDATE users SET name = ?, description = ?, avatar = ?, profileBackground = ?, avatarBorder = ? WHERE username = ?',
            [userData.name, userData.description, userData.avatar, userData.profileBackground, userData.avatarBorder, userData.username],
            function(err) {
                if (err) {
                    console.error("DB error updating profile:", err.message);
                    return;
                }
                // Уведомляем всех других пользователей об обновлении профиля
                socket.broadcast.emit('profile_updated', userData);
            }
        );
    });

    // Обработчики звонков
    socket.on('initiate_call', (data) => {
        const { chatId, caller, callee } = data;
        const calleeSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === callee);
        
        if (calleeSocket) {
            calleeSocket.emit('incoming_call', { chatId, caller });
        }
    });

    socket.on('accept_call', (data) => {
        const { chatId, caller, callee } = data;
        const callerSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === caller);
        
        if (callerSocket) {
            callerSocket.emit('call_accepted', { chatId, callee });
        }
    });

    socket.on('decline_call', (data) => {
        const { chatId, caller } = data;
        const callerSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === caller);
        
        if (callerSocket) {
            callerSocket.emit('call_declined', { chatId });
        }
    });

    socket.on('end_call', (data) => {
        const { chatId, duration, to } = data;
        const otherSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === to);
        
        if (otherSocket) {
            otherSocket.emit('call_ended', { chatId, duration });
        }
    });

    socket.on('offer', (data) => {
        const { chatId, offer, to } = data;
        const otherSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === to);
        
        if (otherSocket) {
            otherSocket.emit('offer', { chatId, offer });
        }
    });

    socket.on('answer', (data) => {
        const { chatId, answer, to } = data;
        const otherSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === to);
        
        if (otherSocket) {
            otherSocket.emit('answer', { chatId, answer });
        }
    });

    socket.on('ice_candidate', (data) => {
        const { chatId, candidate, to } = data;
        const otherSocket = Array.from(io.sockets.sockets.values()).find(s => s.username === to);
        
        if (otherSocket) {
            otherSocket.emit('ice_candidate', { chatId, candidate });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            onlineUsers.delete(socket.username);
            db.run('UPDATE users SET online = 0 WHERE username = ?', [socket.username], (err) => {
                if (err) console.error("DB error setting user offline:", err.message);
            });
            socket.broadcast.emit('user_status_changed', { username: socket.username, online: false });
        }
        console.log('Пользователь отключился:', socket.id);
    });
});

function generatePrivateInviteLink() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'matilda.';
    for (let i = 0; i < 11; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Preview доступен по адресу: http://0.0.0.0:${PORT}`);
});