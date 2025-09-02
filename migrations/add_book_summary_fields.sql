-- Add book summary fields to chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'lesson';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS author VARCHAR(255);
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS reading_time INTEGER;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS key_takeaways JSONB;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);

-- Update existing chapters to be lessons
UPDATE chapters SET content_type = 'lesson' WHERE content_type IS NULL; 