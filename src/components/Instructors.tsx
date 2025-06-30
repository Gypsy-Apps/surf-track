import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  CheckCircle, 
  AlertTriangle,
  X,
  GraduationCap,
  Languages,
  Clock,
  Heart,
  Shield,
  History,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { instructorsService, Instructor, CreateInstructorData } from '../lib/instructorsService';
import { historyService } from '../lib/historyService';
import InstructorHistory from './InstructorHistory';

const Instructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedInstructor, setExpandedInstructor] = useState<string | null>(null);
  const [instructorRevenue, setInstructorRevenue] = useState<Record<string, number>>({});

  // Form state
  const [formData, setFormData] = useState<CreateInstructorData>({
    full_name: '',
    nickname: '',
    birthday: '',
    email: '',
    phone: '',
    profile_photo_url: '',
    certification_body: '',
    certification_expiry: '',
    first_aid_certified: false,
    first_aid_expiry: '',
    ocean_rescue_certified: false,
    rescue_expiry: '',
    years_experience: 0,
    languages_spoken: [],
    lesson_types: [],
    surf_styles: [],
    availability_notes: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      setLoading(true);
      const instructorsData = await instructorsService.getInstructors();
      setInstructors(instructorsData);
      
      // Load revenue data for each instructor
      const revenueData: Record<string, number> = {};
      for (const instructor of instructorsData) {
        try {
          const revenue = await historyService.getInstructorTotalRevenue(instructor.id);
          revenueData[instructor.id] = revenue;
        } catch (error) {
          console.error(`Error loading revenue for instructor ${instructor.id}:`, error);
          revenueData[instructor.id] = 0;
        }
      }
      setInstructorRevenue(revenueData);
    } catch (error) {
      console.error('Error loading instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await instructorsService.createInstructor(formData);
      await loadInstructors();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating instructor:', error);
      alert('Error creating instructor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedInstructor) return;

    try {
      setIsSubmitting(true);
      await instructorsService.updateInstructor(selectedInstructor.id, formData);
      await loadInstructors();
      setShowEditModal(false);
      setSelectedInstructor(null);
      resetForm();
    } catch (error) {
      console.error('Error updating instructor:', error);
      alert('Error updating instructor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    if (!confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) {
      return;
    }

    try {
      await instructorsService.deleteInstructor(instructorId);
      await loadInstructors();
    } catch (error) {
      console.error('Error deleting instructor:', error);
      alert('Error deleting instructor. Please try again.');
    }
  };

  const handleEditInstructor = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setFormData({
      full_name: instructor.full_name,
      nickname: instructor.nickname || '',
      birthday: instructor.birthday || '',
      email: instructor.email,
      phone: instructor.phone,
      profile_photo_url: instructor.profile_photo_url || '',
      certification_body: instructor.certification_body || '',
      certification_expiry: instructor.certification_expiry || '',
      first_aid_certified: instructor.first_aid_certified || false,
      first_aid_expiry: instructor.first_aid_expiry || '',
      ocean_rescue_certified: instructor.ocean_rescue_certified || false,
      rescue_expiry: instructor.rescue_expiry || '',
      years_experience: instructor.years_experience || 0,
      languages_spoken: instructor.languages_spoken || [],
      lesson_types: instructor.lesson_types || [],
      surf_styles: instructor.surf_styles || [],
      availability_notes: instructor.availability_notes || '',
      status: instructor.status,
      notes: instructor.notes || ''
    });
    setShowEditModal(true);
  };

  const handleViewHistory = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      nickname: '',
      birthday: '',
      email: '',
      phone: '',
      profile_photo_url: '',
      certification_body: '',
      certification_expiry: '',
      first_aid_certified: false,
      first_aid_expiry: '',
      ocean_rescue_certified: false,
      rescue_expiry: '',
      years_experience: 0,
      languages_spoken: [],
      lesson_types: [],
      surf_styles: [],
      availability_notes: '',
      status: 'active',
      notes: ''
    });
  };

  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch = instructor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructor.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || instructor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'on_leave': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCertificationStatusColor = (expiryDate?: string) => {
    if (!expiryDate) return 'text-gray-400';
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (expiry < now) {
      return 'text-red-400'; // Expired
    } else if (expiry <= thirtyDaysFromNow) {
      return 'text-amber-400'; // Expiring soon
    } else {
      return 'text-green-400'; // Valid
    }
  };

  const renderInstructorModal = (isEdit: boolean = false) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">
            {isEdit ? 'Edit Instructor' : 'Add New Instructor'}
          </h3>
          <button
            onClick={() => {
              if (isEdit) {
                setShowEditModal(false);
                setSelectedInstructor(null);
              } else {
                setShowCreateModal(false);
              }
              resetForm();
            }}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={isEdit ? handleUpdateInstructor : handleCreateInstructor} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Nickname</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Birthday</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Years Experience</label>
              <input
                type="number"
                value={formData.years_experience}
                onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="active" className="bg-gray-800">Active</option>
                <option value="inactive" className="bg-gray-800">Inactive</option>
                <option value="on_leave" className="bg-gray-800">On Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Profile Photo URL</label>
              <input
                type="text"
                value={formData.profile_photo_url}
                onChange={(e) => setFormData(prev => ({ ...prev, profile_photo_url: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Certifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Certification Body</label>
                <input
                  type="text"
                  value={formData.certification_body}
                  onChange={(e) => setFormData(prev => ({ ...prev, certification_body: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="e.g., ISA, WSL, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Certification Expiry</label>
                <input
                  type="date"
                  value={formData.certification_expiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, certification_expiry: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="first_aid_certified"
                    checked={formData.first_aid_certified}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_aid_certified: e.target.checked }))}
                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                  />
                  <label htmlFor="first_aid_certified" className="text-cyan-200">First Aid Certified</label>
                </div>
                {formData.first_aid_certified && (
                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">First Aid Expiry</label>
                    <input
                      type="date"
                      value={formData.first_aid_expiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_aid_expiry: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="ocean_rescue_certified"
                    checked={formData.ocean_rescue_certified}
                    onChange={(e) => setFormData(prev => ({ ...prev, ocean_rescue_certified: e.target.checked }))}
                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                  />
                  <label htmlFor="ocean_rescue_certified" className="text-cyan-200">Ocean Rescue Certified</label>
                </div>
                {formData.ocean_rescue_certified && (
                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">Rescue Certification Expiry</label>
                    <input
                      type="date"
                      value={formData.rescue_expiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, rescue_expiry: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lesson Types */}
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Lesson Types</label>
            <div className="flex flex-wrap gap-2">
              {['Beginner Group', 'Intermediate Group', 'Advanced Group', 'Private Lesson', 'Kids Group', 'SUP Lesson', 'Longboard Lesson'].map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.lesson_types?.includes(type)}
                    onChange={(e) => {
                      const types = formData.lesson_types || [];
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, lesson_types: [...types, type] }));
                      } else {
                        setFormData(prev => ({ ...prev, lesson_types: types.filter(t => t !== type) }));
                      }
                    }}
                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                  />
                  <span className="text-cyan-200 text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Languages Spoken</label>
            <div className="flex flex-wrap gap-2">
              {['English', 'Spanish', 'French', 'Portuguese', 'German', 'Mandarin', 'Japanese'].map(language => (
                <label key={language} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.languages_spoken?.includes(language)}
                    onChange={(e) => {
                      const languages = formData.languages_spoken || [];
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, languages_spoken: [...languages, language] }));
                      } else {
                        setFormData(prev => ({ ...prev, languages_spoken: languages.filter(l => l !== language) }));
                      }
                    }}
                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                  />
                  <span className="text-cyan-200 text-sm">{language}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Surf Styles */}
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Surf Styles</label>
            <div className="flex flex-wrap gap-2">
              {['Shortboard', 'Longboard', 'Fish', 'Funboard', 'SUP', 'Soft-top', 'Gun', 'Performance', 'Classic', 'Noseriding'].map(style => (
                <label key={style} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.surf_styles?.includes(style)}
                    onChange={(e) => {
                      const styles = formData.surf_styles || [];
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, surf_styles: [...styles, style] }));
                      } else {
                        setFormData(prev => ({ ...prev, surf_styles: styles.filter(s => s !== style) }));
                      }
                    }}
                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                  />
                  <span className="text-cyan-200 text-sm">{style}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability Notes */}
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Availability Notes</label>
            <textarea
              value={formData.availability_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, availability_notes: e.target.value }))}
              rows={2}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="e.g., Available weekends only, prefers morning lessons, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Additional notes about the instructor..."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setSelectedInstructor(null);
                } else {
                  setShowCreateModal(false);
                }
                resetForm();
              }}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Instructor' : 'Create Instructor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderHistoryModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h3 className="text-xl font-semibold text-white">Instructor Performance History</h3>
            <p className="text-cyan-200">{selectedInstructor?.full_name}</p>
          </div>
          <button
            onClick={() => {
              setShowHistoryModal(false);
              setSelectedInstructor(null);
            }}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {selectedInstructor && (
            <InstructorHistory
              instructorId={selectedInstructor.id}
              instructorName={selectedInstructor.full_name}
              onClose={() => {
                setShowHistoryModal(false);
                setSelectedInstructor(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Instructors</h2>
          <p className="text-cyan-200">Manage surf instructors and their certifications</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Instructor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <input
                type="text"
                placeholder="Search instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-white/70" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all" className="bg-gray-800">All Status</option>
                <option value="active" className="bg-gray-800">Active</option>
                <option value="inactive" className="bg-gray-800">Inactive</option>
                <option value="on_leave" className="bg-gray-800">On Leave</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInstructors.map((instructor) => (
          <div key={instructor.id} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {instructor.full_name}
                    {instructor.nickname && <span className="text-cyan-400 ml-2">"{instructor.nickname}"</span>}
                  </h3>
                  <p className="text-cyan-200 text-sm">{instructor.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(instructor.status)}`}>
                  {instructor.status === 'on_leave' ? 'On Leave' : instructor.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Phone className="h-4 w-4" />
                  <span>{instructor.phone}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Award className="h-4 w-4" />
                  <span>{instructor.years_experience} years experience</span>
                </div>

                {instructor.certification_body && (
                  <div className="flex items-center space-x-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-cyan-200" />
                    <span className="text-cyan-200">{instructor.certification_body}</span>
                    {instructor.certification_expiry && (
                      <span className={getCertificationStatusColor(instructor.certification_expiry)}>
                        (expires {new Date(instructor.certification_expiry).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  {instructor.first_aid_certified && (
                    <div className="flex items-center space-x-1">
                      <Heart className={`h-4 w-4 ${getCertificationStatusColor(instructor.first_aid_expiry)}`} />
                      <span className={getCertificationStatusColor(instructor.first_aid_expiry)}>First Aid</span>
                    </div>
                  )}
                  
                  {instructor.ocean_rescue_certified && (
                    <div className="flex items-center space-x-1">
                      <Shield className={`h-4 w-4 ${getCertificationStatusColor(instructor.rescue_expiry)}`} />
                      <span className={getCertificationStatusColor(instructor.rescue_expiry)}>Rescue</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue and Lessons */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white/5 rounded-lg">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">${instructorRevenue[instructor.id]?.toFixed(0) || '0'}</p>
                  <p className="text-cyan-200 text-xs">Revenue Generated</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">
                    <TrendingUp className="h-4 w-4 text-green-400 mx-auto" />
                  </p>
                  <p className="text-cyan-200 text-xs">Performance</p>
                </div>
              </div>

              {/* Lesson Types */}
              {instructor.lesson_types && instructor.lesson_types.length > 0 && (
                <div className="mb-4">
                  <p className="text-cyan-200 text-xs mb-2">Teaches:</p>
                  <div className="flex flex-wrap gap-1">
                    {instructor.lesson_types.slice(0, 3).map((type, index) => (
                      <span key={index} className="bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded text-xs">
                        {type}
                      </span>
                    ))}
                    {instructor.lesson_types.length > 3 && (
                      <span className="text-emerald-400 text-xs">
                        +{instructor.lesson_types.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Languages */}
              {instructor.languages_spoken && instructor.languages_spoken.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-cyan-200">
                    <Languages className="h-4 w-4" />
                    <span>{instructor.languages_spoken.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {instructor.notes && (
                <div className="mb-4">
                  <p className="text-white/70 text-sm italic line-clamp-2">{instructor.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewHistory(instructor)}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                    title="View Performance History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditInstructor(instructor)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                    title="Edit Instructor"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteInstructor(instructor.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                  title="Delete Instructor"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInstructors.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No instructors found</h3>
          <p className="text-cyan-200 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Add your first instructor to get started'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add First Instructor
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && renderInstructorModal(false)}
      {showEditModal && renderInstructorModal(true)}
      {showHistoryModal && renderHistoryModal()}
    </div>
  );
};

export default Instructors;