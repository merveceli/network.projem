-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('create_job', 'send_application', 'send_message')),
  count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  CONSTRAINT unique_user_action UNIQUE (user_id, action)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits" 
ON rate_limits FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can update their own rate limits
CREATE POLICY "Users can update their own rate limits" 
ON rate_limits FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own rate limits
CREATE POLICY "Users can insert their own rate limits" 
ON rate_limits FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_hours integer DEFAULT 24
)
RETURNS boolean AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
  v_current_time timestamptz := now();
BEGIN
  -- Get current rate limit record
  SELECT count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE user_id = p_user_id AND action = p_action;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO rate_limits (user_id, action, count, window_start)
    VALUES (p_user_id, p_action, 1, v_current_time);
    RETURN true;
  END IF;
  
  -- Check if window has expired
  IF v_current_time > (v_window_start + (p_window_hours || ' hours')::interval) THEN
    -- Reset the window
    UPDATE rate_limits
    SET count = 1, window_start = v_current_time
    WHERE user_id = p_user_id AND action = p_action;
    RETURN true;
  END IF;
  
  -- Check if limit exceeded
  IF v_count >= p_limit THEN
    RETURN false;
  END IF;
  
  -- Increment count
  UPDATE rate_limits
  SET count = count + 1
  WHERE user_id = p_user_id AND action = p_action;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get remaining quota
CREATE OR REPLACE FUNCTION get_rate_limit_remaining(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_hours integer DEFAULT 24
)
RETURNS json AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
  v_current_time timestamptz := now();
  v_remaining integer;
  v_reset_at timestamptz;
BEGIN
  -- Get current rate limit record
  SELECT count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE user_id = p_user_id AND action = p_action;
  
  -- If no record exists, return full quota
  IF NOT FOUND THEN
    RETURN json_build_object(
      'remaining', p_limit,
      'limit', p_limit,
      'reset_at', v_current_time + (p_window_hours || ' hours')::interval
    );
  END IF;
  
  -- Check if window has expired
  IF v_current_time > (v_window_start + (p_window_hours || ' hours')::interval) THEN
    RETURN json_build_object(
      'remaining', p_limit,
      'limit', p_limit,
      'reset_at', v_current_time + (p_window_hours || ' hours')::interval
    );
  END IF;
  
  -- Calculate remaining
  v_remaining := GREATEST(0, p_limit - v_count);
  v_reset_at := v_window_start + (p_window_hours || ' hours')::interval;
  
  RETURN json_build_object(
    'remaining', v_remaining,
    'limit', p_limit,
    'reset_at', v_reset_at,
    'used', v_count
  );
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE rate_limits IS 'Stores rate limiting data for user actions';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if user can perform action and increments counter';
COMMENT ON FUNCTION get_rate_limit_remaining IS 'Returns remaining quota for user action';
