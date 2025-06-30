import { supabase } from './supabase';

export interface InventoryItem {
  id: string;
  item_id: string;
  name: string;
  category: 'surfboard' | 'bodyboard' | 'skimboard' | 'wetsuit' | 'boots' | 'gloves' | 'flippers' | 'hooded-vest' | 'accessories';
  gender?: 'male' | 'female' | 'unisex' | 'kids';
  age_group?: 'adult' | 'kids';
  brand: string;
  model?: string;
  size?: string;
  color?: string;
  condition: 'excellent' | 'good' | 'fair' | 'needs-repair' | 'retired';
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  purchase_date?: string;
  purchase_price: number;
  rental_price: number;
  location?: string;
  notes?: string;
  total_rentals: number;
  total_revenue: number;
  current_renter?: string;
  expected_return?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryStats {
  total: number;
  available: number;
  rented: number;
  maintenance: number;
  retired: number;
  totalValue: number;
  totalRevenue: number;
}

// Enhanced error handling wrapper
const handleInventoryError = (error: any, operation: string) => {
  console.error(`❌ Inventory ${operation} error:`, error);
  
  if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
    console.error('🌐 Network connectivity issue detected');
    console.error('🔧 Troubleshooting steps:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify your .env file contains correct Supabase credentials:');
    console.error('      VITE_SUPABASE_URL=https://your-project-id.supabase.co');
    console.error('      VITE_SUPABASE_ANON_KEY=your-anon-key');
    console.error('   3. Restart your development server after updating .env');
    console.error('   4. Check if your Supabase project is active and accessible');
    
    throw new Error(`Network error: Unable to connect to database. Please check your internet connection and verify your Supabase configuration in the .env file.`);
  }
  
  if (error.message?.includes('Invalid API key')) {
    throw new Error(`Authentication error: Invalid API key. Please check your VITE_SUPABASE_ANON_KEY in the .env file.`);
  }
  
  if (error.message?.includes('Project not found')) {
    throw new Error(`Configuration error: Supabase project not found. Please check your VITE_SUPABASE_URL in the .env file.`);
  }
  
  if (error.code === 'PGRST116') {
    throw new Error(`Database error: The requested resource was not found.`);
  }
  
  if (error.code === 'PGRST301') {
    throw new Error(`Database error: Invalid request format.`);
  }
  
  throw new Error(`Database error: ${error.message || 'An unexpected error occurred'}`);
};

export const inventoryService = {
  // Get all inventory items
  async getInventoryItems(): Promise<InventoryItem[]> {
    try {
      console.log('📦 Fetching inventory items...');
      
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Database query failed:', error);
        handleInventoryError(error, 'getInventoryItems');
      }
      
      console.log(`✅ Successfully fetched ${data?.length || 0} inventory items`);
      return data as InventoryItem[];
    } catch (error) {
      console.error('❌ Error fetching inventory items:', error);
      
      // If it's a network error, provide helpful guidance
      if (error instanceof Error && error.message.includes('Network error')) {
        console.error('💡 This is likely a configuration issue. Please check your .env file.');
        // Return empty array to prevent app crash, but still throw to show user the error
        throw error;
      }
      
      // For other errors, return empty array to prevent app crash
      console.warn('⚠️  Returning empty inventory list due to error');
      return [];
    }
  },

  // Get inventory item by ID
  async getInventoryItem(id: string): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) handleInventoryError(error, 'getInventoryItem');
      return data as InventoryItem;
    } catch (error) {
      handleInventoryError(error, 'getInventoryItem');
      throw error;
    }
  },

  // Get available inventory items
  async getAvailableItems(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'available')
        .order('category', { ascending: true });
      
      if (error) handleInventoryError(error, 'getAvailableItems');
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching available items:', error);
      return [];
    }
  },

  // Get inventory stats
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('status, purchase_price, total_revenue');
      
      if (error) handleInventoryError(error, 'getInventoryStats');
      
      if (!data || data.length === 0) {
        return {
          total: 0,
          available: 0,
          rented: 0,
          maintenance: 0,
          retired: 0,
          totalValue: 0,
          totalRevenue: 0
        };
      }

      const stats = data.reduce((acc, item) => {
        acc.total++;
        acc[item.status as keyof InventoryStats]++;
        acc.totalValue += item.purchase_price || 0;
        acc.totalRevenue += item.total_revenue || 0;
        return acc;
      }, {
        total: 0,
        available: 0,
        rented: 0,
        maintenance: 0,
        retired: 0,
        totalValue: 0,
        totalRevenue: 0
      } as InventoryStats);

      return stats;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      // Return default stats on error
      return {
        total: 0,
        available: 0,
        rented: 0,
        maintenance: 0,
        retired: 0,
        totalValue: 0,
        totalRevenue: 0
      };
    }
  },

  // Create new inventory item
  async createInventoryItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'total_rentals' | 'total_revenue'>): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([item])
        .select()
        .single();
      
      if (error) handleInventoryError(error, 'createInventoryItem');
      return data as InventoryItem;
    } catch (error) {
      handleInventoryError(error, 'createInventoryItem');
      throw error;
    }
  },

  // Update inventory item
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      console.log('🔄 Updating inventory item:', id, updates);
      
      // If setting status to available, explicitly set current_renter and expected_return to null
      if (updates.status === 'available') {
        updates.current_renter = null;
        updates.expected_return = null;
      }
      
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating inventory item:', error);
        handleInventoryError(error, 'updateInventoryItem');
      }
      
      console.log('✅ Inventory item updated successfully:', data);
      return data as InventoryItem;
    } catch (error) {
      console.error('❌ Exception updating inventory item:', error);
      handleInventoryError(error, 'updateInventoryItem');
      throw error;
    }
  },

  // Delete inventory item
  async deleteInventoryItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);
      
      if (error) handleInventoryError(error, 'deleteInventoryItem');
    } catch (error) {
      handleInventoryError(error, 'deleteInventoryItem');
      throw error;
    }
  },

  // Update item status
  async updateItemStatus(id: string, status: InventoryItem['status'], currentRenter?: string, expectedReturn?: string): Promise<InventoryItem> {
    try {
      console.log('🔄 Updating item status:', { id, status, currentRenter, expectedReturn });
      
      const updates: Partial<InventoryItem> = { status };
      if (status === 'available') {
        // When setting to available, always clear renter info
        updates.current_renter = null;
        updates.expected_return = null;
      } else {
        // For other statuses, only update if provided
        if (currentRenter !== undefined) updates.current_renter = currentRenter;
        if (expectedReturn !== undefined) updates.expected_return = expectedReturn;
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating item status:', error);
        handleInventoryError(error, 'updateItemStatus');
      }
      
      console.log('✅ Item status updated successfully:', data);
      return data as InventoryItem;
    } catch (error) {
      console.error('❌ Exception updating item status:', error);
      handleInventoryError(error, 'updateItemStatus');
      throw error;
    }
  },

  // Search inventory items
  async searchInventoryItems(query: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,item_id.ilike.%${query}%`)
        .order('name');
      
      if (error) handleInventoryError(error, 'searchInventoryItems');
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error searching inventory items:', error);
      return [];
    }
  },

  // Get items by category
  async getItemsByCategory(category: InventoryItem['category']): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('category', category)
        .order('name');
      
      if (error) handleInventoryError(error, 'getItemsByCategory');
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching items by category:', error);
      return [];
    }
  },

  // Get items by gender
  async getItemsByGender(gender: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('gender', gender)
        .order('category');
      
      if (error) handleInventoryError(error, 'getItemsByGender');
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching items by gender:', error);
      return [];
    }
  },

  // Get items by age group
  async getItemsByAgeGroup(ageGroup: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('age_group', ageGroup)
        .order('category');
      
      if (error) handleInventoryError(error, 'getItemsByAgeGroup');
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching items by age group:', error);
      return [];
    }
  },

  // Get items needing maintenance
  async getMaintenanceItems(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .or('status.eq.maintenance,condition.eq.needs-repair')
        .order('updated_at', { ascending: false });
      
      if (error) handleInventoryError(error, 'getMaintenanceItems');
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching maintenance items:', error);
      return [];
    }
  },

  // Get rented items with return dates
  async getRentedItems(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'rented')
        .order('expected_return', { ascending: true });
      
      if (error) handleInventoryError(error, 'getRentedItems');
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching rented items:', error);
      return [];
    }
  },

  // Get overdue items
  async getOverdueItems(): Promise<InventoryItem[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'rented')
        .lt('expected_return', today)
        .order('expected_return', { ascending: true });
      
      if (error) handleInventoryError(error, 'getOverdueItems');
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching overdue items:', error);
      return [];
    }
  },

  // Force refresh inventory status from rentals
  async refreshInventoryStatus(): Promise<void> {
    try {
      console.log('🔄 Manually refreshing inventory status from rentals...');
      
      // First, reset all items that are incorrectly marked as rented
      const { data: rentedItems, error: rentedError } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('status', 'rented');
      
      if (rentedError) throw rentedError;
      
      // Get all active rental items
      const { data: activeRentals, error: activeError } = await supabase
        .from('rentals')
        .select(`
          id,
          customer_name,
          end_date,
          rental_items(inventory_item_id)
        `)
        .eq('status', 'active');
      
      if (activeError) throw activeError;
      
      // Get all inventory items that are in active rentals
      const activelyRentedItemIds = new Set<string>();
      activeRentals.forEach(rental => {
        rental.rental_items?.forEach(item => {
          activelyRentedItemIds.add(item.inventory_item_id);
        });
      });
      
      // Find items marked as rented but not in any active rental
      const incorrectlyRentedItems = rentedItems
        .filter(item => !activelyRentedItemIds.has(item.id))
        .map(item => item.id);
      
      if (incorrectlyRentedItems.length > 0) {
        console.log(`🔄 Found ${incorrectlyRentedItems.length} items incorrectly marked as rented. Fixing...`);
        
        // Update these items to available
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            status: 'available',
            current_renter: null,
            expected_return: null
          })
          .in('id', incorrectlyRentedItems);
        
        if (updateError) throw updateError;
        
        console.log('✅ Fixed incorrectly rented items');
      }
      
      console.log('✅ Inventory status refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing inventory status:', error);
      throw error;
    }
  }
};