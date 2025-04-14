-- Create extension for UUID support if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profile table if not exists
CREATE TABLE IF NOT EXISTS public.user_profile (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies for user_profile
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profile' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
    ON public.user_profile
    FOR SELECT
    USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profile' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
    ON public.user_profile
    FOR UPDATE
    USING (auth.uid() = id);
  END IF;
END
$$;

-- Create menu_scan table if not exists
CREATE TABLE IF NOT EXISTS public.menu_scan (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.user_profile(id),
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

-- Create RLS policies for menu_scan
ALTER TABLE public.menu_scan ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'menu_scan' 
    AND policyname = 'Users can view their own scans'
  ) THEN
    CREATE POLICY "Users can view their own scans"
    ON public.menu_scan
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create dish table if not exists
CREATE TABLE IF NOT EXISTS public.dish (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES public.menu_scan(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  category TEXT,
  dietary_tags TEXT,
  health_score NUMERIC,
  ai_analysis TEXT,
  nutrition_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies for dish
ALTER TABLE public.dish ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dish' 
    AND policyname = 'Users can view dishes from their own scans'
  ) THEN
    CREATE POLICY "Users can view dishes from their own scans"
    ON public.dish
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.menu_scan ms
      WHERE ms.id = dish.scan_id
      AND ms.user_id = auth.uid()
    ));
  END IF;
END
$$;

-- Create helper function to check if a function exists
CREATE OR REPLACE FUNCTION public.function_exists(function_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = function_name
  );
END;
$$ LANGUAGE plpgsql;

-- Create helper function to check if a table exists
CREATE OR REPLACE FUNCTION public.table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Create atomic save_menu_scan function
CREATE OR REPLACE FUNCTION public.save_menu_scan(
  p_scan_id UUID,
  p_user_id UUID,
  p_menu_raw_text TEXT,
  p_restaurant_name TEXT,
  p_restaurant_location TEXT,
  p_ocr_method TEXT,
  p_categories JSONB
) RETURNS JSONB AS $$
DECLARE
  v_category JSONB;
  v_dish JSONB;
  v_dish_id UUID;
  v_category_name TEXT;
  v_dish_count INT := 0;
  v_result JSONB;
BEGIN
  -- Insert the scan record
  INSERT INTO public.menu_scan (
    id, 
    user_id, 
    menu_raw_text, 
    scanned_at,
    restaurant_name,
    location,
    ocr_method
  ) VALUES (
    p_scan_id,
    p_user_id,
    p_menu_raw_text,
    NOW(),
    p_restaurant_name,
    p_restaurant_location,
    p_ocr_method
  );
  
  -- Insert each dish
  FOR v_category_index IN 0..jsonb_array_length(p_categories) - 1 LOOP
    v_category := p_categories->v_category_index;
    v_category_name := v_category->>'name';
    
    -- Process dishes in this category
    FOR v_dish_index IN 0..jsonb_array_length(v_category->'dishes') - 1 LOOP
      v_dish := v_category->'dishes'->v_dish_index;
      
      -- Insert dish
      INSERT INTO public.dish (
        scan_id,
        name,
        description,
        price,
        category,
        dietary_tags,
        created_at
      ) VALUES (
        p_scan_id,
        v_dish->>'name',
        COALESCE(v_dish->>'description', ''),
        (v_dish->>'price')::NUMERIC,
        v_category_name,
        CASE 
          WHEN jsonb_array_length(v_dish->'dietary_tags') > 0 
          THEN array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_dish->'dietary_tags')), ',')
          ELSE NULL
        END,
        NOW()
      )
      RETURNING id INTO v_dish_id;
      
      v_dish_count := v_dish_count + 1;
    END LOOP;
  END LOOP;
  
  -- Prepare result
  v_result := jsonb_build_object(
    'scan_id', p_scan_id,
    'dish_count', v_dish_count,
    'success', true
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'scan_id', p_scan_id
    );
END;
$$ LANGUAGE plpgsql; 