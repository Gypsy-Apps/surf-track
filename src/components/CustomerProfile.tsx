import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  MapPin, 
  Star, 
  X,
  Package,
  DollarSign,
  History,
  CheckCircle,
  AlertTriangle,
  Clipboard,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Customer } from '../lib/supabase';
import { customerService } from '../lib/supabase';
import CustomerRentalHistory from './CustomerRentalHistory';
import CustomerTransactionHistory from './CustomerTransactionHistory';

interface CustomerProfileProps {
  customerId: string;
  onClose: () => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customerId,
  onClose
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rentals' | 'transactions'>('overview');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const customerData = await customerService.getCustomer(customerId);
      setCustomer(customerData);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderOverviewTab = () => {
    if (!customer) return null;
    
    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-400" />
              <span>Basic Information</span>
            </h3>
            <button
              onClick={() => toggleSection('basic')}
              className="text-white/70 hover:text-white"
            >
              {expandedSection === 'basic' ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {(expandedSection === 'basic' || expandedSection === null) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-cyan-200 text-sm">Full Name</p>
                  <p className="text-white font-medium">{customer.full_name}</p>
                </div>
                
                <div>
                  <p className="text-cyan-200 text-sm">Email</p>
                  <p className="text-white font-medium">{customer.email}</p>
                </div>
                
                <div>
                  <p className="text-cyan-200 text-sm">Phone</p>
                  <p className="text-white font-medium">{customer.phone}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-cyan-200 text-sm">Date of Birth</p>
                  <p className="text-white font-medium">
                    {customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-cyan-200 text-sm">Status</p>
                  <p className={`font-medium ${
                    customer.status === 'active' ? 'text-green-400' :
                    customer.status === 'inactive' ? 'text-gray-400' :
                    'text-red-400'
                  }`}>
                    {customer.status?.charAt(0).toUpperCase() + customer.status?.slice(1)}
                  </p>
                </div>
                
                <div>
                  <p className="text-cyan-200 text-sm">Customer Since</p>
                  <p className="text-white font-medium">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Emergency Contact */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Phone className="h-5 w-5 text-red-400" />
              <span>Emergency Contact</span>
            </h3>
            <button
              onClick={() => toggleSection('emergency')}
              className="text-white/70 hover:text-white"
            >
              {expandedSection === 'emergency' ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {(expandedSection === 'emergency' || expandedSection === null) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-cyan-200 text-sm">Name</p>
                <p className="text-white font-medium">{customer.emergency_contact_name || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-cyan-200 text-sm">Phone</p>
                <p className="text-white font-medium">{customer.emergency_contact_phone || 'Not provided'}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Waiver Status */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-400" />
              <span>Waiver Status</span>
            </h3>
            <button
              onClick={() => toggleSection('waiver')}
              className="text-white/70 hover:text-white"
            >
              {expandedSection === 'waiver' ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {(expandedSection === 'waiver' || expandedSection === null) && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {customer.waiver_signed ? (
                  <CheckCircle className={`h-5 w-5 ${getWaiverStatusColor(customer)}`} />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
                <span className={`font-medium ${getWaiverStatusColor(customer)}`}>
                  {getWaiverStatusText(customer)}
                </span>
              </div>
              
              {customer.waiver_expiry_date && customer.waiver_signed && (
                <div>
                  <p className="text-cyan-200 text-sm">Expiry Date</p>
                  <p className="text-white font-medium">
                    {new Date(customer.waiver_expiry_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {!customer.waiver_signed && (
                <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                  <p className="text-red-200 text-sm">
                    This customer needs to sign a waiver before participating in activities.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Campground Information */}
        {customer.is_campground_guest && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-orange-400" />
                <span>Campground Information</span>
              </h3>
              <button
                onClick={() => toggleSection('campground')}
                className="text-white/70 hover:text-white"
              >
                {expandedSection === 'campground' ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {(expandedSection === 'campground' || expandedSection === null) && (
              <div className="space-y-3">
                <div>
                  <p className="text-cyan-200 text-sm">Site Number</p>
                  <p className="text-white font-medium">{customer.campground_site_number || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-cyan-200 text-sm">Campground Visits</p>
                  <p className="text-white font-medium">{customer.campground_visits || 0}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {customer.campground_discount_eligible ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  )}
                  <span className={`font-medium ${customer.campground_discount_eligible ? 'text-green-400' : 'text-amber-400'}`}>
                    {customer.campground_discount_eligible ? 'Discount Eligible' : 'Not Eligible for Discount'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Activity Stats */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <History className="h-5 w-5 text-emerald-400" />
              <span>Activity Summary</span>
            </h3>
            <button
              onClick={() => toggleSection('activity')}
              className="text-white/70 hover:text-white"
            >
              {expandedSection === 'activity' ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {(expandedSection === 'activity' || expandedSection === null) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-cyan-200 text-sm">Total Visits</p>
                <p className="text-white font-bold text-xl">{customer.total_visits || 0}</p>
              </div>
              
              <div>
                <p className="text-cyan-200 text-sm">Total Spent</p>
                <p className="text-white font-bold text-xl">${customer.total_spent?.toFixed(2) || '0.00'}</p>
              </div>
              
              <div>
                <p className="text-cyan-200 text-sm">Preferred Activities</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {customer.preferred_activities && customer.preferred_activities.length > 0 ? (
                    customer.preferred_activities.map((activity, index) => (
                      <span key={index} className="bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded text-xs">
                        {activity}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/70 text-sm">No preferences recorded</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Notes */}
        {customer.notes && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Clipboard className="h-5 w-5 text-amber-400" />
                <span>Notes</span>
              </h3>
              <button
                onClick={() => toggleSection('notes')}
                className="text-white/70 hover:text-white"
              >
                {expandedSection === 'notes' ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {(expandedSection === 'notes' || expandedSection === null) && (
              <p className="text-cyan-200 whitespace-pre-line">{customer.notes}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h3 className="text-xl font-semibold text-white">Customer Profile</h3>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h3 className="text-xl font-semibold text-white">Customer Profile</h3>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Customer Not Found</h3>
            <p className="text-cyan-200 mb-4">
              The requested customer profile could not be found or has been deleted.
            </p>
            <button
              onClick={onClose}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h3 className="text-xl font-semibold text-white">{customer.full_name}</h3>
            <p className="text-cyan-200">{customer.email}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/20">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
              activeTab === 'overview' 
                ? 'text-white border-b-2 border-cyan-400' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('rentals')}
            className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
              activeTab === 'rentals' 
                ? 'text-white border-b-2 border-cyan-400' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Rental History</span>
          </button>
          
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
              activeTab === 'transactions' 
                ? 'text-white border-b-2 border-cyan-400' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Transactions</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'rentals' && (
            <CustomerRentalHistory 
              customerId={customer.id} 
              customerName={customer.full_name}
            />
          )}
          {activeTab === 'transactions' && (
            <CustomerTransactionHistory 
              customerId={customer.id}
              customerName={customer.full_name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;