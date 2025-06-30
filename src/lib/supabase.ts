import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced environment variable validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
  console.error('');
  console.error('🔧 To fix this issue:');
  console.error('1. Create a .env file in your project root if it doesn\'t exist');
  console.error('2. Add the following lines to your .env file:');
  console.error('   VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('3. Restart your development server');
  console.error('');
  console.error('📝 You can find these values in your Supabase project dashboard:');
  console.error('   https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
  
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart the development server.');
}

// Validate URL format
try {
  const url = new URL(supabaseUrl);
  if (!url.hostname.includes('supabase')) {
    console.warn('⚠️  URL doesn\'t appear to be a Supabase URL:', supabaseUrl);
  }
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  console.error('Expected format: https://your-project-id.supabase.co');
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in .env file.');
}

// Validate anon key format (basic check)
if (supabaseAnonKey.length < 100) {
  console.warn('⚠️  Anon key appears to be too short. Please verify it\'s correct.');
}

console.log('🔗 Initializing Supabase client...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length, 'characters');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'surf-track-app'
    }
  }
});

// Enhanced connection test function
export const testConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Provide specific guidance based on error type
      if (error.message?.includes('Invalid API key')) {
        console.error('🔑 The API key appears to be invalid. Please check VITE_SUPABASE_ANON_KEY in your .env file.');
      } else if (error.message?.includes('Project not found')) {
        console.error('🏗️  The project URL appears to be incorrect. Please check VITE_SUPABASE_URL in your .env file.');
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error('📋 The database table doesn\'t exist. Please run your migrations or check your database setup.');
      }
      
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Network error connecting to Supabase:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('🌐 This appears to be a network connectivity issue. Please check:');
      console.error('   1. Your internet connection');
      console.error('   2. That your Supabase project is active');
      console.error('   3. That the URL in your .env file is correct');
      console.error('   4. That there are no firewall or proxy issues');
    }
    
    return false;
  }
};

// Database types
export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
  total_visits: number;
  total_spent: number;
  preferred_activities: string[];
  notes: string;
  waiver_signed: boolean;
  waiver_expiry_date?: string;
  status: 'active' | 'inactive' | 'banned';
  is_campground_guest: boolean;
  campground_site_number?: string;
  campground_discount_eligible: boolean;
  campground_visits: number;
}

export interface CustomerVisit {
  id: string;
  customer_id: string;
  visit_date: string;
  visit_type: 'rental' | 'lesson' | 'waiver_only' | 'purchase';
  items: any[];
  total_amount: number;
  notes: string;
  created_at: string;
}

// Enhanced error handling wrapper
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`❌ Supabase ${operation} error:`, error);
  
  if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
    throw new Error(`Network error: Unable to connect to database. Please check your internet connection and verify your Supabase configuration in the .env file.`);
  }
  
  if (error.code === 'PGRST116') {
    throw new Error(`Database error: The requested resource was not found.`);
  }
  
  if (error.code === 'PGRST301') {
    throw new Error(`Database error: Invalid request format.`);
  }
  
  if (error.message?.includes('Invalid API key')) {
    throw new Error(`Authentication error: Invalid API key. Please check your VITE_SUPABASE_ANON_KEY in the .env file.`);
  }
  
  if (error.message?.includes('Project not found')) {
    throw new Error(`Configuration error: Supabase project not found. Please check your VITE_SUPABASE_URL in the .env file.`);
  }
  
  throw new Error(`Database error: ${error.message || 'An unexpected error occurred'}`);
};

// Customer service functions with enhanced error handling
export const customerService = {
  // Get all customers
  async getCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'getCustomers');
      return data as Customer[];
    } catch (error) {
      if (error instanceof Error && error.message.includes('Network error')) {
        throw error;
      }
      handleSupabaseError(error, 'getCustomers');
      return [];
    }
  },

  // Get customer by ID
  async getCustomer(id: string) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) handleSupabaseError(error, 'getCustomer');
      return data as Customer;
    } catch (error) {
      handleSupabaseError(error, 'getCustomer');
      throw error;
    }
  },

  // Search customers by name or email
  async searchCustomers(query: string) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('full_name');
      
      if (error) handleSupabaseError(error, 'searchCustomers');
      return data as Customer[];
    } catch (error) {
      handleSupabaseError(error, 'searchCustomers');
      return [];
    }
  },

  // Get campground guests
  async getCampgroundGuests() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_campground_guest', true)
        .order('campground_site_number');
      
      if (error) handleSupabaseError(error, 'getCampgroundGuests');
      return data as Customer[];
    } catch (error) {
      handleSupabaseError(error, 'getCampgroundGuests');
      return [];
    }
  },

  // Get discount eligible customers
  async getDiscountEligibleCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('campground_discount_eligible', true)
        .order('full_name');
      
      if (error) handleSupabaseError(error, 'getDiscountEligibleCustomers');
      return data as Customer[];
    } catch (error) {
      handleSupabaseError(error, 'getDiscountEligibleCustomers');
      return [];
    }
  },

  // Create new customer
  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_visits' | 'total_spent'>) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'createCustomer');
      return data as Customer;
    } catch (error) {
      handleSupabaseError(error, 'createCustomer');
      throw error;
    }
  },

  // Update customer
  async updateCustomer(id: string, updates: Partial<Customer>) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'updateCustomer');
      return data as Customer;
    } catch (error) {
      handleSupabaseError(error, 'updateCustomer');
      throw error;
    }
  },

  // Delete customer
  async deleteCustomer(id: string) {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error, 'deleteCustomer');
    } catch (error) {
      handleSupabaseError(error, 'deleteCustomer');
      throw error;
    }
  },

  // Get customer visits
  async getCustomerVisits(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('customer_visits')
        .select('*')
        .eq('customer_id', customerId)
        .order('visit_date', { ascending: false });
      
      if (error) handleSupabaseError(error, 'getCustomerVisits');
      return data as CustomerVisit[];
    } catch (error) {
      handleSupabaseError(error, 'getCustomerVisits');
      return [];
    }
  },

  // Add customer visit
  async addCustomerVisit(visit: Omit<CustomerVisit, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('customer_visits')
        .insert([visit])
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'addCustomerVisit');
      return data as CustomerVisit;
    } catch (error) {
      handleSupabaseError(error, 'addCustomerVisit');
      throw error;
    }
  },

  // Update waiver status
  async updateWaiverStatus(customerId: string, signed: boolean, expiryDate?: string) {
    try {
      const updates: Partial<Customer> = {
        waiver_signed: signed,
        waiver_expiry_date: expiryDate
      };

      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'updateWaiverStatus');
      return data as Customer;
    } catch (error) {
      handleSupabaseError(error, 'updateWaiverStatus');
      throw error;
    }
  },

  // Update campground visit count
  async incrementCampgroundVisits(customerId: string) {
    try {
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('campground_visits')
        .eq('id', customerId)
        .single();

      if (fetchError) handleSupabaseError(fetchError, 'incrementCampgroundVisits');

      const { data, error } = await supabase
        .from('customers')
        .update({ 
          campground_visits: (customer.campground_visits || 0) + 1,
          campground_discount_eligible: (customer.campground_visits || 0) + 1 > 1
        })
        .eq('id', customerId)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'incrementCampgroundVisits');
      return data as Customer;
    } catch (error) {
      handleSupabaseError(error, 'incrementCampgroundVisits');
      throw error;
    }
  }
};