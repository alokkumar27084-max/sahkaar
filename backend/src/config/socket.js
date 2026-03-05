const { Server } = require('socket.io');

let io;

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // User joins their own personal room to receive targeted notifications/messages
        socket.on('join_own_room', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their own room`);
        });

        // User joins a specific chat thread
        socket.on('join_chat', (chatId) => {
            socket.join(`chat_${chatId}`);
            console.log(`Socket ${socket.id} joined chat_${chatId}`);
        });

        // Handle typing indicators
        socket.on('typing', ({ chatId, userId }) => {
            socket.to(`chat_${chatId}`).emit('user_typing', { chatId, userId });
        });

        socket.on('stop_typing', ({ chatId, userId }) => {
            socket.to(`chat_${chatId}`).emit('user_stopped_typing', { chatId, userId });
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
