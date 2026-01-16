-- Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT different_users CHECK (blocker_id != blocked_id)
);

-- Enable RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own blocks" 
ON user_blocks FOR SELECT 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" 
ON user_blocks FOR INSERT 
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others" 
ON user_blocks FOR DELETE 
USING (auth.uid() = blocker_id);

-- Update messaging RLS to prevent viewing/sending if blocked
-- This is a bit complex as we need to check both directions

-- Update conversation SELECT policy
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" 
ON conversations FOR SELECT 
USING (
  (auth.uid() = participant_1 OR auth.uid() = participant_2) AND
  NOT EXISTS (
    SELECT 1 FROM user_blocks 
    WHERE (blocker_id = participant_1 AND blocked_id = participant_2)
       OR (blocker_id = participant_2 AND blocked_id = participant_1)
  )
);

-- Update message INSERT policy to prevent sending to someone who blocked you
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations" 
ON messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id 
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE (ub.blocker_id = c.participant_1 AND ub.blocked_id = c.participant_2)
         OR (ub.blocker_id = c.participant_2 AND ub.blocked_id = c.participant_1)
    )
  )
);

-- Function to check if a user is blocked before creating a conversation
CREATE OR REPLACE FUNCTION check_block_before_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM user_blocks 
    WHERE (blocker_id = NEW.participant_1 AND blocked_id = NEW.participant_2)
       OR (blocker_id = NEW.participant_2 AND blocked_id = NEW.participant_1)
  ) THEN
    RAISE EXCEPTION 'Bu kullanıcı ile iletişim kuramazsınız (Engelleme mevcut)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_block_before_conversation
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_block_before_conversation();

COMMENT ON TABLE user_blocks IS 'Stores user blocking relationships';
