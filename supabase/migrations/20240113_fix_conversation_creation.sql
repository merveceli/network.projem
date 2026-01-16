-- Fix for conversation creation RLS issue
-- This removes the unique constraint and adds a better one

-- Drop the old constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS unique_conversation;

-- Add a function to ensure unique conversations (regardless of order)
CREATE OR REPLACE FUNCTION check_conversation_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if conversation already exists (in either order)
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE (participant_1 = NEW.participant_1 AND participant_2 = NEW.participant_2)
       OR (participant_1 = NEW.participant_2 AND participant_2 = NEW.participant_1)
  ) THEN
    RAISE EXCEPTION 'Conversation already exists between these users';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for uniqueness check
DROP TRIGGER IF EXISTS trigger_check_conversation_uniqueness ON conversations;
CREATE TRIGGER trigger_check_conversation_uniqueness
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_conversation_uniqueness();

-- Update the RLS policy to be more permissive for creation
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" 
ON conversations FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (auth.uid() = participant_1 OR auth.uid() = participant_2)
);

COMMENT ON FUNCTION check_conversation_uniqueness IS 'Ensures conversation uniqueness regardless of participant order';
