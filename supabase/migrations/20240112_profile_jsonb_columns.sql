-- Add JSONB columns for complex profile data
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS portfolio jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '[]'::jsonb;

-- Comment on columns for clarity
COMMENT ON COLUMN profiles.portfolio IS 'Array of project objects: {title, category, image, description, technologies}';
COMMENT ON COLUMN profiles.services IS 'Array of service package objects: {name, price, duration, features, color, popular}';
