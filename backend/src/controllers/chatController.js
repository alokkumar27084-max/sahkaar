const db = require('../config/db');
const { getIo } = require('../config/socket');
const { assertUserIsChatParticipant } = require('../utils/chatAccess');

exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role; // 'customer' or 'contractor'

        let query = '';
        let values = [userId];

        // If user is a contractor, fetch chats where their profile is the contractor
        if (role === 'contractor') {
            // Find contractor ID first
            const contractorRes = await db.query('SELECT id FROM contractors WHERE user_id = $1', [userId]);
            if (contractorRes.rows.length === 0) {
                return res.json({ chats: [] }); // Contractor hasn't set up profile
            }
            const contractorId = contractorRes.rows[0].id;

            query = `
        SELECT c.*, 
               u.name as other_party_name,
               NULL as other_party_photo,
               (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
               (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = false AND m.sender_id != $1) as unread_count
        FROM chats c
        JOIN users u ON c.customer_id = u.id
        WHERE c.contractor_id = $2
        ORDER BY c.last_message_at DESC
      `;
            values = [userId, contractorId];
        } else {
            query = `
        SELECT c.*, 
               COALESCE(cont.business_name, u.name, 'User') as other_party_name,
               COALESCE(cont.image_url, cont.photo_url) as other_party_photo,
               (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
               (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = false AND m.sender_id != $1) as unread_count
        FROM chats c
        JOIN contractors cont ON c.contractor_id = cont.id
        JOIN users u ON cont.user_id = u.id
        WHERE c.customer_id = $1
        ORDER BY c.last_message_at DESC
      `;
        }

        const { rows } = await db.query(query, values);

        res.json({ chats: rows });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Error fetching chats' });
    }
};

exports.getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const id = Number(chatId);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'Invalid chat id' });
        }

        const allowed = await assertUserIsChatParticipant(id, req.user.id);
        if (!allowed) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { rows } = await db.query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
            [id]
        );

        // Mark messages as read
        await db.query(
            'UPDATE messages SET is_read = true WHERE chat_id = $1 AND sender_id != $2 AND is_read = false',
            [id, req.user.id]
        );

        res.json({ messages: rows });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const senderId = req.user.id;

        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }
        if (content.length > 5000) {
            return res.status(400).json({ message: 'Message too long (max 5000 characters)' });
        }

        // Verify chat exists and user belongs to it
        const chatRes = await db.query('SELECT * FROM chats WHERE id = $1', [chatId]);
        if (chatRes.rows.length === 0) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        const chat = chatRes.rows[0];

        // Determine who the receiver is
        let receiverId = null;
        let contractorUserId = null;

        // We need the user_id of the contractor to send real-time notifications
        const contRes = await db.query('SELECT user_id FROM contractors WHERE id = $1', [chat.contractor_id]);
        if (contRes.rows.length > 0) {
            contractorUserId = contRes.rows[0].user_id;
        }

        if (senderId === chat.customer_id) {
            receiverId = contractorUserId;
        } else if (senderId === contractorUserId) {
            receiverId = chat.customer_id;
        } else {
            return res.status(403).json({ message: 'Unauthorized for this chat' });
        }

        // Insert message
        const { rows } = await db.query(
            'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
            [chatId, senderId, content]
        );
        const newMessage = rows[0];

        // Update last_message_at
        await db.query('UPDATE chats SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1', [chatId]);

        // Emit via socket
        try {
            const io = getIo();
            io.to(`chat_${chatId}`).emit('new_message', newMessage);
            if (receiverId) {
                // Also emit a general notification to the receiver's personal room
                io.to(receiverId).emit('notification', {
                    type: 'new_message',
                    title: 'New Message',
                    body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    chatId: chatId
                });
            }
        } catch (ioErr) {
            console.error('Socket error (non-fatal):', ioErr);
        }

        res.status(201).json({ message: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

exports.getOrCreateChat = async (req, res) => {
    try {
        const { contractorId } = req.body;
        const customerId = req.user.id;

        // Create new or get existing using ON CONFLICT (idempotent)
        const { rows } = await db.query(
            `INSERT INTO chats (customer_id, contractor_id) 
             VALUES ($1, $2) 
             ON CONFLICT (customer_id, contractor_id) 
             DO UPDATE SET last_message_at = EXCLUDED.last_message_at
             RETURNING *`,
            [customerId, contractorId]
        );

        res.status(rows.length > 0 ? (rows[0].created_at === rows[0].last_message_at ? 201 : 200) : 200).json({ chat: rows[0] });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ message: 'Error creating chat' });
    }
};
