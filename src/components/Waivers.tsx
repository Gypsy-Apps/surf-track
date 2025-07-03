import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  User, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  Download,
  Trash2,
  Eye,
  Archive,
  RefreshCw,
  BarChart3,
  AlertCircle,
  Users,
  TrendingUp,
  Shield
} from 'lucide-react';
import { waiversService, Waiver, CreateWaiverData } from '../lib/waiversService';
import { customerService } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';
import { waiverPDFService } from '../lib/waiverPDFService';
import SignatureViewer from './SignatureViewer';

interface WaiversProps {
  showModal?: boolean;
  onCloseModal?: () => void;
  prefilledCustomerName?: string;
  prefilledActivities?: string[];
  lessonId?: string;
  customerId?: string;
}

const Waivers: React.FC<WaiversProps> = ({ 
  showModal = false, 
  onCloseModal, 
  prefilledCustomerName = '', 
  prefilledActivities = [],
  lessonId,
  customerId
}) => {
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [showCreateModal, setShowCreateModal] = useState(showModal);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSignatureViewer, setShowSignatureViewer] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState<Waiver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waiverStats, setWaiverStats] = useState<any>(null);
  const [customerDataLoaded, setCustomerDataLoaded] = useState(false);
  const [customerDataLoading, setCustomerDataLoading] = useState(false);
  const [formModified, setFormModified] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateWaiverData>({
    customer_id: customerId,
    customer_name: prefilledCustomerName,
    email: '',
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    activities: prefilledActivities,
    signature_data: '',
    lesson_id: lessonId,
    waiver_text: settingsService.getWaiverText('lesson'),
    notes: ''
  });

  // Signature state
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    loadStats();
    
    // Auto-run expiration check
    checkAndMarkExpiredWaivers();

    // Add event listener for beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showCreateModal && formModified) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // Handle escape key to close modals
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateModal && formModified) {
          if (window.confirm("You have unsaved changes. Are you sure you want to close this form?")) {
            handleCloseWaiverModal();
          }
        } else if (showCreateModal) {
          handleCloseWaiverModal();
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showCreateModal, formModified]);

useEffect(() => {
  if (lesson) {
    const participant = lesson.participants?.[0]; // Adjust if you allow selecting a specific participant
    if (participant) {
      setParticipantName(participant.name || '');
      setGuardianName(participant.guardian_name || '');
      setBirthDate(participant.birth_date || '');
      setEmergencyContact(participant.emergency_contact || '');
      setEmergencyPhone(participant.emergency_phone || '');
    }
  }
}, [lesson]);

useEffect(() => {
  if (showModal) {
    setShowCreateModal(true);

    // If we have a customer ID, load their data
    if (customerId) {
      loadCustomerData(customerId);
    }
  }
}, [showModal, customerId]);
      
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: prefilledCustomerName,
        activities: prefilledActivities,
        lesson_id: lessonId,
        waiver_text: prefilledActivities.includes('Surf Lessons') 
          ? settingsService.getWaiverText('lesson')
          : settingsService.getWaiverText('rental')
      }));
    }
  }, [showModal, prefilledCustomerName, prefilledActivities, lessonId, customerId]);

  const loadCustomerData = async (customerIdToLoad: string) => {
    try {
      console.log('🔍 Loading customer data for waiver:', customerIdToLoad);
      setCustomerDataLoading(true);
      setCustomerDataLoaded(false);
      
      const customer = await customerService.getCustomer(customerIdToLoad);
      
      console.log('✅ Customer data loaded:', customer);
      
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        date_of_birth: customer.date_of_birth || '',
        emergency_contact_name: customer.emergency_contact_name || '',
        emergency_contact_phone: customer.emergency_contact_phone || ''
      }));
      
      setCustomerDataLoaded(true);
      console.log('✅ Waiver form pre-populated with customer data');
    } catch (error) {
      console.error('❌ Error loading customer data for waiver:', error);
      setCustomerDataLoaded(false);
    } finally {
      setCustomerDataLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading waivers with filter:', statusFilter);
      
      const [waiversData, customersData] = await Promise.all([
        waiversService.getWaivers(statusFilter),
        customerService.getCustomers()
      ]);
      
      console.log('✅ Loaded waivers:', waiversData.length, 'waivers');
      console.log('✅ Loaded customers:', customersData.length, 'customers');
      
      setWaivers(waiversData);
      setCustomers(customersData);
    } catch (error) {
      console.error('❌ Error loading waivers data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await waiversService.getWaiverStats();
      console.log('📊 Waiver stats loaded:', stats);
      setWaiverStats(stats);
    } catch (error) {
      console.error('Error loading waiver stats:', error);
    }
  };

  const checkAndMarkExpiredWaivers = async () => {
    try {
      await waiversService.markExpiredWaivers();
      console.log('✅ Expired waivers check completed');
    } catch (error) {
      console.error('Error checking expired waivers:', error);
    }
  };

  const handleStatusFilterChange = async (newFilter: 'all' | 'active' | 'expired' | 'expiring_soon') => {
    setStatusFilter(newFilter);
    setLoading(true);
    try {
      console.log('🔍 Filtering waivers by:', newFilter);
      const filteredWaivers = await waiversService.getWaivers(newFilter);
      console.log('✅ Filtered waivers loaded:', filteredWaivers.length, 'waivers');
      setWaivers(filteredWaivers);
    } catch (error) {
      console.error('Error filtering waivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!formData.signature_data) {
        alert('Please provide a signature before submitting.');
        setIsSubmitting(false);
        return;
      }

      console.log('📝 Creating waiver with data:', {
        customer_name: formData.customer_name,
        email: formData.email,
        activities: formData.activities,
        lesson_id: formData.lesson_id,
        customer_id: formData.customer_id
      });

      // Find or create customer if we don't have a customer_id
      let finalCustomerId = formData.customer_id;
      if (!finalCustomerId) {
        console.log('🔍 Finding or creating customer...');
        finalCustomerId = await waiversService.findOrCreateCustomer(formData);
        console.log('✅ Customer ID resolved:', finalCustomerId);
      }
      
      const waiverData = {
        ...formData,
        customer_id: finalCustomerId
      };

      const newWaiver = await waiversService.createWaiver(waiverData);
      console.log('✅ Waiver created successfully:', newWaiver.id);

      // Reload data to show the new waiver
      await loadData();
      await loadStats();
      
      handleCloseWaiverModal();
      
      alert('Waiver created successfully!');
    } catch (error) {
      console.error('❌ Error creating waiver:', error);
      alert('Error creating waiver. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseWaiverModal = () => {
    setShowCreateModal(false);
    setFormModified(false);
    if (onCloseModal) onCloseModal();
    resetForm();
  };

  const handleCancelWaiver = () => {
    if (formModified) {
      if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        handleCloseWaiverModal();
      }
    } else {
      handleCloseWaiverModal();
    }
  };

  const handleDeleteWaiver = async (waiverId: string) => {
    if (!confirm('Are you sure you want to delete this waiver? This will update the customer\'s waiver status.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting waiver:', waiverId);
      await waiversService.deleteWaiver(waiverId);
      console.log('✅ Waiver deleted successfully');
      
      await loadData();
      await loadStats();
      
      // Reload all customers to ensure their waiver status is updated
      const updatedCustomers = await customerService.getCustomers();
      setCustomers(updatedCustomers);
      
      alert('Waiver deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting waiver:', error);
      alert('Error deleting waiver. Please try again.');
    }
  };

  const handleRefreshExpiredWaivers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing expired waivers...');
      await waiversService.markExpiredWaivers();
      await loadData();
      await loadStats();
      
      // Reload all customers to ensure their waiver status is updated
      const updatedCustomers = await customerService.getCustomers();
      setCustomers(updatedCustomers);
      
      console.log('✅ Expired waivers refreshed');
    } catch (error) {
      console.error('Error refreshing expired waivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWaiver = async (waiver: Waiver) => {
    try {
      console.log('📄 Generating waiver PDF for:', waiver.customer_name);
      await waiverPDFService.downloadWaiverPDF(waiver, {
        includeSignature: true,
        includeTimestamp: true,
        includeLegalInfo: true
      });
      console.log('✅ Waiver PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading waiver PDF:', error);
      alert('Error downloading waiver. Please try again.');
    }
  };

  const handleViewSignature = (waiver: Waiver) => {
    setSelectedWaiver(waiver);
    setShowSignatureViewer(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      activities: [],
      signature_data: '',
      waiver_text: settingsService.getWaiverText('lesson'),
      notes: ''
    });
    
    // Clear signature canvas
    if (signatureCanvas) {
      const ctx = signatureCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
      }
    }
    
    setFormModified(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormModified(true);
  };

  const handleCheckboxChange = (activity: string, checked: boolean) => {
    setFormData(prev => {
      const activities = checked 
        ? [...prev.activities, activity]
        : prev.activities.filter(a => a !== activity);
      return { ...prev, activities };
    });
    setFormModified(true);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureCanvas) return;
    setIsDrawing(true);
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = signatureCanvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000';
    }
    
    setFormModified(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signatureCanvas) return;
    
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = signatureCanvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!signatureCanvas) return;
    setIsDrawing(false);
    
    // Save signature as base64
    const signatureData = signatureCanvas.toDataURL();
    setFormData(prev => ({ ...prev, signature_data: signatureData }));
  };

  const clearSignature = () => {
    if (!signatureCanvas) return;
    const ctx = signatureCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
      setFormData(prev => ({ ...prev, signature_data: '' }));
    }
  };

  const filteredWaivers = waivers.filter(waiver => {
    const matchesSearch = waiver.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         waiver.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (waiver: Waiver) => {
    if (waiver.status === 'expired') {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    
    if (waiver.status === 'signed' && waiver.expiry_date) {
      const expiryDate = new Date(waiver.expiry_date);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      if (expiryDate < now) {
        return 'bg-red-500/20 text-red-400 border-red-500/30'; // Expired
      } else if (expiryDate <= thirtyDaysFromNow) {
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'; // Expiring soon
      } else {
        return 'bg-green-500/20 text-green-400 border-green-500/30'; // Active
      }
    }
    
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusText = (waiver: Waiver) => {
    if (waiver.status === 'expired') {
      return 'Expired';
    }
    
    if (waiver.status === 'signed' && waiver.expiry_date) {
      const expiryDate = new Date(waiver.expiry_date);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      if (expiryDate < now) {
        return 'Expired';
      } else if (expiryDate <= thirtyDaysFromNow) {
        return 'Expiring Soon';
      } else {
        return 'Active';
      }
    }
    
    return waiver.status;
  };

  const renderDetailsModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">Waiver Details</h3>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {selectedWaiver && (
          <div className="p-6 space-y-6">
            {/* Customer Information */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-400" />
                <span>Customer Information</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-cyan-200">Name:</span>
                  <p className="text-white font-medium">{selectedWaiver.customer_name}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Email:</span>
                  <p className="text-white font-medium">{selectedWaiver.email}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Phone:</span>
                  <p className="text-white font-medium">{selectedWaiver.phone}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Date of Birth:</span>
                  <p className="text-white font-medium">{selectedWaiver.date_of_birth ? new Date(selectedWaiver.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
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
                  <p className="text-white font-medium">{selectedWaiver.emergency_contact_name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Phone:</span>
                  <p className="text-white font-medium">{selectedWaiver.emergency_contact_phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Waiver Details */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span>Waiver Details</span>
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-cyan-200">Activities:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedWaiver.activities.map((activity, index) => (
                      <span key={index} className="bg-cyan-500/20 text-cyan-200 px-2 py-1 rounded text-xs">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-cyan-200">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedWaiver)}`}>
                    {getStatusText(selectedWaiver)}
                  </span>
                </div>
                <div>
                  <span className="text-cyan-200">Signed Date:</span>
                  <p className="text-white font-medium">{selectedWaiver.signed_date ? new Date(selectedWaiver.signed_date).toLocaleString() : 'Not signed'}</p>
                </div>
                {selectedWaiver.expiry_date && (
                  <div>
                    <span className="text-cyan-200">Expiry Date:</span>
                    <p className="text-white font-medium">{new Date(selectedWaiver.expiry_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-cyan-200">Digital Signature:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-white font-medium">{selectedWaiver.signature_data ? 'Signature on file ✓' : 'No signature'}</p>
                    {selectedWaiver.signature_data && (
                      <button
                        onClick={() => handleViewSignature(selectedWaiver)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Technical Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-cyan-200">Waiver ID:</span>
                  <p className="text-white font-mono text-xs">{selectedWaiver.id}</p>
                </div>
                <div>
                  <span className="text-cyan-200">IP Address:</span>
                  <p className="text-white font-medium">{selectedWaiver.ip_address || 'Not recorded'}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Device:</span>
                  <p className="text-white font-medium">{selectedWaiver.device_type || 'Not recorded'}</p>
                </div>
                <div>
                  <span className="text-cyan-200">Created:</span>
                  <p className="text-white font-medium">{new Date(selectedWaiver.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadWaiver(selectedWaiver)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                
                {selectedWaiver.signature_data && (
                  <button
                    onClick={() => handleViewSignature(selectedWaiver)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Signature</span>
                  </button>
                )}
              </div>
              
              <button
                onClick={() => {
                  handleDeleteWaiver(selectedWaiver.id);
                  setShowDetailsModal(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Waiver</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStatsModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">Waiver Statistics & Administration</h3>
          <button
            onClick={() => setShowStatsModal(false)}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {waiverStats && (
          <div className="p-6 space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{waiverStats.total}</p>
                    <p className="text-blue-200 text-sm">Total Waivers</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{waiverStats.active}</p>
                    <p className="text-green-200 text-sm">Active Waivers</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/20 rounded-xl p-4 border border-amber-500/30">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{waiverStats.expiringSoon}</p>
                    <p className="text-amber-200 text-sm">Expiring Soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{waiverStats.expired + waiverStats.expiredRecently}</p>
                    <p className="text-red-200 text-sm">Expired</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Administrative Actions */}
            <div className="bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-400" />
                <span>Administrative Actions</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">Retention Management</h5>
                  <p className="text-cyan-200 text-sm mb-3">
                    Waivers expired more than 30 days ago: <span className="font-bold text-white">{waiverStats.needsArchiving}</span>
                  </p>
                  <button
                    onClick={() => handleStatusFilterChange('expired')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Review for Archiving</span>
                  </button>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">Expiration Check</h5>
                  <p className="text-cyan-200 text-sm mb-3">
                    Run automated check for expired waivers and update customer profiles
                  </p>
                  <button
                    onClick={handleRefreshExpiredWaivers}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Check Expired Waivers</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Detailed Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-cyan-200">Signed Today:</p>
                  <p className="text-white font-medium text-lg">{waiverStats.todayWaivers}</p>
                </div>
                <div>
                  <p className="text-cyan-200">Expired Recently (30 days):</p>
                  <p className="text-white font-medium text-lg">{waiverStats.expiredRecently}</p>
                </div>
                <div>
                  <p className="text-cyan-200">Pending Signatures:</p>
                  <p className="text-white font-medium text-lg">{waiverStats.pending}</p>
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Quick Filters</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    handleStatusFilterChange('active');
                    setShowStatsModal(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  View Active Waivers ({waiverStats.active})
                </button>
                <button
                  onClick={() => {
                    handleStatusFilterChange('expiring_soon');
                    setShowStatsModal(false);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  View Expiring Soon ({waiverStats.expiringSoon})
                </button>
                <button
                  onClick={() => {
                    handleStatusFilterChange('expired');
                    setShowStatsModal(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  View Expired ({waiverStats.expired + waiverStats.expiredRecently})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">Digital Waiver Collection</h3>
          <button
            onClick={handleCancelWaiver}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Loading indicator for customer data */}
        {customerId && customerDataLoading && (
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mr-3"></div>
            <p className="text-white">Loading customer data...</p>
          </div>
        )}

        <form onSubmit={handleCreateWaiver} className="p-6 space-y-6">
          {/* Customer Information */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleFormChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleFormChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Emergency Contact Name *</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleFormChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Emergency Contact Phone *</label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleFormChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Activities */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Activities</h4>
            <div className="flex flex-wrap gap-2">
              {['Surf Lessons', 'Equipment Rental', 'SUP Lessons', 'Bodyboard Lessons'].map(activity => (
                <label key={activity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.activities.includes(activity)}
                    onChange={(e) => handleCheckboxChange(activity, e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                  />
                  <span className="text-cyan-200">{activity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Digital Signature */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Digital Signature *</h4>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-700 text-sm mb-2">Please sign below:</p>
              <canvas
                ref={setSignatureCanvas}
                width={600}
                height={200}
                className="border border-gray-300 rounded cursor-crosshair w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ touchAction: 'none' }}
              />
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Clear Signature
                </button>
                <p className="text-gray-600 text-xs">
                  By signing above, I acknowledge that I have read and agree to the waiver terms.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handleCancelWaiver}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.signature_data}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Waiver'}
            </button>
          </div>
        </form>
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
          <h2 className="text-3xl font-bold text-white mb-2">Digital Waivers</h2>
          <p className="text-cyan-200">Manage liability waivers and legal documentation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowStatsModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Statistics</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Waiver</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <input
                type="text"
                placeholder="Search waivers..."
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
                onChange={(e) => handleStatusFilterChange(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all" className="bg-gray-800">All Waivers</option>
                <option value="active" className="bg-gray-800">Active</option>
                <option value="expiring_soon" className="bg-gray-800">Expiring Soon</option>
                <option value="expired" className="bg-gray-800">Expired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Waivers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredWaivers.map((waiver) => (
          <div key={waiver.id} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{waiver.customer_name}</h3>
                  <p className="text-cyan-200 text-sm">{waiver.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(waiver)}`}>
                  {getStatusText(waiver)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Calendar className="h-4 w-4" />
                  <span>Signed: {waiver.signed_date ? new Date(waiver.signed_date).toLocaleDateString() : 'Pending'}</span>
                </div>
                {waiver.expiry_date && (
                  <div className="flex items-center space-x-2 text-sm text-cyan-200">
                    <Clock className="h-4 w-4" />
                    <span>Expires: {new Date(waiver.expiry_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Users className="h-4 w-4" />
                  <span>Activities: {waiver.activities.join(', ')}</span>
                </div>
                {waiver.phone && (
                  <div className="flex items-center space-x-2 text-sm text-cyan-200">
                    <Phone className="h-4 w-4" />
                    <span>{waiver.phone}</span>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              {waiver.emergency_contact_name && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-cyan-200 mb-1">Emergency Contact:</p>
                  <p className="text-white text-sm font-medium">{waiver.emergency_contact_name}</p>
                  {waiver.emergency_contact_phone && (
                    <p className="text-cyan-200 text-sm">{waiver.emergency_contact_phone}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedWaiver(waiver);
                      setShowDetailsModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadWaiver(waiver)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {waiver.signature_data && (
                    <button
                      onClick={() => handleViewSignature(waiver)}
                      className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                      title="View Signature"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteWaiver(waiver.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                  title="Delete Waiver"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredWaivers.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No waivers found</h3>
          <p className="text-cyan-200 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start collecting digital waivers for your customers'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Collect First Waiver
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && renderCreateModal()}
      {showDetailsModal && renderDetailsModal()}
      {showStatsModal && renderStatsModal()}
      
      {/* Signature Viewer */}
      {showSignatureViewer && selectedWaiver && (
        <SignatureViewer
          signatureData={selectedWaiver.signature_data || ''}
          customerName={selectedWaiver.customer_name}
          signedDate={selectedWaiver.signed_date}
          onClose={() => setShowSignatureViewer(false)}
          onDownload={() => handleDownloadWaiver(selectedWaiver)}
        />
      )}
    </div>
  );
};

export default Waivers;
