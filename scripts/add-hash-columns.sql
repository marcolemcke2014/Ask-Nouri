-- Add hash columns to menu_scan table for duplicate detection
ALTER TABLE public.menu_scan 
ADD COLUMN IF NOT EXISTS image_hash TEXT,
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create indexes for efficient querying of hashes by user
CREATE INDEX IF NOT EXISTS idx_menu_scan_user_image_hash 
ON public.menu_scan (user_id, image_hash);

CREATE INDEX IF NOT EXISTS idx_menu_scan_user_content_hash 
ON public.menu_scan (user_id, content_hash);

-- Comment explaining the purpose of these columns
COMMENT ON COLUMN public.menu_scan.image_hash IS 'SHA-256 hash of the original menu image for duplicate detection';
COMMENT ON COLUMN public.menu_scan.content_hash IS 'SHA-256 hash of the structured menu content for duplicate detection'; 