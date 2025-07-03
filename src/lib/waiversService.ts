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
        break;
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Waiver[];
  },

  async getWaiver(id: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Waiver;
  },

  async getWaiversByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Waiver[];
  },

  async getWaiversByLesson(lessonId: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Waiver[];
  },

  // --- CORRECTED createWaiver ---
  async createWaiver(waiverData: CreateWaiverData) {
    const isLessonWaiver = waiverData.activities.some(activity =>
      activity.toLowerCase().includes('lesson') || activity.toLowerCase().includes('instruction')
    );
    const activityType = isLessonWaiver ? 'lesson' : 'rental';
    const expiryPeriod = settingsService.getWaiverExpiryPeriod(activityType);
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + expiryPeriod);
    const expiryDateString = expiryDate.toISOString().split('T')[0];

    // Example: stub IP/device
    const ipAddress = '192.168.1.102';
    const deviceType = 'iPad Pro';

    // Log calculation
    console.log('📅 Waiver date calculation:', {
      activityType,
      activities: waiverData.activities,
      today: today.toISOString().split('T')[0],
      expiryPeriod,
      expiryDate: expiryDateString,
      settings: {
        lessonExpiry: settingsService.getWaiverExpiryPeriod('lesson'),
        rentalExpiry: settingsService.getWaiverExpiryPeriod('rental'),
        requireNewPerLesson: settingsService.requiresNewWaiverPerActivity('lesson'),
        requireNewPerRental: settingsService.requiresNewWaiverPerActivity('rental')
      }
    });

    const waiver = {
      ...waiverData,
      status: 'signed' as const,
      signed_date: today.toISOString(),
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      expiry_date: expiryDateString,
      ip_address: ipAddress,
      device_type: deviceType,
      notes: waiverData.notes || '',
      lesson_id: waiverData.lesson_id && waiverData.lesson_id.trim() !== '' ? waiverData.lesson_id : null,
      rental_id: waiverData.rental_id && waiverData.rental_id.trim() !== '' ? waiverData.rental_id : null,
      customer_id: waiverData.customer_id && waiverData.customer_id.trim() !== '' ? waiverData.customer_id : null
    };

    const { data, error } = await supabase
      .from('waivers')
      .insert([waiver])
      .select()
      .single();

    if (error) {
      console.error('Supabase waiver insert error:', error);
      throw error;
    }
    if (!data) {
      console.error('⚠️ Waiver created but no data returned from Supabase');
      throw new Error('Waiver creation succeeded but no data returned.');
    }

    console.log('✅ Waiver successfully created and returned:', data);

    // Update customer profile if customer_id exists
    if (waiver.customer_id) {
      try {
        const currentCustomer = await customerService.getCustomer(waiver.customer_id);
        const customerUpdates: any = {
          waiver_signed: true,
          waiver_expiry_date: waiver.expiry_date
        };
        if (!currentCustomer.date_of_birth && waiverData.date_of_birth) {
          customerUpdates.date_of_birth = waiverData.date_of_birth;
        }
        if (!currentCustomer.emergency_contact_name && waiverData.emergency_contact_name) {
          customerUpdates.emergency_contact_name = waiverData.emergency_contact_name;
        }
        if (!currentCustomer.emergency_contact_phone && waiverData.emergency_contact_phone) {
          customerUpdates.emergency_contact_phone = waiverData.emergency_contact_phone;
        }
        if (currentCustomer.email !== waiverData.email) {
          customerUpdates.email = waiverData.email;
        }
        if (currentCustomer.phone !== waiverData.phone) {
          customerUpdates.phone = waiverData.phone;
        }
        await customerService.updateCustomer(waiver.customer_id, customerUpdates);

        console.log('✅ Customer profile updated with waiver information:', {
          customerId: waiver.customer_id,
          updatedFields: Object.keys(customerUpdates),
          expiryDate: waiver.expiry_date
        });
      } catch (customerError) {
        console.error('Error updating customer profile with waiver data:', customerError);
      }
    }

    return data as Waiver;
  },

  // All other methods of waiversService, unchanged
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

  async deleteWaiver(id: string) {
    const waiver = await this.getWaiver(id);
    const { error } = await supabase
      .from('waivers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    if (waiver.customer_id) {
      try {
        const otherWaivers = await this.getWaiversByCustomer(waiver.customer_id);
        const hasOtherValidWaivers = otherWaivers.some(w =>
          w.id !== id &&
          w.status === 'signed' &&
          w.expiry_date &&
          new Date(w.expiry_date) > new Date()
        );
        if (!hasOtherValidWaivers) {
          await customerService.updateWaiverStatus(waiver.customer_id, false, null);
          console.log('✅ Customer waiver status updated after deletion:', {
            customerId: waiver.customer_id,
            waiverSigned: false
          });
        } else {
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

  // Everything from here on is unchanged
  async searchWaivers(query: string) {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .or(`customer_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Waiver[];
  },

  async filterWaivers(status?: string) {
    let query = supabase.from('waivers').select('*');
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Waiver[];
  },

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
      needsArchiving: data.filter(w => {
        if (!w.expiry_date) return false;
        const expiryDate = new Date(w.expiry_date);
        return expiryDate < thirtyDaysAgo;
      }).length
    };
    return stats;
  },

  async hasValidWaiver(customerId: string, activities: string[] = [], activityDate?: string) {
    const isLessonActivity = activities.some(activity =>
      activity.toLowerCase().includes('lesson') || activity.toLowerCase().includes('instruction')
    );
    const activityType = isLessonActivity ? 'lesson' : 'rental';
    const requiresNewWaiver = settingsService.requiresNewWaiverPerActivity(activityType);

    console.log('🔍 Checking waiver validity:', {
      customerId,
      activities,
      activityType,
      requiresNewWaiver,
      activityDate
    });

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

  async markExpiredWaivers() {
    const today = new Date().toISOString().split('T')[0];
    const { data: expiredWaivers, error: fetchError } = await supabase
      .from('waivers')
      .select('*')
      .eq('status', 'signed')
      .lt('expiry_date', today);
    if (fetchError) throw fetchError;

    if (!expiredWaivers || expiredWaivers.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('waivers')
      .update({ status: 'expired' })
      .eq('status', 'signed')
      .lt('expiry_date', today)
      .select();
    if (error) throw error;

    for (const waiver of expiredWaivers) {
      if (waiver.customer_id) {
        try {
          const otherValidWaivers = await this.getWaiversByCustomer(waiver.customer_id);
          const hasOtherValidWaivers = otherValidWaivers.some(w =>
            w.id !== waiver.id &&
            w.status === 'signed' &&
            w.expiry_date &&
            new Date(w.expiry_date) >= new Date()
          );
          if (!hasOtherValidWaivers) {
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
       *
