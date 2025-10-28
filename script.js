class MatildaMessenger {
    constructor() {
        this.currentUser = null;
        this.users = {};
        this.chats = {};
        this.channels = {};
        this.messages = {};
        this.currentChatId = null;
        this.currentChatType = null; // 'chat' или 'channel'
        this.blockedUsers = JSON.parse(localStorage.getItem('matilda_blocked') || '{}');
        this.selectedMedia = null;
        this.socket = null;
        this.pinnedChats = JSON.parse(localStorage.getItem('matilda_pinned') || '[]');
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.playingAudios = new Map();
        this.premiumUsers = JSON.parse(localStorage.getItem('matilda_premium_users') || '{}');
        this.adminLevel = null;
        this.userPezdy = JSON.parse(localStorage.getItem('matilda_user_pezdy') || '{}');
        this.messageDonations = JSON.parse(localStorage.getItem('matilda_message_donations') || '{}');
        this.channelDonations = JSON.parse(localStorage.getItem('matilda_channel_donations') || '{}');

        // Избранное
        this.favoritesMessages = JSON.parse(localStorage.getItem('matilda_favorites') || '[]');
        this.currentFavoritesSection = 'media';

        // Папки
        this.folders = JSON.parse(localStorage.getItem('matilda_folders') || '{"all": {"name": "Все", "chats": []}}');
        this.currentFolder = 'all';
        this.chatFolders = JSON.parse(localStorage.getItem('matilda_chat_folders') || '{}');

        // Переменные для звонков
        this.currentCall = null;
        this.localStream = null;
        this.remoteStream = null;
        this.remoteAudioElement = null; // Для отдельного аудио элемента собеседника
        this.peerConnection = null;
        this.callStartTime = null;
        this.callDurationInterval = null;
        this.isMuted = false;
        this.isVideoEnabled = false;
        this.isSpeakerEnabled = false;
        this.currentCamera = 'user'; // 'user' или 'environment'
        
        // Данные mini-app для ботов
        this.botMiniApps = {
            'support_bot': '',
            'matilda_bot': 'https://s3.eponesh.com/games/24821/v2/',
            'sosocasino_bot': 'https://s3.eponesh.com/games/22804/v9/',
            'sosocoin_bot': 'https://s3.eponesh.com/games/17884/v12/'
        };
        this.currentBotChat = null;

        this.initializeElements();
        this.startLoadingAnimation();
        this.bindEvents();
        this.connectToServer();
    }

    initializeElements() {
        // Экраны
        this.loadingScreen = document.getElementById('loading-screen');
        this.authScreen = document.getElementById('auth-screen');
        this.messengerScreen = document.getElementById('messenger-screen');
        this.chatScreen = document.getElementById('chat-screen');
        this.settingsScreen = document.getElementById('settings-screen');

        // Формы авторизации
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');

        // Кнопки и поля авторизации
        this.loginBtn = document.getElementById('login-btn');
        this.registerBtn = document.getElementById('register-btn');
        this.showRegisterBtn = document.getElementById('show-register');
        this.showLoginBtn = document.getElementById('show-login');

        // Элементы профиля
        this.profileAvatar = document.getElementById('profile-avatar');
        this.profileName = document.getElementById('profile-name');
        this.profileUsername = document.getElementById('profile-username');

        // Основной интерфейс
        this.sidebar = document.getElementById('sidebar');
        this.chatsList = document.getElementById('chats-list');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.newChatModal = document.getElementById('new-chat-modal');
        this.chatSearch = document.getElementById('chat-search');

        // Чат
        this.backToChatsBtm = document.getElementById('back-to-chats');
        this.chatTitle = document.getElementById('chat-title');
        this.chatStatus = document.getElementById('chat-status');
        this.chatAvatarSmall = document.getElementById('chat-avatar-small');
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.voiceBtn = document.getElementById('voice-btn');

        // Настройки
        this.backToMessengerBtn = document.getElementById('back-to-messenger');
        this.settingsAvatar = document.getElementById('settings-avatar');
        this.settingsName = document.getElementById('settings-name');
        this.settingsUsername = document.getElementById('settings-username');
        this.logoutBtn = document.getElementById('logout-btn');

        // Модальное окно
        this.createChatBtn = document.getElementById('create-chat-btn');
        this.cancelChatBtn = document.getElementById('cancel-chat-btn');
        this.newChatUsernameInput = document.getElementById('new-chat-username');
        this.userSearchResults = document.getElementById('user-search-results');
        this.usernameSuggestions = document.getElementById('username-suggestions');

        // Уведомления
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notification-text');
        this.notificationClose = document.getElementById('notification-close');

        // Premium
        this.premiumScreen = document.getElementById('premium-screen');
        this.activatePremiumBtn = document.getElementById('activate-premium-btn');
        this.premiumStatusContainer = document.getElementById('premium-status-container');

        // Admin
        this.adminScreen = document.getElementById('admin-screen');
        this.adminUserList = document.getElementById('admin-user-list');
        this.adminTitle = document.getElementById('admin-title');

        // Pezdy
        this.pezdyScreen = document.getElementById('pezdy-screen');
        this.userPezdyBalance = document.getElementById('user-pezdy-balance');

        // Folders
        this.foldersScreen = document.getElementById('folders-screen');
        this.foldersList = document.getElementById('folders-list');
        this.createFolderModal = document.getElementById('create-folder-modal');
        this.selectFolderModal = document.getElementById('select-folder-modal');

        // Звонки
        this.callBtn = document.getElementById('call-btn');
        this.incomingCallScreen = document.getElementById('incoming-call-screen');
        this.acceptCallBtn = document.getElementById('accept-call-btn');
        this.declineCallBtn = document.getElementById('decline-call-btn');
        this.callScreen = document.getElementById('call-screen');
        this.endCallBtn = document.getElementById('end-call-btn');
        this.muteBtn = document.getElementById('mute-btn');
        this.videoBtn = document.getElementById('video-btn');
        this.speakerBtn = document.getElementById('speaker-btn');
        this.localVideo = document.getElementById('local-video');
        this.remoteVideo = document.getElementById('remote-video');
        this.callUserName = document.getElementById('call-user-name');
        this.callDuration = document.getElementById('call-duration');
        this.cameraSelectModal = document.getElementById('camera-select-modal');
        
        // Боты
        this.botStartPanel = document.getElementById('bot-start-panel');
        this.botStartBtn = document.getElementById('bot-start-btn');
        this.miniAppBtn = document.getElementById('mini-app-btn');
        this.miniAppModal = document.getElementById('mini-app-modal');
        this.closeMiniAppBtn = document.getElementById('close-mini-app');
    }

    connectToServer() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Подключен к серверу');
            if (this.currentUser) {
                this.socket.emit('user_online', this.currentUser);
            }
        });

        this.socket.on('new_message', (message) => {
            // Обрабатываем все сообщения включая свои (для синхронизации)

            // Если чата не существует, создаем его
            if (!this.chats[message.chatId]) {
                this.chats[message.chatId] = {
                    participants: [this.currentUser, message.sender],
                    createdAt: Date.now(),
                    lastMessage: message.text || 'Медиа',
                    lastMessageTime: message.timestamp
                };

                if (!this.messages[message.chatId]) {
                    this.messages[message.chatId] = [];
                }

                localStorage.setItem('matilda_chats', JSON.stringify(this.chats));
                localStorage.setItem('matilda_messages', JSON.stringify(this.messages));

                // Обновляем список чатов если мы не в текущем чате
                if (!this.currentChatId) {
                    this.loadChats();
                }
            }

            // Сохраняем сообщение
            if (!this.messages[message.chatId]) {
                this.messages[message.chatId] = [];
            }

            // Проверяем, не дублируется ли сообщение
            const existingMessage = this.messages[message.chatId].find(m => 
                m.id === message.id
            );

            if (!existingMessage) {
                this.messages[message.chatId].push(message);
                localStorage.setItem('matilda_messages', JSON.stringify(this.messages));

                // Обновляем последнее сообщение в чате/канале
                if (this.chats[message.chatId]) {
                    this.chats[message.chatId].lastMessage = message.text || 'Медиа';
                    this.chats[message.chatId].lastMessageTime = message.timestamp;
                    localStorage.setItem('matilda_chats', JSON.stringify(this.chats));
                } else if (this.channels[message.chatId]) {
                    this.channels[message.chatId].lastMessage = message.text || 'Медиа';
                    this.channels[message.chatId].lastMessageTime = message.timestamp;
                    localStorage.setItem('matilda_channels', JSON.stringify(this.channels));
                }

                // Отображаем сообщение только если это НЕ наше сообщение или мы не в этом чате
                if (this.currentChatId && message.chatId === this.currentChatId && message.sender !== this.currentUser) {
                    this.displayMessage(message);
                    this.scrollToBottom();
                } else if (!this.currentChatId || message.chatId !== this.currentChatId) {
                    // Обновляем список чатов чтобы показать новое сообщение
                    this.loadChats();
                }
            }
        });

        this.socket.on('user_status_changed', (data) => {
            // Обновляем статус пользователя в интерфейсе
            this.updateUserStatus(data.username, data.online);
        });

        this.socket.on('profile_updated', (userData) => {
            // Обновляем данные пользователя
            this.users[userData.username] = userData;
            if (userData.username === this.currentUser) {
                this.updateProfileInfo();
            }
            this.loadChats();
        });

        this.socket.on('chat_deleted_for_both', (data) => {
            const { chatId, deletedBy } = data;
            if (this.chats[chatId] && deletedBy !== this.currentUser) {
                delete this.chats[chatId];
                delete this.messages[chatId];
                localStorage.setItem('matilda_chats', JSON.stringify(this.chats));
                localStorage.setItem('matilda_messages', JSON.stringify(this.messages));

                if (this.currentChatId === chatId) {
                    this.backToChats();
                } else {
                    this.loadChats();
                }

                this.showNotification(`Чат был удален пользователем ${deletedBy}`);
            }
        });

        this.socket.on('user_blocked_you', (data) => {
            const { blockedBy } = data;
            // Обновляем интерфейс если мы находимся в чате с пользователем который нас заблокировал
            if (this.currentChatType === 'chat' && this.currentChatId) {
                const chat = this.chats[this.currentChatId];
                if (chat && chat.participants.includes(blockedBy)) {
                    // Скрываем панель ввода и показываем подложку блокировки
                    document.querySelector('.input-panel').style.display = 'none';
                    this.createBlockedFooter();
                }
            }
            this.loadChats();
        });

        this.socket.on('user_unblocked_you', (data) => {
            const { unblockedBy } = data;
            // Обновляем интерфейс если мы находимся в чате с пользователем который нас разблокировал
            if (this.currentChatType === 'chat' && this.currentChatId) {
                const chat = this.chats[this.currentChatId];
                if (chat && chat.participants.includes(unblockedBy)) {
                    // Показываем панель ввода и убираем подложку блокировки
                    document.querySelector('.input-panel').style.display = 'flex';
                    this.removeBlockedFooter();
                    this.messageInput.focus();
                }
            }
            this.loadChats();
        });

        this.socket.on('message_deleted', (data) => {
            const { chatId, messageId } = data;
            if (this.messages[chatId]) {
                this.messages[chatId] = this.messages[chatId].filter(m => m.id != messageId);
                localStorage.setItem('matilda_messages', JSON.stringify(this.messages));

                if (this.currentChatId === chatId) {
                    this.loadMessages();
                }
            }
        });

        this.socket.on('message_edited', (data) => {
            const { chatId, messageId, newText, editedAt } = data;
            if (this.messages[chatId]) {
                const message = this.messages[chatId].find(m => m.id == messageId);
                if (message) {
                    message.text = newText;
                    message.edited = true;
                    message.editedAt = editedAt;
                    localStorage.setItem('matilda_messages', JSON.stringify(this.messages));

                    if (this.currentChatId === chatId) {
                        this.loadMessages();
                    }
                }
            }
        });

        this.socket.on('user_typing', (data) => {
            this.showTypingIndicator(data.username, data.typing);
        });

        // Обработчики звонков
        this.socket.on('incoming_call', (data) => {
            this.handleIncomingCall(data);
        });

        this.socket.on('call_accepted', (data) => {
            this.handleCallAccepted(data);
        });

        this.socket.on('call_declined', () => {
            this.handleCallDeclined();
        });

        this.socket.on('call_ended', (data) => {
            this.handleCallEnded(data);
        });

        this.socket.on('ice_candidate', (data) => {
            this.handleIceCandidate(data);
        });

        this.socket.on('offer', (data) => {
            this.handleOffer(data);
        });

        this.socket.on('answer', (data) => {
            this.handleAnswer(data);
        });
    }

    updateUserStatus(username, online) {
        if (this.users[username]) {
            this.users[username].online = online;
        }

        // Обновляем UI если это текущий чат
        if (this.currentChatType === 'chat' && this.currentChatId) {
            const chat = this.chats[this.currentChatId];
            if (chat && chat.participants.includes(username)) {
                this.chatStatus.textContent = online ? 'в сети' : 'был(а) недавно';
                this.chatStatus.style.color = online ? '#00aa00' : '#666666';
            }
        }

        // Обновляем в списке чатов
        this.loadChats();
    }

    startLoadingAnimation() {
        const loadingContainer = document.querySelector('.loading-container');
        const video = document.createElement('video');
        video.src = 'assets/loading.mp4';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.style.cssText = 'width: 300px; height: 300px; object-fit: contain; display: block;';
        
        // Принудительно запускаем видео
        video.addEventListener('loadeddata', () => {
            video.play().catch(err => console.log('Видео запущено'));
        });
        
        loadingContainer.innerHTML = '';
        loadingContainer.appendChild(video);

        setTimeout(() => {
            this.showAuthScreen();
        }, 3000);
    }

    async showAuthScreen() {
        this.loadingScreen.classList.add('hidden');

        // Проверяем, есть ли сохраненный пользователь
        const savedUser = localStorage.getItem('matilda_current_user');
        if (savedUser) {
            try {
                const response = await fetch(`/api/user/${savedUser}`);
                if (response.ok) {
                    const userData = await response.json();
                    this.currentUser = savedUser;
                    this.users[savedUser] = userData;
                    this.socket.emit('user_online', savedUser);
                    await this.loadUsersFromServer();
                    this.showMessengerScreen();
                    return;
                }
            } catch (error) {
                console.log('Не удалось загрузить данные пользователя');
            }
        }

        // Показываем экран аутентификации только если пользователь не авторизован
        this.authScreen.classList.remove('hidden');
    }

    async loadUsersFromServer() {
        try {
            const response = await fetch('/api/users');
            const userList = await response.json();

            userList.forEach(user => {
                this.users[user.username] = user;
            });

            // Загружаем также каналы с сервера
            const channelsResponse = await fetch('/api/channels');
            const channelList = await channelsResponse.json();

            channelList.forEach(channel => {
                this.channels[channel.id] = channel;
            });

            // Загружаем чаты и каналы пользователя
            await this.loadUserChatsFromServer();

            // ВСЕГДА загружаем Premium пользователей ТОЛЬКО с сервера
            const premiumResponse = await fetch('/api/premium-users');
            const premiumData = await premiumResponse.json();

            this.premiumUsers = premiumData;
            // НЕ сохраняем в localStorage - используем только серверные данные
        } catch (error) {
            console.log('Ошибка загрузки данных');
        }
    }

    async loadUserChatsFromServer() {
        try {
            const response = await fetch(`/api/chats/${this.currentUser}`);
            const data = await response.json();

            // Объединяем с локальными чатами
            data.chats.forEach(chat => {
                this.chats[chat.id] = chat;
            });

            data.channels.forEach(channel => {
                this.channels[channel.id] = channel;
            });

            // Загружаем сохраненные подписки пользователя
            const userChannelSubscriptions = JSON.parse(localStorage.getItem('matilda_user_channels') || '{}');
            if (userChannelSubscriptions[this.currentUser]) {
                // Загружаем все каналы с сервера
                try {
                    const channelsResponse = await fetch('/api/channels');
                    const allChannels = await channelsResponse.json();

                    userChannelSubscriptions[this.currentUser].forEach(channelId => {
                        const serverChannel = allChannels.find(ch => ch.id === channelId);
                        if (serverChannel) {
                            // Добавляем пользователя в участники если его там нет
                            if (!serverChannel.members) serverChannel.members = [];
                            if (!serverChannel.members.includes(this.currentUser)) {
                                serverChannel.members.push(this.currentUser);
                            }
                            this.channels[channelId] = serverChannel;
                        }
                    });
                } catch (error) {
                    console.log('Ошибка загрузки подписок на каналы');
                }
            }

            localStorage.setItem('matilda_chats', JSON.stringify(this.chats));
            localStorage.setItem('matilda_channels', JSON.stringify(this.channels));
        } catch (error) {
            console.log('Ошибка загрузки чатов пользователя');
        }
    }

    async loadMessagesFromServer(chatId) {
        try {
            const response = await fetch(`/api/messages/${chatId}`);
            const serverMessages = await response.json();

            if (!this.messages[chatId]) {
                this.messages[chatId] = [];
            }

            // Объединяем сообщения с сервера с локальными, избегая дублирования
            serverMessages.forEach(serverMessage => {
                const exists = this.messages[chatId].find(localMessage => localMessage.id === serverMessage.id);
                if (!exists) {
                    this.messages[chatId].push(serverMessage);
                }
            });

            // Сортируем по времени
            this.messages[chatId].sort((a, b) => a.timestamp - b.timestamp);

            localStorage.setItem('matilda_messages', JSON.stringify(this.messages));
        } catch (error) {
            console.log('Ошибка загрузки сообщений');
        }
    }

    bindEvents() {
        // Переключение форм
        this.showRegisterBtn.addEventListener('click', () => this.switchToRegister());
        this.showLoginBtn.addEventListener('click', () => this.switchToLogin());

        // Авторизация
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.registerBtn.addEventListener('click', () => this.handleRegister());

        // Enter в формах
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        document.getElementById('register-confirm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });

        // Проверка никнейма при вводе
        document.getElementById('register-username').addEventListener('input', (e) => {
            this.checkUsernameAvailability(e.target.value);
        });

        // Основной интерфейс
        this.newChatBtn.addEventListener('click', () => this.showNewChatModal());
        this.createChatBtn.addEventListener('click', () => this.createNewChat());
        this.cancelChatBtn.addEventListener('click', () => this.hideNewChatModal());

        // Профиль кликабельный
        document.querySelector('.user-profile-mini').addEventListener('click', () => this.showSettings());

        // Поиск чатов и каналов
        this.chatSearch.addEventListener('input', (e) => this.searchChats(e.target.value));

        // Поиск пользователей и каналов в модальном окне
        this.newChatUsernameInput.addEventListener('input', (e) => {
            this.searchUsersAndChannels(e.target.value);
        });

        // Чат
        this.backToChatsBtm.addEventListener('click', () => this.backToChats());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Голосовые сообщения
        this.voiceBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startVoiceRecording();
        });
        this.voiceBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.stopVoiceRecording();
        });
        this.voiceBtn.addEventListener('mouseleave', (e) => {
            if (this.isRecording) {
                this.stopVoiceRecording();
            }
        });

        // Тач события для мобильных
        this.voiceBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startVoiceRecording();
        });
        this.voiceBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopVoiceRecording();
        });
        this.voiceBtn.addEventListener('touchcancel', (e) => {
            if (this.isRecording) {
                this.stopVoiceRecording();
            }
        });

        // Сохраняем изначальную иконку
        this.voiceBtn.dataset.originalIcon = this.voiceBtn.innerHTML;

        // Индикатор печати
        this.messageInput.addEventListener('input', () => {
            if (this.currentChatId) {
                this.socket.emit('typing_start', {
                    chatId: this.currentChatId,
                    username: this.currentUser
                });

                clearTimeout(this.typingTimeout);
                this.typingTimeout = setTimeout(() => {
                    this.socket.emit('typing_stop', {
                        chatId: this.currentChatId,
                        username: this.currentUser
                    });
                }, 1000);
            }
        });

        // Настройки
        this.backToMessengerBtn.addEventListener('click', () => this.backToMessenger());
        this.logoutBtn.addEventListener('click', () => this.logout());

        // Новые обработчики
        document.addEventListener('click', (e) => {
            if (e.target.closest('#edit-profile-btn')) {
                this.showEditProfile();
            }
            if (e.target.closest('#privacy-btn')) {
                this.showPrivacyPolicy();
            }
            if (e.target.closest('#premium-btn')) {
                this.showPremiumScreen();
            }
            if (e.target.closest('#customization-btn-header')) {
                if (this.isPremiumUser(this.currentUser)) {
                    this.showPremiumCustomization();
                } else {
                    this.showNotification('Доступно только для Premium пользователей');
                }
            }
            if (e.target.closest('#new-channel-btn')) {
                this.showCreateChannel();
            }
            if (e.target.closest('#settings-avatar')) {
                this.showAvatarUpload();
            }
            if (e.target.closest('.attach-btn')) {
                this.openMediaGallery();
            }
            if (e.target.closest('#admin-access')) {
                this.showAdminLogin();
            }
            if (e.target.closest('#pezdy-button-header')) {
                this.showPezdyScreen();
            }
        });

        // Premium
        document.getElementById('back-from-premium').addEventListener('click', () => this.backFromPremium());
        document.getElementById('activate-premium-btn').addEventListener('click', () => this.activatePremium());

        // Admin
        document.getElementById('back-from-admin').addEventListener('click', () => this.backFromAdmin());

        // Pezdy
        document.getElementById('back-from-pezdy').addEventListener('click', () => this.backFromPezdy());

        // Favorites
        document.getElementById('favorites-btn').addEventListener('click', () => this.openFavoritesChat());
        document.getElementById('back-from-favorites-sections').addEventListener('click', () => this.backFromFavoritesSections());

        // Folders
        document.getElementById('folders-btn').addEventListener('click', () => this.showFoldersScreen());
        document.getElementById('back-from-folders').addEventListener('click', () => this.backFromFolders());
        document.getElementById('create-folder-item').addEventListener('click', () => this.showCreateFolderModal());
        document.getElementById('confirm-folder-btn').addEventListener('click', () => this.createFolder());
        document.getElementById('cancel-folder-btn').addEventListener('click', () => this.hideCreateFolderModal());
        document.getElementById('cancel-select-folder-btn').addEventListener('click', () => this.hideSelectFolderModal());

        // Кнопка добавления Пёзд
        const addPezdyBtn = document.getElementById('add-pezdy-btn');
        if (addPezdyBtn) {
            addPezdyBtn.addEventListener('click', () => this.showAddPezdyModal());
        }

        // Звонки
        document.addEventListener('click', (e) => {
            if (e.target.closest('#call-btn')) {
                this.initiateCall();
            }
        });

        this.acceptCallBtn.addEventListener('click', () => this.acceptCall());
        this.declineCallBtn.addEventListener('click', () => this.declineCall());
        this.endCallBtn.addEventListener('click', () => this.endCall());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.videoBtn.addEventListener('click', () => this.toggleVideo());
        this.speakerBtn.addEventListener('click', () => this.toggleSpeaker());

        document.getElementById('front-camera-btn').addEventListener('click', () => this.selectCamera('user'));
        document.getElementById('back-camera-btn').addEventListener('click', () => this.selectCamera('environment'));
        document.getElementById('cancel-camera-btn').addEventListener('click', () => {
            this.cameraSelectModal.classList.add('hidden');
        });

        // Боты
        this.botStartBtn.addEventListener('click', () => this.startBotChat());
        this.miniAppBtn.addEventListener('click', () => this.openMiniApp());
        this.closeMiniAppBtn.addEventListener('click', () => this.closeMiniApp());
        
        this.miniAppModal.addEventListener('click', (e) => {
            if (e.target === this.miniAppModal) this.closeMiniApp();
        });

        // Закрытие модального окна
        this.newChatModal.addEventListener('click', (e) => {
            if (e.target === this.newChatModal) this.hideNewChatModal();
        });

        // Уведомления
        this.notificationClose.addEventListener('click', () => this.hideNotification());
    }

    switchToRegister() {
        this.loginForm.style.transform = 'translateX(-100%)';
        this.loginForm.style.opacity = '0';
        setTimeout(() => {
            this.loginForm.classList.add('hidden');
            this.registerForm.classList.remove('hidden');
            this.registerForm.style.transform = 'translateX(100%)';
            this.registerForm.style.opacity = '0';
            setTimeout(() => {
                this.registerForm.style.transform = 'translateX(0)';
                this.registerForm.style.opacity = '1';
            }, 10);
        }, 300);
    }

    switchToLogin() {
        this.registerForm.style.transform = 'translateX(100%)';
        this.registerForm.style.opacity = '0';
        setTimeout(() => {
            this.registerForm.classList.add('hidden');
            this.loginForm.classList.remove('hidden');
            this.loginForm.style.transform = 'translateX(-100%)';
            this.loginForm.style.opacity = '0';
            setTimeout(() => {
                this.loginForm.style.transform = 'translateX(0)';
                this.loginForm.style.opacity = '1';
            }, 10);
        }, 300);
        this.usernameSuggestions.classList.add('hidden');
    }

    async checkUsernameAvailability(username) {
        // Проверяем на пробелы
        if (username.includes(' ')) {
            this.showUsernameError('В юзернейме нельзя использовать пробелы');
            return;
        }

        if (!username || username.length < 5) {
            if (username.length > 0 && username.length < 5) {
                this.showUsernameError('Юзернейм должен содержать минимум 5 символов');
            } else {
                this.usernameSuggestions.classList.add('hidden');
            }
            return;
        }

        try {
            const response = await fetch(`/api/check-username/${encodeURIComponent(username)}`);
            const result = await response.json();

            if (result.taken) {
                this.showUsernameSuggestions(username);
            } else {
                this.usernameSuggestions.classList.add('hidden');
            }
        } catch (error) {
            console.log('Ошибка проверки юзернейма');
        }
    }

    showUsernameError(message) {
        this.usernameSuggestions.innerHTML = `<p style="color: #ff4444;">${message}</p>`;
        this.usernameSuggestions.classList.remove('hidden');
    }

    async showUsernameSuggestions(takenUsername) {
        try {
            const response = await fetch(`/api/suggest-usernames/${encodeURIComponent(takenUsername)}`);
            const suggestions = await response.json();

            if (suggestions.length > 0) {
                this.usernameSuggestions.innerHTML = `
                    <p>Никнейм занят. Предлагаемые варианты:</p>
                    ${suggestions.map(name => 
                        `<span class="suggestion-item" onclick="matildaMessenger.selectSuggestion('${name}')">${name}</span>`
                    ).join('')}
                `;
                this.usernameSuggestions.classList.remove('hidden');
            }
        } catch (error) {
            this.showUsernameError('Никнейм занят');
        }
    }

    selectSuggestion(username) {
        document.getElementById('register-username').value = username;
        this.usernameSuggestions.classList.add('hidden');
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showNotification('Пожалуйста, заполните все поля');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = username;
                this.users[username] = result.user;
                localStorage.setItem('matilda_current_user', username);
                this.socket.emit('user_online', username);
                await this.loadUsersFromServer();
                this.showMessengerScreen();
                this.showNotification(`Добро пожаловать, ${result.user.name || username}!`);
            } else {
                this.showNotification(result.message);
            }
        } catch (error) {
            this.showNotification('Ошибка подключения к серверу');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const name = document.getElementById('register-name').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        if (!username || !name || !password || !confirmPassword) {
            this.showNotification('Пожалуйста, заполните все поля');
            return;
        }

        if (username.length < 5) {
            this.showNotification('Никнейм должен содержать минимум 5 символов');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, name, password })
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = username;
                this.users[username] = result.user;
                localStorage.setItem('matilda_current_user', username);

                // Даём новому пользователю 100 стартовых Пёзд
                this.addUserPezdy(username, 100);

                this.socket.emit('user_online', username);
                await this.loadUsersFromServer();
                this.showMessengerScreen();
                this.showNotification(`Аккаунт успешно создан! Добро пожаловать, ${name}! Вам начислено 100 Пёзд!`);
            } else {
                this.showNotification(result.message);
                if (result.message.includes('существует')) {
                    this.showUsernameSuggestions(username);
                }
            }
        } catch (error) {
            this.showNotification('Ошибка подключения к серверу');
        }
    }

    showMessengerScreen() {
        this.authScreen.style.opacity = '0';
        setTimeout(() => {
            this.authScreen.classList.add('hidden');
            this.messengerScreen.classList.remove('hidden');
            this.messengerScreen.style.opacity = '0';
            setTimeout(() => {
                this.messengerScreen.style.opacity = '1';
            }, 10);
        }, 300);
        this.updateProfileInfo();
        this.renderFolderTabs();
        this.loadChats();
    }

    updateProfileInfo() {
        const user = this.users[this.currentUser];
        const firstLetter = (user.name || this.currentUser).charAt(0).toUpperCase();

        // Проверяем премиум и удаляем кастомизацию если истёк
        const isPremium = this.isPremiumUser(this.currentUser);

        // Обновляем аватар в боковой панели
        if (user.avatar) {
            this.profileAvatar.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            this.profileAvatar.textContent = firstLetter;
        }

        // Применяем обводку если есть И премиум активен
        if (user.avatarBorder && isPremium) {
            this.profileAvatar.style.background = user.avatarBorder;
            this.profileAvatar.style.padding = '3px';
        } else {
            this.profileAvatar.style.background = '#0088cc';
            this.profileAvatar.style.padding = '0';
        }

        const premiumBadge = isPremium ? '<img src="assets/premium-badge.png" class="premium-badge" alt="Premium">' : '';
        this.profileName.innerHTML = `${user.name || this.currentUser}${premiumBadge}`;
        this.profileUsername.textContent = `@${this.currentUser}`;

        // Обновляем аватар в настройках
        if (user.avatar) {
            this.settingsAvatar.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            this.settingsAvatar.textContent = firstLetter;
        }

        // Применяем обводку в настройках если есть И премиум активен
        if (user.avatarBorder && isPremium) {
            this.settingsAvatar.style.background = user.avatarBorder;
            this.settingsAvatar.style.padding = '3px';
        } else {
            this.settingsAvatar.style.background = '#0088cc';
            this.settingsAvatar.style.padding = '0';
        }

        const premiumBadgeSettings = isPremium ? '<img src="assets/premium-badge.png" class="premium-badge" alt="Premium">' : '';
        this.settingsName.innerHTML = `${user.name || this.currentUser}${premiumBadgeSettings}`;
        this.settingsUsername.textContent = `@${this.currentUser}`;

        let descriptionElement = document.querySelector('.profile-description');
        if (user.description) {
            if (!descriptionElement) {
                descriptionElement = document.createElement('p');
                descriptionElement.className = 'profile-description';
                document.querySelector('.profile-details').appendChild(descriptionElement);
            }
            descriptionElement.textContent = user.description;
        } else if (descriptionElement) {
            descriptionElement.remove();
        }

        // Обновляем фон профиля
        this.updateProfileBackground();
        this.updateCustomizationButtonVisibility();
    }

    async searchChats(query) {
        if (!query.trim()) {
            this.loadChats();
            return;
        }

        if (query.startsWith('matilda.')) {
            this.handlePrivateChannelInvite(query);
            return;
        }

        // Получаем всех пользователей с сервера для поиска
        let allUsers = [];
        try {
            const response = await fetch(`/api/search/users/${encodeURIComponent(query)}`);
            allUsers = await response.json();
            allUsers = allUsers.filter(user => user.username !== this.currentUser);
        } catch (error) {
            console.log('Ошибка поиска пользователей');
        }

        // Получаем все каналы с сервера для поиска
        let allChannels = [];
        try {
            const response = await fetch(`/api/search/channels/${encodeURIComponent(query)}`);
            allChannels = await response.json();
        } catch (error) {
            console.log('Ошибка поиска каналов');
        }

        const myChats = Object.keys(this.chats).filter(chatId => 
            this.chats[chatId].participants && this.chats[chatId].participants.includes(this.currentUser)
        );

        const myChannels = Object.keys(this.channels).filter(channelId => 
            this.channels[channelId].members && this.channels[channelId].members.includes(this.currentUser)
        );

        const filteredMyChats = myChats.filter(chatId => {
            const chat = this.chats[chatId];
            if (!chat.participants) return false;
            const otherUser = chat.participants.find(p => p !== this.currentUser);
            if (!otherUser) return false;
            const userName = this.users[otherUser]?.name || otherUser;
            return userName.toLowerCase().includes(query.toLowerCase()) ||
                   otherUser.toLowerCase().includes(query.toLowerCase());
        });

        const filteredMyChannels = myChannels.filter(channelId => {
            const channel = this.channels[channelId];
            return (channel.name && channel.name.toLowerCase().includes(query.toLowerCase())) ||
                   (channel.username && channel.username.toLowerCase().includes(query.toLowerCase())) ||
                   (channel.description && channel.description.toLowerCase().includes(query.toLowerCase()));
        });

        this.displaySearchResults(filteredMyChats, filteredMyChannels, allUsers, allChannels, query);
    }

    async searchUsersAndChannels(query) {
        if (!query.trim()) {
            this.userSearchResults.innerHTML = '';
            return;
        }

        // Убираем @ если пользователь ввел его
        const cleanQuery = query.startsWith('@') ? query.substring(1) : query;

        try {
            const response = await fetch(`/api/search/users/${encodeURIComponent(cleanQuery)}`);
            const matchedUsers = await response.json();

            const filteredUsers = matchedUsers.filter(user => user.username !== this.currentUser);

            // Получаем каналы с сервера
            const channelsResponse = await fetch('/api/search/channels/' + encodeURIComponent(cleanQuery));
            const matchedChannels = await channelsResponse.json();

            let resultsHTML = '';

            if (filteredUsers.length > 0) {
                resultsHTML += '<div class="search-section-title">Пользователи:</div>';
                resultsHTML += filteredUsers.map(user => {
                    const isBotUser = user.username.endsWith('_bot');
                    const botBadge = isBotUser ? '<img src="assets/premium-badge.png" class="premium-badge" alt="Premium">' : '';
                    return `
                    <div class="user-result" onclick="matildaMessenger.selectUser('${user.username}')">
                        <div class="user-result-avatar">${(user.name || user.username).charAt(0).toUpperCase()}</div>
                        <div class="user-result-info">
                            <h4>${user.name || user.username}${botBadge}</h4>
                            <p>@${user.username}${user.online ? ' • в сети' : ''}</p>
                        </div>
                    </div>
                    `;
                }).join('');
            }

            if (matchedChannels.length > 0) {
                resultsHTML += '<div class="search-section-title">Каналы:</div>';
                resultsHTML += matchedChannels.map(channel => `
                    <div class="user-result" onclick="matildaMessenger.selectChannelFromSearch('${channel.id}')">
                        <div class="user-result-avatar channel-avatar">📢</div>
                        <div class="user-result-info">
                            <h4>${channel.name}</h4>
                            <p>@${channel.username} • ${(channel.members || []).length} подписчиков</p>
                        </div>
                    </div>
                `).join('');
            }

            if (filteredUsers.length === 0 && matchedChannels.length === 0) {
                resultsHTML = '<div class="no-results">Ничего не найдено</div>';
            }

            this.userSearchResults.innerHTML = resultsHTML;
        } catch (error) {
            this.userSearchResults.innerHTML = '<div class="no-results">Ошибка поиска</div>';
        }
    }

    selectUser(username) {
        this.newChatUsernameInput.value = username;
        this.userSearchResults.innerHTML = '';
    }

    selectChannel(channelId) {
        this.joinChannel(channelId);
    }

    selectChannelFromSearch(channelId) {
        // Закрываем модальное окно
        this.hideNewChatModal();
        // Присоединяемся к каналу
        this.joinChannelFromSearch(channelId);
    }

    handlePrivateChannelInvite(inviteLink) {
        const channelId = Object.keys(this.channels).find(id => {
            const channel = this.channels[id];
            return !channel.isPublic && channel.inviteLink === inviteLink;
        });

        if (channelId) {
            this.joinChannel(channelId);
            this.chatSearch.value = '';
        } else {
            this.showNotification('Неверная ссылка приглашения');
        }
    }

    displaySearchResults(myChats, myChannels, allUsers, allChannels, query) {
        this.chatsList.innerHTML = '';

        let hasResults = false;

        if (myChats.length > 0) {
            const section = document.createElement('div');
            section.className = 'search-section-title';
            section.textContent = 'Мои чаты:';
            this.chatsList.appendChild(section);

            myChats.forEach(chatId => {
                const chat = this.chats[chatId];
                const otherUser = chat.participants.find(p => p !== this.currentUser);
                this.createChatItem(chatId, otherUser);
            });
            hasResults = true;
        }

        if (myChannels.length > 0) {
            const section = document.createElement('div');
            section.className = 'search-section-title';
            section.textContent = 'Мои каналы:';
            this.chatsList.appendChild(section);

            myChannels.forEach(channelId => {
                const channel = this.channels[channelId];
                this.createChannelItem(channelId, channel, true);
            });
            hasResults = true;
        }

        if (allUsers.length > 0) {
            const section = document.createElement('div');
            section.className = 'search-section-title';
            section.textContent = 'Пользователи:';
            this.chatsList.appendChild(section);

            allUsers.forEach(user => {
                this.createUserSearchItemFromServer(user);
            });
            hasResults = true;
        }

        if (allChannels.length > 0) {
            const section = document.createElement('div');
            section.className = 'search-section-title';
            section.textContent = 'Публичные каналы:';
            this.chatsList.appendChild(section);

            allChannels.forEach(channel => {
                this.createChannelSearchItemFromServer(channel);
            });
            hasResults = true;
        }

        if (!hasResults) {
            this.chatsList.innerHTML = '<div class="no-chats">Ничего не найдено</div>';
        }
    }

    createUserSearchItem(username) {
        const user = this.users[username];
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';

        chatItem.onclick = () => this.showUserProfile(username);
        const firstLetter = (user.name || username).charAt(0).toUpperCase();

        chatItem.innerHTML = `
            <div class="chat-avatar">${firstLetter}</div>
            <div class="chat-info">
                <div class="chat-name">${user.name || user.username}</div>
                <div class="chat-last-message">@${username}${user.description ? ' • ' + user.description : ''}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">Профиль</div>
            </div>
        `;

        this.chatsList.appendChild(chatItem);
    }

    createUserSearchItemFromServer(user) {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';

        chatItem.onclick = () => this.showUserProfileFromServer(user);

        let avatarContent = (user.name || user.username).charAt(0).toUpperCase();
        if (user.avatar) {
            avatarContent = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }

        const isBotUser = user.username.endsWith('_bot');
        const botBadge = isBotUser ? '<img src="assets/premium-badge.png" class="premium-badge" alt="Premium">' : '';

        chatItem.innerHTML = `
            <div class="chat-avatar">${avatarContent}</div>
            <div class="chat-info">
                <div class="chat-name">${user.name || user.username}${botBadge}</div>
                <div class="chat-last-message">@${user.username}${user.description ? ' • ' + user.description : ''}${user.online ? ' • в сети' : ''}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">Профиль</div>
            </div>
        `;

        this.chatsList.appendChild(chatItem);
    }

    createChannelSearchItemFromServer(channel) {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item channel-item';

        chatItem.onclick = () => this.joinChannelFromSearch(channel.id);

        chatItem.innerHTML = `
            <div class="chat-avatar channel-avatar">📢</div>
            <div class="chat-info">
                <div class="chat-name">${channel.name}</div>
                <div class="chat-last-message">@${channel.username} • ${(channel.members || []).length} подписчиков</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">Присоединиться</div>
            </div>
        `;

        this.chatsList.appendChild(chatItem);
    }

    showUserProfileFromServer(user) {
        // Добавляем пользователя в локальный кэш если его там нет
        if (!this.users[user.username]) {
            this.users[user.username] = user;
        }
        this.showUserProfile(user.username);
    }

    createChannelSearchItem(channelId, channel) {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item channel-item';

        chatItem.onclick = () => this.joinChannelFromSearch(channelId);

        chatItem.innerHTML = `
            <div class="chat-avatar channel-avatar">📢</div>
            <div class="chat-info">
                <div class="chat-name">${channel.name}</div>
                <div class="chat-last-message">@${channel.username} • ${(channel.members || []).length} подписчиков</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">Присоединиться</div>
            </div>
        `;

        this.chatsList.appendChild(chatItem);
    }

    showUserProfile(username) {
        const user = this.users[username];
        if (!user) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'user-profile-modal';
        modal.style.opacity = '0';

        let avatarContent = (user.name || username).charAt(0).toUpperCase();
        if (user.avatar) {
            avatarContent = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }

        const avatarStyle = user.avatarBorder ? `style="background: ${user.avatarBorder}; padding: 3px;"` : '';
        const isBotUser = username.endsWith('_bot');
        const premiumBadge = (this.isPremiumUser(username) || isBotUser) ? '<img src="assets/premium-badge.png" class="premium-badge" alt="Premium">' : '';
        const bgStyle = user.profileBackground ? `style="background-image: url(${user.profileBackground}); background-size: cover; background-position: center;"` : '';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="profile-section" ${bgStyle}>
                    ${user.profileBackground ? '<div class="profile-background-overlay"></div>' : ''}
                    <div class="profile-avatar-large" ${avatarStyle}>${avatarContent}</div>
                    <div class="profile-details">
                        <h3>${user.name || username}${premiumBadge}</h3>
                        <p>@${username}</p>
                        ${user.description ? `<p class="profile-description">${user.description}</p>` : ''}
                        <p class="profile-status">${user.online ? 'в сети' : 'был(а) недавно'}</p>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button id="start-chat-with-user" class="done-button">Написать</button>
                    <button id="close-profile-btn" class="cancel-button">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-profile-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('start-chat-with-user').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
                this.startChatWithUser(username);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    startChatWithUser(username) {
        const existingChatId = Object.keys(this.chats).find(chatId => {
            const chat = this.chats[chatId];
            return chat.participants.includes(this.currentUser) && 
                   chat.participants.includes(username);
        });

        if (existingChatId) {
            this.openChat(existingChatId, username);
        } else {
            const chatId = 'chat_' + Date.now().toString();
            this.chats[chatId] = {
                participants: [this.currentUser, username],
                createdAt: Date.now(),
                lastMessage: '',
                lastMessageTime: Date.now()
            };

            this.messages[chatId] = [];

            localStorage.setItem('matilda_chats', JSON.stringify(this.chats));
            localStorage.setItem('matilda_messages', JSON.stringify(this.messages));

            this.openChat(chatId, username);
        }

        this.chatSearch.value = '';
    }

    async joinChannelFromSearch(channelId) {
        await this.joinChannel(channelId);
        this.chatSearch.value = '';
    }

    async joinChannel(channelId) {
        const channel = this.channels[channelId];
        if (!channel) {
            // Загружаем канал с сервера если его нет локально
            try {
                const response = await fetch('/api/channels');
                const channelList = await response.json();
                const serverChannel = channelList.find(ch => ch.id === channelId);

                if (serverChannel) {
                    this.channels[channelId] = serverChannel;
                    localStorage.setItem('matilda_channels', JSON.stringify(this.channels));
                } else {
                    this.showNotification('Канал не найден');
                    return;
                }
            } catch (error) {
                this.showNotification('Ошибка загрузки канала');
                return;
            }
        }

        const updatedChannel = this.channels[channelId];
        if (!updatedChannel.members) updatedChannel.members = [];

        if (!updatedChannel.members.includes(this.currentUser)) {
            updatedChannel.members.push(this.currentUser);

            // Сохраняем подписку пользователя в отдельном ключе localStorage
            let userChannelSubscriptions = JSON.parse(localStorage.getItem('matilda_user_channels') || '{}');
            if (!userChannelSubscriptions[this.currentUser]) {
                userChannelSubscriptions[this.currentUser] = [];
            }
            if (!userChannelSubscriptions[this.currentUser].includes(channelId)) {
                userChannelSubscriptions[this.currentUser].push(channelId);
            }
            localStorage.setItem('matilda_user_channels', JSON.stringify(userChannelSubscriptions));
            localStorage.setItem('matilda_channels', JSON.stringify(this.channels));

            this.showNotification(`Вы подписались на канал "${updatedChannel.name}"`);
            this.hideNewChatModal();
            this.loadChats();

            // Сразу открываем канал
            setTimeout(() => {
                this.openChannel(channelId);
            }, 500);
        } else {
            this.showNotification('Вы уже подписаны на этот канал');
            // Если уже подписан, просто открываем канал
            setTimeout(() => {
                this.openChannel(channelId);
            }, 500);
        }
    }

    loadChats() {
        let userChats = Object.keys(this.chats).filter(chatId => 
            this.chats[chatId].participants && this.chats[chatId].participants.includes(this.currentUser)
        );

        let userChannels = Object.keys(this.channels).filter(channelId => 
            this.channels[channelId].members && this.channels[channelId].members.includes(this.currentUser)
        );

        // Фильтрация по текущей папке
        if (this.currentFolder !== 'all') {
            const folderChatIds = Object.keys(this.chatFolders).filter(chatId => 
                this.chatFolders[chatId] && this.chatFolders[chatId].includes(this.currentFolder)
            );
            userChats = userChats.filter(chatId => folderChatIds.includes(chatId));
            userChannels = userChannels.filter(channelId => folderChatIds.includes(channelId));
        }

        this.displayChatsAndChannels(userChats, userChannels);
    }

    displayChatsAndChannels(chatIds, channelIds) {
        if (chatIds.length === 0 && channelIds.length === 0) {
            if (this.currentFolder !== 'all') {
                this.chatsList.innerHTML = `
                    <div class="empty-folder">
                        <img src="assets/empty-folder.png" alt="Пусто" class="empty-folder-image">
                        <div class="empty-folder-text">Нет чатов</div>
                    </div>
                `;
            } else {
                this.chatsList.innerHTML = '<div class="no-chats">Нет чатов</div>';
            }
        } else {
            this.chatsList.innerHTML = '';

            // Получаем закрепленные чаты для текущей папки
            const folderPinnedChats = this.folders[this.currentFolder].pinnedChats || [];

            // Разделяем на закрепленные и обычные
            const pinnedChannels = channelIds.filter(id => folderPinnedChats.includes(id));
            const unpinnedChannels = channelIds.filter(id => !folderPinnedChats.includes(id));
            const pinnedChats = chatIds.filter(id => folderPinnedChats.includes(id));
            const unpinnedChats = chatIds.filter(id => !folderPinnedChats.includes(id));

            // Сначала закрепленные каналы
            pinnedChannels.forEach(channelId => {
                const channel = this.channels[channelId];
                this.createChannelItem(channelId, channel, true);
            });

            // Затем закрепленные чаты
            pinnedChats.forEach(chatId => {
                const chat = this.chats[chatId];
                const otherUser = chat.participants.find(p => p !== this.currentUser);
                this.createChatItem(chatId, otherUser, true);
            });

            // Разделитель если есть закрепленные
            if (pinnedChannels.length > 0 || pinnedChats.length > 0) {
                const separator = document.createElement('div');
                separator.className = 'pinned-separator';
                separator.style.cssText = 'height: 1px; background: #333; margin: 10px 20px;';
                this.chatsList.appendChild(separator);
            }

            // Обычные каналы
            unpinnedChannels.forEach(channelId => {
                const channel = this.channels[channelId];
                this.createChannelItem(channelId, channel, false);
            });

            // Обычные чаты
            unpinnedChats.forEach(chatId => {
                const chat = this.chats[chatId];
                const otherUser = chat.participants.find(p => p !== this.currentUser);
                this.createChatItem(chatId, otherUser, false);
            });
        }
    }

    createChannelItem(channelId, channel, isPinned = false) {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item channel-item';
        if (channelId === this.currentChatId) {
            chatItem.classList.add('active');
        }
        if (isPinned) {
            chatItem.classList.add('pinned');
        }

        const timeAgo = this.getTimeAgo(channel.lastMessageTime);

        chatItem.onclick = () => this.openChannel(channelId);

        // Добавляем контекстное меню для ПК
        chatItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showChatListMenu(e, channelId, 'channel');
        });

        // Добавляем свайп для мобильных
        this.addSwipeGesture(chatItem, channelId, 'channel');

        const pinIcon = isPinned ? '📌 ' : '';

        let avatarContent = '📢';
        if (channel.avatar) {
            avatarContent = `<img src="${channel.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }

        chatItem.innerHTML = `
            <div class="chat-avatar channel-avatar">${avatarContent}</div>
            <div class="chat-info">
                <div class="chat-name">${pinIcon}${channel.name}</div>
                <div class="chat-last-message">${this.truncateMessage(channel.lastMessage || 'Канал создан')}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">${timeAgo}</div>
            </div>
        `;

        this.chatsList.appendChild(chatItem);
    }

    createChatItem(chatId, username, isPinned = false) {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        if (chatId === this.currentChatId) {
            chatItem.classList.add('active');
        }
        if (isPinned) {
            chatItem.classList.add('pinned');
        }

        const chat = this.chats[chatId];
        const timeAgo = this.getTimeAgo(chat.lastMessageTime || chat.createdAt);

        chatItem.onclick = () => this.openChat(chatId, username);

        // Добавляем контекстное меню для ПК
        chatItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showChatListMenu(e, chatId, 'chat');
        });

        // Добавляем свайп для мобильных
        this.addSwipeGesture(chatItem, chatId, 'chat');

        const userName = this.users[username]?.name || username;
        const user = this.users[username];
        const firstLetter = userName.charAt(0).toUpperCase();

        const isBlocked = this.isUserBlocked(username, this.currentUser);
        const blockedText = isBlocked ? ' (заблокирован)' : '';
        const pinIcon = isPinned ? '📌 ' : '';
        const isBotUser = username.endsWith('_bot');
        const premiumBadge = (this.isPremiumUser(username) || isBotUser) ? '<img src="assets/premium-badge.png" class="premium-badge" alt="Premium">' : '';

        let avatarContent = firstLetter;
        if (user && user.avatar) {
            avatarContent = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }

        const avatarStyle = user && user.avatarBorder ? `style="background: ${user.avatarBorder}; padding: 3px;"` : '';

        chatItem.innerHTML = `
            <div class="chat-avatar" ${avatarStyle}>${avatarContent}</div>
            <div class="chat-info">
                <div class="chat-name">${pinIcon}${userName}${premiumBadge}${blockedText}</div>
                <div class="chat-last-message">${this.truncateMessage(chat.lastMessage || 'Новый чат')}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">${timeAgo}</div>
            </div>
        `;

        this.chatsList.appendChild(chatItem);
    }

    truncateMessage(message, maxLength = 30) {
        if (!message) return '';
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    }

    getTimeAgo(timestamp) {
        if (!timestamp) return '';
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'сейчас';
        if (minutes < 60) return `${minutes}м`;
        if (hours < 24) return `${hours}ч`;
        if (days < 7) return `${days}д`;
        return new Date(timestamp).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }

    showNewChatModal() {
        this.newChatModal.style.opacity = '0';
        this.newChatModal.classList.remove('hidden');
        setTimeout(() => {
            this.newChatModal.style.opacity = '1';
        }, 10);
        this.newChatUsernameInput.focus();
    }

    hideNewChatModal() {
        this.newChatModal.style.opacity = '0';
        setTimeout(() => {
            this.newChatModal.classList.add('hidden');
        }, 300);
        this.newChatUsernameInput.value = '';
        this.userSearchResults.innerHTML = '';
    }

    createNewChat() {
        const username = this.newChatUsernameInput.value.trim();

        if (!username) {
            this.showNotification('Введите никнейм пользователя');
            return;
        }

        if (username === this.currentUser) {
            this.showNotification('Нельзя создать чат с самим собой');
            return;
        }

        if (!this.users[username]) {
            this.showNotification('Пользователь не найден');
            return;
        }

        const existingChatId = Object.keys(this.chats).find(chatId => {
            const chat = this.chats[chatId];
            return chat.participants.includes(this.currentUser) && 
                   chat.participants.includes(username);
        });

        if (existingChatId) {
            this.hideNewChatModal();
            this.openChat(existingChatId, username);
            return;
        }

        const chatId = 'chat_' + Date.now().toString();
        this.chats[chatId] = {
            participants: [this.currentUser, username],
            createdAt: Date.now(),
            lastMessage: '',
            lastMessageTime: Date.now()
        };

        this.messages[chatId] = [];

        localStorage.setItem('matilda_chats', JSON.stringify(this.chats));
        localStorage.setItem('matilda_messages', JSON.stringify(this.messages));

        this.hideNewChatModal();
        this.loadChats();
        this.openChat(chatId, username);

        const userName = this.users[username]?.name || username;
        this.showNotification(`Чат с ${userName} создан`);
    }

    openChat(chatId, username) {
        this.currentChatId = chatId;
        this.currentChatType = 'chat';
        const user = this.users[username];
        const userName = user?.name || username;
        const firstLetter = userName.charAt(0).toUpperCase();
        const isBotUser = username.endsWith('_bot');
        const premiumBadge = (this.isPremiumUser(username) || isBotUser) ? '<img src="assets/premium-badge.png" class="premium-badge" alt="Premium">' : '';

        this.chatTitle.innerHTML = `${userName}${premiumBadge}`;
        this.chatStatus.textContent = 'в сети';

        if (user && user.avatar) {
            this.chatAvatarSmall.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            this.chatAvatarSmall.textContent = firstLetter;
        }

        if (user && user.avatarBorder) {
            this.chatAvatarSmall.style.background = user.avatarBorder;
            this.chatAvatarSmall.style.padding = '3px';
        } else {
            this.chatAvatarSmall.style.background = '#0088cc';
            this.chatAvatarSmall.style.padding = '0';
        }

        // Добавляем клик по аватару для просмотра профиля
        this.chatAvatarSmall.onclick = () => this.showUserProfile(username);
        this.chatAvatarSmall.style.cursor = 'pointer';

        // Проверяем, это бот или нет
        const isBot = username.endsWith('_bot');
        this.currentBotChat = isBot ? username : null;

        // Скрываем/показываем кнопку звонка
        const callBtn = document.getElementById('call-btn');
        if (callBtn) {
            if (isBot) {
                callBtn.classList.add('call-btn-hidden');
            } else {
                callBtn.classList.remove('call-btn-hidden');
            }
        }

        // ИСПРАВЛЕНИЕ: Сбрасываем кнопку mini-app перед проверкой
        this.miniAppBtn.classList.add('hidden');

        // Добавляем кнопку меню чата
        this.addChatMenu(username);

        this.messengerScreen.style.opacity = '0';
        setTimeout(() => {
            this.messengerScreen.classList.add('hidden');
            this.chatScreen.classList.remove('hidden');
            this.chatScreen.style.opacity = '0';
            setTimeout(() => {
                this.chatScreen.style.opacity = '1';
            }, 10);
        }, 300);

        this.loadMessages();

        // Проверяем, заблокирован ли текущий пользователь собеседником
        const isCurrentUserBlocked = this.isUserBlocked(this.currentUser, username);

        if (isBot) {
            // Для ботов показываем кнопку СТАРТ только если бот НИ РАЗУ не запускался (проверяем localStorage)
            const botStarted = localStorage.getItem(`bot_started_${this.currentUser}_${username}`);
            if (!botStarted) {
                this.botStartPanel.classList.remove('hidden');
                document.querySelector('.input-panel').style.display = 'none';
            } else {
                this.botStartPanel.classList.add('hidden');
                document.querySelector('.input-panel').style.display = 'flex';
                this.voiceBtn.style.display = 'none'; // Скрываем голосовые в ботах
                this.miniAppBtn.classList.remove('hidden');
            }
        } else if (isCurrentUserBlocked) {
            // Скрываем панель ввода и показываем заглушку о блокировке
            this.botStartPanel.classList.add('hidden');
            document.querySelector('.input-panel').style.display = 'none';
            this.voiceBtn.style.display = 'flex';
            this.miniAppBtn.classList.add('hidden');
            this.createBlockedFooter();
        } else {
            // Показываем обычную панель ввода
            this.botStartPanel.classList.add('hidden');
            document.querySelector('.input-panel').style.display = 'flex';
            this.voiceBtn.style.display = 'flex';
            this.miniAppBtn.classList.add('hidden');
            this.removeBlockedFooter();
            this.messageInput.focus();
        }

        setTimeout(() => this.loadChats(), 10);
    }

    openChannel(channelId) {
        this.currentChatId = channelId;
        this.currentChatType = 'channel';
        const channel = this.channels[channelId];

        this.chatTitle.textContent = channel.name;
        this.chatTitle.onclick = () => this.showChannelInfo(channelId);
        this.chatStatus.textContent = `@${channel.username} • ${(channel.members || []).length} подписчиков`;
        this.chatAvatarSmall.textContent = '📢';

        // Для канала аватар не должен показывать профиль пользователя
        this.chatAvatarSmall.onclick = () => this.showChannelInfo(channelId);
        this.chatAvatarSmall.style.cursor = 'pointer';

        // Скрываем кнопку звонка для каналов
        const callBtn = document.getElementById('call-btn');
        if (callBtn) {
            callBtn.classList.add('call-btn-hidden');
        }

        // Добавляем кнопку меню канала
        this.addChannelMenu(channelId);

        this.messengerScreen.style.opacity = '0';
        setTimeout(() => {
            this.messengerScreen.classList.add('hidden');
            this.chatScreen.classList.remove('hidden');
            this.chatScreen.style.opacity = '0';
            setTimeout(() => {
                this.chatScreen.style.opacity = '1';
            }, 10);
        }, 300);

        this.loadMessages();

        // В каналах только админы или пользователь matilda могут писать
        const canWrite = channel.creator === this.currentUser || this.currentUser === 'matilda';

        if (canWrite) {
            // Показываем обычную панель ввода
            document.querySelector('.input-panel').style.display = 'flex';
            this.voiceBtn.style.display = 'flex';
            this.miniAppBtn.classList.add('hidden');
            this.createChannelFooter(false);
            this.messageInput.focus();
        } else {
            // Скрываем панель ввода и показываем заглушку
            document.querySelector('.input-panel').style.display = 'none';
            this.voiceBtn.style.display = 'flex';
            this.miniAppBtn.classList.add('hidden');
            this.createChannelFooter(true);
        }

        setTimeout(() => this.loadChats(), 10);
    }

    addChatMenu(username) {
        // Удаляем предыдущее меню если есть
        const existingMenu = document.querySelector('.chat-menu-btn');
        if (existingMenu) existingMenu.remove();

        const menuBtn = document.createElement('button');
        menuBtn.className = 'chat-action-btn chat-menu-btn';
        menuBtn.textContent = '⋮';
        menuBtn.onclick = () => this.showChatMenu(username);

        document.querySelector('.chat-actions').appendChild(menuBtn);
    }

    addChannelMenu(channelId) {
        // Удаляем предыдущее меню если есть
        const existingMenu = document.querySelector('.chat-menu-btn');
        if (existingMenu) existingMenu.remove();

        const menuBtn = document.createElement('button');
        menuBtn.className = 'chat-action-btn chat-menu-btn';
        menuBtn.textContent = '⋮';
        menuBtn.onclick = () => this.showChannelMenu(channelId);

        document.querySelector('.chat-actions').appendChild(menuBtn);
    }

    showChatMenu(username) {
        const isBlocked = this.isUserBlocked(username, this.currentUser);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'chat-menu-modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Действия с чатом</h3>
                <div class="settings-menu">
                    <div class="settings-item" id="delete-chat-me">
                        <span class="settings-icon">🗑️</span>
                        <span>Удалить чат только у меня</span>
                    </div>
                    <div class="settings-item" id="delete-chat-both">
                        <span class="settings-icon">💥</span>
                        <span>Удалить чат у обоих</span>
                    </div>
                    <div class="settings-item" id="block-user">
                        <span class="settings-icon">${isBlocked ? '🔓' : '🚫'}</span>
                        <span>${isBlocked ? 'Разблокировать' : 'Заблокировать'}</span>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button id="close-chat-menu" class="cancel-button">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-chat-menu').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('delete-chat-me').addEventListener('click', () => {
            this.deleteChatForMe();
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('delete-chat-both').addEventListener('click', () => {
            this.deleteChatForBoth();
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('block-user').addEventListener('click', () => {
            if (isBlocked) {
                this.unblockUser(username);
            } else {
                this.blockUser(username);
            }
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    showChannelMenu(channelId) {
        const channel = this.channels[channelId];
        const isDefaultChannel = channel && channel.isDefault;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'channel-menu-modal';
        modal.style.opacity = '0';

        let menuItems = '';
        if (!isDefaultChannel) {
            menuItems = `
                <div class="settings-item" id="leave-channel">
                    <span class="settings-icon">🚪</span>
                    <span>Покинуть канал</span>
                </div>
            `;
        } else {
            menuItems = `
                <div class="settings-item disabled">
                    <span class="settings-icon">🔒</span>
                    <span>Официальный канал нельзя покинуть</span>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Действия с каналом</h3>
                <div class="settings-menu">
                    ${menuItems}
                </div>
                <div class="modal-buttons">
                    <button id="close-channel-menu" class="cancel-button">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-channel-menu').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('leave-channel').addEventListener('click', () => {
            this.leaveChannel(channelId);
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    deleteChatForMe() {
        if (this.currentChatId && this.currentChatType === 'chat' && this.chats[this.currentChatId]) {
            // Удаляем только личный чат, каналы не трогаем
            delete this.chats[this.currentChatId];
            delete this.messages[this.currentChatId];
            localStorage.setItem('matilda_chats', JSON.stringify(this.chats));
            localStorage.setItem('matilda_messages', JSON.stringify(this.messages));
            this.showNotification('Чат удален у вас');
            this.backToChats();
        }
    }

    deleteChatForBoth() {
        if (this.currentChatId && this.currentChatType === 'chat' && this.chats[this.currentChatId]) {
            const chat = this.chats[this.currentChatId];

            // Отправляем уведомление через сокет о удалении чата
            this.socket.emit('delete_chat_for_both', {
                chatId: this.currentChatId,
                participants: chat.participants,
                deletedBy: this.currentUser
            });

            // Удаляем только личный чат, каналы не трогаем
            delete this.chats[this.currentChatId];
            delete this.messages[this.currentChatId];
            localStorage.setItem('matilda_chats', JSON.stringify(this.chats));
            localStorage.setItem('matilda_messages', JSON.stringify(this.messages));
            this.showNotification('Чат удален у всех участников');
            this.backToChats();
        }
    }

    async blockUser(username) {
        try {
            const response = await fetch('/api/block-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    blockedBy: this.currentUser,
                    blockedUser: username
                })
            });

            if (response.ok) {
                if (!this.blockedUsers[this.currentUser]) {
                    this.blockedUsers[this.currentUser] = [];
                }
                if (!this.blockedUsers[this.currentUser].includes(username)) {
                    this.blockedUsers[this.currentUser].push(username);
                }

                // Отправляем уведомление через сокет о блокировке
                this.socket.emit('user_blocked', {
                    blockedUser: username,
                    blockedBy: this.currentUser
                });

                this.showNotification(`Пользователь ${username} заблокирован`);

                // Обновляем интерфейс чата если мы в нём
                if (this.currentChatId && this.currentChatType === 'chat') {
                    const chat = this.chats[this.currentChatId];
                    if (chat && chat.participants.includes(username)) {
                        this.backToChats();
                    }
                }

                this.loadChats();
            }
        } catch (error) {
            this.showNotification('Ошибка блокировки');
        }
    }

    async unblockUser(username) {
        try {
            const response = await fetch('/api/unblock-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    unblockedBy: this.currentUser,
                    unblockedUser: username
                })
            });

            if (response.ok) {
                if (this.blockedUsers[this.currentUser]) {
                    this.blockedUsers[this.currentUser] = this.blockedUsers[this.currentUser].filter(u => u !== username);
                }

                // Отправляем уведомление через сокет о разблокировке
                this.socket.emit('user_unblocked', {
                    unblockedUser: username,
                    unblockedBy: this.currentUser
                });

                this.showNotification(`Пользователь ${username} разблокирован`);
                this.loadChats();
            }
        } catch (error) {
            this.showNotification('Ошибка разблокировки');
        }
    }

    isUserBlocked(username, byUser) {
        return this.blockedUsers[byUser] && this.blockedUsers[byUser].includes(username);
    }

    leaveChannel(channelId) {
        const channel = this.channels[channelId];

        // Проверяем, не является ли это официальным каналом Matilda
        if (channel && channel.isDefault) {
            this.showNotification('Нельзя покинуть официальный канал Матильды');
            return;
        }

        if (channel && channel.members) {
            channel.members = channel.members.filter(member => member !== this.currentUser);

            // Удаляем подписку из сохраненных подписок пользователя
            let userChannelSubscriptions = JSON.parse(localStorage.getItem('matilda_user_channels') || '{}');
            if (userChannelSubscriptions[this.currentUser]) {
                userChannelSubscriptions[this.currentUser] = userChannelSubscriptions[this.currentUser].filter(id => id !== channelId);
                localStorage.setItem('matilda_user_channels', JSON.stringify(userChannelSubscriptions));
            }

            localStorage.setItem('matilda_channels', JSON.stringify(this.channels));
            this.showNotification(`Вы покинули канал "${channel.name}"`);
            this.backToChats();
        }
    }

    async loadMessages() {
        // Сначала загружаем сообщения с сервера
        await this.loadMessagesFromServer(this.currentChatId);

        const chatMessages = this.messages[this.currentChatId] || [];
        this.messagesContainer.innerHTML = '';

        chatMessages.forEach(message => {
            this.displayMessage(message);
        });

        this.scrollToBottom();
    }

    displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender === this.currentUser ? 'sent' : 'received'}`;
        messageDiv.dataset.messageId = message.id;
        messageDiv.style.position = 'relative';

        const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let senderName = '';
        if (this.channels[this.currentChatId] && message.sender !== this.currentUser) {
            senderName = `<div class="message-sender">${this.users[message.sender]?.name || message.sender}</div>`;
        }

        let forwardedHeader = '';
        if (message.forwarded && message.forwardedFrom) {
            const fromName = message.forwardedFrom.isChannel 
                ? this.channels[message.forwardedFrom.chatId]?.name || 'Канал'
                : this.users[message.forwardedFrom.sender]?.name || message.forwardedFrom.sender;
            forwardedHeader = `<div class="message-forwarded-header" onclick="matildaMessenger.openForwardedSource('${message.forwardedFrom.chatId}', '${message.forwardedFrom.sender}', ${message.forwardedFrom.isChannel})">Переслано от ${fromName}</div>`;
        }

        let messageContent = '';
        if (message.media) {
            if (message.media.type === 'image') {
                messageContent = `<img src="${message.media.url}" alt="Изображение" class="message-image">`;
            } else if (message.media.type === 'video') {
                messageContent = `<video src="${message.media.url}" controls class="message-video"></video>`;
            } else if (message.media.type === 'voice') {
                messageContent = this.createVoiceMessageHTML(message.media);
            } else if (message.media.type === 'file') {
                messageContent = `
                    <div class="file-message" onclick="matildaMessenger.showFilePreview('${message.id}', '${this.escapeHtml(message.media.name)}', ${message.media.size || 0}, '${message.media.url}')">
                        <img src="assets/empty-files.png" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 8px;">
                        <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${this.escapeHtml(message.media.name)}</div>
                        <div style="font-size: 11px; color: #999;">${this.formatFileSize(message.media.size || 0)}</div>
                    </div>
                `;
            }
            if (message.text) {
                messageContent += `<div class="message-text">${this.processMessageText(message.text, message.sender === this.currentUser)}</div>`;
            }
        } else {
            messageContent = `<div class="message-text">${this.processMessageText(message.text, message.sender === this.currentUser)}</div>`;
        }

        const editedMark = message.edited ? '<span class="message-edited">(изменено)</span>' : '';

        // Кнопка донатов для сообщений в каналах (только для чужих сообщений)
        let donateBtn = '';
        if (this.currentChatType === 'channel' && message.sender !== this.currentUser) {
            donateBtn = `<button class="message-donate-btn" onclick="matildaMessenger.showDonatePezdyModal('${message.id}')"><img src="assets/pezdi-icon-post.png" alt="Донат"></button>`;
        }

        // Счётчик донатов
        let donationsDisplay = '';
        const messageKey = `${this.currentChatId}_${message.id}`;
        const totalDonations = this.messageDonations[messageKey] || 0;
        if (totalDonations > 0) {
            donationsDisplay = `
                <div class="message-donations">
                    <img src="assets/pezdi-icon-post.png" alt="Пёзды">
                    <span class="message-donations-count">${this.formatPezdyCount(totalDonations)}</span>
                </div>
            `;
        }

        // Проверяем, является ли это сообщением о звонке
        if (message.isCallMessage) {
            messageDiv.classList.add('call-message');
            if (message.callType === 'declined') {
                messageDiv.classList.add('missed');
            } else if (message.callType === 'completed') {
                messageDiv.classList.add('completed');
            }

            messageDiv.innerHTML = `
                <img src="assets/call-icon.png" alt="Звонок" class="call-message-icon">
                <div class="call-message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-time">${time}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                ${forwardedHeader}
                ${senderName}
                ${messageContent}
                <div class="message-time">${time} ${editedMark}</div>
                ${donationsDisplay}
                ${donateBtn}
            `;
        }

        // Добавляем контекстное меню для своих сообщений
        if (message.sender === this.currentUser) {
            messageDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showMessageContextMenu(e, message);
            });
        }

        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        this.messagesContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    showDonatePezdyModal(messageId) {
        const userBalance = this.getUserPezdy(this.currentUser);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Донат Пёздами</h3>
                <p style="color: #666666; margin-bottom: 15px;">Ваш баланс: ${this.formatPezdyCount(userBalance)} Пёзд</p>
                <input type="number" id="donate-amount" placeholder="Количество Пёзд" class="input-field" min="1" max="${userBalance}">
                <div class="modal-buttons">
                    <button id="cancel-donate-btn" class="cancel-button">Отмена</button>
                    <button id="confirm-donate-btn" class="done-button">Донатить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('cancel-donate-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('confirm-donate-btn').addEventListener('click', () => {
            const amount = parseInt(document.getElementById('donate-amount').value);
            if (!amount || amount <= 0) {
                this.showNotification('Введите корректное количество');
                return;
            }
            if (amount > userBalance) {
                this.showNotification('Недостаточно Пёзд на балансе');
                return;
            }
            this.donatePezdy(messageId, amount);
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    donatePezdy(messageId, amount) {
        const messageKey = `${this.currentChatId}_${messageId}`;

        // Убираем пёзды у пользователя
        this.removeUserPezdy(this.currentUser, amount);

        // Добавляем в донаты сообщения
        if (!this.messageDonations[messageKey]) {
            this.messageDonations[messageKey] = 0;
        }
        this.messageDonations[messageKey] += amount;
        localStorage.setItem('matilda_message_donations', JSON.stringify(this.messageDonations));

        // Добавляем в донаты канала
        if (!this.channelDonations[this.currentChatId]) {
            this.channelDonations[this.currentChatId] = 0;
        }
        this.channelDonations[this.currentChatId] += amount;
        localStorage.setItem('matilda_channel_donations', JSON.stringify(this.channelDonations));

        this.showNotification(`Вы задонатили ${this.formatPezdyCount(amount)} Пёзд!`);
        this.loadMessages();
    }

    openFavoritesChat() {
        this.currentChatId = 'favorites';
        this.currentChatType = 'favorites';

        this.chatTitle.textContent = 'Избранное';
        this.chatTitle.onclick = () => this.showFavoritesSections();
        this.chatStatus.textContent = 'сохраненные сообщения';
        this.chatAvatarSmall.innerHTML = '<img src="assets/favorites-avatar.png" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">';
        this.chatAvatarSmall.onclick = () => this.showFavoritesSections();
        this.chatAvatarSmall.style.cursor = 'pointer';

        // Скрываем кнопку звонка
        const callBtn = document.getElementById('call-btn');
        if (callBtn) {
            callBtn.classList.add('call-btn-hidden');
        }

        // Удаляем меню чата если есть
        const existingMenu = document.querySelector('.chat-menu-btn');
        if (existingMenu) existingMenu.remove();

        this.settingsScreen.style.opacity = '0';
        setTimeout(() => {
            this.settingsScreen.classList.add('hidden');
            this.chatScreen.classList.remove('hidden');
            this.chatScreen.style.opacity = '0';
            setTimeout(() => {
                this.chatScreen.style.opacity = '1';
            }, 10);
        }, 300);

        this.loadFavoritesMessages();

        // Показываем панель ввода
        this.botStartPanel.classList.add('hidden');
        document.querySelector('.input-panel').style.display = 'flex';
        this.voiceBtn.style.display = 'flex';
        this.miniAppBtn.classList.add('hidden');
        this.removeBlockedFooter();
        this.messageInput.focus();
    }

    showFavoritesSections() {
        this.chatScreen.style.opacity = '0';
        setTimeout(() => {
            this.chatScreen.classList.add('hidden');
            document.getElementById('favorites-sections-screen').classList.remove('hidden');
            document.getElementById('favorites-sections-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('favorites-sections-screen').style.opacity = '1';
            }, 10);
        }, 300);

        this.loadFavoritesSections();
    }

    backFromFavoritesSections() {
        document.getElementById('favorites-sections-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('favorites-sections-screen').classList.add('hidden');
            this.chatScreen.classList.remove('hidden');
            this.chatScreen.style.opacity = '0';
            setTimeout(() => {
                this.chatScreen.style.opacity = '1';
            }, 10);
        }, 300);
    }

    loadFavoritesSections() {
        // Добавляем обработчики переключения табов
        document.querySelectorAll('.favorites-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.favorites-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.favorites-section').forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                const section = tab.dataset.section;
                document.getElementById(`favorites-${section}`).classList.add('active');
                this.currentFavoritesSection = section;
            });
        });

        this.renderFavoritesSections();
    }

    renderFavoritesSections() {
        const sections = {
            media: [],
            files: [],
            links: [],
            voice: []
        };

        this.favoritesMessages.forEach(item => {
            if (item.message.media) {
                if (item.message.media.type === 'image' || item.message.media.type === 'video') {
                    sections.media.push(item);
                } else if (item.message.media.type === 'voice') {
                    sections.voice.push(item);
                } else if (item.message.media.type === 'file') {
                    sections.files.push(item);
                }
            } else if (item.message.text && this.containsLink(item.message.text)) {
                sections.links.push(item);
            } else if (item.message.text) {
                // Текстовые сообщения без ссылок тоже добавляем в соответствующую категорию
                // Можно добавить в links или создать отдельную категорию
                sections.links.push(item);
            }
        });

        // Отображаем каждую секцию
        Object.keys(sections).forEach(sectionKey => {
            const sectionEl = document.getElementById(`favorites-${sectionKey}`);
            
            if (sections[sectionKey].length === 0) {
                // Пустая секция - показываем заглушку
                const emptyDiv = sectionEl.querySelector('.favorites-empty');
                if (emptyDiv) {
                    emptyDiv.style.display = 'flex';
                }
                return;
            }

            // Скрываем заглушку
            const emptyDiv = sectionEl.querySelector('.favorites-empty');
            if (emptyDiv) {
                emptyDiv.style.display = 'none';
            }

            // Создаем контейнер для сообщений если его нет
            let messagesContainer = sectionEl.querySelector('.favorites-messages-list');
            if (!messagesContainer) {
                messagesContainer = document.createElement('div');
                messagesContainer.className = 'favorites-messages-list';
                sectionEl.appendChild(messagesContainer);
            }
            messagesContainer.innerHTML = '';

            sections[sectionKey].forEach(item => {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message received';
                messageDiv.style.maxWidth = '85%';
                messageDiv.style.marginBottom = '12px';
                messageDiv.onclick = () => this.openFavoritesItem(item);
                messageDiv.style.cursor = 'pointer';
                
                const time = new Date(item.message.timestamp).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                let content = '';
                if (item.message.media) {
                    if (item.message.media.type === 'image') {
                        content = `<img src="${item.message.media.url}" alt="Изображение" class="message-image">`;
                    } else if (item.message.media.type === 'video') {
                        content = `<video src="${item.message.media.url}" controls class="message-video"></video>`;
                    } else if (item.message.media.type === 'voice') {
                        content = this.createVoiceMessageHTML(item.message.media);
                    } else if (item.message.media.type === 'file') {
                        content = `
                            <div class="file-message" onclick="matildaMessenger.showFilePreview('${item.message.id}', '${this.escapeHtml(item.message.media.name || 'Файл')}', ${item.message.media.size || 0}, '${item.message.media.url}')">
                                <img src="assets/empty-files.png" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 8px;">
                                <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${this.escapeHtml(item.message.media.name || 'Файл')}</div>
                                <div style="font-size: 11px; color: #999;">${this.formatFileSize(item.message.media.size || 0)}</div>
                            </div>
                        `;
                    }
                    if (item.message.text) {
                        content += `<div class="message-text">${this.processMessageText(item.message.text)}</div>`;
                    }
                } else if (item.message.text) {
                    content = `<div class="message-text">${this.processMessageText(item.message.text)}</div>`;
                }

                messageDiv.innerHTML = `
                    ${content}
                    <div class="message-time">${time}</div>
                `;
                
                messagesContainer.appendChild(messageDiv);
            });
        });
    }

    containsLink(text) {
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        return urlPattern.test(text);
    }

    openFavoritesItem(item) {
        // Возвращаемся в избранное
        this.backFromFavoritesSections();
        // Прокручиваем к сообщению
        setTimeout(() => {
            const messageEl = document.querySelector(`[data-message-id="${item.message.id}"]`);
            if (messageEl) {
                messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }

    loadFavoritesMessages() {
        this.messagesContainer.innerHTML = '';
        this.favoritesMessages.forEach(item => {
            this.displayFavoritesMessage(item.message);
        });
        this.scrollToBottom();
    }

    displayFavoritesMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message received';
        messageDiv.dataset.messageId = message.id;
        messageDiv.style.position = 'relative';

        const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let messageContent = '';
        if (message.media) {
            if (message.media.type === 'image') {
                messageContent = `<img src="${message.media.url}" alt="Изображение" class="message-image">`;
            } else if (message.media.type === 'video') {
                messageContent = `<video src="${message.media.url}" controls class="message-video"></video>`;
            } else if (message.media.type === 'voice') {
                messageContent = this.createVoiceMessageHTML(message.media);
            } else if (message.media.type === 'file') {
                messageContent = `
                    <div class="file-message" onclick="matildaMessenger.showFilePreview('${message.id}', '${this.escapeHtml(message.media.name || 'Файл')}', ${message.media.size || 0}, '${message.media.url}')">
                        <img src="assets/empty-files.png" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 8px;">
                        <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${this.escapeHtml(message.media.name || 'Файл')}</div>
                        <div style="font-size: 11px; color: #999;">${this.formatFileSize(message.media.size || 0)}</div>
                    </div>
                `;
            }
            if (message.text) {
                messageContent += `<div class="message-text">${this.escapeHtml(message.text)}</div>`;
            }
        } else {
            messageContent = `<div class="message-text">${this.escapeHtml(message.text)}</div>`;
        }

        messageDiv.innerHTML = `
            ${messageContent}
            <div class="message-time">${time}</div>
        `;

        // Добавляем контекстное меню для удаления из избранного
        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showFavoritesMessageContextMenu(e, message);
        });

        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        this.messagesContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    showFavoritesMessageContextMenu(event, message) {
        const existingMenu = document.querySelector('.message-context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'message-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
        menu.style.zIndex = '9999';

        menu.innerHTML = '<div class="context-menu-item" data-action="remove">Удалить из избранного</div>';

        document.body.appendChild(menu);

        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'remove') {
                this.removeFromFavorites(message);
            }
            menu.remove();
        });

        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    removeFromFavorites(message) {
        this.favoritesMessages = this.favoritesMessages.filter(item => item.message.id !== message.id);
        localStorage.setItem('matilda_favorites', JSON.stringify(this.favoritesMessages));
        this.loadFavoritesMessages();
        this.showNotification('Удалено из избранного');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Б';
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    showMessageContextMenu(event, message) {
        // Удаляем предыдущее меню если есть
        const existingMenu = document.querySelector('.message-context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'message-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
        menu.style.zIndex = '9999';

        const canEdit = message.sender === this.currentUser;
        const canForward = true;

        let menuItems = '';
        if (canEdit) {
            menuItems += '<div class="context-menu-item" data-action="edit">Редактировать</div>';
            menuItems += '<div class="context-menu-item" data-action="delete">Удалить</div>';
        }
        menuItems += '<div class="context-menu-item" data-action="forward">Переслать</div>';

        menu.innerHTML = menuItems;

        document.body.appendChild(menu);

        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'edit') {
                this.editMessage(message);
            } else if (action === 'delete') {
                this.deleteMessage(message);
            } else if (action === 'forward') {
                this.showForwardModal(message);
            }
            menu.remove();
        });

        // Закрываем меню при клике вне его
        setTimeout(() => {
            document.addEventListener('click', () => {
                if (menu.parentNode) menu.remove();
            }, { once: true });
        }, 10);
    }

    editMessage(message) {
        const messageEl = document.querySelector(`[data-message-id="${message.id}"]`);
        const textEl = messageEl.querySelector('.message-text');

        const input = document.createElement('input');
        input.type = 'text';
        input.value = message.text;
        input.className = 'message-edit-input';
        input.style.cssText = `
            background: #1a1a1a;
            border: 1px solid #0088cc;
            border-radius: 8px;
            color: #ffffff;
            padding: 8px;
            width: 100%;
            font-size: 14px;
        `;

        textEl.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== message.text) {
                this.socket.emit('edit_message', {
                    chatId: this.currentChatId,
                    messageId: message.id,
                    sender: this.currentUser,
                    newText: newText
                });

                message.text = newText;
                message.edited = true;
                message.editedAt = Date.now();

                this.messages[this.currentChatId] = this.messages[this.currentChatId].map(m => 
                    m.id === message.id ? message : m
                );
                localStorage.setItem('matilda_messages', JSON.stringify(this.messages));
            }
            this.loadMessages();
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit();
        });

        input.addEventListener('blur', saveEdit);
    }

    deleteMessage(message) {
        if (confirm('Удалить сообщение?')) {
            this.socket.emit('delete_message', {
                chatId: this.currentChatId,
                messageId: message.id,
                sender: this.currentUser
            });

            this.messages[this.currentChatId] = this.messages[this.currentChatId].filter(m => m.id !== message.id);
            localStorage.setItem('matilda_messages', JSON.stringify(this.messages));
            this.loadMessages();
        }
    }

    showForwardModal(message) {
        const modal = document.getElementById('forward-modal');
        const chatsList = document.getElementById('forward-chats-list');
        
        chatsList.innerHTML = '';

        // Добавляем избранное в начало списка
        const favItem = document.createElement('div');
        favItem.className = 'forward-chat-item';
        favItem.innerHTML = `
            <div class="chat-avatar"><img src="assets/favorites-avatar.png" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"></div>
            <div class="chat-info">
                <div class="chat-name">Избранное</div>
            </div>
        `;
        favItem.onclick = () => {
            this.forwardMessage(message, 'favorites');
            modal.classList.add('hidden');
        };
        chatsList.appendChild(favItem);

        // Добавляем остальные чаты
        const allChats = [
            ...Object.keys(this.chats).filter(id => this.chats[id].participants.includes(this.currentUser)),
            ...Object.keys(this.channels).filter(id => this.channels[id].members.includes(this.currentUser))
        ];

        allChats.forEach(chatId => {
            const chat = this.chats[chatId] || this.channels[chatId];
            const isChannel = this.channels[chatId] !== undefined;
            
            const chatItem = document.createElement('div');
            chatItem.className = 'forward-chat-item';
            
            let name, avatar;
            if (isChannel) {
                name = chat.name;
                avatar = '📢';
            } else {
                const otherUser = chat.participants.find(p => p !== this.currentUser);
                name = this.users[otherUser]?.name || otherUser;
                avatar = name.charAt(0).toUpperCase();
            }

            chatItem.innerHTML = `
                <div class="chat-avatar">${avatar}</div>
                <div class="chat-info">
                    <div class="chat-name">${name}</div>
                </div>
            `;
            
            chatItem.onclick = () => {
                this.forwardMessage(message, chatId);
                modal.classList.add('hidden');
            };
            
            chatsList.appendChild(chatItem);
        });

        modal.classList.remove('hidden');
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('cancel-forward-btn').onclick = () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        };
    }

    async forwardMessage(message, targetChatId) {
        // Проверка на блокировку и права
        if (targetChatId !== 'favorites') {
            if (this.chats[targetChatId]) {
                const chat = this.chats[targetChatId];
                const otherUser = chat.participants.find(p => p !== this.currentUser);
                
                const response = await fetch(`/api/check-blocked/${this.currentUser}/${otherUser}`);
                const result = await response.json();
                
                if (result.blocked) {
                    this.showNotification('Пользователь заблокировал вас');
                    return;
                }
            } else if (this.channels[targetChatId]) {
                const channel = this.channels[targetChatId];
                if (channel.creator !== this.currentUser && this.currentUser !== 'matilda') {
                    this.showNotification('Только администратор может отправлять сообщения в канал');
                    return;
                }
            }
        }

        const forwardedMessage = {
            id: Date.now() + Math.random(),
            sender: this.currentUser,
            text: message.text,
            media: message.media,
            timestamp: Date.now(),
            forwarded: true,
            forwardedFrom: {
                chatId: this.currentChatId,
                sender: message.sender,
                isChannel: this.currentChatType === 'channel'
            }
        };

        if (targetChatId === 'favorites') {
            this.favoritesMessages.push({
                message: forwardedMessage,
                originalChatId: this.currentChatId
            });
            localStorage.setItem('matilda_favorites', JSON.stringify(this.favoritesMessages));
            
            // Добавляем в messages для избранного
            if (!this.messages['favorites']) {
                this.messages['favorites'] = [];
            }
            this.messages['favorites'].push(forwardedMessage);
            localStorage.setItem('matilda_messages', JSON.stringify(this.messages));
            
            this.showNotification('Добавлено в избранное');
            
            // Обновляем экран избранного если мы там
            if (this.currentChatId === 'favorites') {
                this.loadFavoritesMessages();
            }
        } else {
            // Отправка через сокет
            if (!this.messages[targetChatId]) {
                this.messages[targetChatId] = [];
            }

            this.displayMessage(forwardedMessage);

            const participants = this.chats[targetChatId]?.participants;

            this.socket.emit('send_message', {
                chatId: targetChatId,
                message: forwardedMessage,
                sender: this.currentUser,
                chatType: this.channels[targetChatId] ? 'channel' : 'chat',
                participants: participants
            });

            this.showNotification('Сообщение переслано');
        }
    }

    addToFavorites(message) {
        const favoriteItem = {
            message: { ...message, id: Date.now() + Math.random() },
            originalChatId: this.currentChatId
        };

        this.favoritesMessages.push(favoriteItem);
        localStorage.setItem('matilda_favorites', JSON.stringify(this.favoritesMessages));
        this.showNotification('Добавлено в избранное');
        
        // Обновляем разделы если мы на экране разделов
        if (!document.getElementById('favorites-sections-screen').classList.contains('hidden')) {
            this.renderFavoritesSections();
        }
    }

    openForwardedSource(chatId, sender, isChannel) {
        if (isChannel) {
            this.backToChats();
            setTimeout(() => {
                this.openChannel(chatId);
            }, 300);
        } else {
            this.showUserProfile(sender);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showFilePreview(messageId, fileName, fileSize, fileUrl) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        
        const isHtmlFile = fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm');
        
        let openButton = '';
        if (isHtmlFile) {
            openButton = '<button id="open-html-file" class="done-button" style="width: 100%; margin-top: 10px;">ОТКРЫТЬ</button>';
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <div style="text-align: center; padding: 20px;">
                    <img src="assets/download-icon.png" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 15px;">
                    <h3 style="margin-bottom: 8px;">${this.escapeHtml(fileName)}</h3>
                    <p style="color: #666666; font-size: 14px; margin-bottom: 20px;">${this.formatFileSize(fileSize)}</p>
                    <a href="${fileUrl}" download="${fileName}" style="text-decoration: none;">
                        <button class="done-button" style="width: 100%;">СКАЧАТЬ</button>
                    </a>
                    ${openButton}
                </div>
                <div class="modal-buttons">
                    <button id="close-file-preview" class="cancel-button">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-file-preview').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });
        
        if (isHtmlFile) {
            document.getElementById('open-html-file').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.openHtmlFile(fileUrl, fileName);
                }, 300);
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    openHtmlFile(fileUrl, fileName) {
        const htmlModal = document.createElement('div');
        htmlModal.className = 'mini-app-modal';
        htmlModal.id = 'html-viewer-modal';
        htmlModal.innerHTML = `
            <div class="mini-app-header">
                <button id="close-html-viewer" class="close-mini-app-btn">
                    <img src="assets/close-mini-app.png" alt="Закрыть">
                </button>
            </div>
            <div class="mini-app-content">
                <iframe src="${fileUrl}" class="mini-app-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
            </div>
        `;
        
        document.body.appendChild(htmlModal);
        htmlModal.classList.remove('hidden');
        
        document.getElementById('close-html-viewer').addEventListener('click', () => {
            this.closeHtmlViewer();
        });
        
        htmlModal.addEventListener('click', (e) => {
            if (e.target === htmlModal) {
                this.closeHtmlViewer();
            }
        });
    }

    closeHtmlViewer() {
        const htmlModal = document.getElementById('html-viewer-modal');
        if (htmlModal) {
            htmlModal.style.animation = 'slideDownMiniApp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
            setTimeout(() => {
                htmlModal.remove();
            }, 400);
        }
    }

    processMessageText(text, isSender = false) {
        let processedText = this.escapeHtml(text);
        
        if (isSender) {
            // Для отправителя - не делаем ссылки и упоминания кликабельными
            return processedText;
        }
        
        // Обрабатываем упоминания пользователей и каналов
        const mentionRegex = /@(\w+)/g;
        processedText = processedText.replace(mentionRegex, (match, username) => {
            return `<span class="message-mention" onclick="matildaMessenger.handleMentionClick('${username}')">${match}</span>`;
        });
        
        // Обрабатываем ссылки
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        processedText = processedText.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" class="message-link">${url}</a>`;
        });
        
        return processedText;
    }

    async handleMentionClick(username) {
        // Проверяем, это пользователь или канал
        const isUser = this.users[username];
        const channel = Object.values(this.channels).find(ch => ch.username === username);
        
        if (isUser) {
            this.showUserProfile(username);
        } else if (channel) {
            this.showChannelProfileFromMention(username);
        } else {
            // Пробуем загрузить с сервера
            try {
                const userResponse = await fetch(`/api/user/${username}`);
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    this.users[username] = userData;
                    this.showUserProfile(username);
                    return;
                }
            } catch (error) {}
            
            try {
                const channelsResponse = await fetch('/api/channels');
                const channels = await channelsResponse.json();
                const foundChannel = channels.find(ch => ch.username === username);
                if (foundChannel) {
                    this.channels[foundChannel.id] = foundChannel;
                    this.showChannelProfileFromMention(username);
                    return;
                }
            } catch (error) {}
            
            this.showNotification('Пользователь или канал не найден');
        }
    }

    showChannelProfileFromMention(channelUsername) {
        const channel = Object.values(this.channels).find(ch => ch.username === channelUsername);
        if (!channel) {
            this.showNotification('Канал не найден');
            return;
        }

        const channelId = Object.keys(this.channels).find(id => this.channels[id].username === channelUsername);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';

        const isMember = channel.members && channel.members.includes(this.currentUser);
        const joinButton = !isMember 
            ? '<button id="join-channel-from-mention" class="done-button">Перейти</button>'
            : '<button id="open-channel-from-mention" class="done-button">Открыть</button>';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="channel-info-header">
                    <div class="channel-info-avatar">📢</div>
                    <h3>${channel.name}</h3>
                    <p>@${channel.username}</p>
                    <p class="channel-members">${(channel.members || []).length} подписчиков</p>
                </div>
                <div class="channel-description">
                    <p>${channel.description || 'Описание отсутствует'}</p>
                </div>
                <div class="modal-buttons">
                    <button id="close-channel-profile-btn" class="cancel-button">Закрыть</button>
                    ${joinButton}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-channel-profile-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        if (!isMember) {
            document.getElementById('join-channel-from-mention').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.joinChannel(channelId);
                }, 300);
            });
        } else {
            document.getElementById('open-channel-from-mention').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.openChannel(channelId);
                }, 300);
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    openMediaGallery() {
        if (this.currentChatType === 'channel') {
            const channel = this.channels[this.currentChatId];
            if (channel.creator !== this.currentUser && this.currentUser !== 'matilda') {
                this.showNotification('Только администратор может отправлять медиа');
                return;
            }
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*'; // Принимаем абсолютно любые файлы
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleMediaSelect(file);
            }
        };
        input.click();
    }

    handleMediaSelect(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            let mediaType = 'file';
            if (file.type.startsWith('image/')) {
                mediaType = 'image';
            } else if (file.type.startsWith('video/')) {
                mediaType = 'video';
            }
            // Все остальные типы файлов (включая .zip, .html, .pdf, .doc и т.д.) будут обрабатываться как 'file'
            
            const mediaData = {
                type: mediaType,
                url: e.target.result,
                name: file.name,
                size: file.size,
                mimeType: file.type || 'application/octet-stream'
            };

            this.selectedMedia = mediaData;
            this.showMediaPreview(mediaData);
        };
        reader.readAsDataURL(file);
    }

    showMediaPreview(mediaData) {
        // Удаляем предыдущий превью если есть
        const existingPreview = document.querySelector('.media-preview');
        if (existingPreview) existingPreview.remove();

        const preview = document.createElement('div');
        preview.className = 'media-preview';

        let mediaElement = '';
        if (mediaData.type === 'image') {
            mediaElement = `<img src="${mediaData.url}" alt="Превью">`;
        } else if (mediaData.type === 'video') {
            mediaElement = `<video src="${mediaData.url}" controls></video>`;
        } else {
            // Определяем тип файла для отображения соответствующей иконки/описания
            const fileExt = mediaData.name.split('.').pop().toLowerCase();
            let fileTypeLabel = 'Файл';
            
            if (['html', 'htm'].includes(fileExt)) {
                fileTypeLabel = 'HTML документ';
            } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) {
                fileTypeLabel = 'Архив';
            } else if (['pdf'].includes(fileExt)) {
                fileTypeLabel = 'PDF документ';
            } else if (['doc', 'docx'].includes(fileExt)) {
                fileTypeLabel = 'Word документ';
            } else if (['xls', 'xlsx'].includes(fileExt)) {
                fileTypeLabel = 'Excel документ';
            } else if (['txt'].includes(fileExt)) {
                fileTypeLabel = 'Текстовый файл';
            } else if (['mp3', 'wav', 'ogg'].includes(fileExt)) {
                fileTypeLabel = 'Аудио файл';
            }
            
            mediaElement = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px;">
                    <img src="assets/empty-files.png" style="width: 40px; height: 40px; object-fit: contain;">
                    <div>
                        <div style="font-size: 14px; font-weight: 500;">${this.escapeHtml(mediaData.name)}</div>
                        <div style="font-size: 11px; color: #666;">${fileTypeLabel} • ${this.formatFileSize(mediaData.size)}</div>
                    </div>
                </div>
            `;
        }

        preview.innerHTML = `
            ${mediaElement}
            <button class="remove-media-btn" onclick="matildaMessenger.removeMediaPreview()">✕</button>
        `;

        // Вставляем превью над панелью ввода
        const inputPanel = document.querySelector('.input-panel');
        inputPanel.parentNode.insertBefore(preview, inputPanel);
    }

    removeMediaPreview() {
        const preview = document.querySelector('.media-preview');
        if (preview) preview.remove();
        this.selectedMedia = null;
    }

    async sendMessage() {
        const text = this.messageInput.value.trim();

        if (!text && !this.selectedMedia) return;

        // Проверяем блокировку для чатов НА СЕРВЕРЕ
        if (this.currentChatType === 'chat') {
            const chat = this.chats[this.currentChatId];
            if (chat && chat.participants) {
                const otherUser = chat.participants.find(p => p !== this.currentUser);

                // Проверяем блокировку на сервере
                try {
                    const response = await fetch(`/api/check-blocked/${this.currentUser}/${otherUser}`);
                    const result = await response.json();

                    if (result.blocked) {
                        this.showNotification('Пользователь заблокировал вас');
                        this.messageInput.value = '';
                        this.removeMediaPreview();
                        return;
                    }
                } catch (error) {
                    console.log('Ошибка проверки блокировки');
                }
            }
        }

        // Проверяем права в канале
        if (this.currentChatType === 'channel') {
            const channel = this.channels[this.currentChatId];
            if (channel && channel.creator !== this.currentUser && this.currentUser !== 'matilda') {
                this.showNotification('Только администратор может отправлять сообщения');
                return;
            }
        }

        const messageData = {
            id: Date.now() + Math.random(), // Уникальный ID
            sender: this.currentUser,
            text: text,
            media: this.selectedMedia,
            timestamp: Date.now()
        };

        // Отображаем сообщение только локально (без сохранения)
        this.displayMessage(messageData);
        this.scrollToBottom();

        // Определяем участников чата
        let participants = null;
        if (this.currentChatType === 'chat' && this.chats[this.currentChatId]) {
            participants = this.chats[this.currentChatId].participants;
        }

        // Если это избранное, сохраняем локально
        if (this.currentChatType === 'favorites') {
            if (!this.messages['favorites']) {
                this.messages['favorites'] = [];
            }
            this.messages['favorites'].push(messageData);
            localStorage.setItem('matilda_messages', JSON.stringify(this.messages));
            
            this.favoritesMessages.push({
                message: messageData,
                originalChatId: 'favorites'
            });
            localStorage.setItem('matilda_favorites', JSON.stringify(this.favoritesMessages));
        } else {
            // Отправляем сообщение через сокет
            this.socket.emit('send_message', {
                chatId: this.currentChatId,
                message: {
                    text: text,
                    media: this.selectedMedia
                },
                sender: this.currentUser,
                chatType: this.currentChatType,
                participants: participants
            });
        }

        this.messageInput.value = '';
        this.removeMediaPreview();
    }

    backToChats() {
        this.chatTitle.onclick = null;
        const existingMenu = document.querySelector('.chat-menu-btn');
        if (existingMenu) existingMenu.remove();

        // Удаляем подложку канала если есть
        const existingFooter = document.querySelector('.channel-footer');
        if (existingFooter) existingFooter.remove();

        // Удаляем подложку блокировки если есть
        this.removeBlockedFooter();

        // Восстанавливаем состояние поля ввода
        document.querySelector('.input-panel').style.display = 'flex';
        this.messageInput.disabled = false;
        this.messageInput.placeholder = 'Введите сообщение...';
        this.sendBtn.disabled = false;

        this.chatScreen.style.opacity = '0';
        setTimeout(() => {
            this.chatScreen.classList.add('hidden');
            this.messengerScreen.classList.remove('hidden');
            this.messengerScreen.style.opacity = '0';
            setTimeout(() => {
                this.messengerScreen.style.opacity = '1';
            }, 10);
        }, 300);
        this.currentChatId = null;
        this.currentChatType = null;
        this.loadChats();
    }

    showSettings() {
        this.messengerScreen.style.opacity = '0';
        setTimeout(() => {
            this.messengerScreen.classList.add('hidden');
            this.settingsScreen.classList.remove('hidden');
            this.settingsScreen.style.opacity = '0';
            setTimeout(() => {
                this.settingsScreen.style.opacity = '1';
            }, 10);
        }, 300);
        this.updateProfileInfo();
        this.updateCustomizationButtonVisibility();
    }

    backToMessenger() {
        this.settingsScreen.style.opacity = '0';
        setTimeout(() => {
            this.settingsScreen.classList.add('hidden');
            this.messengerScreen.classList.remove('hidden');
            this.messengerScreen.style.opacity = '0';
            setTimeout(() => {
                this.messengerScreen.style.opacity = '1';
            }, 10);
        }, 300);
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            // Очищаем все данные пользователя
            localStorage.removeItem('matilda_current_user');
            localStorage.removeItem('matilda_users');
            localStorage.removeItem('matilda_chats');
            localStorage.removeItem('matilda_channels');
            localStorage.removeItem('matilda_messages');
            localStorage.removeItem('matilda_blocked');

            // Сброс состояния приложения
            this.currentUser = null;
            this.users = {};
            this.chats = {};
            this.channels = {};
            this.messages = {};
            this.blockedUsers = {};
            this.currentChatId = null;
            this.currentChatType = null;

            this.settingsScreen.style.opacity = '0';
            setTimeout(() => {
                this.settingsScreen.classList.add('hidden');
                this.authScreen.classList.remove('hidden');
                this.authScreen.style.opacity = '0';
                setTimeout(() => {
                    this.authScreen.style.opacity = '1';
                }, 10);
            }, 300);

            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
            this.switchToLogin();

            this.showNotification('Вы вышли из аккаунта');
        }
    }

    showNotification(message) {
        this.notificationText.textContent = message;
        this.notification.style.transform = 'translateX(100%)';
        this.notification.classList.remove('hidden');
        setTimeout(() => {
            this.notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            this.hideNotification();
        }, 4000);
    }

    hideNotification() {
        this.notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            this.notification.classList.add('hidden');
        }, 300);
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showEditProfile() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'edit-profile-modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Редактировать профиль</h3>
                <input type="text" id="edit-name" placeholder="Имя" value="${this.users[this.currentUser].name}" class="input-field">
                <input type="text" id="edit-username" placeholder="Никнейм" value="${this.currentUser}" class="input-field">
                <textarea id="edit-description" placeholder="Описание" class="input-field" rows="3">${this.users[this.currentUser].description || ''}</textarea>
                <button id="edit-avatar-btn" class="input-field" style="text-align: left; cursor: pointer;">Выбрать фото профиля</button>
                <div class="modal-buttons">
                    <button id="cancel-edit-btn" class="cancel-button">Отмена</button>
                    <button id="save-edit-btn" class="done-button">Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('edit-avatar-btn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.users[this.currentUser].avatar = e.target.result;
                        document.getElementById('edit-avatar-btn').textContent = 'Фото выбрано ✓';
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('save-edit-btn').addEventListener('click', () => {
            this.saveProfile();
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    saveProfile() {
        const newName = document.getElementById('edit-name').value.trim();
        const newUsername = document.getElementById('edit-username').value.trim();
        const newDescription = document.getElementById('edit-description').value.trim();

        if (!newName || !newUsername) {
            this.showNotification('Заполните все поля');
            return;
        }

        if (newUsername.length < 5) {
            this.showNotification('Никнейм должен содержать минимум 5 символов');
            return;
        }

        const isUserTaken = newUsername !== this.currentUser && this.users[newUsername];
        const isChannelTaken = Object.values(this.channels).some(channel => channel.username === newUsername);

        if (isUserTaken || isChannelTaken) {
            this.showNotification('Пользователь с таким именем уже существует');
            return;
        }

        this.users[this.currentUser].name = newName;
        this.users[this.currentUser].description = newDescription;

        if (newUsername !== this.currentUser) {
            this.users[newUsername] = this.users[this.currentUser];
            delete this.users[this.currentUser];
            this.currentUser = newUsername;
            localStorage.setItem('matilda_current_user', newUsername);
        }

        localStorage.setItem('matilda_users', JSON.stringify(this.users));
        this.updateProfileInfo();
        this.showNotification('Профиль обновлен');
    }

    showPrivacyPolicy() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'privacy-modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content privacy-content">
                <h3>Политика конфиденциальности</h3>
                <div class="privacy-text">
                    <h4>Добро пожаловать в ебейший мессенджер Матильда!</h4>
                    <p>Матильда - это самый не безопасный мессенджер.</p>

                    <h4>Что мы собираем:</h4>
                    <p>• Абсолютно всё. Даже информацию о твоём аккаунте в укради брейнрот.</p>
                    <p>• Ваши сообщения уходят хуй пойми кому.</p>
                    <p>• Мы знаем, что вы пишете. И если вы напишите хоть что то сука плохое про Матильду вам пезда.</p>
                    <p>• Метаданные, геолокация и прочая хуйня хранится на нашем сервере (на старом компьютере в квартире 100 летней бабки который можно взломать даже просто пройдя рядом).</p>
                    <p>• Ваши нюдсы отправляются в сеть (да и фото котиков тоже).</p>

                    <h4>Небезопасность
                    :</h4>
                    <p>• Все сообщения в открытом доступе и видны всем.</p>
                    <p>• Наши сервера могут иногда ломаться и из за этого к вам могут приезжать ребята из ФСБ</p>
                    <p>• Сука когда ты дочитал до этого момента мы слили всю инфу о тебе. лол.</p>
                    <p>• Алгоритмы расшифрования написаны на языке программирования "Cись++".</p>

                    <h4>Что мы делаем :</h4>
                    <p>• Читаем ваши сообщения.</p>
                    <p>• Следим за вами (даже когда вы срёте).</p>
                    <p>• Передаем данные правительству всех стран (чтобы посмотрели на вас какой вы долбаёб и удалили вас с планеты).</p>
                    <p>• Анализируем ваше поведение для рекламы сосокоина.</p>

                    <h4>Заключение:</h4>
                    <p>Матильда создана людьми для холодильников а можно 2 шаурмы для √9=3. Мы хотим, чтобы вы общались свободно, небезопасно и с удовольствием. Нахуй конфиденциальность, СВОБОДУ ДАННЫМ!</p>
                </div>
                <div class="modal-buttons">
                    <button id="close-privacy-btn" class="done-button">Все ясно, бля</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-privacy-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    showCreateChannel() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'create-channel-modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Новый канал</h3>
                <input type="text" id="channel-name" placeholder="Название канала" class="input-field">
                <div id="username-field">
                    <input type="text" id="channel-username" placeholder="Юзернейм канала (без @)" class="input-field">
                </div>
                <input type="text" id="channel-description" placeholder="Описание канала" class="input-field">
                <div class="channel-type">
                    <label><input type="radio" name="channel-type" value="public" checked> Публичный канал</label>
                    <label><input type="radio" name="channel-type" value="private"> Приватный канал</label>
                </div>
                <div class="modal-buttons">
                    <button id="cancel-channel-btn" class="cancel-button">Отмена</button>
                    <button id="create-channel-btn-modal" class="done-button">Создать</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        // Скрытие/показ поля юзернейма
        const publicRadio = document.querySelector('input[name="channel-type"][value="public"]');
        const privateRadio = document.querySelector('input[name="channel-type"][value="private"]');
        const usernameField = document.getElementById('username-field');

        publicRadio.addEventListener('change', () => {
            if (publicRadio.checked) {
                usernameField.style.display = 'block';
            }
        });

        privateRadio.addEventListener('change', () => {
            if (privateRadio.checked) {
                usernameField.style.display = 'none';
            }
        });

        document.getElementById('channel-username').addEventListener('input', (e) => {
            this.checkChannelUsernameAvailability(e.target.value);
        });

        document.getElementById('cancel-channel-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('create-channel-btn-modal').addEventListener('click', () => {
            this.createChannel();
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    checkChannelUsernameAvailability(username) {
        if (!username || username.length < 3) return;

        const isUserTaken = this.users[username];
        const isChannelTaken = Object.values(this.channels).some(channel => channel.username === username);

        const input = document.getElementById('channel-username');
        if (isUserTaken || isChannelTaken) {
            input.style.borderColor = '#ff4444';
            input.style.boxShadow = '0 0 0 2px rgba(255, 68, 68, 0.2)';
        } else {
            input.style.borderColor = '#00aa00';
            input.style.boxShadow = '0 0 0 2px rgba(0, 170, 0, 0.2)';
        }
    }

    async createChannel() {
        const name = document.getElementById('channel-name').value.trim();
        const description = document.getElementById('channel-description').value.trim();
        const type = document.querySelector('input[name="channel-type"]:checked').value;

        if (!name) {
            this.showNotification('Введите название канала');
            return;
        }

        let username = '';
        if (type === 'public') {
            username = document.getElementById('channel-username').value.trim();
            if (!username) {
                this.showNotification('Введите юзернейм канала');
                return;
            }

            if (username.length < 5) {
                this.showNotification('Юзернейм канала должен содержать минимум 5 символов');
                return;
            }
        }

        try {
            const response = await fetch('/api/channels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    username,
                    description,
                    isPublic: type === 'public',
                    creator: this.currentUser
                })
            });

            const result = await response.json();

            if (result.success) {
                this.channels[result.channelId] = result.channel;
                this.loadChats();

                if (type === 'private') {
                    this.showNotification(`Приватный канал "${name}" создан! Ссылка: ${result.channel.inviteLink}`);
                } else {
                    this.showNotification(`Канал "${name}" создан`);
                }
            } else {
                this.showNotification(result.message);
            }
        } catch (error) {
            this.showNotification('Ошибка создания канала');
        }
    }

    showChannelInfo(channelId) {
        const channel = this.channels[channelId];
        if (!channel) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'channel-info-modal';
        modal.style.opacity = '0';

        const isCreator = channel.creator === this.currentUser;
        const editButton = isCreator ? '<button id="edit-channel-btn" class="done-button">Редактировать</button>' : '';

        // Информация о донатах для админа
        const totalDonations = this.channelDonations[channelId] || 0;
        let donationsInfo = '';
        if (isCreator && totalDonations > 0) {
            donationsInfo = `
                <div class="channel-donations-info" id="channel-donations-exchange">
                    <img src="assets/pezdi-icon-post.png" alt="Пёзды">
                    <div class="channel-donations-text">
                        <div class="channel-donations-label">Всего донатов:</div>
                        <div class="channel-donations-count">${this.formatPezdyCount(totalDonations)}</div>
                    </div>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-content">
                <div class="channel-info-header">
                    <div class="channel-info-avatar">📢</div>
                    <h3>${channel.name}</h3>
                    <p>@${channel.username}</p>
                    <p class="channel-members">${(channel.members || []).length} подписчиков</p>
                </div>
                ${donationsInfo}
                <div class="channel-description">
                    <p>${channel.description || 'Описание отсутствует'}</p>
                </div>
                <div class="modal-buttons">
                    <button id="close-channel-info-btn" class="cancel-button">Закрыть</button>
                    ${editButton}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-channel-info-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        if (isCreator) {
            document.getElementById('edit-channel-btn').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.showEditChannel(channelId);
                }, 300);
            });

            if (totalDonations > 0) {
                document.getElementById('channel-donations-exchange').addEventListener('click', () => {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        this.showPezdyExchangeModal(channelId, totalDonations);
                    }, 300);
                });
            }
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    showPezdyExchangeModal(channelId, totalDonations) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';

        const canExchangePremium = totalDonations >= 100;
        const premiumButton = canExchangePremium 
            ? '<button id="exchange-premium-btn" class="done-button">Обменять на Premium (100 Пёзд)</button>'
            : '<button class="done-button" disabled style="opacity: 0.5;">Обменять на Premium (100 Пёзд)</button>';

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Обмен Пёзд</h3>
                <p style="color: #FFD700; font-size: 24px; margin: 20px 0;">
                    ${this.formatPezdyCount(totalDonations)} Пёзд
                </p>
                <p style="color: #666666; margin-bottom: 20px;">Доступно для обмена</p>
                <div class="settings-menu" style="margin: 20px 0;">
                    ${premiumButton}
                </div>
                <div class="modal-buttons">
                    <button id="close-exchange-btn" class="cancel-button">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-exchange-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        if (canExchangePremium) {
            document.getElementById('exchange-premium-btn').addEventListener('click', async () => {
                await this.exchangePezdyForPremium(channelId);
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    async exchangePezdyForPremium(channelId) {
        if (!this.channelDonations[channelId] || this.channelDonations[channelId] < 100) {
            this.showNotification('Недостаточно Пёзд для обмена');
            return;
        }

        // Убираем 100 пёзд из донатов канала
        this.channelDonations[channelId] -= 100;
        localStorage.setItem('matilda_channel_donations', JSON.stringify(this.channelDonations));

        // Активируем Premium на 30 дней
        const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);

        try {
            await fetch('/api/premium-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: this.currentUser,
                    expiresAt: expiresAt,
                    grantedByAdmin: false
                })
            });

            this.premiumUsers[this.currentUser] = {
                activatedAt: Date.now(),
                expiresAt: expiresAt
            };

            this.updatePremiumStatus();
            this.updateProfileInfo();
            this.updateCustomizationButtonVisibility();
            this.showNotification('Premium активирован на 1 месяц!');
        } catch (error) {
            this.showNotification('Ошибка активации Premium');
        }
    }

    // Методы для ботов
    startBotChat() {
        // Сохраняем факт запуска бота
        if (this.currentBotChat) {
            localStorage.setItem(`bot_started_${this.currentUser}_${this.currentBotChat}`, 'true');
        }
        
        this.botStartPanel.classList.add('hidden');
        document.querySelector('.input-panel').style.display = 'flex';
        this.voiceBtn.style.display = 'none';
        this.miniAppBtn.classList.remove('hidden');
        this.messageInput.focus();
    }

    openMiniApp() {
        const miniAppUrl = this.botMiniApps[this.currentBotChat];
        const miniAppContent = document.getElementById('mini-app-content');
        
        if (miniAppUrl && miniAppUrl.trim() !== '') {
            miniAppContent.innerHTML = `<iframe src="${miniAppUrl}" class="mini-app-iframe"></iframe>`;
        } else {
            miniAppContent.innerHTML = `
                <img src="assets/no-mini-app.png" alt="Нет Mini App" class="no-mini-app-icon">
                <p class="no-mini-app-text">У этого бота нету Mini App</p>
            `;
        }
        
        this.miniAppModal.classList.remove('hidden');
    }

    closeMiniApp() {
        // Добавляем анимацию закрытия
        this.miniAppModal.style.animation = 'slideDownMiniApp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
        
        setTimeout(() => {
            this.miniAppModal.classList.add('hidden');
            this.miniAppModal.style.animation = '';
        }, 400);
    }

    // Методы для звонков
    async initiateCall() {
        if (this.currentChatType !== 'chat') {
            this.showNotification('Звонки доступны только в личных чатах');
            return;
        }

        const chat = this.chats[this.currentChatId];
        if (!chat || !chat.participants) return;

        const otherUser = chat.participants.find(p => p !== this.currentUser);
        if (!otherUser) return;

        // Проверяем блокировку
        if (this.isUserBlocked(this.currentUser, otherUser)) {
            this.showNotification('Пользователь заблокировал вас');
            return;
        }

        this.currentCall = {
            chatId: this.currentChatId,
            caller: this.currentUser,
            callee: otherUser,
            startTime: null
        };

        // Отправляем запрос на звонок
        this.socket.emit('initiate_call', {
            chatId: this.currentChatId,
            caller: this.currentUser,
            callee: otherUser
        });

        this.showNotification('Звоним...');

        // Таймаут 30 секунд - если не ответили, сбрасываем звонок
        this.callTimeout = setTimeout(() => {
            if (this.currentCall && !this.currentCall.startTime) {
                this.showNotification('Абонент не отвечает');
                this.sendCallMessage('declined');
                this.currentCall = null;
            }
        }, 30000);
    }

    async handleIncomingCall(data) {
        const { chatId, caller } = data;
        const user = this.users[caller];

        this.currentCall = {
            chatId: chatId,
            caller: caller,
            callee: this.currentUser,
            startTime: null
        };

        // Показываем экран входящего звонка
        const userName = user?.name || caller;
        const firstLetter = userName.charAt(0).toUpperCase();

        document.getElementById('incoming-call-name').textContent = userName;

        const incomingAvatar = document.getElementById('incoming-call-avatar');
        if (user && user.avatar) {
            incomingAvatar.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            incomingAvatar.textContent = firstLetter;
        }

        this.incomingCallScreen.classList.remove('hidden');

        // Воспроизводим рингтон
        this.callRingtone = new Audio('assets/call-audio.mp3');
        this.callRingtone.loop = true;
        this.callRingtone.play().catch(err => console.log('Не удалось воспроизвести рингтон'));

        // Таймаут 30 секунд - автоматически отклоняем если не ответили
        this.callTimeout = setTimeout(() => {
            if (this.currentCall && !this.currentCall.startTime) {
                this.declineCall();
            }
        }, 30000);
    }

    async acceptCall() {
        // Очищаем таймаут
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }

        this.incomingCallScreen.classList.add('hidden');

        // Останавливаем рингтон
        if (this.callRingtone) {
            this.callRingtone.pause();
            this.callRingtone = null;
        }

        // Получаем доступ к медиа-устройствам
        try {
            // Запрашиваем и аудио, и видео
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: this.currentCamera
                }
            });

            console.log('Получены локальные медиа:', this.localStream.getTracks().map(t => t.kind));

            // Отображаем локальное видео
            this.localVideo.srcObject = this.localStream;
            this.localVideo.muted = true;
            this.localVideo.autoplay = true;
            this.isVideoEnabled = true;
            this.videoBtn.classList.add('active');

            // Создаем WebRTC соединение
            await this.createPeerConnection();

            this.startCall();

            // Отправляем уведомление о принятии звонка
            this.socket.emit('accept_call', {
                chatId: this.currentCall.chatId,
                caller: this.currentCall.caller,
                callee: this.currentUser
            });
        } catch (error) {
            console.error('Error accessing media devices:', error);
            this.showNotification('Не удалось получить доступ к микрофону/камере');
            this.currentCall = null;
            this.endCall();
        }
    }

    declineCall() {
        // Очищаем таймаут
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }

        this.incomingCallScreen.classList.add('hidden');

        // Останавливаем рингтон
        if (this.callRingtone) {
            this.callRingtone.pause();
            this.callRingtone = null;
        }

        if (this.currentCall) {
            this.socket.emit('decline_call', {
                chatId: this.currentCall.chatId,
                caller: this.currentCall.caller,
                callee: this.currentUser
            });

            // Отправляем сообщение об отклоненном звонке
            this.sendCallMessage('declined');
        }

        this.currentCall = null;
    }

    async handleCallAccepted(data) {
        // Очищаем таймаут
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }

        // Получаем доступ к медиа-устройствам
        try {
            // Запрашиваем и аудио, и видео
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: this.currentCamera
                }
            });

            console.log('Получены локальные медиа для звонящего:', this.localStream.getTracks().map(t => t.kind));

            // Отображаем локальное видео
            this.localVideo.srcObject = this.localStream;
            this.localVideo.muted = true;
            this.localVideo.autoplay = true;
            this.isVideoEnabled = true;
            this.videoBtn.classList.add('active');

            // Создаем WebRTC соединение
            await this.createPeerConnection();

            this.startCall();

            // Создаем и отправляем offer
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await this.peerConnection.setLocalDescription(offer);

            console.log('Отправляем offer');
            this.socket.emit('offer', {
                chatId: this.currentCall.chatId,
                offer: offer,
                to: this.currentCall.callee
            });
        } catch (error) {
            console.error('Error starting call:', error);
            this.showNotification('Не удалось начать звонок');
            this.endCall();
        }
    }

    handleCallDeclined() {
        // Очищаем таймаут
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }

        this.showNotification('Звонок отклонен');
        this.sendCallMessage('declined');
        this.currentCall = null;
    }

    async createPeerConnection() {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(config);

        // Добавляем все треки из локального потока
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                console.log('Добавляем локальный трек:', track.kind, track.enabled);
                try {
                    this.peerConnection.addTrack(track, this.localStream);
                } catch (e) {
                    console.error("Error adding track to peer connection:", e);
                }
            });
        }

        // Обрабатываем удаленный поток - используем единый MediaStream
        this.remoteStream = new MediaStream();
        
        this.peerConnection.ontrack = (event) => {
            console.log('Получен удаленный трек:', event.track.kind, 'readyState:', event.track.readyState);

            // Добавляем трек в единый удаленный поток
            this.remoteStream.addTrack(event.track);

            if (event.track.kind === 'audio') {
                // Для аудио создаем отдельный audio элемент
                if (!this.remoteAudioElement) {
                    this.remoteAudioElement = new Audio();
                    this.remoteAudioElement.autoplay = true;
                    this.remoteAudioElement.volume = 1.0;
                }
                // Устанавливаем поток с аудио треком
                this.remoteAudioElement.srcObject = new MediaStream([event.track]);
                
                this.remoteAudioElement.play().then(() => {
                    console.log('Аудио собеседника воспроизводится');
                }).catch(err => {
                    console.error('Ошибка воспроизведения аудио:', err);
                });
            }

            if (event.track.kind === 'video') {
                // Для видео используем video элемент
                const videoStream = new MediaStream(this.remoteStream.getVideoTracks());
                this.remoteVideo.srcObject = videoStream;
                this.remoteVideo.muted = true; // video элемент без звука
                this.remoteVideo.autoplay = true;

                // Убираем аватар когда получаем видео
                const avatarOverlay = document.getElementById('call-avatar-overlay');
                if (avatarOverlay) {
                    avatarOverlay.remove();
                }

                this.remoteVideo.play().then(() => {
                    console.log('Видео собеседника воспроизводится');
                }).catch(err => {
                    console.error('Ошибка воспроизведения видео:', err);
                });
            }

            console.log('Трек добавлен:', event.track.kind);
        };

        // Обрабатываем ICE кандидатов
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Отправляем ICE candidate');
                this.socket.emit('ice_candidate', {
                    chatId: this.currentCall.chatId,
                    candidate: event.candidate,
                    to: this.currentCall.caller === this.currentUser ? this.currentCall.callee : this.currentCall.caller
                });
            }
        };

        // Следим за состоянием соединения
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Состояние соединения:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'disconnected' || this.peerConnection.connectionState === 'failed' || this.peerConnection.connectionState === 'closed') {
                this.endCall();
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('Состояние ICE соединения:', this.peerConnection.iceConnectionState);
        };
    }

    async handleOffer(data) {
        const { offer } = data;

        console.log('Получен offer, устанавливаем удаленное описание');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        console.log('Создаем answer');
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        console.log('Отправляем answer');
        this.socket.emit('answer', {
            chatId: this.currentCall.chatId,
            answer: answer,
            to: this.currentCall.caller
        });
    }

    async handleAnswer(data) {
        const { answer } = data;
        console.log('Получен answer, устанавливаем удаленное описание');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Удаленное описание установлено, соединение должно быть установлено');
    }

    async handleIceCandidate(data) {
        const { candidate } = data;
        if (this.peerConnection && candidate) {
            try {
                console.log('Добавляем ICE candidate');
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('Ошибка добавления ICE candidate:', error);
            }
        }
    }

    startCall() {
        // Показываем экран звонка
        this.callScreen.classList.remove('hidden');

        const otherUser = this.currentCall.caller === this.currentUser ? this.currentCall.callee : this.currentCall.caller;
        const user = this.users[otherUser];
        const userName = user?.name || otherUser;

        this.callUserName.textContent = userName;
        this.callStartTime = Date.now();
        this.currentCall.startTime = this.callStartTime;

        // Скрываем локальное видео по умолчанию
        this.localVideo.style.display = 'none';

        // Показываем аватар вместо чёрного экрана
        this.showCallAvatar(otherUser);

        // Запускаем счетчик времени
        this.callDurationInterval = setInterval(() => {
            const elapsed = Date.now() - this.callStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.callDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    showCallAvatar(username) {
        const user = this.users[username];
        const firstLetter = (user?.name || username).charAt(0).toUpperCase();

        const avatarOverlay = document.createElement('div');
        avatarOverlay.id = 'call-avatar-overlay';
        avatarOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #003366, #0066cc);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1;
        `;

        const avatarDiv = document.createElement('div');
        avatarDiv.style.cssText = `
            width: 150px;
            height: 150px;
            background: #0088cc;
            border-radius: 75px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            font-weight: 500;
            margin-bottom: 20px;
        `;

        if (user && user.avatar) {
            avatarDiv.innerHTML = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatarDiv.textContent = firstLetter;
        }

        if (user && user.avatarBorder) {
            avatarDiv.style.background = user.avatarBorder;
            avatarDiv.style.padding = '3px';
        }

        avatarOverlay.appendChild(avatarDiv);
        document.querySelector('.call-video-container').appendChild(avatarOverlay);
    }

    endCall() {
        // Очищаем таймаут
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }

        // Останавливаем все потоки
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }
        if (this.remoteAudioElement) {
            this.remoteAudioElement.pause();
            this.remoteAudioElement.srcObject = null;
            this.remoteAudioElement = null;
        }


        // Закрываем соединение
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Останавливаем счетчик
        if (this.callDurationInterval) {
            clearInterval(this.callDurationInterval);
            this.callDurationInterval = null;
        }

        // Убираем оверлей с аватаром
        const avatarOverlay = document.getElementById('call-avatar-overlay');
        if (avatarOverlay) {
            avatarOverlay.remove();
        }

        // Скрываем экран звонка
        this.callScreen.classList.add('hidden');
        this.localVideo.srcObject = null;
        this.localVideo.style.display = 'none';
        this.remoteVideo.srcObject = null;

        // Отправляем сообщение о завершении звонка
        if (this.currentCall && this.currentCall.startTime) {
            const duration = Math.floor((Date.now() - this.currentCall.startTime) / 1000);
            this.sendCallMessage('completed', duration);

            // Уведомляем другого пользователя
            this.socket.emit('end_call', {
                chatId: this.currentCall.chatId,
                duration: duration,
                to: this.currentCall.caller === this.currentUser ? this.currentCall.callee : this.currentCall.caller
            });
        }

        this.currentCall = null;
        this.isMuted = false;
        this.isVideoEnabled = false;
        this.isSpeakerEnabled = false;
    }

    handleCallEnded(data) {
        const { duration } = data;

        // Очищаем таймаут
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }

        // Останавливаем все потоки
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }
        if (this.remoteAudioElement) {
            this.remoteAudioElement.pause();
            this.remoteAudioElement.srcObject = null;
            this.remoteAudioElement = null;
        }

        // Закрываем соединение
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Останавливаем счетчик
        if (this.callDurationInterval) {
            clearInterval(this.callDurationInterval);
            this.callDurationInterval = null;
        }

        // Убираем оверлей с аватаром
        const avatarOverlay = document.getElementById('call-avatar-overlay');
        if (avatarOverlay) {
            avatarOverlay.remove();
        }

        // Скрываем экран звонка
        this.callScreen.classList.add('hidden');
        this.incomingCallScreen.classList.add('hidden');
        this.localVideo.srcObject = null;
        this.localVideo.style.display = 'none';
        this.remoteVideo.srcObject = null;

        // Отправляем сообщение о завершении звонка
        if (duration > 0) {
            this.sendCallMessage('completed', duration);
        }

        this.currentCall = null;
        this.isMuted = false;
        this.isVideoEnabled = false;
        this.isSpeakerEnabled = false;
    }

    toggleMute() {
        if (!this.localStream) return;

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            this.isMuted = !audioTrack.enabled;

            const muteIcon = document.getElementById('mute-icon');
            if (this.isMuted) {
                muteIcon.src = 'assets/mic-off.png';
                this.muteBtn.classList.add('active');
            } else {
                muteIcon.src = 'assets/voice-icon.png';
                this.muteBtn.classList.remove('active');
            }
        }
    }

    toggleVideo() {
        if (!this.isVideoEnabled) {
            this.cameraSelectModal.classList.remove('hidden');
        } else {
            // Выключаем видео
            if (this.localStream) {
                const videoTracks = this.localStream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.stop();
                    this.localStream.removeTrack(track);
                });
            }

            // Удаляем видео трек из peer connection
            if (this.peerConnection) {
                const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    this.peerConnection.removeTrack(sender);
                }
            }

            this.isVideoEnabled = false;
            this.videoBtn.classList.remove('active');
            this.localVideo.style.display = 'none';
        }
    }

    async selectCamera(facing) {
        this.cameraSelectModal.classList.add('hidden');
        this.currentCamera = facing;

        try {
            // Останавливаем текущий видео поток если есть
            if (this.localStream) {
                const videoTracks = this.localStream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.stop();
                    this.localStream.removeTrack(track);
                });
            } else {
                // Создаем новый поток если его нет
                this.localStream = new MediaStream();
            }

            // Получаем новый видео поток
            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            const videoTrack = videoStream.getVideoTracks()[0];
            console.log('Получен видео трек:', videoTrack.label);

            // Добавляем в локальный поток
            this.localStream.addTrack(videoTrack);

            // Создаем НОВЫЙ MediaStream только с видео треком для localVideo
            const videoOnlyStream = new MediaStream([videoTrack]);
            this.localVideo.srcObject = videoOnlyStream;
            this.localVideo.muted = true; // muted для избежания эха
            this.localVideo.autoplay = true;

            // Добавляем в peer connection или заменяем существующий трек
            if (this.peerConnection) {
                const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    console.log('Заменяем существующий видео трек');
                    await sender.replaceTrack(videoTrack);
                } else {
                    console.log('Добавляем новый видео трек');
                    this.peerConnection.addTrack(videoTrack, this.localStream);
                }
            }

            this.isVideoEnabled = true;
            this.videoBtn.classList.add('active');
            this.localVideo.style.display = 'block';

            console.log('Видео включено');
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showNotification('Не удалось получить доступ к камере');
        }
    }

    toggleSpeaker() {
        this.isSpeakerEnabled = !this.isSpeakerEnabled;

        if (this.remoteAudioElement) {
            this.remoteAudioElement.volume = this.isSpeakerEnabled ? 1.0 : 0.5;
        }

        if (this.isSpeakerEnabled) {
            this.speakerBtn.classList.add('active');
        } else {
            this.speakerBtn.classList.remove('active');
        }
    }

    sendCallMessage(type, duration = 0) {
        if (!this.currentCall) return;

        let messageText = '';
        if (type === 'declined') {
            messageText = 'Отменённый звонок';
        } else if (type === 'completed') {
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            messageText = `Звонок (${minutes}:${seconds.toString().padStart(2, '0')})`;
        }

        const messageData = {
            id: Date.now() + Math.random(),
            sender: this.currentUser,
            text: messageText,
            timestamp: Date.now(),
            chatId: this.currentCall.chatId,
            isCallMessage: true,
            callType: type
        };

        // Сохраняем сообщение локально
        if (!this.messages[this.currentCall.chatId]) {
            this.messages[this.currentCall.chatId] = [];
        }
        this.messages[this.currentCall.chatId].push(messageData);
        localStorage.setItem('matilda_messages', JSON.stringify(this.messages));

        // Отправляем через сокет
        this.socket.emit('send_message', {
            chatId: this.currentCall.chatId,
            message: {
                text: messageText,
                isCallMessage: true,
                callType: type
            },
            sender: this.currentUser,
            chatType: 'chat',
            participants: this.chats[this.currentCall.chatId].participants
        });
    }

    showEditChannel(channelId) {
        const channel = this.channels[channelId];
        if (!channel || channel.creator !== this.currentUser) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'edit-channel-modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Редактировать канал</h3>
                <input type="text" id="edit-channel-name" placeholder="Название канала" value="${channel.name}" class="input-field">
                <input type="text" id="edit-channel-username" placeholder="Юзернейм канала" value="${channel.username || ''}" class="input-field">
                <input type="text" id="edit-channel-description" placeholder="Описание канала" value="${channel.description}" class="input-field">
                <button id="edit-channel-avatar-btn" class="input-field" style="text-align: left; cursor: pointer;">Выбрать аватар канала</button>
                <div class="channel-type">
                    <label><input type="radio" name="edit-channel-type" value="public" ${channel.isPublic ? 'checked' : ''}> Публичный канал</label>
                    <label><input type="radio" name="edit-channel-type" value="private" ${!channel.isPublic ? 'checked' : ''}> Приватный канал</label>
                </div>
                <div class="modal-buttons">
                    <button id="delete-channel-btn" class="cancel-button" style="background: #ff4444;">Удалить канал</button>
                    <button id="cancel-edit-channel-btn" class="cancel-button">Отмена</button>
                    <button id="save-edit-channel-btn" class="done-button">Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('edit-channel-avatar-btn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        channel.avatar = e.target.result;
                        document.getElementById('edit-channel-avatar-btn').textContent = 'Аватар выбран ✓';
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });

        document.getElementById('delete-channel-btn').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить канал?')) {
                delete this.channels[channelId];
                delete this.messages[channelId];
                localStorage.setItem('matilda_channels', JSON.stringify(this.channels));
                localStorage.setItem('matilda_messages', JSON.stringify(this.messages));
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.backToChats();
                    this.showNotification('Канал удален');
                }, 300);
            }
        });

        document.getElementById('cancel-edit-channel-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('save-edit-channel-btn').addEventListener('click', () => {
            this.saveChannelChanges(channelId);
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    saveChannelChanges(channelId) {
        const channel = this.channels[channelId];
        const newName = document.getElementById('edit-channel-name').value.trim();
        const newUsername = document.getElementById('edit-channel-username').value.trim();
        const newDescription = document.getElementById('edit-channel-description').value.trim();
        const newType = document.querySelector('input[name="edit-channel-type"]:checked').value;

        if (!newName || !newUsername) {
            this.showNotification('Заполните все обязательные поля');
            return;
        }

        if (newUsername.length < 5) {
            this.showNotification('Юзернейм канала должен содержать минимум 5 символов');
            return;
        }

        if (newUsername !== channel.username) {
            const isUserTaken = this.users[newUsername];
            const isChannelTaken = Object.values(this.channels).some(ch => ch.username === newUsername && ch !== channel);

            if (isUserTaken || isChannelTaken) {
                this.showNotification('Юзернейм уже занят');
                return;
            }
        }

        const wasPublic = channel.isPublic;

        channel.name = newName;
        channel.username = newUsername;
        channel.description = newDescription;
        channel.isPublic = newType === 'public';

        if (wasPublic && !channel.isPublic) {
            channel.inviteLink = this.generateInviteLink();
        }
        if (!wasPublic && channel.isPublic) {
            delete channel.inviteLink;
        }

        localStorage.setItem('matilda_channels', JSON.stringify(this.channels));

        if (this.currentChatId === channelId) {
            this.chatTitle.textContent = newName;
            this.chatStatus.textContent = `@${newUsername} • ${(channel.members || []).length} подписчиков`;
        }

        this.loadChats();
        this.showNotification('Канал обновлен');

        if (!channel.isPublic) {
            this.showNotification(`Ссылка приглашения: https://matilda.chat/invite/${channel.inviteLink}`);
        }
    }

    generateInviteLink() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    createChannelFooter(isRestricted) {
        // Удаляем предыдущую подложку если есть
        const existingFooter = document.querySelector('.channel-footer');
        if (existingFooter) existingFooter.remove();

        if (isRestricted) {
            const footer = document.createElement('div');
            footer.className = 'channel-footer';
            footer.innerHTML = `
                <div class="channel-restriction-message">
                    <img src="assets/block-icon.png" alt="Блокировка">
                    <span>Вы не администратор этого канала</span>
                </div>
            `;
            document.querySelector('.chat-screen').appendChild(footer);
        }
    }

    createBlockedFooter() {
        // Удаляем предыдущую подложку если есть
        const existingFooter = document.querySelector('.blocked-footer');
        if (existingFooter) existingFooter.remove();

        const footer = document.createElement('div');
        footer.className = 'blocked-footer';
        footer.innerHTML = `
            <div class="blocked-message">
                <span>🚫 Вы были заблокированы данным пользователем</span>
            </div>
        `;
        document.querySelector('.chat-screen').appendChild(footer);
    }

    removeBlockedFooter() {
        const existingFooter = document.querySelector('.blocked-footer');
        if (existingFooter) existingFooter.remove();
    }

    generatePrivateInviteLink() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'matilda.';
        for (let i = 0; i < 11; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    showChatListMenu(event, chatId, type) {
        // Проверяем закреплён ли чат в ТЕКУЩЕЙ папке
        const folderPinnedChats = this.folders[this.currentFolder].pinnedChats || [];
        const isPinned = folderPinnedChats.includes(chatId);
        const customFolders = Object.keys(this.folders).filter(id => id !== 'all');

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        
        let folderOption = '';
        if (customFolders.length > 0) {
            folderOption = `
                <div class="settings-item" id="add-to-folder">
                    <span class="settings-icon">📁</span>
                    <span>Добавить в папку</span>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Действия</h3>
                <div class="settings-menu">
                    <div class="settings-item" id="pin-chat">
                        <span class="settings-icon">📌</span>
                        <span>${isPinned ? 'Открепить' : 'Закрепить'}</span>
                    </div>
                    ${folderOption}
                </div>
                <div class="modal-buttons">
                    <button id="close-chat-list-menu" class="cancel-button">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('close-chat-list-menu').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('pin-chat').addEventListener('click', () => {
            this.togglePin(chatId);
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        if (customFolders.length > 0) {
            document.getElementById('add-to-folder').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.showAddToFolderOption(chatId);
                }, 300);
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    addSwipeGesture(element, chatId, type) {
        let startX = 0;
        let startY = 0;
        let moved = false;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            moved = false;
        });

        element.addEventListener('touchmove', (e) => {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - startX;
            const diffY = currentY - startY;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                moved = true;
                e.preventDefault();

                if (diffX > 50) {
                    element.style.transform = `translateX(${Math.min(diffX - 50, 100)}px)`;
                    element.style.background = '#1a4a1a';
                }
            }
        });

        element.addEventListener('touchend', (e) => {
            const currentX = e.changedTouches[0].clientX;
            const diffX = currentX - startX;

            element.style.transform = '';
            element.style.background = '';

            if (moved && diffX > 100) {
                // Создаем фейковое событие для показа меню
                const fakeEvent = { clientX: currentX, clientY: e.changedTouches[0].clientY };
                this.showChatListMenu(fakeEvent, chatId, type);
            }
        });
    }

    togglePin(chatId) {
        // Создаем уникальный ключ для закрепления в текущей папке
        const pinKey = `${this.currentFolder}_${chatId}`;
        
        if (!this.folders[this.currentFolder].pinnedChats) {
            this.folders[this.currentFolder].pinnedChats = [];
        }
        
        const pinnedChats = this.folders[this.currentFolder].pinnedChats;
        const index = pinnedChats.indexOf(chatId);
        
        if (index > -1) {
            pinnedChats.splice(index, 1);
            this.showNotification('Чат откреплен');
        } else {
            pinnedChats.push(chatId);
            this.showNotification('Чат закреплен');
        }

        localStorage.setItem('matilda_folders', JSON.stringify(this.folders));
        this.loadChats();
    }

    showTypingIndicator(username, isTyping) {
        const typingId = `typing-${username}`;
        const existingIndicator = document.getElementById(typingId);

        if (isTyping && !existingIndicator) {
            const indicator = document.createElement('div');
            indicator.id = typingId;
            indicator.className = 'typing-indicator';
            indicator.innerHTML = `
                <div class="typing-user">${this.users[username]?.name || username} печатает</div>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            this.messagesContainer.appendChild(indicator);
            this.scrollToBottom();
        } else if (!isTyping && existingIndicator) {
            existingIndicator.remove();
        }
    }

    showAvatarUpload() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Фото профиля</h3>
                <div class="modal-buttons">
                    <button id="upload-avatar-btn" class="done-button">Загрузить фото</button>
                    ${this.users[this.currentUser].avatar ? '<button id="delete-avatar-btn" class="cancel-button" style="background: #ff4444;">Удалить фото</button>' : ''}
                    <button id="cancel-avatar-btn" class="cancel-button">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('upload-avatar-btn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        await this.updateProfile({ avatar: e.target.result });
                        modal.style.opacity = '0';
                        setTimeout(() => {
                            document.body.removeChild(modal);
                        }, 300);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });

        if (this.users[this.currentUser].avatar) {
            document.getElementById('delete-avatar-btn').addEventListener('click', async () => {
                await this.updateProfile({ avatar: '' });
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            });
        }

        document.getElementById('cancel-avatar-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    async updateProfile(data) {
        try {
            const response = await fetch(`/api/user/${this.currentUser}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                Object.assign(this.users[this.currentUser], data);
                this.updateProfileInfo();
                this.showNotification('Профиль обновлен');

                // Уведомляем других пользователей об обновлении профиля
                this.socket.emit('profile_updated', {
                    username: this.currentUser,
                    ...this.users[this.currentUser]
                });
            }
        } catch (error) {
            this.showNotification('Ошибка обновления профиля');
        }
    }

    // Методы для работы с голосовыми сообщениями
    async startVoiceRecording() {
        if (this.isRecording) return;

        // Проверяем блокировку для чатов
        if (this.currentChatType === 'chat') {
            const chat = this.chats[this.currentChatId];
            if (chat && chat.participants) {
                const otherUser = chat.participants.find(p => p !== this.currentUser);
                if (this.isUserBlocked(this.currentUser, otherUser)) {
                    this.showNotification('Пользователь заблокировал вас');
                    return;
                }
            }
        }

        // Проверяем права в канале
        if (this.currentChatType === 'channel') {
            const channel = this.channels[this.currentChatId];
            if (channel && channel.creator !== this.currentUser && this.currentUser !== 'matilda') {
                this.showNotification('Только администратор может отправлять сообщения');
                return;
            }
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            this.voiceBtn.classList.add('recording');

            this.showRecordingIndicator();

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.processVoiceRecording();
            };

            this.mediaRecorder.start();

        } catch (error) {
            this.showNotification('Не удалось получить доступ к микрофону');
        }
    }

    stopVoiceRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;
        this.voiceBtn.classList.remove('recording');

        this.hideRecordingIndicator();

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    showRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'recording-indicator';
        indicator.id = 'recording-indicator';

        indicator.innerHTML = `
            <div class="recording-icon">🎤</div>
            <div class="recording-text">Запись голосового сообщения...</div>
            <div class="recording-time">0:00</div>
        `;

        document.querySelector('.chat-screen').appendChild(indicator);

        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            const timeEl = indicator.querySelector('.recording-time');
            if (timeEl) {
                timeEl.textContent = timeString;
            }
        }, 100);
    }

    hideRecordingIndicator() {
        const indicator = document.getElementById('recording-indicator');
        if (indicator) {
            indicator.remove();
        }

        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    processVoiceRecording() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            
            if (duration < 1) {
                this.showNotification('Голосовое сообщение слишком короткое');
                return;
            }

            const voiceData = {
                type: 'voice',
                url: e.target.result,
                duration: duration
            };

            this.selectedMedia = voiceData;
            this.sendMessage();
        };
        
        reader.readAsDataURL(audioBlob);
    }

    processVoiceRecording() {
        // Скрываем индикатор записи
        this.hideRecordingIndicator();
        
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const duration = Date.now() - this.recordingStartTime;

        // Минимальная длительность 1 секунда
        if (duration < 1000) {
            this.showNotification('Слишком короткое сообщение');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const voiceData = {
                type: 'voice',
                url: e.target.result,
                duration: Math.floor(duration / 1000),
                waveform: this.generateWaveform(duration)
            };

            this.sendVoiceMessage(voiceData);
        };
        reader.readAsDataURL(audioBlob);
    }

    generateWaveform(duration) {
        // Генерируем простую волновую форму для визуализации
        const bars = Math.min(Math.max(Math.floor(duration / 200), 20), 50);
        const waveform = [];

        for (let i = 0; i < bars; i++) {
            // Случайная высота от 10% до 100%
            waveform.push(Math.floor(Math.random() * 90) + 10);
        }

        return waveform;
    }

    sendVoiceMessage(voiceData) {
        const messageData = {
            id: Date.now() + Math.random(),
            sender: this.currentUser,
            text: '',
            media: voiceData,
            timestamp: Date.now()
        };

        // Отображаем сообщение локально
        this.displayMessage(messageData);
        this.scrollToBottom();

        // Определяем участников чата
        let participants = null;
        if (this.currentChatType === 'chat' && this.chats[this.currentChatId]) {
            participants = this.chats[this.currentChatId].participants;
        }

        // Отправляем через сокет
        this.socket.emit('send_message', {
            chatId: this.currentChatId,
            message: {
                text: '',
                media: voiceData
            },
            sender: this.currentUser,
            chatType: this.currentChatType,
            participants: participants
        });
    }

    createVoiceMessageHTML(voiceMedia) {
        const duration = voiceMedia.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const waveformBars = voiceMedia.waveform.map((height, index) => 
            `<div class="voice-wave-bar" data-index="${index}" style="height: ${height}%"></div>`
        ).join('');

        const voiceId = `voice_${Date.now()}_${Math.random()}`;

        return `
            <div class="voice-message" data-voice-id="${voiceId}" data-voice-url="${voiceMedia.url}">
                <button class="voice-play-btn" onclick="matildaMessenger.toggleVoicePlayback('${voiceId}')">▶</button>
                <div class="voice-waveform" onclick="matildaMessenger.seekVoiceMessage('${voiceId}', event)">
                    ${waveformBars}
                </div>
                <div class="voice-duration">${durationText}</div>
            </div>
        `;
    }

    toggleVoicePlayback(voiceId) {
        const voiceElement = document.querySelector(`[data-voice-id="${voiceId}"]`);
        const playBtn = voiceElement.querySelector('.voice-play-btn');
        const voiceUrl = voiceElement.dataset.voiceUrl;

        if (this.playingAudios.has(voiceId)) {
            // Остановить воспроизведение
            const audio = this.playingAudios.get(voiceId);
            audio.pause();
            audio.currentTime = 0;
            this.playingAudios.delete(voiceId);
            playBtn.textContent = '▶';
            this.clearVoiceWaveform(voiceId);
        } else {
            // Остановить все другие голосовые сообщения
            this.playingAudios.forEach((audio, id) => {
                audio.pause();
                audio.currentTime = 0;
                const otherPlayBtn = document.querySelector(`[data-voice-id="${id}"] .voice-play-btn`);
                if (otherPlayBtn) otherPlayBtn.textContent = '▶';
                this.clearVoiceWaveform(id);
            });
            this.playingAudios.clear();

            // Начать воспроизведение
            const audio = new Audio(voiceUrl);
            this.playingAudios.set(voiceId, audio);
            playBtn.textContent = '⏸';

            audio.addEventListener('timeupdate', () => {
                this.updateVoiceWaveform(voiceId, audio.currentTime / audio.duration);
            });

            audio.addEventListener('ended', () => {
                this.playingAudios.delete(voiceId);
                playBtn.textContent = '▶';
                this.clearVoiceWaveform(voiceId);
            });

            audio.play().catch(() => {
                this.playingAudios.delete(voiceId);
                playBtn.textContent = '▶';
                this.showNotification('Ошибка воспроизведения');
            });
        }
    }

    seekVoiceMessage(voiceId, event) {
        if (!this.playingAudios.has(voiceId)) return;

        const waveform = event.currentTarget;
        const rect = waveform.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progress = clickX / rect.width;

        const audio = this.playingAudios.get(voiceId);
        audio.currentTime = progress * audio.duration;
    }

    updateVoiceWaveform(voiceId, progress) {
        const voiceElement = document.querySelector(`[data-voice-id="${voiceId}"]`);
        const bars = voiceElement.querySelectorAll('.voice-wave-bar');

        bars.forEach((bar, index) => {
            const barProgress = index / bars.length;
            if (barProgress <= progress) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    }

    clearVoiceWaveform(voiceId) {
        const voiceElement = document.querySelector(`[data-voice-id="${voiceId}"]`);
        if (voiceElement) {
            const bars = voiceElement.querySelectorAll('.voice-wave-bar');
            bars.forEach(bar => bar.classList.remove('active'));
        }
    }

    showPremiumScreen() {
        this.settingsScreen.style.opacity = '0';
        setTimeout(() => {
            this.settingsScreen.classList.add('hidden');
            this.premiumScreen.classList.remove('hidden');
            this.premiumScreen.style.opacity = '0';
            setTimeout(() => {
                this.premiumScreen.style.opacity = '1';
            }, 10);
        }, 300);
        this.updatePremiumStatus();
        this.addPremiumCustomizationButton();
    }

    showPezdyScreen() {
        this.premiumScreen.style.opacity = '0';
        setTimeout(() => {
            this.premiumScreen.classList.add('hidden');
            this.pezdyScreen.classList.remove('hidden');
            this.pezdyScreen.style.opacity = '0';
            setTimeout(() => {
                this.pezdyScreen.style.opacity = '1';
            }, 10);
        }, 300);
        this.updatePezdyBalance();
    }

    backFromPezdy() {
        this.pezdyScreen.style.opacity = '0';
        setTimeout(() => {
            this.pezdyScreen.classList.add('hidden');
            this.settingsScreen.classList.remove('hidden');
            this.settingsScreen.style.opacity = '0';
            setTimeout(() => {
                this.settingsScreen.style.opacity = '1';
            }, 10);
        }, 300);
        this.updatePezdyBalance();
    }

    showAddPezdyModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Получить Пёзды</h3>
                <input type="number" id="pezdy-amount-input" placeholder="Введите количество" class="input-field" min="1">
                <div class="modal-buttons">
                    <button id="cancel-pezdy-btn" class="cancel-button">Отмена</button>
                    <button id="confirm-pezdy-btn" class="done-button">Получить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('cancel-pezdy-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('confirm-pezdy-btn').addEventListener('click', () => {
            const amount = parseInt(document.getElementById('pezdy-amount-input').value);
            if (!amount || amount <= 0) {
                this.showNotification('Введите корректное количество');
                return;
            }
            this.addUserPezdy(this.currentUser, amount);
            this.updatePezdyBalance();
            this.showNotification(`Вы получили ${amount} Пёзд!`);
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    addPezdyToUser() {
        const amount = 50; // Даём 50 Пёзд за нажатие
        this.addUserPezdy(this.currentUser, amount);
        this.updatePezdyBalance();
        this.showNotification(`Вы получили ${amount} Пёзд!`);
    }

    updatePezdyBalance() {
        const balance = this.userPezdy[this.currentUser] || 0;
        this.userPezdyBalance.textContent = this.formatPezdyCount(balance);
    }

    formatPezdyCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'М';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'К';
        }
        return count.toString();
    }

    getUserPezdy(username) {
        return this.userPezdy[username] || 0;
    }

    addUserPezdy(username, amount) {
        if (!this.userPezdy[username]) {
            this.userPezdy[username] = 0;
        }
        this.userPezdy[username] += amount;
        localStorage.setItem('matilda_user_pezdy', JSON.stringify(this.userPezdy));
        if (username === this.currentUser) {
            this.updatePezdyBalance();
        }
    }

    removeUserPezdy(username, amount) {
        if (!this.userPezdy[username]) {
            this.userPezdy[username] = 0;
        }
        this.userPezdy[username] = Math.max(0, this.userPezdy[username] - amount);
        localStorage.setItem('matilda_user_pezdy', JSON.stringify(this.userPezdy));
        if (username === this.currentUser) {
            this.updatePezdyBalance();
        }
    }

    updateCustomizationButton() {
        const customBtn = document.getElementById('customization-btn');
        if (customBtn) {
            if (this.isPremiumUser(this.currentUser)) {
                customBtn.style.display = 'flex';
            } else {
                customBtn.style.display = 'none';
            }
        }
    }

    updateCustomizationButtonVisibility() {
        const headerBtn = document.getElementById('customization-btn-header');
        if (headerBtn) {
            if (this.isPremiumUser(this.currentUser)) {
                headerBtn.classList.add('visible');
            } else {
                headerBtn.classList.remove('visible');
            }
        }
    }

    showPremiumCustomization() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Кастомизация профиля</h3>
                <div class="premium-customization-menu">
                    <button id="add-profile-background" class="premium-custom-btn">Добавить баннер</button>
                    <button id="add-avatar-border" class="premium-custom-btn">Добавить обводку аватара</button>
                </div>
                <div class="modal-buttons">
                    <button id="close-customization" class="cancel-button">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('add-profile-background').addEventListener('click', () => {
            this.uploadProfileBackground();
        });

        document.getElementById('add-avatar-border').addEventListener('click', () => {
            this.selectAvatarBorder();
        });

        document.getElementById('close-customization').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    uploadProfileBackground() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    await this.updateProfile({ profileBackground: e.target.result });
                    this.showNotification('Фон профиля установлен');
                    this.updateProfileBackground();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    selectAvatarBorder() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Выбрать обводку аватара</h3>
                <div class="avatar-borders-grid">
                    <div class="border-option" data-border="linear-gradient(135deg, #FFD700, #FFA500)">
                        <div class="border-preview" style="background: linear-gradient(135deg, #FFD700, #FFA500);">Золотая</div>
                    </div>
                    <div class="border-option" data-border="linear-gradient(135deg, #667eea, #764ba2)">
                        <div class="border-preview" style="background: linear-gradient(135deg, #667eea, #764ba2);">Фиолетовая</div>
                    </div>
                    <div class="border-option" data-border="linear-gradient(135deg, #f093fb, #f5576c)">
                        <div class="border-preview" style="background: linear-gradient(135deg, #f093fb, #f5576c);">Розовая</div>
                    </div>
                    <div class="border-option" data-border="linear-gradient(135deg, #4facfe, #00f2fe)">
                        <div class="border-preview" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">Голубая</div>
                    </div>
                    <div class="border-option" data-border="linear-gradient(135deg, #43e97b, #38f9d7)">
                        <div class="border-preview" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">Зелёная</div>
                    </div>
                    <div class="border-option" data-border="linear-gradient(135deg, #fa709a, #fee140)">
                        <div class="border-preview" style="background: linear-gradient(135deg, #fa709a, #fee140);">Закат</div>
                    </div>
                    <div class="border-option" data-border="">
                        <div class="border-preview" style="background: #333;">Убрать</div>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button id="close-border-selection" class="cancel-button">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.querySelectorAll('.border-option').forEach(option => {
            option.addEventListener('click', async () => {
                const border = option.dataset.border;
                await this.updateProfile({ avatarBorder: border });
                this.showNotification('Обводка аватара обновлена');
                this.updateAvatarBorder();
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            });
        });

        document.getElementById('close-border-selection').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    updateProfileBackground() {
        const user = this.users[this.currentUser];
        const profileSection = document.querySelector('.profile-section');

        if (!profileSection) return;

        if (user && user.profileBackground) {
            profileSection.style.backgroundImage = `url(${user.profileBackground})`;
            profileSection.classList.add('has-background');
        } else {
            profileSection.style.backgroundImage = '';
            profileSection.classList.remove('has-background');
        }
    }

    updateAvatarBorder() {
        const user = this.users[this.currentUser];

        // Обновляем в настройках
        const settingsAvatar = document.getElementById('settings-avatar');
        if (settingsAvatar && user.avatarBorder) {
            settingsAvatar.style.background = user.avatarBorder;
            settingsAvatar.style.padding = '3px';
        } else if (settingsAvatar) {
            settingsAvatar.style.background = '#0088cc';
            settingsAvatar.style.padding = '0';
        }

        // Обновляем в сайдбаре
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar && user.avatarBorder) {
            profileAvatar.style.background = user.avatarBorder;
            profileAvatar.style.padding = '3px';
        } else if (profileAvatar) {
            profileAvatar.style.background = '#0088cc';
            profileAvatar.style.padding = '0';
        }
    }

    backFromPremium() {
        this.premiumScreen.style.opacity = '0';
        setTimeout(() => {
            this.premiumScreen.classList.add('hidden');
            this.settingsScreen.classList.remove('hidden');
            this.settingsScreen.style.opacity = '0';
            setTimeout(() => {
                this.settingsScreen.style.opacity = '1';
            }, 10);
        }, 300);
    }

    updatePremiumStatus() {
        const premiumData = this.premiumUsers[this.currentUser];

        if (premiumData && premiumData.expiresAt > Date.now()) {
            const expiryDate = new Date(premiumData.expiresAt);
            const dateString = expiryDate.toLocaleDateString('ru-RU');

            this.premiumStatusContainer.innerHTML = `
                <div class="premium-status">
                    ✓ Подписка активна до ${dateString}
                </div>
            `;
            this.activatePremiumBtn.disabled = true;
            this.activatePremiumBtn.textContent = 'Подписка активна';
        } else {
            this.premiumStatusContainer.innerHTML = '';
            this.activatePremiumBtn.disabled = false;
            this.activatePremiumBtn.textContent = 'Активировать';
        }
    }

    async activatePremium() {
        const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 дней

        try {
            await fetch('/api/premium-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: this.currentUser,
                    expiresAt: expiresAt,
                    grantedByAdmin: false
                })
            });

            this.premiumUsers[this.currentUser] = {
                activatedAt: Date.now(),
                expiresAt: expiresAt
            };

            this.updatePremiumStatus();
            this.updateProfileInfo();
            this.updateCustomizationButtonVisibility();
            this.showNotification('Matilda Premium активирован на 1 месяц!');
        } catch (error) {
            this.showNotification('Ошибка активации Premium');
        }
    }

    isPremiumUser(username) {
        const premiumData = this.premiumUsers[username];
        const isPremium = premiumData && premiumData.expiresAt > Date.now();

        // Если подписка истекла и пользователь текущий - удаляем кастомизацию
        if (!isPremium && username === this.currentUser && premiumData) {
            const user = this.users[username];
            if (user && (user.profileBackground || user.avatarBorder)) {
                this.updateProfile({ 
                    profileBackground: '', 
                    avatarBorder: '' 
                });
            }
        }

        return isPremium;
    }

    showAdminLogin() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Вход в админ-панель</h3>
                <input type="password" id="admin-password" placeholder="Введите пароль" class="input-field">
                <div class="modal-buttons">
                    <button id="cancel-admin-btn" class="cancel-button">Отмена</button>
                    <button id="login-admin-btn" class="done-button">Войти</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('cancel-admin-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('login-admin-btn').addEventListener('click', () => {
            const password = document.getElementById('admin-password').value;

            if (password === 'allfndr102') {
                this.adminLevel = 'full';
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.showAdminPanel();
                }, 300);
            } else if (password === 'alladmin5') {
                this.adminLevel = 'view';
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.showAdminPanel();
                }, 300);
            } else {
                this.showNotification('Неверный пароль');
            }
        });

        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('login-admin-btn').click();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    showAdminPanel() {
        this.settingsScreen.style.opacity = '0';
        setTimeout(() => {
            this.settingsScreen.classList.add('hidden');
            this.adminScreen.classList.remove('hidden');
            this.adminScreen.style.opacity = '0';
            setTimeout(() => {
                this.adminScreen.style.opacity = '1';
            }, 10);
        }, 300);

        if (this.adminLevel === 'full') {
            this.adminTitle.textContent = 'Админ-панель (Полный доступ)';
        } else {
            this.adminTitle.textContent = 'Админ-панель (Просмотр)';
        }

        this.loadAdminUsers();
    }

    backFromAdmin() {
        this.adminScreen.style.opacity = '0';
        setTimeout(() => {
            this.adminScreen.classList.add('hidden');
            this.settingsScreen.classList.remove('hidden');
            this.settingsScreen.style.opacity = '0';
            setTimeout(() => {
                this.settingsScreen.style.opacity = '1';
            }, 10);
        }, 300);
        this.adminLevel = null;
    }

    async loadAdminUsers() {
        try {
            const response = await fetch('/api/users');
            const allUsers = await response.json();

            this.adminUserList.innerHTML = '';

            allUsers.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'admin-user-item';

                const isPremium = this.isPremiumUser(user.username);

                let avatarContent = (user.name || user.username).charAt(0).toUpperCase();
                if (user.avatar) {
                    avatarContent = `<img src="${user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                }

                userItem.innerHTML = `
                    <div class="admin-user-avatar">${avatarContent}</div>
                    <div class="admin-user-info">
                        <div class="admin-user-name">${user.name || user.username}</div>
                        <div class="admin-user-username">@${user.username}</div>
                    </div>
                    ${isPremium ? '<div class="admin-user-premium">Premium</div>' : ''}
                `;

                if (this.adminLevel === 'full') {
                    userItem.onclick = () => this.showAdminUserMenu(user.username);
                }

                this.adminUserList.appendChild(userItem);
            });
        } catch (error) {
            this.showNotification('Ошибка загрузки пользователей');
        }
    }

    showAdminUserMenu(username) {
        const isPremium = this.isPremiumUser(username);
        const premiumData = this.premiumUsers[username];

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Управление: @${username}</h3>
                ${isPremium ? `<p style="color: #FFD700; margin-bottom: 15px;">Premium активен до ${new Date(premiumData.expiresAt).toLocaleDateString('ru-RU')}</p>` : ''}
                <div class="settings-menu" style="margin: 20px 0;">
                    <div class="settings-item" id="give-premium-month">
                        <span class="settings-icon">⭐</span>
                        <span>Выдать Premium на 1 месяц</span>
                    </div>
                    <div class="settings-item" id="give-premium-year">
                        <span class="settings-icon">🌟</span>
                        <span>Выдать Premium на 1 год</span>
                    </div>
                    ${isPremium ? `
                    <div class="settings-item" id="remove-premium">
                        <span class="settings-icon">❌</span>
                        <span>Отозвать Premium</span>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-buttons">
                    <button id="close-admin-user-menu" class="cancel-button">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('give-premium-month').addEventListener('click', () => {
            this.givePremium(username, 30);
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('give-premium-year').addEventListener('click', () => {
            this.givePremium(username, 365);
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        if (isPremium) {
            document.getElementById('remove-premium').addEventListener('click', () => {
                this.removePremium(username);
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            });
        }

        document.getElementById('close-admin-user-menu').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    async givePremium(username, days) {
        const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);

        this.premiumUsers[username] = {
            activatedAt: Date.now(),
            expiresAt: expiresAt,
            grantedByAdmin: true
        };

        localStorage.setItem('matilda_premium_users', JSON.stringify(this.premiumUsers));

        // Отправляем на сервер
        try {
            await fetch('/api/premium-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    expiresAt,
                    grantedByAdmin: true
                })
            });
        } catch (error) {
            console.error('Ошибка выдачи Premium на сервере');
        }

        this.loadAdminUsers();
        this.showNotification(`Premium выдан пользователю @${username} на ${days} дней`);

        // Обновляем интерфейс если это текущий пользователь
        if (username === this.currentUser) {
            this.updatePremiumStatus();
            this.updateProfileInfo();
        }
    }

    async removePremium(username) {
        delete this.premiumUsers[username];
        localStorage.setItem('matilda_premium_users', JSON.stringify(this.premiumUsers));

        // Отправляем на сервер
        try {
            await fetch(`/api/premium-users/${username}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Ошибка отзыва Premium на сервере');
        }

        this.loadAdminUsers();
        this.showNotification(`Premium отозван у пользователя @${username}`);

        // Обновляем интерфейс если это текущий пользователь
        if (username === this.currentUser) {
            this.updatePremiumStatus();
            this.updateProfileInfo();

            // Убираем кастомизацию
            const user = this.users[this.currentUser];
            if (user.profileBackground || user.avatarBorder) {
                await this.updateProfile({ 
                    profileBackground: '', 
                    avatarBorder: '' 
                });
            }
        }
    }

    // Методы для работы с папками
    showFoldersScreen() {
        this.settingsScreen.style.opacity = '0';
        setTimeout(() => {
            this.settingsScreen.classList.add('hidden');
            this.foldersScreen.classList.remove('hidden');
            this.foldersScreen.style.opacity = '0';
            setTimeout(() => {
                this.foldersScreen.style.opacity = '1';
            }, 10);
        }, 300);
        this.renderFoldersList();
    }

    backFromFolders() {
        this.foldersScreen.style.opacity = '0';
        setTimeout(() => {
            this.foldersScreen.classList.add('hidden');
            this.settingsScreen.classList.remove('hidden');
            this.settingsScreen.style.opacity = '0';
            setTimeout(() => {
                this.settingsScreen.style.opacity = '1';
            }, 10);
        }, 300);
    }

    renderFoldersList() {
        this.foldersList.innerHTML = '';
        Object.keys(this.folders).forEach(folderId => {
            if (folderId !== 'all') {
                const folder = this.folders[folderId];
                const folderItem = document.createElement('div');
                folderItem.className = 'folder-list-item';
                folderItem.innerHTML = `
                    <img src="assets/folder-icon.png" alt="${folder.name}" class="folder-item-icon">
                    <span>${folder.name}</span>
                `;
                folderItem.onclick = () => this.selectFolder(folderId);
                
                // Добавляем свайп для удаления
                this.addFolderSwipeGesture(folderItem, folderId);
                
                this.foldersList.appendChild(folderItem);
            }
        });
    }

    addFolderSwipeGesture(element, folderId) {
        let startX = 0;
        let moved = false;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            moved = false;
        });

        element.addEventListener('touchmove', (e) => {
            const currentX = e.touches[0].clientX;
            const diffX = currentX - startX;

            if (Math.abs(diffX) > 10) {
                moved = true;
                e.preventDefault();

                if (diffX > 50) {
                    element.style.transform = `translateX(${Math.min(diffX - 50, 100)}px)`;
                    element.style.background = '#ff4444';
                }
            }
        });

        element.addEventListener('touchend', (e) => {
            const currentX = e.changedTouches[0].clientX;
            const diffX = currentX - startX;

            element.style.transform = '';
            element.style.background = '';

            if (moved && diffX > 100) {
                this.showDeleteFolderConfirm(folderId);
            }
        });

        // Для ПК - контекстное меню
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showDeleteFolderConfirm(folderId);
        });
    }

    showDeleteFolderConfirm(folderId) {
        const folder = this.folders[folderId];
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Удалить папку "${folder.name}"?</h3>
                <div class="modal-buttons">
                    <button id="cancel-delete-folder" class="cancel-button">Отмена</button>
                    <button id="confirm-delete-folder" class="done-button" style="background: #ff4444;">Удалить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        document.getElementById('cancel-delete-folder').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        document.getElementById('confirm-delete-folder').addEventListener('click', () => {
            this.deleteFolder(folderId);
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
    }

    deleteFolder(folderId) {
        delete this.folders[folderId];
        
        // Удаляем привязки чатов к этой папке
        Object.keys(this.chatFolders).forEach(chatId => {
            if (this.chatFolders[chatId]) {
                this.chatFolders[chatId] = this.chatFolders[chatId].filter(id => id !== folderId);
            }
        });
        
        localStorage.setItem('matilda_folders', JSON.stringify(this.folders));
        localStorage.setItem('matilda_chat_folders', JSON.stringify(this.chatFolders));
        
        this.renderFoldersList();
        this.renderFolderTabs();
        this.showNotification('Папка удалена');
        
        // Если мы находились в удаленной папке, переключаемся на "Все"
        if (this.currentFolder === folderId) {
            this.currentFolder = 'all';
            this.loadChats();
        }
    }

    showCreateFolderModal() {
        this.createFolderModal.style.opacity = '0';
        this.createFolderModal.classList.remove('hidden');
        setTimeout(() => {
            this.createFolderModal.style.opacity = '1';
        }, 10);
        document.getElementById('folder-name-input').value = '';
        document.getElementById('folder-name-input').focus();
    }

    hideCreateFolderModal() {
        this.createFolderModal.style.opacity = '0';
        setTimeout(() => {
            this.createFolderModal.classList.add('hidden');
        }, 300);
    }

    createFolder() {
        const name = document.getElementById('folder-name-input').value.trim();
        if (!name) {
            this.showNotification('Введите название папки');
            return;
        }

        const folderId = 'folder_' + Date.now();
        this.folders[folderId] = {
            name: name,
            chats: []
        };
        localStorage.setItem('matilda_folders', JSON.stringify(this.folders));
        
        this.hideCreateFolderModal();
        this.renderFoldersList();
        this.renderFolderTabs();
        this.showNotification(`Папка "${name}" создана`);
    }

    selectFolder(folderId) {
        this.currentFolder = folderId;
        this.backFromFolders();
        this.backToMessenger();
        this.renderFolderTabs();
        this.loadChats();
    }

    renderFolderTabs() {
        // Проверяем, есть ли пользовательские папки
        const hasCustomFolders = Object.keys(this.folders).some(id => id !== 'all');
        
        let tabsContainer = document.querySelector('.folder-tabs');
        
        if (!hasCustomFolders) {
            // Если нет папок, удаляем контейнер
            if (tabsContainer) {
                tabsContainer.remove();
            }
            return;
        }
        
        if (!tabsContainer) {
            tabsContainer = document.createElement('div');
            tabsContainer.className = 'folder-tabs';
            const sidebar = document.getElementById('sidebar');
            const sidebarHeader = sidebar.querySelector('.sidebar-header');
            sidebarHeader.after(tabsContainer);
        }

        tabsContainer.innerHTML = '';

        // Всегда первая папка "Все"
        const allTab = document.createElement('div');
        allTab.className = 'folder-tab' + (this.currentFolder === 'all' ? ' active' : '');
        allTab.textContent = 'Все';
        allTab.onclick = () => this.switchFolder('all');
        tabsContainer.appendChild(allTab);

        // Остальные папки
        Object.keys(this.folders).forEach(folderId => {
            if (folderId !== 'all') {
                const folder = this.folders[folderId];
                const tab = document.createElement('div');
                tab.className = 'folder-tab' + (this.currentFolder === folderId ? ' active' : '');
                tab.textContent = folder.name;
                tab.onclick = () => this.switchFolder(folderId);
                tabsContainer.appendChild(tab);
            }
        });
    }

    switchFolder(folderId) {
        this.currentFolder = folderId;
        this.renderFolderTabs();
        this.loadChats();
    }

    showAddToFolderOption(chatId) {
        // Проверяем, есть ли папки кроме "Все"
        const customFolders = Object.keys(this.folders).filter(id => id !== 'all');
        if (customFolders.length === 0) {
            return; // Не показываем опцию если нет пользовательских папок
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Добавить в папку</h3>
                <div id="folder-select-list"></div>
                <div class="modal-buttons">
                    <button class="cancel-button" onclick="this.closest('.modal').remove()">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        const folderSelectList = modal.querySelector('#folder-select-list');
        customFolders.forEach(folderId => {
            const folder = this.folders[folderId];
            const item = document.createElement('div');
            item.className = 'select-folder-item';
            item.innerHTML = `<span>${folder.name}</span>`;
            item.onclick = () => {
                this.addChatToFolder(chatId, folderId);
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            };
            folderSelectList.appendChild(item);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
    }

    addChatToFolder(chatId, folderId) {
        if (!this.chatFolders[chatId]) {
            this.chatFolders[chatId] = [];
        }
        if (!this.chatFolders[chatId].includes(folderId)) {
            this.chatFolders[chatId].push(folderId);
            localStorage.setItem('matilda_chat_folders', JSON.stringify(this.chatFolders));
            this.showNotification(`Чат добавлен в папку "${this.folders[folderId].name}"`);
        }
    }

    hideSelectFolderModal() {
        this.selectFolderModal.style.opacity = '0';
        setTimeout(() => {
            this.selectFolderModal.classList.add('hidden');
        }, 300);
    }
}

// Инициализация приложения
let matildaMessenger;
document.addEventListener('DOMContentLoaded', () => {
    matildaMessenger = new MatildaMessenger();
});