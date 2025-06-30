import { supabase } from './supabase';
import { Customer } from './supabase';
import { InventoryItem } from './inventoryService';

export interface RentalItem {
  id: string;
  rental_id: string;
  inventory_item_id: string;
  inventory_item?: InventoryItem;
  quantity: number;
  daily_rate: number;
  insurance_selected: boolean;
  item_notes: string;
  created_at: string;
}

export interface Rental {
  id: string;
  customer_id: string;
  customer_name: string;
  start_date: string;
  end_date: string;
  return_date?: string;
  status: 'active' | 'overdue' | 'returned' | 'cancelled';
  total_amount: number;
  insurance_cost: number;
  late_fees: number;
  damage_charges: number;
  notes: string;
  waiver_collected: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  rental_items?: RentalItem[];
}

export interface CreateRentalData {
  customer_id: string;
  customer_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  insurance_cost: number;
  notes?: string;
  rental_items: {
    inventory_item_id: string;
    quantity: number;
    daily_rate: number;
    insurance_selected: boolean;
    item_notes?: string;
  }[];
}

export const rentalsService = {
  // Get all rentals with related data
  async getRentals() {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customer:customers(*),
        rental_items(
          *,
          inventory_item:inventory_items(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Rental[];
  },

  // Get rental by ID
  async getRental(id: string) {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customer:customers(*),
        rental_items(
          *,
          inventory_item:inventory_items(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Rental;
  },

  // Create new rental
  async createRental(rentalData: CreateRentalData) {
    // Start a transaction by creating the rental first
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .insert([{
        customer_id: rentalData.customer_id,
        customer_name: rentalData.customer_name,
        start_date: rentalData.start_date,
        end_date: rentalData.end_date,
        total_amount: rentalData.total_amount,
        insurance_cost: rentalData.insurance_cost,
        notes: rentalData.notes || '',
        status: 'active'
      }])
      .select()
      .single();
    
    if (rentalError) throw rentalError;

    // Create rental items
    const rentalItemsData = rentalData.rental_items.map(item => ({
      ...item,
      rental_id: rental.id
    }));

    const { data: rentalItems, error: itemsError } = await supabase
      .from('rental_items')
      .insert(rentalItemsData)
      .select(`
        *,
        inventory_item:inventory_items(*)
      `);
    
    if (itemsError) throw itemsError;

    // Return the complete rental with items
    return {
      ...rental,
      rental_items: rentalItems
    } as Rental;
  },

  // Update rental
  async updateRental(id: string, updates: Partial<Rental>) {
    console.log('🔄 Updating rental:', id, updates);
    
    const { data, error } = await supabase
      .from('rentals')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(*),
        rental_items(
          *,
          inventory_item:inventory_items(*)
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Error updating rental:', error);
      throw error;
    }
    
    console.log('✅ Rental updated successfully:', data);
    return data as Rental;
  },

  // Mark rental as returned
  async returnRental(id: string, returnDate?: string) {
    const updates = {
      status: 'returned' as const,
      return_date: returnDate || new Date().toISOString().split('T')[0]
    };

    return this.updateRental(id, updates);
  },

  // Cancel rental
  async cancelRental(id: string, reason?: string) {
    const updates = {
      status: 'cancelled' as const,
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
    };

    return this.updateRental(id, updates);
  },

  // Update waiver status
  async updateWaiverStatus(id: string, waiverCollected: boolean) {
    return this.updateRental(id, { waiver_collected: waiverCollected });
  },

  // Get rentals by customer
  async getRentalsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        rental_items(
          *,
          inventory_item:inventory_items(*)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Rental[];
  },

  // Get active rentals
  async getActiveRentals() {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customer:customers(*),
        rental_items(
          *,
          inventory_item:inventory_items(*)
        )
      `)
      .eq('status', 'active')
      .order('end_date', { ascending: true });
    
    if (error) throw error;
    return data as Rental[];
  },

  // Get overdue rentals
  async getOverdueRentals() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customer:customers(*),
        rental_items(
          *,
          inventory_item:inventory_items(*)
        )
      `)
      .eq('status', 'active')
      .lt('end_date', today)
      .order('end_date', { ascending: true });
    
    if (error) throw error;
    return data as Rental[];
  },

  // Search rentals
  async searchRentals(query: string) {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customer:customers(*),
        rental_items(
          *,
          inventory_item:inventory_items(*)
        )
      `)
      .or(`customer_name.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Rental[];
  },

  // Get rental statistics
  async getRentalStats() {
    const { data, error } = await supabase
      .from('rentals')
      .select('status, total_amount, created_at, end_date');
    
    if (error) throw error;
    
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      total: data.length,
      active: data.filter(r => r.status === 'active').length,
      overdue: data.filter(r => r.status === 'active' && r.end_date < today).length,
      returned: data.filter(r => r.status === 'returned').length,
      cancelled: data.filter(r => r.status === 'cancelled').length,
      todayRentals: data.filter(r => r.created_at.split('T')[0] === today).length,
      totalRevenue: data
        .filter(r => r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.total_amount, 0),
      todayRevenue: data
        .filter(r => r.created_at.split('T')[0] === today && r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.total_amount, 0)
    };
    
    return stats;
  },

  // Delete rental
  async deleteRental(id: string) {
    const { error } = await supabase
      .from('rentals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Force refresh inventory status for all rentals
  async refreshRentalInventoryStatus() {
    try {
      console.log('🔄 Manually refreshing inventory status for all rentals...');
      
      // Get all active rentals
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
      
      // Update inventory items for each active rental
      for (const rental of activeRentals) {
        if (rental.rental_items && rental.rental_items.length > 0) {
          const itemIds = rental.rental_items.map(item => item.inventory_item_id);
          
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({
              status: 'rented',
              current_renter: rental.customer_name,
              expected_return: rental.end_date
            })
            .in('id', itemIds);
          
          if (updateError) throw updateError;
        }
      }
      
      // Get all returned/cancelled rentals
      const { data: completedRentals, error: completedError } = await supabase
        .from('rentals')
        .select(`
          id,
          status,
          rental_items(inventory_item_id)
        `)
        .in('status', ['returned', 'cancelled']);
      
      if (completedError) throw completedError;
      
      // Update inventory items for each completed rental
      for (const rental of completedRentals) {
        if (rental.rental_items && rental.rental_items.length > 0) {
          const itemIds = rental.rental_items.map(item => item.inventory_item_id);
          
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({
              status: 'available',
              current_renter: null,
              expected_return: null
            })
            .in('id', itemIds);
          
          if (updateError) throw updateError;
        }
      }
      
      console.log('✅ Rental inventory status refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing rental inventory status:', error);
      throw error;
    }
  }
};