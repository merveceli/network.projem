-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('new_application', 'message', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: System can create notifications (for triggers/functions)
CREATE POLICY "System can create notifications" 
ON notifications FOR INSERT 
WITH CHECK (true);

-- Function to create notification when application is submitted
CREATE OR REPLACE FUNCTION notify_job_creator()
RETURNS TRIGGER AS $$
DECLARE
  job_creator_id uuid;
  job_title text;
BEGIN
  -- Get job creator and title
  SELECT creator_id, title INTO job_creator_id, job_title
  FROM jobs WHERE id = NEW.job_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    job_creator_id,
    'new_application',
    'Yeni Başvuru!',
    'İlanınıza yeni bir başvuru geldi: ' || job_title,
    '/basvurular'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification on new application
DROP TRIGGER IF EXISTS trigger_notify_job_creator ON applications;
CREATE TRIGGER trigger_notify_job_creator
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_creator();

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for various events';
