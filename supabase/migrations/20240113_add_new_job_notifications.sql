-- Add trigger for new job notifications
-- This will notify all users when a new job is posted

CREATE OR REPLACE FUNCTION notify_new_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if job is approved
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status != 'approved') THEN
    -- Create notification for all users (except the creator)
    -- Using a simple approach to avoid UUID casting issues
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT 
      u.id,
      'system',
      'Yeni İlan!',
      'Yeni bir iş ilanı yayınlandı: ' || COALESCE(NEW.title, 'İsimsiz İlan'),
      '/ilan/' || NEW.id::text
    FROM auth.users u
    WHERE u.id != NEW.creator_id
    LIMIT 100; -- Limit to prevent too many notifications at once
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_new_job ON jobs;

-- Create trigger
CREATE TRIGGER trigger_notify_new_job
  AFTER INSERT OR UPDATE OF status ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_job();

-- Add comment
COMMENT ON FUNCTION notify_new_job IS 'Notifies users when a new job is approved (limited to 100 users per job)';
