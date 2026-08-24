const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./jwt');
const { assertUserIsChatParticipant } = require('../utils/chatAccess');

let io;

function initSocket(server) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const corsOrigins = frontendUrl.split(',').map((x) => x.trim()).filter(Boolean);
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || corsOrigins.includes(origin)) return callback(null, true);
                return callback(new Error('CORS blocked'));
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    function extractTokenFromHandshake(socket) {
        const fromAuth = socket.handshake.auth?.token;
        if (fromAuth) return String(fromAuth).trim();
        const cookieHeader = socket.handshake.headers.cookie || '';
        const m = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
        return m ? decodeURIComponent(m[1].trim()) : null;
    }

    io.use((socket, next) => {
        try {
            const token = extractTokenFromHandshake(socket);
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const payload = jwt.verify(token, getJwtSecret());
            socket.userId = payload.sub || payload.id;
            socket.userRole = payload.role || null;
            return next();
        } catch (e) {
            return next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id} user=${socket.userId}`);

        // Automatically join personal notification room using server-verified user ID
        if (socket.userId) {
            socket.join(String(socket.userId));
        }

        socket.on('join_own_room', () => {
            if (!socket.userId) return;
            socket.join(String(socket.userId));
        });

        socket.on('join_chat', async (rawChatId) => {
            const chatId = Number(rawChatId);
            if (!Number.isFinite(chatId) || !socket.userId) return;
            try {
                const ok = await assertUserIsChatParticipant(chatId, socket.userId);
                if (!ok) return;
                socket.join(`chat_${chatId}`);
                console.log(`Socket ${socket.id} joined chat_${chatId}`);
            } catch (err) {
                console.error('join_chat error:', err.message);
            }
        });

        socket.on('typing', ({ chatId }) => {
            if (!chatId || !socket.userId) return;
            socket.to(`chat_${chatId}`).emit('user_typing', { chatId, userId: socket.userId });
        });

        socket.on('stop_typing', ({ chatId }) => {
            if (!chatId || !socket.userId) return;
            socket.to(`chat_${chatId}`).emit('user_stopped_typing', { chatId, userId: socket.userId });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

function getIo() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

module.exports = { initSocket, getIo };
