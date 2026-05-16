const quoteModel = require('../models/quoteModel');
const db = require('../config/db');
const ioConfig = require('../config/socket');
const { assertUserIsChatParticipant } = require('../utils/chatAccess');

exports.createQuote = async (req, res) => {
  const { chatId, items, totalAmount, notes } = req.body;
  const senderId = req.user.id;

  try {
    const id = Number(chatId);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'Invalid chat id' });

    // Verify chat participant
    const isParticipant = await assertUserIsChatParticipant(id, senderId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Unauthorized for this chat' });
    }

    const chatRes = await db.query('SELECT * FROM chats WHERE id = $1', [id]);
    const chat = chatRes.rows[0];
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Only the contractor should be able to create a quote
    const contractorRes = await db.query('SELECT user_id FROM contractors WHERE id = $1', [chat.contractor_id]);
    const contractorUserId = contractorRes.rows[0]?.user_id;

    if (senderId !== contractorUserId) {
      return res.status(403).json({ message: 'Only contractors can send quotes' });
    }

    // Create the quote
    const quote = await quoteModel.createQuote({
      chatId: id,
      contractorId: chat.contractor_id,
      customerId: chat.customer_id,
      items,
      totalAmount,
      notes
    });

    // Create a message linking to this quote
    const msgRes = await db.query(
      `INSERT INTO messages (chat_id, sender_id, content, message_type, reference_id) 
       VALUES ($1, $2, $3, 'quote', $4) RETURNING *`,
      [id, senderId, 'Sent an itemized quote.', quote.id]
    );

    const newMessage = msgRes.rows[0];

    // Update chat last message
    await db.query('UPDATE chats SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    // Emit via socket
    const io = ioConfig.getIO();
    if (io) {
      io.to(`chat_${id}`).emit('new_message', newMessage);
    }

    res.status(201).json({ status: 'success', quote, message: newMessage });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ message: 'Failed to create quote' });
  }
};

exports.getQuotes = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  try {
    const id = Number(chatId);
    if (!id || isNaN(id)) return res.status(400).json({ message: 'Invalid chat id' });

    const isParticipant = await assertUserIsChatParticipant(id, userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Unauthorized for this chat' });
    }

    const quotes = await quoteModel.getQuotesByChat(id);
    res.json({ quotes });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ message: 'Failed to fetch quotes' });
  }
};

exports.getQuoteById = async (req, res) => {
  const { quoteId } = req.params;
  const userId = req.user.id;

  try {
    const quote = await quoteModel.getQuoteById(quoteId);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const isParticipant = await assertUserIsChatParticipant(quote.chat_id, userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Unauthorized for this chat' });
    }

    res.json({ quote });
  } catch (error) {
    console.error('Error fetching quote by id:', error);
    res.status(500).json({ message: 'Failed to fetch quote' });
  }
};

exports.updateQuoteStatus = async (req, res) => {
  const { quoteId } = req.params;
  const { status } = req.body; // ACCEPTED or REJECTED
  const userId = req.user.id;

  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const quote = await quoteModel.getQuoteById(quoteId);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const isParticipant = await assertUserIsChatParticipant(quote.chat_id, userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Unauthorized for this chat' });
    }

    // Only the customer should be able to accept/reject
    if (userId !== quote.customer_id) {
      return res.status(403).json({ message: 'Only the customer can accept or reject the quote' });
    }

    const updatedQuote = await quoteModel.updateQuoteStatus(quoteId, status);

    // Create a system message about the status change
    const msgRes = await db.query(
      `INSERT INTO messages (chat_id, sender_id, content, message_type, reference_id) 
       VALUES ($1, $2, $3, 'system', $4) RETURNING *`,
      [quote.chat_id, userId, `Quote was ${status.toLowerCase()}`, quoteId]
    );

    const newMessage = msgRes.rows[0];

    // Emit via socket
    const io = ioConfig.getIO();
    if (io) {
      io.to(`chat_${quote.chat_id}`).emit('new_message', newMessage);
      io.to(`chat_${quote.chat_id}`).emit('quote_updated', updatedQuote);
    }

    res.json({ status: 'success', quote: updatedQuote });
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ message: 'Failed to update quote status' });
  }
};
