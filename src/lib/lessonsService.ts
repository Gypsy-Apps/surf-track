import { supabase } from './supabase';

export interface Lesson {
  id: string;
  type: string;
  instructor_id: string | null;
  instructor_name: string;
  max_participants: number;
  current_participants: number;
  date: string;
  time: string;
  location: string;
  notes: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  cancellation_reason?: string;
  cancellation_notes?: string;
  refund_amount?: number;
  refund_type?: 'none' | 'partial' | 'full';
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  participants?: LessonParticipant[];
  // Enhanced cancellation fields
  processing_fee?: number;
  weather_related?: boolean;
  instructor_fault?: boolean;
  customer_no_show?: boolean;
  rescheduled?: boolean;
  reschedule_date?: string;
  reschedule_time?: string;
  compensation_offered?: boolean;
  compensation_type?: 'none' | 'credit' | 'discount' | 'free_lesson';
  compensation_value?: number;
  notification_sent?: boolean;
  follow_up_required?: boolean;
  advance_notice_hours?: number;
  total_revenue?: number;
  participant_count?: number;
  original_price?: number;
  cancellation_timestamp?: string;
}

export interface LessonParticipant {
  id: string;
  lesson_id: string;
  customer_id: string;
  customer_name: string;
  waiver_collected: boolean;
  added_at: string;
}

export interface CreateLessonData {
  type: string;
  instructor_id: string | null;
  instructor_name: string;
  max_participants: number;
  date: string;
  time: string;
  location: string;
  notes: string;
  price: number;
}

export interface CancellationData {
  reason: string;
  customNotes: string;
  refundType: 'none' | 'partial' | 'full';
  refundAmount?: number;
  processingFee?: number;
  weatherRelated?: boolean;
  instructorFault?: boolean;
  customerNoShow?: boolean;
  rescheduled?: boolean;
  rescheduleDate?: string;
  rescheduleTime?: string;
  compensationOffered?: boolean;
  compensationType?: 'none' | 'credit' | 'discount' | 'free_lesson';
  compensationValue?: number;
  notificationSent?: boolean;
  followUpRequired?: boolean;
  totalRevenue?: number;
  participantCount?: number;
  originalPrice?: number;
  cancellationTimestamp?: string;
  advanceNoticeHours?: number;
}

export interface RescheduleData {
  newDate: string;
  newTime: string;
  newLocation?: string;
  newInstructor?: string;
  reason: string;
  notes?: string;
  notifyParticipants: boolean;
  compensationOffered: boolean;
  compensationType: 'none' | 'credit' | 'discount' | 'free_lesson';
  compensationValue: number;
}

export const lessonsService = {
  // Get all lessons
  async getLessons() {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        participants:lesson_participants(*)
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) throw error;
    return data as Lesson[];
  },

  // Get lesson by ID
  async getLesson(id: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        participants:lesson_participants(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Lesson;
  },

  // Create new lesson
  async createLesson(lessonData: CreateLessonData) {
    const { data, error } = await supabase
      .from('lessons')
      .insert([lessonData])
      .select()
      .single();
    
    if (error) throw error;
    return data as Lesson;
  },

  // Update lesson
  async updateLesson(id: string, updates: Partial<Lesson>) {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lesson;
  },

  // Reschedule lesson - NEW FUNCTIONALITY
  async rescheduleLesson(id: string, rescheduleData: RescheduleData) {
    const lesson = await this.getLesson(id);
    
    // Calculate advance notice for original lesson
    const originalDateTime = new Date(`${lesson.date}T${lesson.time}`);
    const now = new Date();
    const advanceNoticeHours = Math.round((originalDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    const updates = {
      date: rescheduleData.newDate,
      time: rescheduleData.newTime,
      location: rescheduleData.newLocation || lesson.location,
      instructor_name: rescheduleData.newInstructor || lesson.instructor_name,
      rescheduled: true,
      reschedule_date: rescheduleData.newDate,
      reschedule_time: rescheduleData.newTime,
      compensation_offered: rescheduleData.compensationOffered,
      compensation_type: rescheduleData.compensationType,
      compensation_value: rescheduleData.compensationValue,
      notification_sent: rescheduleData.notifyParticipants,
      follow_up_required: true,
      advance_notice_hours: advanceNoticeHours,
      notes: lesson.notes + (rescheduleData.notes ? `\n\nReschedule Notes: ${rescheduleData.notes}` : ''),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lesson;
  },

  // Enhanced cancel lesson with comprehensive tracking
  async cancelLesson(id: string, cancellationData: CancellationData) {
    const lesson = await this.getLesson(id);
    
    // Calculate refund details
    const totalRevenue = lesson.price * lesson.current_participants;
    let baseRefund = 0;
    
    switch (cancellationData.refundType) {
      case 'none':
        baseRefund = 0;
        break;
      case 'partial':
        baseRefund = Math.round(totalRevenue * 0.5 * 100) / 100;
        break;
      case 'full':
        baseRefund = totalRevenue;
        break;
    }
    
    // Calculate processing fee
    let processingFee = 0;
    if (cancellationData.reason === 'Customer request' && baseRefund > 0) {
      processingFee = Math.min(baseRefund * 0.1, 25); // 10% fee, max $25
    }
    
    // Waive processing fee for weather/instructor issues
    if (cancellationData.weatherRelated || cancellationData.instructorFault) {
      processingFee = 0;
    }
    
    const finalRefund = Math.max(0, baseRefund - processingFee);
    
    // Calculate advance notice
    const lessonDateTime = new Date(`${lesson.date}T${lesson.time}`);
    const now = new Date();
    const advanceNoticeHours = Math.round((lessonDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    const updates = {
      status: 'cancelled' as const,
      cancellation_reason: cancellationData.reason,
      cancellation_notes: cancellationData.reason === 'Other' ? cancellationData.customNotes : '',
      refund_amount: finalRefund,
      refund_type: cancellationData.refundType,
      cancelled_at: new Date().toISOString(),
      processing_fee: processingFee,
      weather_related: cancellationData.weatherRelated || false,
      instructor_fault: cancellationData.instructorFault || false,
      customer_no_show: cancellationData.customerNoShow || false,
      rescheduled: cancellationData.rescheduled || false,
      reschedule_date: cancellationData.rescheduleDate || null,
      reschedule_time: cancellationData.rescheduleTime || null,
      compensation_offered: cancellationData.compensationOffered || false,
      compensation_type: cancellationData.compensationType || 'none',
      compensation_value: cancellationData.compensationValue || 0,
      notification_sent: cancellationData.notificationSent || false,
      follow_up_required: cancellationData.followUpRequired || false,
      advance_notice_hours: advanceNoticeHours,
      total_revenue: totalRevenue,
      participant_count: lesson.current_participants,
      original_price: lesson.price,
      cancellation_timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lesson;
  },

  // Delete lesson
  async deleteLesson(id: string) {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Add participant to lesson
  async addParticipant(lessonId: string, customerId: string, customerName: string, waiverCollected: boolean = false) {
    const { data, error } = await supabase
      .from('lesson_participants')
      .insert([{
        lesson_id: lessonId,
        customer_id: customerId,
        customer_name: customerName,
        waiver_collected: waiverCollected
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as LessonParticipant;
  },

  // Remove participant from lesson
  async removeParticipant(lessonId: string, customerId: string) {
    const { error } = await supabase
      .from('lesson_participants')
      .delete()
      .eq('lesson_id', lessonId)
      .eq('customer_id', customerId);
    
    if (error) throw error;
  },

  // Update participant waiver status
  async updateParticipantWaiver(lessonId: string, customerId: string, waiverCollected: boolean) {
    const { data, error } = await supabase
      .from('lesson_participants')
      .update({ waiver_collected: waiverCollected })
      .eq('lesson_id', lessonId)
      .eq('customer_id', customerId)
      .select()
      .single();
    
    if (error) throw error;
    return data as LessonParticipant;
  },

  // Get lessons for a specific date
  async getLessonsByDate(date: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        participants:lesson_participants(*)
      `)
      .eq('date', date)
      .order('time', { ascending: true });
    
    if (error) throw error;
    return data as Lesson[];
  },

  // Get lessons for a specific instructor
  async getLessonsByInstructor(instructorId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        participants:lesson_participants(*)
      `)
      .eq('instructor_id', instructorId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) throw error;
    return data as Lesson[];
  },

  // Get lesson statistics
  async getLessonStats() {
    const { data, error } = await supabase
      .from('lessons')
      .select('status, current_participants, price, date');
    
    if (error) throw error;
    
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      total: data.length,
      scheduled: data.filter(lesson => lesson.status === 'scheduled').length,
      inProgress: data.filter(lesson => lesson.status === 'in-progress').length,
      completed: data.filter(lesson => lesson.status === 'completed').length,
      cancelled: data.filter(lesson => lesson.status === 'cancelled').length,
      todayLessons: data.filter(lesson => lesson.date === today).length,
      totalStudents: data.reduce((sum, lesson) => sum + lesson.current_participants, 0),
      todayRevenue: data
        .filter(lesson => lesson.date === today && lesson.status !== 'cancelled')
        .reduce((sum, lesson) => sum + (lesson.price * lesson.current_participants), 0)
    };
    
    return stats;
  },

  // Get cancellation analytics
  async getCancellationAnalytics() {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('status', 'cancelled');
    
    if (error) throw error;
    
    const analytics = {
      totalCancellations: data.length,
      weatherCancellations: data.filter(l => l.weather_related).length,
      instructorCancellations: data.filter(l => l.instructor_fault).length,
      customerCancellations: data.filter(l => l.cancellation_reason === 'Customer request').length,
      noShowCancellations: data.filter(l => l.customer_no_show).length,
      totalRefundsIssued: data.reduce((sum, l) => sum + (l.refund_amount || 0), 0),
      totalProcessingFees: data.reduce((sum, l) => sum + (l.processing_fee || 0), 0),
      rescheduledLessons: data.filter(l => l.rescheduled).length,
      compensationOffered: data.filter(l => l.compensation_offered).length,
      averageAdvanceNotice: data.reduce((sum, l) => sum + (l.advance_notice_hours || 0), 0) / data.length
    };
    
    return analytics;
  },

  // Get reschedule analytics - NEW
  async getRescheduleAnalytics() {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('rescheduled', true);
    
    if (error) throw error;
    
    const analytics = {
      totalRescheduled: data.length,
      weatherRescheduled: data.filter(l => l.weather_related).length,
      instructorRescheduled: data.filter(l => l.instructor_fault).length,
      customerRescheduled: data.filter(l => l.cancellation_reason === 'Customer request').length,
      compensationOffered: data.filter(l => l.compensation_offered).length,
      averageAdvanceNotice: data.reduce((sum, l) => sum + (l.advance_notice_hours || 0), 0) / data.length,
      totalCompensationValue: data.reduce((sum, l) => sum + (l.compensation_value || 0), 0)
    };
    
    return analytics;
  },

  // Calculate refund amount
  calculateRefundAmount(lesson: Lesson, refundType: string) {
    const totalRevenue = lesson.price * lesson.current_participants;
    switch (refundType) {
      case 'none':
        return 0;
      case 'partial':
        return Math.round(totalRevenue * 0.5 * 100) / 100;
      case 'full':
        return totalRevenue;
      default:
        return 0;
    }
  }
};