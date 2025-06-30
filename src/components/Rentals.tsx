import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  X,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Eye,
  RefreshCw
} from 'lucide-react';
import { rentalsService, Rental, CreateRentalData } from '../lib/rentalsService';
import { inventoryService, InventoryItem } from '../lib/inventoryService';
import { customerService, Customer } from '../lib/supabase';
import { waiversService } from '../lib/waiversService';
import { settingsService } from '../lib/settingsService';
import RentalDetails from './RentalDetails';
import EquipmentReturn from './EquipmentReturn';
import CustomerProfile from './CustomerProfile';

interface RentalsProps {
  onOpenWaiver: (customerName: string, activities: string[], lessonId?: string, customerId?: string) => void;
}

const Rentals: React.FC<RentalsProps> = ({ onOpenWaiver }) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer search states for rental creation
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  // Form states
  const [formData, setFormData] = useState<CreateRentalData>({
    customer_id: '',
    customer_name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 0,
    insurance_cost: 0,
    notes: '',
    rental_items: []
  });

  const [selectedItems, setSelectedItems] = useState<{
    inventory_item_id: string;
    quantity: number;
    daily_rate: number;
    insurance_selected: boolean;
    item_notes: string;
  }[]>([]);

  useEffect(() => {
    loadData();
    
    // Add click outside listener to close customer dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
    } else {
      const filtered = customers.filter(customer =>
        customer.full_name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phone.includes(customerSearchTerm)
      ).slice(0, 10);
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(filtered.length > 0);
    }
  }, [customerSearchTerm, customers]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rentalsData, customersData, inventoryData] = await Promise.all([
        rentalsService.getRentals(),
        customerService.getCustomers(),
        inventoryService.getAvailableItems()
      ]);
      setRentals(rentalsData);
      setCustomers(customersData);
      setInventoryItems(inventoryData);
    } catch (error) {
      console.error('Error loading rentals data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      // First refresh the rental inventory status
      await rentalsService.refreshRentalInventoryStatus();
      // Then refresh the inventory status
      await inventoryService.refreshInventoryStatus();
      // Finally reload the data
      await loadData();
      alert('Rental and inventory status refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing status:', error);
      alert('Error refreshing status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const calculateRentalTotal = () => {
    const days = Math.max(1, Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)));
    
    let itemsTotal = 0;
    let insuranceTotal = 0;

    selectedItems.forEach(item => {
      const dailyTotal = item.daily_rate * item.quantity;
      itemsTotal += dailyTotal * days;
      
      if (item.insurance_selected) {
        insuranceTotal += settingsService.getInsuranceCost() * item.quantity * days;
      }
    });

    return {
      itemsTotal,
      insuranceTotal,
      total: itemsTotal + insuranceTotal,
      days
    };
  };

  const handleSelectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.full_name
    }));
    setCustomerSearchTerm(customer.full_name);
    setShowCustomerDropdown(false);
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      if (selectedItems.length === 0) {
        alert('Please select at least one item to rent.');
        return;
      }

      if (!formData.customer_id) {
        alert('Please select a customer.');
        return;
      }

      const { total, insuranceTotal } = calculateRentalTotal();
      
      const rentalData = {
        ...formData,
        total_amount: total,
        insurance_cost: insuranceTotal,
        rental_items: selectedItems
      };

      const newRental = await rentalsService.createRental(rentalData);
      
      await loadData();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating rental:', error);
      alert('Error creating rental. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnRental = async (rental: Rental) => {
    setSelectedRental(rental);
    setShowReturnModal(true);
  };

  const handleDeleteRental = async (rentalId: string) => {
    if (!confirm('Are you sure you want to delete this rental? This action cannot be undone.')) {
      return;
    }

    try {
      await rentalsService.deleteRental(rentalId);
      await loadData();
    } catch (error) {
      console.error('Error deleting rental:', error);
    }
  };

  const handleOpenWaiverForRental = async (rental: Rental) => {
    const activities = settingsService.getRequiredActivities('rental');
    
    // Check if customer already has a waiver
    const customer = customers.find(c => c.id === rental.customer_id);
    if (customer) {
      // Pass the customer ID so the waiver can pre-populate with customer data
      onOpenWaiver(rental.customer_name, activities, undefined, customer.id);
    } else {
      // Fallback to just the customer name
      onOpenWaiver(rental.customer_name, activities);
    }
  };

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowCustomerProfile(true);
  };

  const handleViewDetails = (rental: Rental) => {
    setSelectedRental(rental);
    setShowDetailsModal(true);
  };

  const addItemToRental = (item: InventoryItem) => {
    const existingItem = selectedItems.find(si => si.inventory_item_id === item.id);
    
    if (existingItem) {
      setSelectedItems(prev => prev.map(si => 
        si.inventory_item_id === item.id 
          ? { ...si, quantity: si.quantity + 1 }
          : si
      ));
    } else {
      setSelectedItems(prev => [...prev, {
        inventory_item_id: item.id,
        quantity: 1,
        daily_rate: item.rental_price,
        insurance_selected: false,
        item_notes: ''
      }]);
    }
  };

  const removeItemFromRental = (itemId: string) => {
    setSelectedItems(prev => prev.filter(si => si.inventory_item_id !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromRental(itemId);
      return;
    }
    
    setSelectedItems(prev => prev.map(si => 
      si.inventory_item_id === itemId 
        ? { ...si, quantity }
        : si
    ));
  };

  const toggleItemInsurance = (itemId: string) => {
    setSelectedItems(prev => prev.map(si => 
      si.inventory_item_id === itemId 
        ? { ...si, insurance_selected: !si.insurance_selected }
        : si
    ));
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_amount: 0,
      insurance_cost: 0,
      notes: '',
      rental_items: []
    });
    setSelectedItems([]);
    setCustomerSearchTerm('');
    setShowCustomerDropdown(false);
  };

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = rental.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rental.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rental.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'returned': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const renderCreateModal = () => {
    const { total, insuranceTotal, days } = calculateRentalTotal();
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h3 className="text-xl font-semibold text-white">Create New Rental</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleCreateRental} className="p-6 space-y-6">
            {/* Customer Selection with Search */}
            <div className="relative" ref={customerSearchRef}>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or phone..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (customerSearchTerm.trim() !== '' && filteredCustomers.length > 0) {
                      setShowCustomerDropdown(true);
                    }
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
              
              {/* Customer Dropdown */}
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-3 hover:bg-gray-700 cursor-pointer border-b border-white/10 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{customer.full_name}</p>
                          <p className="text-cyan-200 text-sm">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-200 text-sm">{customer.phone}</p>
                          {customer.waiver_signed ? (
                            <span className="text-green-400 text-xs flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Waiver Valid</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 text-xs flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Needs Waiver</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {customerSearchTerm && !showCustomerDropdown && filteredCustomers.length === 0 && (
                <p className="text-amber-400 text-sm mt-1">No customers found. Please check the spelling or add a new customer.</p>
              )}
            </div>

            {/* Rental Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
            </div>

            {/* Equipment Selection */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Select Equipment</h4>
              
              {/* Available Items */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-cyan-200 mb-2">Available Equipment</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {inventoryItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => addItemToRental(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{item.name}</p>
                          <p className="text-cyan-200 text-xs">{item.brand} {item.model}</p>
                          <p className="text-emerald-400 text-xs">${item.rental_price}/day</p>
                        </div>
                        <Plus className="h-4 w-4 text-cyan-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Items */}
              {selectedItems.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-cyan-200 mb-2">Selected Items ({days} day{days !== 1 ? 's' : ''})</h5>
                  <div className="space-y-3">
                    {selectedItems.map(selectedItem => {
                      const item = inventoryItems.find(i => i.id === selectedItem.inventory_item_id);
                      if (!item) return null;
                      
                      const itemTotal = selectedItem.daily_rate * selectedItem.quantity * days;
                      const itemInsurance = selectedItem.insurance_selected ? settingsService.getInsuranceCost() * selectedItem.quantity * days : 0;
                      
                      return (
                        <div key={selectedItem.inventory_item_id} className="bg-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-white font-medium">{item.name}</p>
                              <p className="text-cyan-200 text-sm">{item.brand} {item.model}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItemFromRental(selectedItem.inventory_item_id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-cyan-200 mb-1">Quantity</label>
                              <input
                                type="number"
                                min="1"
                                value={selectedItem.quantity}
                                onChange={(e) => updateItemQuantity(selectedItem.inventory_item_id, parseInt(e.target.value))}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-cyan-200 mb-1">Daily Rate</label>
                              <input
                                type="number"
                                step="0.01"
                                value={selectedItem.daily_rate}
                                onChange={(e) => setSelectedItems(prev => prev.map(si => 
                                  si.inventory_item_id === selectedItem.inventory_item_id 
                                    ? { ...si, daily_rate: parseFloat(e.target.value) || 0 }
                                    : si
                                ))}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                              />
                            </div>
                            
                            <div className="flex items-end">
                              <label className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={selectedItem.insurance_selected}
                                  onChange={() => toggleItemInsurance(selectedItem.inventory_item_id)}
                                  className="rounded border-white/20 bg-white/10 text-cyan-400"
                                />
                                <span className="text-cyan-200">Insurance (+${settingsService.getInsuranceCost()}/day)</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-sm">
                            <span className="text-cyan-200">Subtotal:</span>
                            <span className="text-white font-medium">${(itemTotal + itemInsurance).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
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

            {/* Total */}
            {selectedItems.length > 0 && (
              <div className="bg-cyan-500/20 rounded-xl p-4 border border-cyan-500/30">
                <div className="space-y-2">
                  <div className="flex justify-between text-cyan-200">
                    <span>Equipment ({days} day{days !== 1 ? 's' : ''}):</span>
                    <span>${(total - insuranceTotal).toFixed(2)}</span>
                  </div>
                  {insuranceTotal > 0 && (
                    <div className="flex justify-between text-cyan-200">
                      <span>Insurance:</span>
                      <span>${insuranceTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-cyan-500/30">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0 || !formData.customer_id}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Rental'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
          <h2 className="text-3xl font-bold text-white mb-2">Equipment Rentals</h2>
          <p className="text-cyan-200">Manage gear rentals and returns</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefreshStatus}
            disabled={refreshing}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Rental</span>
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
                placeholder="Search rentals..."
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
                <option value="overdue" className="bg-gray-800">Overdue</option>
                <option value="returned" className="bg-gray-800">Returned</option>
                <option value="cancelled" className="bg-gray-800">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rentals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRentals.map((rental) => (
          <div key={rental.id} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    <button 
                      onClick={() => rental.customer_id && handleViewCustomer(rental.customer_id)}
                      className="hover:text-cyan-300 transition-colors"
                    >
                      {rental.customer_name}
                    </button>
                  </h3>
                  <p className="text-cyan-200 text-sm">{rental.rental_items?.length || 0} item(s)</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(rental.status)}`}>
                  {rental.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</span>
                </div>
                {rental.return_date && (
                  <div className="flex items-center space-x-2 text-sm text-cyan-200">
                    <CheckCircle className="h-4 w-4" />
                    <span>Returned: {new Date(rental.return_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-cyan-200">
                  <DollarSign className="h-4 w-4" />
                  <span>${rental.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Waiver Status */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  {rental.waiver_collected ? (
                    <div className="flex items-center space-x-1 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Waiver Signed</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Waiver Needed</span>
                    </div>
                  )}
                </div>
              </div>

              {rental.notes && (
                <p className="text-white/70 text-sm mb-4 italic">{rental.notes}</p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex space-x-2">
                  {!rental.waiver_collected && (
                    <button
                      onClick={() => handleOpenWaiverForRental(rental)}
                      className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors"
                      title="Collect Waiver"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleViewDetails(rental)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex space-x-2">
                  {rental.status === 'active' && (
                    <button
                      onClick={() => handleReturnRental(rental)}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                      title="Process Return"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRental(rental.id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                    title="Delete Rental"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRentals.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No rentals found</h3>
          <p className="text-cyan-200 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first rental to get started'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create First Rental
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && renderCreateModal()}
      {showDetailsModal && selectedRental && (
        <RentalDetails 
          rental={selectedRental} 
          onClose={() => setShowDetailsModal(false)}
          onRefresh={loadData}
        />
      )}
      {showReturnModal && selectedRental && (
        <EquipmentReturn 
          rentalId={selectedRental.id} 
          onClose={() => setShowReturnModal(false)}
          onComplete={() => {
            setShowReturnModal(false);
            loadData();
          }}
        />
      )}
      {showCustomerProfile && selectedCustomerId && (
        <CustomerProfile 
          customerId={selectedCustomerId}
          onClose={() => setShowCustomerProfile(false)}
        />
      )}
    </div>
  );
};

export default Rentals;