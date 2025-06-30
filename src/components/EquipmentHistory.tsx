import React, { useState, useEffect } from 'react';
import { Calendar, Package, DollarSign, TrendingUp, Wrench, Clock, User, AlertTriangle, CheckCircle, BarChart3, Filter, Search, ChevronDown, ChevronUp, Plus, X, PenTool as Tool, Activity } from 'lucide-react';
import { 
  historyService, 
  EquipmentRentalHistory, 
  EquipmentMaintenanceHistory 
} from '../lib/historyService';

interface EquipmentHistoryProps {
  equipmentId: string;
  equipmentName: string;
  onClose: () => void;
}

const EquipmentHistory: React.FC<EquipmentHistoryProps> = ({
  equipmentId,
  equipmentName,
  onClose
}) => {
  const [rentalHistory, setRentalHistory] = useState<EquipmentRentalHistory[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<EquipmentMaintenanceHistory[]>([]);
  const [utilizationStats, setUtilizationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rentals' | 'maintenance' | 'analytics'>('rentals');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Maintenance form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type: 'cleaning' as const,
    maintenance_date: new Date().toISOString().split('T')[0],
    performed_by: '',
    description: '',
    cost: 0,
    condition_before: 'good' as const,
    condition_after: 'good' as const,
    downtime_hours: 0,
    warranty_work: false,
    vendor_used: '',
    next_maintenance_due: '',
    maintenance_notes: ''
  });

  useEffect(() => {
    loadEquipmentData();
  }, [equipmentId, dateRange]);

  const loadEquipmentData = async () => {
    try {
      setLoading(true);
      const [rentals, maintenance, stats] = await Promise.all([
        historyService.getEquipmentRentalHistory(equipmentId, dateRange.start, dateRange.end),
        historyService.getEquipmentMaintenanceHistory(equipmentId, dateRange.start, dateRange.end),
        historyService.getEquipmentUtilizationStats(equipmentId, dateRange.start, dateRange.end)
      ]);
      
      setRentalHistory(rentals);
      setMaintenanceHistory(maintenance);
      setUtilizationStats(stats);
    } catch (error) {
      console.error('Error loading equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await historyService.addEquipmentMaintenanceRecord({
        equipment_id: equipmentId,
        ...maintenanceForm
      });
      
      await loadEquipmentData();
      setShowAddMaintenance(false);
      setMaintenanceForm({
        maintenance_type: 'cleaning',
        maintenance_date: new Date().toISOString().split('T')[0],
        performed_by: '',
        description: '',
        cost: 0,
        condition_before: 'good',
        condition_after: 'good',
        downtime_hours: 0,
        warranty_work: false,
        vendor_used: '',
        next_maintenance_due: '',
        maintenance_notes: ''
      });
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      alert('Error adding maintenance record. Please try again.');
    }
  };

  const filteredRentals = rentalHistory.filter(rental => 
    rental.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaintenance = maintenanceHistory.filter(maintenance => 
    maintenance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maintenance.performed_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRentalsTab = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
        <input
          type="text"
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>

      {/* Rental History */}
      <div className="space-y-3">
        {filteredRentals.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No rentals found</h3>
            <p className="text-cyan-200">
              {searchTerm 
                ? 'Try adjusting your search'
                : 'No rentals in the selected date range'
              }
            </p>
          </div>
        ) : (
          filteredRentals.map((rental) => (
            <div
              key={rental.id}
              className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{rental.customer_name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-cyan-200">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(rental.rental_start_date).toLocaleDateString()} - {new Date(rental.rental_end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{rental.total_days} days</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-white font-bold">${rental.total_revenue.toFixed(2)}</p>
                    <div className="flex items-center space-x-2 text-sm">
                      {rental.damage_reported && (
                        <span className="text-red-400 flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Damage</span>
                        </span>
                      )}
                      {rental.late_return && (
                        <span className="text-amber-400 flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Late</span>
                        </span>
                      )}
                      {!rental.damage_reported && !rental.late_return && (
                        <span className="text-green-400 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Good</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setExpandedRecord(
                      expandedRecord === rental.id ? null : rental.id
                    )}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {expandedRecord === rental.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedRecord === rental.id && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Rental Details:</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-cyan-200">Daily Rate:</span>
                          <span className="text-white">${rental.daily_rate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-200">Condition Out:</span>
                          <span className="text-white capitalize">{rental.condition_out}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-200">Condition In:</span>
                          <span className="text-white capitalize">{rental.condition_in}</span>
                        </div>
                        {rental.actual_return_date && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Returned:</span>
                            <span className="text-white">{new Date(rental.actual_return_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Charges:</h5>
                      <div className="space-y-1 text-sm">
                        {rental.damage_cost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Damage Cost:</span>
                            <span className="text-red-400">${rental.damage_cost.toFixed(2)}</span>
                          </div>
                        )}
                        {rental.late_fees > 0 && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Late Fees:</span>
                            <span className="text-amber-400">${rental.late_fees.toFixed(2)}</span>
                          </div>
                        )}
                        {rental.insurance_claimed && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Insurance:</span>
                            <span className="text-blue-400">Claimed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {rental.rental_notes && (
                    <div className="mt-4">
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Notes:</h5>
                      <p className="text-white text-sm bg-white/5 rounded p-3">{rental.rental_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 mr-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
          <input
            type="text"
            placeholder="Search maintenance records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <button
          onClick={() => setShowAddMaintenance(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Maintenance</span>
        </button>
      </div>

      {/* Maintenance History */}
      <div className="space-y-3">
        {filteredMaintenance.length === 0 ? (
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No maintenance records found</h3>
            <p className="text-cyan-200">
              {searchTerm 
                ? 'Try adjusting your search'
                : 'No maintenance records in the selected date range'
              }
            </p>
          </div>
        ) : (
          filteredMaintenance.map((maintenance) => (
            <div
              key={maintenance.id}
              className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    maintenance.maintenance_type === 'repair' ? 'bg-red-500/20' :
                    maintenance.maintenance_type === 'cleaning' ? 'bg-blue-500/20' :
                    maintenance.maintenance_type === 'inspection' ? 'bg-yellow-500/20' :
                    'bg-purple-500/20'
                  }`}>
                    <Wrench className={`h-4 w-4 ${
                      maintenance.maintenance_type === 'repair' ? 'text-red-400' :
                      maintenance.maintenance_type === 'cleaning' ? 'text-blue-400' :
                      maintenance.maintenance_type === 'inspection' ? 'text-yellow-400' :
                      'text-purple-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium capitalize">{maintenance.maintenance_type}</h4>
                    <div className="flex items-center space-x-4 text-sm text-cyan-200">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(maintenance.maintenance_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{maintenance.performed_by}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-white font-bold">${maintenance.cost.toFixed(2)}</p>
                    <p className="text-cyan-200 text-sm">
                      {maintenance.condition_before} → {maintenance.condition_after}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setExpandedRecord(
                      expandedRecord === maintenance.id ? null : maintenance.id
                    )}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {expandedRecord === maintenance.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedRecord === maintenance.id && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Maintenance Details:</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-cyan-200">Downtime:</span>
                          <span className="text-white">{maintenance.downtime_hours} hours</span>
                        </div>
                        {maintenance.warranty_work && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Warranty Work:</span>
                            <span className="text-green-400">Yes</span>
                          </div>
                        )}
                        {maintenance.vendor_used && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Vendor:</span>
                            <span className="text-white">{maintenance.vendor_used}</span>
                          </div>
                        )}
                        {maintenance.next_maintenance_due && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Next Due:</span>
                            <span className="text-white">{new Date(maintenance.next_maintenance_due).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Description:</h5>
                      <p className="text-white text-sm bg-white/5 rounded p-3">{maintenance.description}</p>
                    </div>
                  </div>
                  
                  {maintenance.maintenance_notes && (
                    <div className="mt-4">
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Additional Notes:</h5>
                      <p className="text-white text-sm bg-white/5 rounded p-3">{maintenance.maintenance_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Maintenance Modal */}
      {showAddMaintenance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-xl font-semibold text-white">Add Maintenance Record</h3>
              <button
                onClick={() => setShowAddMaintenance(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddMaintenance} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Maintenance Type *</label>
                  <select
                    value={maintenanceForm.maintenance_type}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, maintenance_type: e.target.value as any }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    required
                  >
                    <option value="cleaning" className="bg-gray-800">Cleaning</option>
                    <option value="repair" className="bg-gray-800">Repair</option>
                    <option value="inspection" className="bg-gray-800">Inspection</option>
                    <option value="replacement" className="bg-gray-800">Replacement</option>
                    <option value="upgrade" className="bg-gray-800">Upgrade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Date *</label>
                  <input
                    type="date"
                    value={maintenanceForm.maintenance_date}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, maintenance_date: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Performed By *</label>
                  <input
                    type="text"
                    value={maintenanceForm.performed_by}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, performed_by: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Technician name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Condition Before</label>
                  <select
                    value={maintenanceForm.condition_before}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, condition_before: e.target.value as any }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="excellent" className="bg-gray-800">Excellent</option>
                    <option value="good" className="bg-gray-800">Good</option>
                    <option value="fair" className="bg-gray-800">Fair</option>
                    <option value="needs-repair" className="bg-gray-800">Needs Repair</option>
                    <option value="retired" className="bg-gray-800">Retired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Condition After</label>
                  <select
                    value={maintenanceForm.condition_after}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, condition_after: e.target.value as any }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="excellent" className="bg-gray-800">Excellent</option>
                    <option value="good" className="bg-gray-800">Good</option>
                    <option value="fair" className="bg-gray-800">Fair</option>
                    <option value="needs-repair" className="bg-gray-800">Needs Repair</option>
                    <option value="retired" className="bg-gray-800">Retired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Downtime (hours)</label>
                  <input
                    type="number"
                    value={maintenanceForm.downtime_hours}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, downtime_hours: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Vendor Used</label>
                  <input
                    type="text"
                    value={maintenanceForm.vendor_used}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, vendor_used: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Vendor name (if applicable)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Next Maintenance Due</label>
                  <input
                    type="date"
                    value={maintenanceForm.next_maintenance_due}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, next_maintenance_due: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="warranty_work"
                    checked={maintenanceForm.warranty_work}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, warranty_work: e.target.checked }))}
                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                  />
                  <label htmlFor="warranty_work" className="text-cyan-200">Warranty Work</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Description *</label>
                <textarea
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Describe the maintenance performed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Notes</label>
                <textarea
                  value={maintenanceForm.maintenance_notes}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, maintenance_notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMaintenance(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {utilizationStats ? (
        <>
          {/* Utilization Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="h-4 w-4 text-blue-400" />
                <span className="text-cyan-200 text-sm">Total Rentals</span>
              </div>
              <p className="text-white font-bold text-xl">{utilizationStats.totalRentals}</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-green-400" />
                <span className="text-cyan-200 text-sm">Days Rented</span>
              </div>
              <p className="text-white font-bold text-xl">{utilizationStats.totalDaysRented}</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span className="text-cyan-200 text-sm">Total Revenue</span>
              </div>
              <p className="text-white font-bold text-xl">${utilizationStats.totalRevenue.toFixed(2)}</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-cyan-200 text-sm">Avg Revenue/Day</span>
              </div>
              <p className="text-white font-bold text-xl">
                ${utilizationStats.totalDaysRented > 0 
                  ? (utilizationStats.totalRevenue / utilizationStats.totalDaysRented).toFixed(2) 
                  : '0.00'}
              </p>
            </div>
          </div>

          {/* Maintenance and Damage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Maintenance Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Total Maintenance Records:</span>
                  <span className="text-white font-medium">{maintenanceHistory.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Maintenance Cost:</span>
                  <span className="text-white font-medium">
                    ${maintenanceHistory.reduce((sum, record) => sum + record.cost, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Total Downtime:</span>
                  <span className="text-white font-medium">
                    {maintenanceHistory.reduce((sum, record) => sum + record.downtime_hours, 0)} hours
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Damage & Issues</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Damage Incidents:</span>
                  <span className="text-white font-medium">{utilizationStats.damageIncidents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Late Returns:</span>
                  <span className="text-white font-medium">{utilizationStats.lateReturns}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Damage Rate:</span>
                  <span className={`font-medium ${
                    utilizationStats.totalRentals > 0 && 
                    (utilizationStats.damageIncidents / utilizationStats.totalRentals) > 0.1 
                      ? 'text-red-400' 
                      : 'text-green-400'
                  }`}>
                    {utilizationStats.totalRentals > 0 
                      ? ((utilizationStats.damageIncidents / utilizationStats.totalRentals) * 100).toFixed(1) 
                      : '0'}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Analysis */}
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Return on Investment Analysis</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-cyan-200">Total Revenue Generated:</span>
                <span className="text-white font-bold">${utilizationStats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-cyan-200">Total Maintenance Cost:</span>
                <span className="text-white font-bold">
                  ${maintenanceHistory.reduce((sum, record) => sum + record.cost, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-cyan-200">Net Profit:</span>
                <span className="text-green-400 font-bold">
                  ${(utilizationStats.totalRevenue - maintenanceHistory.reduce((sum, record) => sum + record.cost, 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No analytics available</h3>
          <p className="text-cyan-200">
            Not enough data to generate analytics for this equipment
          </p>
        </div>
      )}
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
          <h3 className="text-xl font-semibold text-white">{equipmentName} - History</h3>
          <p className="text-cyan-200">
            {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
          </p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-cyan-200 text-sm">From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-cyan-200 text-sm">To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
        {[
          { id: 'rentals', name: 'Rental History', icon: Package },
          { id: 'maintenance', name: 'Maintenance', icon: Tool },
          { id: 'analytics', name: 'Analytics', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-cyan-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'rentals' && renderRentalsTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
};

export default EquipmentHistory;