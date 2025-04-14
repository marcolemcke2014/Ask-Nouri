-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profile table if not exists
CREATE TABLE IF NOT EXISTS public.user_profile (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create canonical_menus table for menu content deduplication
CREATE TABLE IF NOT EXISTS public.canonical_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_hash TEXT NOT NULL UNIQUE,
  first_scan_id UUID NULL,
  dish_count INTEGER NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on content_hash for quick lookup
CREATE INDEX IF NOT EXISTS idx_canonical_menus_content_hash 
ON public.canonical_menus (content_hash);

-- Create menu_scan table
CREATE TABLE IF NOT EXISTS public.menu_scan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  image_hash TEXT NULL,
  canonical_menu_id UUID NULL REFERENCES public.canonical_menus(id) ON DELETE RESTRICT,
  menu_raw_text TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  restaurant_name TEXT,
  location TEXT,
  health_score NUMERIC,
  ocr_method TEXT,
  scan_method TEXT,
  device_type TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id and image_hash for quick duplicate detection
CREATE INDEX IF NOT EXISTS idx_menu_scan_user_image_hash 
ON public.menu_scan (user_id, image_hash);

-- Create menu_dishes table linked to canonical_menus
CREATE TABLE IF NOT EXISTS public.menu_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_menu_id UUID NULL REFERENCES public.canonical_menus(id) ON DELETE CASCADE,
  dish_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  category TEXT,
  tags TEXT[],
  health_score INTEGER,
  macros JSONB,
  nutrition_details JSONB,
  benefits TEXT[],
  flags TEXT[],
  modifications_suggested TEXT[],
  reasoning TEXT,
  is_recommended BOOLEAN DEFAULT FALSE,
  user_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on canonical_menu_id for quick dish lookup
CREATE INDEX IF NOT EXISTS idx_menu_dishes_canonical_menu_id
ON public.menu_dishes (canonical_menu_id);

-- Row-level security policies
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" 
ON public.user_profile FOR SELECT USING (auth.uid() = id);

ALTER TABLE public.menu_scan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own scans" 
ON public.menu_scan FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.canonical_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view canonical menus" 
ON public.canonical_menus FOR SELECT USING (true);

ALTER TABLE public.menu_dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view menu dishes" 
ON public.menu_dishes FOR SELECT USING (true);

-- Update canonical_menus.first_scan_id foreign key
ALTER TABLE public.canonical_menus
ADD CONSTRAINT fk_canonical_menus_first_scan_id
FOREIGN KEY (first_scan_id) 
REFERENCES public.menu_scan(id)
ON DELETE SET NULL;

-- Comments
COMMENT ON TABLE public.canonical_menus IS 'Stores unique menu content identified by content_hash';
COMMENT ON TABLE public.menu_scan IS 'Stores individual user menu scans, linked to canonical menus';
COMMENT ON TABLE public.menu_dishes IS 'Stores dishes from menus, linked to canonical menus for deduplication';
COMMENT ON COLUMN public.canonical_menus.content_hash IS 'Hash of the structured menu content for deduplication';
COMMENT ON COLUMN public.menu_scan.image_hash IS 'Hash of the original image for per-user duplicate detection';
COMMENT ON COLUMN public.menu_scan.canonical_menu_id IS 'Reference to the canonical menu this scan represents'; 