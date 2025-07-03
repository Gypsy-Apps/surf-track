import { supabase } from './supabase';
import { customerService } from './supabase';
import { settingsService } from './settingsService';

export interface Waiver {
  id: string;
  customer_id?: string;
  customer_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  activities: string[];
  signature_data?: string;
  signed_date?: string;
  ip_address?: string;
  device_type?: string;
  status: 'signed' | 'pending' | 'expired';
  expiry_date?: string;
  lesson_id?: string;
  rental_id?: string;
  waiver_text?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWaiverData {
  customer_id?: string;
  customer_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  activities: string[];
  signature_data: string;
  lesson_id?: string;
  rental_id?: string;
  waiver_text: string;
  notes?: string;
}

export const waiversService = {
  // Get all waivers with status filtering
  async getWaivers(statusFilter?: 'all' | 'active' | 'expired' | 'expiring_soon') {
    let query = supabase.from('waivers').select('*');
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    switch (statusFilter) {
      case 'active':
        query = query.eq('status', 'signed').gte('expiry_date', today);
        break;
      case 'expired':
        query = query.or(`status.eq.expired,and(status.eq.signed,expiry_date.lt.${today})`);
        break;
      case 'expiring_soon':
        query = query.eq('status', 'signed').gte('expiry_date', today).lte('expiry_date', thirtyDaysFromNow);
        break;
      default:
        // Return all waivers
        break;
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Waiver[];
  },

  // Get waiver by ID
  async getWaiver(id: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Waiver;
  },

  // Get waivers by customer ID
  async getWaiversByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Waiver[];
  },

  // Get waivers by lesson ID
  async getWaiversByLesson(lessonId: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Waiver[];
  },

 // Create new waiver with customer profile sync and activity-specific expiry
async createWaiver(waiverData: CreateWaiverData) {
  const isLessonWaiver = waiverData.activities.some(activity =>
    activity.toLowerCase().includes('lesson') || activity.toLowerCase().includes('instruction')
  );

  const expiryDate = this.calculateExpiryDate(isLessonWaiver);

  const waiver = {
    ...waiverData,
    created_at: new Date().toISOString(),
    expiry_date: expiryDate,
  };

  const { data, error } = await supabase
    .from('waivers')
    .insert([waiver])
    .select()
    .single();

  // 🔍 Add this check and log
  if (error) {
    console.error('Supabase waiver insert error:', error);
    throw error;
  }

  if (!data) {
    console.error('⚠️ Waiver created but no data returned from Supabase');
    throw new Error('Waiver creation succeeded but no data returned.');
  }

  console.log('✅ Waiver successfully created and returned:', data);

  return data as Waiver;
}
    
    // Calculate expiry date based on activity type settings
    const today = new Date();
    const expiryDate = new Date(today);
    const expiryPeriod = settingsService.getWaiverExpiryPeriod(activityType);
    expiryDate.setDate(today.getDate() + expiryPeriod);
    
    // Format as YYYY-MM-DD to ensure correct date
    const expiryDateString = expiryDate.toISOString().split('T')[0];
    
    console.log('📅 Waiver date calculation:', {
      activityType,
      activities: waiverData.activities,
      today: today.toISOString().split('T')[0],
      expiryPeriod: expiryPeriod,
      expiryDate: expiryDateString,
      settings: {
        lessonExpiry: settingsService.getWaiverExpiryPeriod('lesson'),
        rentalExpiry: settingsService.getWaiverExpiryPeriod('rental'),
        requireNewPerLesson: settingsService.requiresNewWaiverPerActivity('lesson'),
        requireNewPerRental: settingsService.requiresNewWaiverPerActivity('rental')
      }
    });
    
    // Get client IP and device info
    const ipAddress = '192.168.1.102'; // In real app, get from request
    const deviceType = 'iPad Pro'; // In real app, detect device
    
    const waiver = {
      ...waiverData,
      status: 'signed' as const,
      signed_date: new Date().toISOString(),
      expiry_date: expiryDateString,
      ip_address: ipAddress,
      device_type: deviceType,
      notes: waiverData.notes || '',
      // Convert empty strings to null for foreign key fields
      lesson_id: waiverData.lesson_id && waiverData.lesson_id.trim() !== '' ? waiverData.lesson_id : null,
      rental_id: waiverData.rental_id && waiverData.rental_id.trim() !== '' ? waiverData.rental_id : null,
      customer_id: waiverData.customer_id && waiverData.customer_id.trim() !== '' ? waiverData.customer_id : null
    };

    const { data, error } = await supabase
      .from('waivers')
      .insert([waiver])
      .select()
      .single();
    
    if (error) throw error;

    console.log('✅ Waiver created with activity-specific expiry:', {
      waiverId: data.id,
      customerName: data.customer_name,
      activityType,
      expiryPeriod: expiryPeriod + ' days',
      expiryDate: data.expiry_date,
      signedDate: data.signed_date
    });

    // Update customer profile with waiver information AND any missing data
    if (waiver.customer_id) {
      try {
        // Get current customer data to see what's missing
        const currentCustomer = await customerService.getCustomer(waiver.customer_id);
        
        // Prepare updates - only update fields that are missing or empty
        const customerUpdates: any = {
          waiver_signed: true,
          waiver_expiry_date: waiver.expiry_date
        };

        // Update missing personal information
        if (!currentCustomer.date_of_birth && waiverData.date_of_birth) {
          customerUpdates.date_of_birth = waiverData.date_of_birth;
        }

        if (!currentCustomer.emergency_contact_name && waiverData.emergency_contact_name) {
          customerUpdates.emergency_contact_name = waiverData.emergency_contact_name;
        }

        if (!currentCustomer.emergency_contact_phone && waiverData.emergency_contact_phone) {
          customerUpdates.emergency_contact_phone = waiverData.emergency_contact_phone;
        }

        // Update email if it's different (in case they corrected it)
        if (currentCustomer.email !== waiverData.email) {
          customerUpdates.email = waiverData.email;
        }

        // Update phone if it's different (in case they corrected it)
        if (currentCustomer.phone !== waiverData.phone) {
          customerUpdates.phone = waiverData.phone;
        }

        // Update the customer profile
        await customerService.updateCustomer(waiver.customer_id, customerUpdates);

        console.log('✅ Customer profile updated with waiver information:', {
          customerId: waiver.customer_id,
          updatedFields: Object.keys(customerUpdates),
          expiryDate: waiver.expiry_date
        });

      } catch (customerError) {
        console.error('Error updating customer profile with waiver data:', customerError);
        // Don't throw error here as waiver was successfully created
      }
    }

    return data as Waiver;
  },

  // Update waiver
  async updateWaiver(id: string, updates: Partial<Waiver>) {
    const { data, error } = await supabase
      .from('waivers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Waiver;
  },

  // Delete waiver with customer profile sync
  async deleteWaiver(id: string) {
    // Get waiver details before deletion to update customer status
    const waiver = await this.getWaiver(id);
    
    const { error } = await supabase
      .from('waivers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Update customer waiver status if this was their waiver
    if (waiver.customer_id) {
      try {
        // Check if customer has other valid waivers
        const otherWaivers = await this.getWaiversByCustomer(waiver.customer_id);
        const hasOtherValidWaivers = otherWaivers.some(w => 
          w.id !== id && 
          w.status === 'signed' && 
          w.expiry_date && 
          new Date(w.expiry_date) > new Date()
        );

        if (!hasOtherValidWaivers) {
          // No other valid waivers, mark customer as needing waiver
          await customerService.updateWaiverStatus(waiver.customer_id, false, null);
          console.log('✅ Customer waiver status updated after deletion:', {
            customerId: waiver.customer_id,
            waiverSigned: false
          });
        } else {
          // Find the most recent valid waiver and update customer with that info
          const latestValidWaiver = otherWaivers
            .filter(w => w.status === 'signed' && w.expiry_date && new Date(w.expiry_date) > new Date())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          
          if (latestValidWaiver) {
            await customerService.updateWaiverStatus(waiver.customer_id, true, latestValidWaiver.expiry_date);
            console.log('✅ Customer waiver status updated with latest valid waiver:', {
              customerId: waiver.customer_id,
              expiryDate: latestValidWaiver.expiry_date
            });
          }
        }
      } catch (customerError) {
        console.error('Error updating customer waiver status after deletion:', customerError);
      }
    }

    console.log('✅ Waiver deleted and customer profile updated:', {
      waiverId: id,
      customerName: waiver.customer_name
    });
  },

  // Search waivers
  async searchWaivers(query: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .or(`customer_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Waiver[];
  },

  // Filter waivers by status
  async filterWaivers(status?: string) {
    let query = supabase.from('waivers').select('*');
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Waiver[];
  },

  // Get waiver statistics with expiration tracking
  async getWaiverStats() {
    const { data, error } = await supabase
      .from('waivers')
      .select('status, expiry_date, created_at');
    
    if (error) throw error;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: data.length,
      signed: data.filter(w => w.status === 'signed').length,
      pending: data.filter(w => w.status === 'pending').length,
      expired: data.filter(w => w.status === 'expired').length,
      active: data.filter(w => {
        if (w.status !== 'signed' || !w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate >= now;
      }).length,
      expiringSoon: data.filter(w => {
        if (w.status !== 'signed' || !w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
      }).length,
      expiredRecently: data.filter(w => {
        if (!w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate < now && expiryDate >= thirtyDaysAgo;
      }).length,
      todayWaivers: data.filter(w => {
        const today = new Date().toISOString().split('T')[0];
        return w.created_at.split('T')[0] === today;
      }).length,
      // Administrative categories
      needsArchiving: data.filter(w => {
        if (!w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate < thirtyDaysAgo; // Expired more than 30 days ago
      }).length
    };
    
    return stats;
  },

  // Check if customer has valid waiver for specific activity
  async hasValidWaiver(customerId: string, activities: string[] = [], activityDate?: string) {
    // Determine activity type
    const isLessonActivity = activities.some(activity => 
      activity.toLowerCase().includes('lesson') || activity.toLowerCase().includes('instruction')
    );
    const activityType = isLessonActivity ? 'lesson' : 'rental';
    
    // Check if new waiver is required per activity
    const requiresNewWaiver = settingsService.requiresNewWaiverPerActivity(activityType);
    
    console.log('🔍 Checking waiver validity:', {
      customerId,
      activities,
      activityType,
      requiresNewWaiver,
      activityDate
    });
    
    // If new waiver is required per activity, customer always needs a new waiver
    if (requiresNewWaiver) {
      console.log('❌ New waiver required per activity');
      return false;
    }
    
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'signed')
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log('❌ No valid waivers found');
      return false;
    }
    
    const waiver = data[0];
    
    // Check if waiver covers all required activities
    if (activities.length > 0) {
      const hasAllActivities = activities.every(activity => 
        waiver.activities.includes(activity)
      );
      
      if (!hasAllActivities) {
        console.log('❌ Waiver does not cover all required activities');
        return false;
      }
    }
    
    console.log('✅ Valid waiver found:', {
      waiverId: waiver.id,
      expiryDate: waiver.expiry_date,
      activities: waiver.activities
    });
    
    return true;
  },

  // Get customer's latest waiver
  async getCustomerLatestWaiver(customerId: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Waiver : null;
  },

  // Mark expired waivers and update customer profiles
  async markExpiredWaivers() {
    const today = new Date().toISOString().split('T')[0];
    
    // Get waivers that should be expired
    const { data: expiredWaivers, error: fetchError } = await supabase
      .from('waivers')
      .select('*')
      .eq('status', 'signed')
      .lt('expiry_date', today);
    
    if (fetchError) throw fetchError;
    
    if (!expiredWaivers || expiredWaivers.length === 0) {
      return [];
    }

    // Mark waivers as expired
    const { data, error } = await supabase
      .from('waivers')
      .update({ status: 'expired' })
      .eq('status', 'signed')
      .lt('expiry_date', today)
      .select();
    
    if (error) throw error;

    // Update customer profiles for expired waivers
    for (const waiver of expiredWaivers) {
      if (waiver.customer_id) {
        try {
          // Check if customer has other valid waivers
          const otherValidWaivers = await this.getWaiversByCustomer(waiver.customer_id);
          const hasOtherValidWaivers = otherValidWaivers.some(w => 
            w.id !== waiver.id && 
            w.status === 'signed' && 
            w.expiry_date && 
            new Date(w.expiry_date) >= new Date()
          );

          if (!hasOtherValidWaivers) {
            // No other valid waivers, mark customer as needing waiver
            await customerService.updateWaiverStatus(waiver.customer_id, false, null);
            console.log('✅ Customer waiver status updated due to expiration:', {
              customerId: waiver.customer_id,
              customerName: waiver.customer_name,
              expiredWaiverId: waiver.id
            });
          }
        } catch (customerError) {
          console.error('Error updating customer profile for expired waiver:', customerError);
        }
      }
    }
    
    console.log(`✅ Marked ${data.length} waivers as expired and updated customer profiles`);
    return data as Waiver[];
  },

  // Get waivers expiring soon
  async getWaiversExpiringSoon(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('status', 'signed')
      .lte('expiry_date', futureDateStr)
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });
    
    if (error) throw error;
    return data as Waiver[];
  },

  // Get waivers for administrative review (expired > 30 days ago)
  async getWaiversForArchiving() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .or(`status.eq.expired,and(status.eq.signed,expiry_date.lt.${thirtyDaysAgoStr})`)
      .order('expiry_date', { ascending: true });
    
    if (error) throw error;
    return data as Waiver[];
  },

  // Archive old waivers (soft delete - mark as archived)
  async archiveOldWaivers(waiverIds: string[]) {
    const { data, error } = await supabase
      .from('waivers')
      .update({ 
        status: 'expired',
        notes: 'Archived for administrative purposes'
      })
      .in('id', waiverIds)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ Archived ${data.length} old waivers for administrative purposes`);
    return data as Waiver[];
  },

  // Get waiver retention report
  async getWaiverRetentionReport() {
    const { data, error } = await supabase
      .from('waivers')
      .select('status, expiry_date, created_at, signed_date');
    
    if (error) throw error;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const report = {
      totalWaivers: data.length,
      activeWaivers: data.filter(w => {
        if (w.status !== 'signed' || !w.expiry_date) return false;
        return new Date(w.expiry_date) >= now;
      }).length,
      expiredLast30Days: data.filter(w => {
        if (!w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate < now && expiryDate >= thirtyDaysAgo;
      }).length,
      expiredLast60Days: data.filter(w => {
        if (!w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate < thirtyDaysAgo && expiryDate >= sixtyDaysAgo;
      }).length,
      expiredLast90Days: data.filter(w => {
        if (!w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate < sixtyDaysAgo && expiryDate >= ninetyDaysAgo;
      }).length,
      readyForArchiving: data.filter(w => {
        if (!w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate < thirtyDaysAgo;
      }).length
    };
    
    return report;
  },

  // Link waiver to lesson
  async linkWaiverToLesson(waiverId: string, lessonId: string) {
    const { data, error } = await supabase
      .from('waivers')
      .update({ lesson_id: lessonId })
      .eq('id', waiverId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Waiver;
  },

  // Link waiver to rental
  async linkWaiverToRental(waiverId: string, rentalId: string) {
    const { data, error } = await supabase
      .from('waivers')
      .update({ rental_id: rentalId })
      .eq('id', waiverId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Waiver;
  },

  // Find or create customer from waiver data with profile sync
  async findOrCreateCustomer(waiverData: CreateWaiverData) {
    // First, try to find existing customer by email
    const { data: existingCustomer, error: searchError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', waiverData.email)
      .single();
    
    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }
    
    if (existingCustomer) {
      // Customer exists - update their profile with any missing information
      const customerUpdates: any = {
        waiver_signed: true,
        waiver_expiry_date: null // This will be set properly when the waiver is created
      };

      // Update missing personal information
      if (!existingCustomer.date_of_birth && waiverData.date_of_birth) {
        customerUpdates.date_of_birth = waiverData.date_of_birth;
      }

      if (!existingCustomer.emergency_contact_name && waiverData.emergency_contact_name) {
        customerUpdates.emergency_contact_name = waiverData.emergency_contact_name;
      }

      if (!existingCustomer.emergency_contact_phone && waiverData.emergency_contact_phone) {
        customerUpdates.emergency_contact_phone = waiverData.emergency_contact_phone;
      }

      // Update email if it's different (in case they corrected it)
      if (existingCustomer.email !== waiverData.email) {
        customerUpdates.email = waiverData.email;
      }

      // Update phone if it's different (in case they corrected it)
      if (existingCustomer.phone !== waiverData.phone) {
        customerUpdates.phone = waiverData.phone;
      }

      // Update the customer profile
      await customerService.updateCustomer(existingCustomer.id, customerUpdates);

      console.log('✅ Existing customer profile updated with waiver information:', {
        customerId: existingCustomer.id,
        updatedFields: Object.keys(customerUpdates)
      });

      return existingCustomer.id;
    }
    
    // Create new customer with all waiver information
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert([{
        full_name: waiverData.customer_name,
        email: waiverData.email,
        phone: waiverData.phone,
        date_of_birth: waiverData.date_of_birth,
        emergency_contact_name: waiverData.emergency_contact_name,
        emergency_contact_phone: waiverData.emergency_contact_phone,
        preferred_activities: waiverData.activities,
        waiver_signed: true,
        status: 'active'
      }])
      .select()
      .single();
    
    if (createError) throw createError;
    
    console.log('✅ New customer created with complete waiver information:', {
      customerId: newCustomer.id,
      name: newCustomer.full_name
    });
    
    return newCustomer.id;
  },

  // Save waiver as draft (incomplete)
  async saveWaiverDraft(waiverData: Partial<CreateWaiverData>) {
    // Only save if we have at least customer name and email
    if (!waiverData.customer_name || !waiverData.email) {
      throw new Error('Customer name and email are required to save a draft waiver');
    }

    const waiver = {
      ...waiverData,
      status: 'pending' as const,
      notes: (waiverData.notes || '') + ' [Draft saved]'
    };

    const { data, error } = await supabase
      .from('waivers')
      .insert([waiver])
      .select()
      .single();
    
    if (error) throw error;

    console.log('✅ Waiver draft saved:', {
      waiverId: data.id,
      customerName: data.customer_name
    });

    return data as Waiver;
  }
};
