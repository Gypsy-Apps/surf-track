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
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  X,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { customerService, Customer } from '../lib/supabase';
import CustomerTransactionHistory from './CustomerTransactionHistory';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    preferred_activities: [],
    notes: '',
    is_campground_guest: false,
    campground_site_number: '',
    status: 'active'
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customersData = await customerService.getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await customerService.createCustomer(formData as Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_visits' | 'total_spent'>);
      await loadCustomers();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await customerService.updateCustomer(selectedCustomer.id, formData);
      await loadCustomers();
      setShowEditModal(false);
      setSelectedCustomer(null);
      resetForm();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error updating customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await customerService.deleteCustomer(customerId);
      await loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer. Please try again.');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      date_of_birth: customer.date_of_birth || '',
      emergency_contact_name: customer.emergency_contact_name || '',
      emergency_contact_phone: customer.emergency_contact_phone || '',
      preferred_activities: customer.preferred_activities || [],
      notes: customer.notes || '',
      is_campground_guest: customer.is_campground_guest || false,
      campground_site_number: customer.campground_site_number || '',
      status: customer.status
    });
    setShowEditModal(true);
  };

  const handleViewHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      preferred_activities: [],
      notes: '',
      is_campground_guest: false,
      campground_site_number: '',
      status: 'active'
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'banned': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getWaiverStatusColor = (customer: Customer) => {
    if (!customer.waiver_signed) {
      return 'text-red-400';
    }
    
    if (customer.waiver_expiry_date) {
      const expiryDate = new Date(customer.waiver_expiry_date);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      if (expiryDate < now) {
        return 'text-red-400'; // Expired
      } else if (expiryDate <= thirtyDaysFromNow) {
        return 'text-amber-400'; // Expiring soon
      } else {
        return 'text-green-400'; // Valid
      }
    }
    
    return 'text-green-400';
  };

  const getWaiverStatusText = (customer: Customer) => {
    if (!customer.waiver_signed) {
      return 'No Waiver';
    }
    
    if (customer.waiver_expiry_date) {
      const expiryDate = new Date(customer.waiver_expiry_date);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      if (expiryDate < now) {
        return 'Expired';
      } else if (expiryDate <= thirtyDaysFromNow) {
        return 'Expiring Soon';
      } else {
        return 'Valid';
      }
    }
    
    return 'Signed';
  };

  const renderCustomerModal = (isEdit: boolean = false) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button
            onClick={() => {
              if (isEdit) {
                setShowEditModal(false);
                setSelectedCustomer(null);
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

        <form onSubmit={isEdit ? handleUpdateCustomer : handleCreateCustomer} className="p-6 space-y-4">
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
              <label className="block text-sm font-medium text-cyan-200 mb-2">Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Emergency Contact Name</label>
              <input
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Emergency Contact Phone</label>
              <input
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
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
                <option value="banned" className="bg-gray-800">Banned</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_campground_guest}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_campground_guest: e.target.checked }))}
                  className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-cyan-200">Campground Guest</span>
              </label>
            </div>
          </div>

          {formData.is_campground_guest && (
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Campground Site Number</label>
              <input
                type="text"
                value={formData.campground_site_number}
                onChange={(e) => setFormData(prev => ({ ...prev, campground_site_number: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g., A-15"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Preferred Activities</label>
            <div className="flex flex-wrap gap-2">
              {['Surf Lessons', 'Equipment Rental', 'SUP Lessons', 'Bodyboard Lessons', 'Skimboard Lessons'].map(activity => (
                <label key={activity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.preferred_activities?.includes(activity)}
                    onChange={(e) => {
                      const activities = formData.preferred_activities || [];
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, preferred_activities: [...activities, activity] }));
                      } else {
                        setFormData(prev => ({ ...prev, preferred_activities: activities.filter(a => a !== activity) }));
                      }
                    }}
                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                  />
                  <span className="text-cyan-200 text-sm">{activity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Additional notes about the customer..."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setSelectedCustomer(null);
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
              {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Customer' : 'Create Customer')}
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
            <h3 className="text-xl font-semibold text-white">Transaction History</h3>
            <p className="text-cyan-200">{selectedCustomer?.full_name}</p>
          </div>
          <button
            onClick={() => {
              setShowHistoryModal(false);
              setSelectedCustomer(null);
            }}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {selectedCustomer && (
            <CustomerTransactionHistory
              customerId={selectedCustomer.id}
              customerName={selectedCustomer.full_name}
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
          <h2 className="text-3xl font-bold text-white mb-2">Customers</h2>
          <p className="text-cyan-200">Manage customer profiles and information</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
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
                placeholder="Search customers..."
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
                <option value="banned" className="bg-gray-800">Banned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{customer.full_name}</h3>
                  <p className="text-cyan-200 text-sm">{customer.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                
                {customer.date_of_birth && (
                  <div className="flex items-center space-x-2 text-sm text-cyan-200">
                    <Calendar className="h-4 w-4" />
                    <span>Born: {new Date(customer.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span className={`font-medium ${getWaiverStatusColor(customer)}`}>
                    {getWaiverStatusText(customer)}
                  </span>
                  {customer.waiver_expiry_date && customer.waiver_signed && (
                    <span className="text-cyan-200 text-xs">
                      (expires {new Date(customer.waiver_expiry_date).toLocaleDateString()})
                    </span>
                  )}
                </div>

                {customer.is_campground_guest && (
                  <div className="flex items-center space-x-2 text-sm text-orange-400">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Campground Guest
                      {customer.campground_site_number && ` - Site ${customer.campground_site_number}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-white/5 rounded-lg">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{customer.total_visits}</p>
                  <p className="text-cyan-200 text-xs">Visits</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">${customer.total_spent.toFixed(0)}</p>
                  <p className="text-cyan-200 text-xs">Spent</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">
                    {customer.campground_discount_eligible ? (
                      <Star className="h-4 w-4 text-yellow-400 mx-auto" />
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className="text-cyan-200 text-xs">VIP</p>
                </div>
              </div>

              {/* Preferred Activities */}
              {customer.preferred_activities && customer.preferred_activities.length > 0 && (
                <div className="mb-4">
                  <p className="text-cyan-200 text-xs mb-2">Preferred Activities:</p>
                  <div className="flex flex-wrap gap-1">
                    {customer.preferred_activities.slice(0, 2).map((activity, index) => (
                      <span key={index} className="bg-cyan-500/20 text-cyan-200 px-2 py-1 rounded text-xs">
                        {activity}
                      </span>
                    ))}
                    {customer.preferred_activities.length > 2 && (
                      <span className="text-cyan-400 text-xs">
                        +{customer.preferred_activities.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {customer.notes && (
                <div className="mb-4">
                  <p className="text-white/70 text-sm italic line-clamp-2">{customer.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewHistory(customer)}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                    title="View Transaction History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                    title="Edit Customer"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                  title="Delete Customer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No customers found</h3>
          <p className="text-cyan-200 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Add your first customer to get started'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add First Customer
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && renderCustomerModal(false)}
      {showEditModal && renderCustomerModal(true)}
      {showHistoryModal && renderHistoryModal()}
    </div>
  );
};

export default Customers;