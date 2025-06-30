import React, { useState } from 'react';
import { 
  Package, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  FileText,
  ArrowRight,
  Shield,
  Clipboard,
  History
} from 'lucide-react';
import { Rental, RentalItem } from '../lib/rentalsService';
import { Customer } from '../lib/supabase';
import EquipmentReturn from './EquipmentReturn';

interface RentalDetailsProps {
  rental: Rental;
  onClose: () => void;
  onRefresh: () => void;
}

const RentalDetails: React.FC<RentalDetailsProps> = ({ 
  rental, 
  onClose,
  onRefresh
}) => {
  const [showReturnModal, setShowReturnModal] = useState(false);

  const handleCompleteReturn = () => {
    setShowReturnModal(false);
    onRefresh();
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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div>
              <h3 className="text-xl font-semibold text-white">Rental Details</h3>
              <p className="text-cyan-200">
                {rental.customer_name} - {new Date(rental.start_date).toLocaleDateString()} to {new Date(rental.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {rental.status === 'active' && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Process Return</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`rounded-xl p-4 flex items-center justify-between ${
                rental.status === 'active' ? 'bg-green-500/20 border border-green-500/30' :
                rental.status === 'overdue' ? 'bg-red-500/20 border border-red-500/30' :
                rental.status === 'returned' ? 'bg-gray-500/20 border border-gray-500/30' :
                'bg-orange-500/20 border border-orange-500/30'
              }`}>
                <div className="flex items-center space-x-3">
                  {rental.status === 'active' && <CheckCircle className="h-5 w-5 text-green-400" />}
                  {rental.status === 'overdue' && <AlertTriangle className="h-5 w-5 text-red-400" />}
                  {rental.status === 'returned' && <CheckCircle className="h-5 w-5 text-gray-400" />}
                  {rental.status === 'cancelled' && <X className="h-5 w-5 text-orange-400" />}
                  
                  <div>
                    <p className="text-white font-medium capitalize">{rental.status}</p>
                    <p className="text-sm text-cyan-200">
                      {rental.status === 'active' && `Due back on ${new Date(rental.end_date).toLocaleDateString()}`}
                      {rental.status === 'overdue' && `Was due on ${new Date(rental.end_date).toLocaleDateString()}`}
                      {rental.status === 'returned' && rental.return_date && `Returned on ${new Date(rental.return_date).toLocaleDateString()}`}
                      {rental.status === 'cancelled' && 'Rental was cancelled'}
                    </p>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(rental.status)}`}>
                  {rental.status.toUpperCase()}
                </span>
              </div>
              
              {/* Customer Information */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-400" />
                  <span>Customer Information</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white font-medium">{rental.customer_name}</p>
                    {rental.customer && (
                      <div className="mt-2 space-y-1 text-sm text-cyan-200">
                        <p>{rental.customer.email}</p>
                        <p>{rental.customer.phone}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end">
                    {rental.waiver_collected ? (
                      <div className="flex items-center space-x-2 text-green-400">
                        <FileText className="h-4 w-4" />
                        <span>Waiver on File</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>No Waiver</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Rental Details */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <span>Rental Details</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-cyan-200" />
                      <span className="text-cyan-200">Start Date:</span>
                      <span className="text-white">{new Date(rental.start_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-cyan-200" />
                      <span className="text-cyan-200">End Date:</span>
                      <span className="text-white">{new Date(rental.end_date).toLocaleDateString()}</span>
                    </div>
                    
                    {rental.return_date && (
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-cyan-200">Return Date:</span>
                        <span className="text-white">{new Date(rental.return_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="h-4 w-4 text-cyan-200" />
                      <span className="text-cyan-200">Total Amount:</span>
                      <span className="text-white">${rental.total_amount.toFixed(2)}</span>
                    </div>
                    
                    {rental.insurance_cost > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Shield className="h-4 w-4 text-cyan-200" />
                        <span className="text-cyan-200">Insurance:</span>
                        <span className="text-white">${rental.insurance_cost.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {rental.late_fees > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span className="text-cyan-200">Late Fees:</span>
                        <span className="text-amber-400">${rental.late_fees.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {rental.damage_charges > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-cyan-200">Damage Charges:</span>
                        <span className="text-red-400">${rental.damage_charges.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Rental Items */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Package className="h-5 w-5 text-emerald-400" />
                  <span>Rental Items</span>
                </h4>
                
                <div className="space-y-3">
                  {rental.rental_items?.map((item, index) => (
                    <div key={index} className="bg-white/10 rounded-lg p-4">
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
                          {item.insurance_selected && (
                            <p className="text-green-400 text-sm flex items-center space-x-1">
                              <Shield className="h-3 w-3" />
                              <span>Insurance Selected</span>
                            </p>
                          )}
                        </div>
                        
                        {rental.status === 'returned' && item.inventory_item && (
                          <div className="text-right">
                            <p className="text-sm text-cyan-200">Return Condition:</p>
                            <p className={`text-sm font-medium ${
                              item.inventory_item.condition === 'excellent' ? 'text-green-400' :
                              item.inventory_item.condition === 'good' ? 'text-blue-400' :
                              item.inventory_item.condition === 'fair' ? 'text-amber-400' :
                              'text-red-400'
                            }`}>
                              {item.inventory_item.condition.charAt(0).toUpperCase() + item.inventory_item.condition.slice(1).replace('-', ' ')}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {item.item_notes && (
                        <p className="text-white/70 text-sm mt-2 italic">{item.item_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              {rental.notes && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <Clipboard className="h-5 w-5 text-amber-400" />
                    <span>Notes</span>
                  </h4>
                  <p className="text-cyan-200 whitespace-pre-line">{rental.notes}</p>
                </div>
              )}
              
              {/* Return History */}
              {rental.status === 'returned' && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <History className="h-5 w-5 text-blue-400" />
                    <span>Return History</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-200">Return Date:</span>
                      <span className="text-white">{new Date(rental.return_date!).toLocaleDateString()}</span>
                    </div>
                    
                    {rental.late_fees > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-200">Late Fees:</span>
                        <span className="text-amber-400">${rental.late_fees.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {rental.damage_charges > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-200">Damage Charges:</span>
                        <span className="text-red-400">${rental.damage_charges.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-200">Condition Summary:</span>
                      <span className="text-white">
                        {rental.rental_items?.some(item => 
                          item.inventory_item?.condition === 'needs-repair' || 
                          item.inventory_item?.condition === 'damaged'
                        ) ? (
                          <span className="text-red-400 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Damage Reported
                          </span>
                        ) : (
                          <span className="text-green-400 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Good Condition
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 border-t border-white/20 bg-white/5 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Close
            </button>
            
            {rental.status === 'active' && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Process Return</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showReturnModal && (
        <EquipmentReturn 
          rentalId={rental.id} 
          onClose={() => setShowReturnModal(false)}
          onComplete={handleCompleteReturn}
        />
      )}
    </>
  );
};

export default RentalDetails;