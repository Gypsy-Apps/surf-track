import { supabase } from './supabase';

export interface Instructor {
  id: string;
  full_name: string;
  nickname: string;
  birthday?: string;
  email: string;
  phone: string;
  profile_photo_url?: string;
  certification_body: string;
  certification_expiry?: string;
  first_aid_certified: boolean;
  first_aid_expiry?: string;
  ocean_rescue_certified: boolean;
  rescue_expiry?: string;
  years_experience: number;
  languages_spoken: string[];
  lesson_types: string[];
  surf_styles: string[];
  availability_notes: string;
  status: 'active' | 'inactive' | 'on_leave';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInstructorData {
  full_name: string;
  nickname?: string;
  birthday?: string;
  email: string;
  phone: string;
  profile_photo_url?: string;
  certification_body?: string;
  certification_expiry?: string;
  first_aid_certified?: boolean;
  first_aid_expiry?: string;
  ocean_rescue_certified?: boolean;
  rescue_expiry?: string;
  years_experience?: number;
  languages_spoken?: string[];
  lesson_types?: string[];
  surf_styles?: string[];
  availability_notes?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  notes?: string;
}

export const instructorsService = {
  // Get all instructors
  async getInstructors() {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .order('full_name');
    
    if (error) throw error;
    return data as Instructor[];
  },

  // Get active instructors only
  async getActiveInstructors() {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('status', 'active')
      .order('full_name');
    
    if (error) throw error;
    return data as Instructor[];
  },

  // Get instructor by ID
  async getInstructor(id: string) {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Instructor;
  },

  // Create new instructor
  async createInstructor(instructorData: CreateInstructorData) {
    const { data, error } = await supabase
      .from('instructors')
      .insert([{
        ...instructorData,
        languages_spoken: instructorData.languages_spoken || [],
        lesson_types: instructorData.lesson_types || [],
        surf_styles: instructorData.surf_styles || [],
        years_experience: instructorData.years_experience || 0,
        first_aid_certified: instructorData.first_aid_certified || false,
        ocean_rescue_certified: instructorData.ocean_rescue_certified || false,
        status: instructorData.status || 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Instructor;
  },

  // Update instructor
  async updateInstructor(id: string, updates: Partial<Instructor>) {
    const { data, error } = await supabase
      .from('instructors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Instructor;
  },

  // Delete instructor
  async deleteInstructor(id: string) {
    // First, update any lessons that reference this instructor
    await supabase
      .from('lessons')
      .update({ 
        instructor_id: null,
        instructor_name: 'Instructor Removed'
      })
      .eq('instructor_id', id);

    // Then delete the instructor
    const { error } = await supabase
      .from('instructors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Search instructors
  async searchInstructors(query: string) {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .or(`full_name.ilike.%${query}%,nickname.ilike.%${query}%,email.ilike.%${query}%`)
      .order('full_name');
    
    if (error) throw error;
    return data as Instructor[];
  },

  // Get instructors by lesson type
  async getInstructorsByLessonType(lessonType: string) {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .contains('lesson_types', [lessonType])
      .eq('status', 'active')
      .order('full_name');
    
    if (error) throw error;
    return data as Instructor[];
  },

  // Get instructor statistics
  async getInstructorStats() {
    const { data, error } = await supabase
      .from('instructors')
      .select('status, first_aid_certified, ocean_rescue_certified, certification_expiry, first_aid_expiry, rescue_expiry');
    
    if (error) throw error;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: data.length,
      active: data.filter(i => i.status === 'active').length,
      inactive: data.filter(i => i.status === 'inactive').length,
      onLeave: data.filter(i => i.status === 'on_leave').length,
      firstAidCertified: data.filter(i => i.first_aid_certified).length,
      oceanRescueCertified: data.filter(i => i.ocean_rescue_certified).length,
      certificationsExpiringSoon: data.filter(i => {
        if (!i.certification_expiry) return false;
        const expiryDate = new Date(i.certification_expiry);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
      }).length,
      firstAidExpiringSoon: data.filter(i => {
        if (!i.first_aid_expiry) return false;
        const expiryDate = new Date(i.first_aid_expiry);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
      }).length,
      rescueExpiringSoon: data.filter(i => {
        if (!i.rescue_expiry) return false;
        const expiryDate = new Date(i.rescue_expiry);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
      }).length
    };
    
    return stats;
  },

  // Subscribe to instructor changes (for real-time updates)
  subscribeToInstructorChanges(callback: (instructors: Instructor[]) => void) {
    const subscription = supabase
      .channel('instructors-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'instructors' 
        }, 
        async () => {
          // Fetch updated instructors list
          const instructors = await this.getActiveInstructors();
          callback(instructors);
        }
      )
      .subscribe();

    return subscription;
  }
};