/**
 * Database operations related to menus and menu items
 */
import supabase, { handleDbError } from './client';
import { Tables, DbMenu, DbMenuItem, DbAnalysis, DbSavedMenu, DbPaginatedResult } from '@/types/db';
import { Menu, MenuItem, MenuAnalysisResponse } from '@/types/menu';

/**
 * Save menu text to database
 */
export async function saveMenuText(
  text: string, 
  userId?: string,
  restaurantId?: string
): Promise<DbMenu | null> {
  try {
    const { data, error } = await supabase
      .from(Tables.MENUS)
      .insert({
        text,
        user_id: userId || null,
        restaurant_id: restaurantId || null
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as DbMenu;
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Save menu items to database
 */
export async function saveMenuItems(
  menuId: string,
  items: MenuItem[]
): Promise<DbMenuItem[] | null> {
  try {
    // Convert from application format to DB format
    const dbItems = items.map(item => ({
      menu_id: menuId,
      name: item.name,
      description: item.description || null,
      price: item.price || null,
      category: item.category || null,
      health_rating: item.healthRating,
      dietary_tags: item.dietaryTags,
      nutrition: item.nutrition || null,
      ingredients: item.ingredients || null,
      reasons_for_rating: item.reasonsForRating || null,
      recommended_modifications: item.recommendedModifications || null
    }));
    
    const { data, error } = await supabase
      .from(Tables.MENU_ITEMS)
      .insert(dbItems)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data as DbMenuItem[];
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Save menu analysis to database
 */
export async function saveAnalysis(
  menuId: string, 
  analysis: MenuAnalysisResponse, 
  userId?: string
): Promise<DbAnalysis | null> {
  try {
    const { data, error } = await supabase
      .from(Tables.ANALYSES)
      .insert({
        menu_id: menuId,
        user_id: userId || null,
        result: analysis
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as DbAnalysis;
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Get menu by ID with items and analysis
 */
export async function getMenuById(menuId: string): Promise<Menu | null> {
  try {
    // Get menu
    const { data: menuData, error: menuError } = await supabase
      .from(Tables.MENUS)
      .select(`
        *,
        restaurant:restaurant_id(*)
      `)
      .eq('id', menuId)
      .single();
    
    if (menuError) {
      throw menuError;
    }
    
    // Get menu items
    const { data: itemsData, error: itemsError } = await supabase
      .from(Tables.MENU_ITEMS)
      .select('*')
      .eq('menu_id', menuId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (itemsError) {
      throw itemsError;
    }
    
    // Convert from DB format to application format
    const items = itemsData.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      healthRating: item.health_rating,
      dietaryTags: item.dietary_tags,
      nutrition: item.nutrition,
      ingredients: item.ingredients,
      reasonsForRating: item.reasons_for_rating,
      recommendedModifications: item.recommended_modifications
    })) as MenuItem[];
    
    return {
      id: menuData.id,
      restaurantId: menuData.restaurant_id,
      restaurant: menuData.restaurant ? {
        id: menuData.restaurant.id,
        name: menuData.restaurant.name,
        cuisineType: menuData.restaurant.cuisine_type,
        location: menuData.restaurant.location,
        priceRange: menuData.restaurant.price_range as any
      } : undefined,
      items,
      scannedAt: new Date(menuData.created_at),
      rawText: menuData.text
    };
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Get user scan history with pagination
 */
export async function getUserScanHistory(
  userId: string,
  page = 1,
  pageSize = 10
): Promise<DbPaginatedResult<DbMenu> | null> {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from(Tables.MENUS)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (countError) {
      throw countError;
    }
    
    // Get page of data
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from(Tables.MENUS)
      .select(`
        *,
        restaurant:restaurant_id(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      throw error;
    }
    
    return {
      data: data as DbMenu[],
      count: count || 0,
      page,
      pageSize,
      hasMore: count ? from + data.length < count : false
    };
  } catch (error) {
    handleDbError(error);
    return null;
  }
}

/**
 * Save a menu to user's favorites
 */
export async function saveMenuToFavorites(
  userId: string,
  menuId: string,
  notes?: string
): Promise<DbSavedMenu | null> {
  try {
    const { data, error } = await supabase
      .from(Tables.SAVED_MENUS)
      .insert({
        user_id: userId,
        menu_id: menuId,
        notes: notes || null
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as DbSavedMenu;
  } catch (error) {
    handleDbError(error);
    return null;
  }
} 