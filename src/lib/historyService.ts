import { supabase } from './supabase';

// Instructor lesson history interfaces
export interface InstructorLessonHistory {
  id: string;
  instructor_id: string;
  lesson_id: string;
  lesson_type: string;
  lesson_date: string;
  lesson_time: string;
  participant_count: number;
  lesson_price: number;
  total_revenue: number;
  lesson_status: 'completed' | 'cancelled' | 'no_show';
  location: string;
  weather_conditions?: string;
  instructor_notes: string;
  participant_feedback_avg?: number;
  lesson_duration_minutes?: number;
  equipment_used?: string[];
  safety_incidents: number;
  created_at: string;
}

// Equipment rental history interfaces
export interface EquipmentRentalHistory {
  id: string;
  equipment_id: string;
  rental_id: string;
  customer_id?: string;
  customer_name: string;
  rental_start_date: string;
  rental_end_date: string;
  actual_return_date?: string;
  daily_rate: number;
  total_days: number;
  total_revenue: number;
  condition_out: 'excellent' | 'good' | 'fair' | 'needs-repair';
  condition_in: 'excellent' | 'good' | 'fair' | 'damaged';
  damage_reported: boolean;
  damage_cost: number;
  late_return: boolean;
  late_fees: number;
  insurance_claimed: boolean;
  rental_notes: string;
  created_at: string;
}

// Equipment maintenance history interfaces
export interface EquipmentMaintenanceHistory {
  id: string;
  equipment_id: string;
  maintenance_type: 'cleaning' | 'repair' | 'inspection' | 'replacement' | 'upgrade';
  maintenance_date: string;
  performed_by: string;
  description: string;
  cost: number;
  parts_replaced?: string[];
  condition_before: 'excellent' | 'good' | 'fair' | 'needs-repair' | 'retired';
  condition_after: 'excellent' | 'good' | 'fair' | 'needs-repair' | 'retired';
  downtime_hours: number;
  warranty_work: boolean;
  vendor_used?: string;
  next_maintenance_due?: string;
  maintenance_notes: string;
  photos_taken: boolean;
  created_at: string;
}

// Customer transaction history interfaces
export interface CustomerTransactionHistory {
  id: string;
  customer_id: string;
  transaction_type: 'rental' | 'lesson' | 'purchase' | 'waiver_only' | 'campground' | 'refund' | 'credit';
  transaction_date: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'check' | 'online' | 'comp';
  reference_id?: string;
  reference_type?: string;
  description: string;
  items_json: any[];
  discount_applied: number;
  tax_amount: number;
  tip_amount: number;
  staff_member?: string;
  location?: string;
  notes: string;
  created_at: string;
}

// Instructor performance metrics interfaces
export interface InstructorPerformanceMetrics {
  id: string;
  instructor_id: string;
  metric_date: string;
  lessons_taught: number;
  total_students: number;
  total_revenue: number;
  average_class_size: number;
  student_satisfaction_avg?: number;
  cancellation_rate: number;
  no_show_rate: number;
  repeat_customer_rate: number;
  safety_incidents: number;
  equipment_damage_incidents: number;
  weather_cancellations: number;
  created_at: string;
  updated_at: string;
}

export const historyService = {
  // Instructor lesson history methods
  async getInstructorLessonHistory(instructorId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('instructor_lesson_history')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('lesson_date', { ascending: false });

    if (startDate) {
      query = query.gte('lesson_date', startDate);
    }
    if (endDate) {
      query = query.lte('lesson_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as InstructorLessonHistory[];
  },

  async getInstructorPerformanceMetrics(instructorId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('instructor_performance_metrics')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('metric_date', { ascending: false });

    if (startDate) {
      query = query.gte('metric_date', startDate);
    }
    if (endDate) {
      query = query.lte('metric_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as InstructorPerformanceMetrics[];
  },

  async getInstructorTotalRevenue(instructorId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('instructor_lesson_history')
      .select('total_revenue')
      .eq('instructor_id', instructorId)
      .eq('lesson_status', 'completed');

    if (startDate) {
      query = query.gte('lesson_date', startDate);
    }
    if (endDate) {
      query = query.lte('lesson_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data.reduce((total, record) => total + (record.total_revenue || 0), 0);
  },

  // Equipment rental history methods
  async getEquipmentRentalHistory(equipmentId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('equipment_rental_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('rental_start_date', { ascending: false });

    if (startDate) {
      query = query.gte('rental_start_date', startDate);
    }
    if (endDate) {
      query = query.lte('rental_start_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as EquipmentRentalHistory[];
  },

  async getEquipmentMaintenanceHistory(equipmentId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('equipment_maintenance_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('maintenance_date', { ascending: false });

    if (startDate) {
      query = query.gte('maintenance_date', startDate);
    }
    if (endDate) {
      query = query.lte('maintenance_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as EquipmentMaintenanceHistory[];
  },

  async addEquipmentMaintenanceRecord(maintenanceData: Omit<EquipmentMaintenanceHistory, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('equipment_maintenance_history')
      .insert([maintenanceData])
      .select()
      .single();

    if (error) throw error;
    return data as EquipmentMaintenanceHistory;
  },

  async getEquipmentUtilizationStats(equipmentId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('equipment_rental_history')
      .select('total_days, total_revenue, damage_reported, late_return')
      .eq('equipment_id', equipmentId);

    if (startDate) {
      query = query.gte('rental_start_date', startDate);
    }
    if (endDate) {
      query = query.lte('rental_start_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      totalRentals: data.length,
      totalDaysRented: data.reduce((sum, record) => sum + record.total_days, 0),
      totalRevenue: data.reduce((sum, record) => sum + record.total_revenue, 0),
      damageIncidents: data.filter(record => record.damage_reported).length,
      lateReturns: data.filter(record => record.late_return).length,
      utilizationRate: 0 // Would need to calculate based on available days
    };

    return stats;
  },

  // Customer transaction history methods
  async getCustomerTransactionHistory(customerId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('customer_transaction_history')
      .select('*')
      .eq('customer_id', customerId)
      .order('transaction_date', { ascending: false });

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as CustomerTransactionHistory[];
  },

  async addCustomerTransaction(transactionData: Omit<CustomerTransactionHistory, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('customer_transaction_history')
      .insert([transactionData])
      .select()
      .single();

    if (error) throw error;
    return data as CustomerTransactionHistory;
  },

  async getCustomerSpendingAnalytics(customerId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('customer_transaction_history')
      .select('amount, transaction_type, transaction_date')
      .eq('customer_id', customerId);

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const analytics = {
      totalSpent: data.reduce((sum, record) => sum + record.amount, 0),
      totalTransactions: data.length,
      averageTransactionValue: data.length > 0 ? data.reduce((sum, record) => sum + record.amount, 0) / data.length : 0,
      spendingByType: data.reduce((acc, record) => {
        acc[record.transaction_type] = (acc[record.transaction_type] || 0) + record.amount;
        return acc;
      }, {} as Record<string, number>),
      monthlySpending: data.reduce((acc, record) => {
        const month = new Date(record.transaction_date).toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + record.amount;
        return acc;
      }, {} as Record<string, number>)
    };

    return analytics;
  },

  // Analytics and reporting methods
  async getInstructorLeaderboard(startDate?: string, endDate?: string) {
    let query = supabase
      .from('instructor_lesson_history')
      .select(`
        instructor_id,
        total_revenue,
        participant_count,
        instructors!inner(full_name, nickname)
      `)
      .eq('lesson_status', 'completed');

    if (startDate) {
      query = query.gte('lesson_date', startDate);
    }
    if (endDate) {
      query = query.lte('lesson_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate by instructor
    const leaderboard = data.reduce((acc, record) => {
      const instructorId = record.instructor_id;
      if (!acc[instructorId]) {
        acc[instructorId] = {
          instructor_id: instructorId,
          instructor_name: record.instructors.full_name,
          nickname: record.instructors.nickname,
          total_revenue: 0,
          total_students: 0,
          lessons_taught: 0
        };
      }
      acc[instructorId].total_revenue += record.total_revenue;
      acc[instructorId].total_students += record.participant_count;
      acc[instructorId].lessons_taught += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(leaderboard).sort((a: any, b: any) => b.total_revenue - a.total_revenue);
  },

  async getTopPerformingEquipment(startDate?: string, endDate?: string) {
    let query = supabase
      .from('equipment_rental_history')
      .select(`
        equipment_id,
        total_revenue,
        total_days,
        inventory_items!inner(name, brand, model, category)
      `);

    if (startDate) {
      query = query.gte('rental_start_date', startDate);
    }
    if (endDate) {
      query = query.lte('rental_start_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate by equipment
    const equipmentStats = data.reduce((acc, record) => {
      const equipmentId = record.equipment_id;
      if (!acc[equipmentId]) {
        acc[equipmentId] = {
          equipment_id: equipmentId,
          name: record.inventory_items.name,
          brand: record.inventory_items.brand,
          model: record.inventory_items.model,
          category: record.inventory_items.category,
          total_revenue: 0,
          total_days_rented: 0,
          rental_count: 0
        };
      }
      acc[equipmentId].total_revenue += record.total_revenue;
      acc[equipmentId].total_days_rented += record.total_days;
      acc[equipmentId].rental_count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(equipmentStats).sort((a: any, b: any) => b.total_revenue - a.total_revenue);
  },

  async getBusinessAnalytics(startDate?: string, endDate?: string) {
    // Get instructor revenue
    const instructorRevenue = await this.getInstructorLeaderboard(startDate, endDate);
    const totalInstructorRevenue = instructorRevenue.reduce((sum, instructor: any) => sum + instructor.total_revenue, 0);

    // Get equipment revenue
    const equipmentRevenue = await this.getTopPerformingEquipment(startDate, endDate);
    const totalEquipmentRevenue = equipmentRevenue.reduce((sum, equipment: any) => sum + equipment.total_revenue, 0);

    return {
      totalRevenue: totalInstructorRevenue + totalEquipmentRevenue,
      instructorRevenue: totalInstructorRevenue,
      equipmentRevenue: totalEquipmentRevenue,
      topInstructors: instructorRevenue.slice(0, 5),
      topEquipment: equipmentRevenue.slice(0, 5)
    };
  }
};