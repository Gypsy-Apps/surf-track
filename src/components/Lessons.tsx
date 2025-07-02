import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  X,
  User,
  DollarSign,
  Phone,
  Mail,
  Download,
  QrCode,
  Package,
  UserCheck,
  Eye,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { lessonsService, Lesson, CreateLessonData, CancellationData } from '../lib/lessonsService';
import { instructorsService, Instructor } from '../lib/instructorsService';
import { customerService } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';

interface LessonsProps {
  onOpenWaiver: (customerName: string, activities: string[], lessonId?: string, customerId?: string) => void;
}

const Lessons: React.FC<LessonsProps> = ({ onOpenWaiver }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Participant management states
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // Form states
  const [formData, setFormData] = useState<CreateLessonData>({
    type: 'Beginner Group',
    instructor_id: '',
    instructor_name: '',
    max_participants: 6,
    date: '',
    time: '10:00',
    location: 'Main Beach - North Side',
    notes: '',
    price: 75
  });

  const [cancellationData, setCancellationData] = useState<CancellationData>({
    reason: 'Customer request',
    customNotes: '',
    refundType: 'partial',
    refundAmount: 0,
    processingFee: 0,
    weatherRelated: false,
    instructorFault: false,
    customerNoShow: false,
    rescheduled: false,
    compensationOffered: false,
    compensationType: 'none',
    compensationValue: 0,
    notificationSent: false,
    followUpRequired: false,
    totalRevenue: 0,
    participantCount: 0,
    originalPrice: 0,
    cancellationTimestamp: new Date().toISOString(),
    advanceNoticeHours: 0
  });

  const lessonTypes = [
    'Beginner Group',
    'Intermediate Group', 
    'Advanced Group',
    'Private Lesson',
    'Kids Group',
    'SUP Lesson',
    'Longboard Lesson'
  ];

  const locations = settingsService.getBusinessLocations();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter customers based on search term
    if (customerSearchTerm.trim() === '') {
      setFilteredCustomers(customers.slice(0, 10)); // Show first 10 customers
    } else {
      const filtered = customers.filter(customer =>
        customer.full_name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phone.includes(customerSearchTerm)
      ).slice(0, 10);
      setFilteredCustomers(filtered);
    }
  }, [customerSearchTerm, customers]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lessonsData, instructorsData, customersData] = await Promise.all([
        lessonsService.getLessons(),
        instructorsService.getActiveInstructors(),
        customerService.getCustomers()
      ]);
      setLessons(lessonsData);
      setInstructors(instructorsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading lessons data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const selectedInstructor = instructors.find(i => i.id === formData.instructor_id);
      
      const lessonData = {
        ...formData,
        instructor_name: selectedInstructor?.full_name || formData.instructor_name,
        price: settingsService.getLessonPrice(formData.type)
      };

      await lessonsService.createLesson(lessonData);
      await loadData();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating lesson:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await lessonsService.cancelLesson(selectedLesson.id, cancellationData);
      await loadData();
      setShowCancelModal(false);
      setSelectedLesson(null);
    } catch (error) {
      console.error('Error cancelling lesson:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    try {
      await lessonsService.deleteLesson(lessonId);
      await loadData();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const handleOpenWaiverForParticipant = async (lesson: Lesson, participant: any) => {
    try {
      // Get the full customer details to pass to waiver
      const customer = await customerService.getCustomer(participant.customer_id);
      const activities = settingsService.getRequiredActivities('lesson');
      
      console.log('🎯 Opening waiver for participant:', {
        participantName: participant.customer_name,
        customerId: participant.customer_id,
        customerData: customer,
        lessonId: lesson.id,
        activities
      });
      
      // Pass the customer ID so the waiver can pre-populate with customer data
      onOpenWaiver(participant.customer_name, activities, lesson.id, participant.customer_id);
    } catch (error) {
      console.error('Error loading customer data for waiver:', error);
      // Fallback to just the participant name
      const activities = settingsService.getRequiredActivities('lesson');
      onOpenWaiver(participant.customer_name, activities, lesson.id);
    }
  };

  const handleAddParticipant = async (customer: any) => {
    if (!selectedLesson) return;

    try {
      // Check if customer is already a participant
      const isAlreadyParticipant = selectedLesson.participants?.some(
        p => p.customer_id === customer.id
      );

      if (isAlreadyParticipant) {
        alert('This customer is already registered for this lesson.');
        return;
      }

      // Check if lesson is full
      if (selectedLesson.current_participants >= selectedLesson.max_participants) {
        alert('This lesson is already full.');
        return;
      }

      await lessonsService.addParticipant(
        selectedLesson.id,
        customer.id,
        customer.full_name,
        customer.waiver_signed
      );

      await loadData();
      setCustomerSearchTerm('');
      setShowAddParticipantModal(false);
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Error adding participant. Please try again.');
    }
  };

  const handleRemoveParticipant = async (lessonId: string, customerId: string) => {
    if (!confirm('Are you sure you want to remove this participant from the lesson?')) {
      return;
    }

    try {
      await lessonsService.removeParticipant(lessonId, customerId);
      await loadData();
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const handleViewCustomerProfile = async (customerId: string) => {
    try {
      const customer = await customerService.getCustomer(customerId);
      setSelectedCustomer(customer);
      setShowCustomerProfile(true);
    } catch (error) {
      console.error('Error loading customer profile:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Beginner Group',
      instructor_id: '',
      instructor_name: '',
      max_participants: 6,
      date: '',
      time: '10:00',
      location: 'Main Beach - North Side',
      notes: '',
      price: 75
    });
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">Create New Lesson</h3>
          <button
            onClick={() => setShowCreateModal(false)}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleCreateLesson} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Lesson Type</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    type: newType,
                    price: settingsService.getLessonPrice(newType),
                    max_participants: newType.includes('Private') ? 1 : 
                                    newType.includes('Kids') ? 4 : 6
                  }));
                }}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                {lessonTypes.map(type => (
                  <option key={type} value={type} className="bg-gray-800">{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Instructor</label>
              <select
                value={formData.instructor_id}
                onChange={(e) => {
                  const instructor = instructors.find(i => i.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    instructor_id: e.target.value,
                    instructor_name: instructor?.full_name || ''
                  }));
                }}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                <option value="" className="bg-gray-800">Select Instructor</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id} className="bg-gray-800">
                    {instructor.full_name} {instructor.nickname && `(${instructor.nickname})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                {locations.map(location => (
                  <option key={location} value={location} className="bg-gray-800">{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Max Participants</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.max_participants}
                onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Special instructions, conditions, etc."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-cyan-200">
              <span className="text-sm">Lesson Price: </span>
              <span className="text-xl font-bold text-white">${settingsService.getLessonPrice(formData.type)}</span>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Lesson'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderAddParticipantModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h3 className="text-xl font-semibold text-white">Add Participant</h3>
            <p className="text-cyan-200">{selectedLesson?.type} - {selectedLesson?.date}</p>
          </div>
          <button
            onClick={() => setShowAddParticipantModal(false)}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Customer Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Customer Results */}
          {filteredCustomers.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white/5 rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                      <User className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{customer.full_name}</p>
                      <div className="flex items-center space-x-4 text-sm text-cyan-200">
                        <span>{customer.email}</span>
                        <span>{customer.phone}</span>
                        {customer.waiver_signed ? (
                          <span className="text-green-400 flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Waiver Valid</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Needs Waiver</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddParticipant(customer)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add to Lesson
                  </button>
                </div>
              ))}
            </div>
          )}

          {customerSearchTerm && filteredCustomers.length === 0 && (
            <p className="text-cyan-200 text-center py-4">No customers found matching your search.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCustomerProfileModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">Customer Profile</h3>
          <button
            onClick={() => setShowCustomerProfile(false)}
            className="text-white/70 hover:text-white text-2xl"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {selectedCustomer && (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-400" />
                <span>Basic Information</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-cyan-200">Name:</span>
                  <p className="text-white font-medium">{selectedCustomer.full_name}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Email:</span>
                  <p className="text-white font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Phone:</span>
                  <p className="text-white font-medium">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Date of Birth:</span>
                  <p className="text-white font-medium">{selectedCustomer.date_of_birth ? new Date(selectedCustomer.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Phone className="h-5 w-5 text-red-400" />
                <span>Emergency Contact</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-cyan-200">Name:</span>
                  <p className="text-white font-medium">{selectedCustomer.emergency_contact_name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Phone:</span>
                  <p className="text-white font-medium">{selectedCustomer.emergency_contact_phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Visit History */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-400" />
                <span>Visit History</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-cyan-200">Total Visits:</span>
                  <p className="text-white font-medium text-lg">{selectedCustomer.total_visits}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Total Spent:</span>
                  <p className="text-white font-medium text-lg">${selectedCustomer.total_spent}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Status:</span>
                  <p className={`font-medium text-lg ${selectedCustomer.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Waiver Status */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span>Waiver Status</span>
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {selectedCustomer.waiver_signed ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                  <span className={selectedCustomer.waiver_signed ? 'text-green-400' : 'text-red-400'}>
                    {selectedCustomer.waiver_signed ? 'Waiver Signed' : 'Waiver Required'}
                  </span>
                </div>
                {selectedCustomer.waiver_expiry_date && (
                  <div className="text-sm">
                    <span className="text-cyan-200">Expires:</span>
                    <span className="text-white ml-2">{new Date(selectedCustomer.waiver_expiry_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedCustomer.notes && (
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-white mb-3">Notes</h4>
                <p className="text-cyan-200 text-sm">{selectedCustomer.notes}</p>
              </div>
            )}
          </div>
        )}
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
          <h2 className="text-3xl font-bold text-white mb-2">Surf Lessons</h2>
          <p className="text-cyan-200">Manage lesson schedules and participants</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Lesson</span>
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
                placeholder="Search lessons..."
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
                <option value="scheduled" className="bg-gray-800">Scheduled</option>
                <option value="in-progress" className="bg-gray-800">In Progress</option>
                <option value="completed" className="bg-gray-800">Completed</option>
                <option value="cancelled" className="bg-gray-800">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => (
          <div key={lesson.id} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{lesson.type}</h3>
                  <p className="text-cyan-200 text-sm">{lesson.instructor_name}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(lesson.status)}`}>
                  {lesson.status.replace('-', ' ')}
                </span>
              </div>
<div className="mt-4 flex gap-3">
  <button
    onClick={() => markLessonCompleted(lesson.id)}
    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
  >
    Mark as Completed
  </button>

  <button
    onClick={() => {
      setSelectedLesson(lesson);
      setShowCommentModal(true);
    }}
    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm"
  >
    Add Comment
  </button>
</div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(lesson.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Clock className="h-4 w-4" />
                  <span>{lesson.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <MapPin className="h-4 w-4" />
                  <span>{lesson.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Users className="h-4 w-4" />
                  <span>{lesson.current_participants}/{lesson.max_participants} participants</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <DollarSign className="h-4 w-4" />
                  <span>${lesson.price}</span>
                </div>
              </div>

              {lesson.notes && (
                <p className="text-white/70 text-sm mb-4 italic">{lesson.notes}</p>
              )}

              {/* Participants Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-cyan-200">Participants</h4>
                  {lesson.status === 'scheduled' && lesson.current_participants < lesson.max_participants && (
                    <button
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setShowAddParticipantModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded transition-colors"
                      title="Add Participant"
                    >
                      <UserPlus className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {lesson.participants && lesson.participants.length > 0 ? (
                  <div className="space-y-2">
                    {lesson.participants.map((participant, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{participant.customer_name}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Waiver Status */}
                          <div className="flex items-center space-x-1">
                            {participant.waiver_collected ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-amber-400" />
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1">
                            {/* Waiver Button */}
                            {!participant.waiver_collected && lesson.status === 'scheduled' && (
                              <button
                                onClick={() => handleOpenWaiverForParticipant(lesson, participant)}
                                className="bg-orange-600 hover:bg-orange-700 text-white p-1 rounded transition-colors"
                                title="Collect Waiver"
                              >
                                <FileText className="h-3 w-3" />
                              </button>
                            )}

                            {/* View Profile Button */}
                            <button
                              onClick={() => handleViewCustomerProfile(participant.customer_id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white p-1 rounded transition-colors"
                              title="View Profile"
                            >
                              <Eye className="h-3 w-3" />
                            </button>

                            {/* Remove Participant Button */}
                            {lesson.status === 'scheduled' && (
                              <button
                                onClick={() => handleRemoveParticipant(lesson.id, participant.customer_id)}
                                className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                                title="Remove Participant"
                              >
                                <UserMinus className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-cyan-200 text-sm">No participants yet</p>
                    {lesson.status === 'scheduled' && (
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setShowAddParticipantModal(true);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 text-sm mt-1"
                      >
                        Add first participant
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex space-x-2">
                  {lesson.status === 'scheduled' && (
                    <button
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setCancellationData(prev => ({
                          ...prev,
                          totalRevenue: lesson.price * lesson.current_participants,
                          participantCount: lesson.current_participants,
                          originalPrice: lesson.price
                        }));
                        setShowCancelModal(true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                      title="Cancel Lesson"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                    title="Delete Lesson"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No lessons found</h3>
          <p className="text-cyan-200 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first lesson to get started'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create First Lesson
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && renderCreateModal()}
      {showAddParticipantModal && renderAddParticipantModal()}
      {showCustomerProfile && renderCustomerProfileModal()}
    </div>
  );
};

export default Lessons;
