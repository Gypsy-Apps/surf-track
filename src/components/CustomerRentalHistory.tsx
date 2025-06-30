import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Package, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Shield,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { rentalsService, Rental } from '../lib/rentalsService';
import RentalDetails from './RentalDetails';

interface CustomerRentalHistoryProps {
  customerId: string;
  customerName: string;
}

const CustomerRentalHistory: React.FC<CustomerRentalHistoryProps> = ({
  customerId,
  customerName
}) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRental, setExpandedRental] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showRentalDetails, setShowRentalDetails] = useState(false);

  useEffect(() => {
    loadRentalHistory();
  }, [customerId]);

  const loadRentalHistory = async () => {
    try {
      setLoading(true);
      const rentalHistory = await rentalsService.getRentalsByCustomer(customerId);
      setRentals(rentalHistory);
    } catch (error) {
      console.error('Error loading rental history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (rental: Rental) => {
    setSelectedRental(rental);
    setShowRentalDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'returned': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredRentals = rentals.filter(rental => {
    const matchesStatus = filterStatus === 'all' || rental.status === filterStatus;
    const matchesSearch = rental.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rental.rental_items?.some(item => 
                           item.inventory_item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.inventory_item?.brand.toLowerCase().includes(searchTerm.toLowerCase())
                         ) ?? false);
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalSpent = rentals.reduce((sum, rental) => sum + rental.total_amount, 0);
  const totalRentals = rentals.length;
  const activeRentals = rentals.filter(rental => rental.status === 'active' || rental.status === 'overdue').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-4 w-4 text-blue-400" />
            <span className="text-cyan-200 text-sm">Total Rentals</span>
          </div>
          <p className="text-white font-bold text-xl">{totalRentals}</p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-cyan-200 text-sm">Total Spent</span>
          </div>
          <p className="text-white font-bold text-xl">${totalSpent.toFixed(2)}</p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-4 w-4 text-purple-400" />
            <span className="text-cyan-200 text-sm">Active Rentals</span>
          </div>
          <p className="text-white font-bold text-xl">{activeRentals}</p>
        </div>
      </div>

      {/* Filters */}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="all" className="bg-gray-800">All Status</option>
              <option value="active" className="bg-gray-800">Active</option>
              <option value="overdue" className="bg-gray-800">Overdue</option>
              <option value="returned" className="bg-gray-800">Returned</option>
              <option value="cancelled" className="bg-gray-800">Cancelled</option>
            </select>
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-white transition-colors flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* Rental List */}
      <div className="space-y-3">
        {filteredRentals.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No rentals found</h3>
            <p className="text-cyan-200">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : `${customerName} hasn't rented any equipment yet`
              }
            </p>
          </div>
        ) : (
          filteredRentals.map((rental) => (
            <div
              key={rental.id}
              className={`rounded-lg border p-4 transition-all duration-200 hover:bg-white/5 ${
                rental.status === 'active' ? 'bg-green-500/10 border-green-500/30' :
                rental.status === 'overdue' ? 'bg-red-500/10 border-red-500/30' :
                rental.status === 'returned' ? 'bg-gray-500/10 border-gray-500/30' :
                'bg-orange-500/10 border-orange-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className={`h-4 w-4 ${
                    rental.status === 'active' ? 'text-green-400' :
                    rental.status === 'overdue' ? 'text-red-400' :
                    rental.status === 'returned' ? 'text-gray-400' :
                    'text-orange-400'
                  }`} />
                  <div>
                    <h4 className="text-white font-medium">
                      {rental.rental_items?.length || 0} {rental.rental_items?.length === 1 ? 'item' : 'items'} rented
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-cyan-200">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</span>
                      </div>
                      {rental.return_date && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>Returned: {new Date(rental.return_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-white font-bold">${rental.total_amount.toFixed(2)}</p>
                    <p className="text-cyan-200 text-sm capitalize">{rental.status}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(rental)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => setExpandedRental(
                        expandedRental === rental.id ? null : rental.id
                      )}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {expandedRental === rental.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedRental === rental.id && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h5 className="text-cyan-200 text-sm font-medium mb-2">Rental Items:</h5>
                  <div className="space-y-2">
                    {rental.rental_items?.map((item, index) => (
                      <div key={index} className="bg-white/5 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">
                              {item.inventory_item?.name || 'Unknown Item'}
                            </p>
                            <p className="text-cyan-200 text-sm">
                              {item.inventory_item?.brand} {item.inventory_item?.model}
                            </p>
                            <p className="text-cyan-200 text-sm">
                              Quantity: {item.quantity} × ${item.daily_rate.toFixed(2)}/day
                            </p>
                          </div>
                          <div className="text-right">
                            {item.insurance_selected && (
                              <span className="text-green-400 text-xs flex items-center">
                                <Shield className="h-3 w-3 mr-1" />
                                Insured
                              </span>
                            )}
                            {rental.status === 'returned' && item.inventory_item && (
                              <p className={`text-xs font-medium mt-1 ${
                                item.inventory_item.condition === 'excellent' ? 'text-green-400' :
                                item.inventory_item.condition === 'good' ? 'text-blue-400' :
                                item.inventory_item.condition === 'fair' ? 'text-amber-400' :
                                'text-red-400'
                              }`}>
                                Returned: {item.inventory_item.condition.charAt(0).toUpperCase() + item.inventory_item.condition.slice(1).replace('-', ' ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional Charges */}
                  {(rental.late_fees > 0 || rental.damage_charges > 0) && (
                    <div className="mt-4">
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Additional Charges:</h5>
                      <div className="bg-white/5 rounded p-3">
                        {rental.late_fees > 0 && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-amber-400" />
                              <span className="text-white">Late Fees</span>
                            </div>
                            <span className="text-amber-400">${rental.late_fees.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {rental.damage_charges > 0 && (
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-3 w-3 text-red-400" />
                              <span className="text-white">Damage Charges</span>
                            </div>
                            <span className="text-red-400">${rental.damage_charges.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10 font-medium">
                          <span className="text-white">Total Charges</span>
                          <span className="text-white">${(rental.total_amount + rental.late_fees + rental.damage_charges).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {rental.notes && (
                    <div className="mt-4">
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Notes:</h5>
                      <p className="text-white text-sm bg-white/5 rounded p-3 whitespace-pre-line">{rental.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Rental Details Modal */}
      {showRentalDetails && selectedRental && (
        <RentalDetails 
          rental={selectedRental} 
          onClose={() => setShowRentalDetails(false)}
          onRefresh={loadRentalHistory}
        />
      )}
    </div>
  );
};

export default CustomerRentalHistory;