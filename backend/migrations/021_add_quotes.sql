-- 021_add_quotes.sql
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ title: 'Wiring', amount: 500 }]
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_chat ON quotes(chat_id);
CREATE INDEX IF NOT EXISTS idx_quotes_contractor ON quotes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);

-- Also, add a message type column to messages to support rendering quotes in chat
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text'; -- text, quote
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reference_id UUID; -- if type is quote, this references quotes.id
