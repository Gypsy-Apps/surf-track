import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  X, 
  Camera, 
  DollarSign, 
  Shield, 
  FileText, 
  Check, 
  Clipboard,
  CreditCard,
  ArrowRight,
  User,
  Calendar,
  Save
} from 'lucide-react';
import { rentalsService, Rental, RentalItem } from '../lib/rentalsService';
import { inventoryService, InventoryItem } from '../lib/inventoryService';
import { historyService } from '../lib/historyService';
import { customerService, Customer } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';

interface EquipmentReturnProps {
  rentalId: string;
  onClose: () => void;
  onComplete: () => void;
}

interface DamageAssessment {
  itemId: string;
  condition: 'excellent' | 'good' | 'fair' | 'damaged';
  damageDescription: string;
  estimatedRepairCost: number;
  coveredByInsurance: boolean;
  photosUploaded: boolean;
}

const EquipmentReturn: React.FC<EquipmentReturnProps> = ({ 
  rentalId, 
  onClose,
  onComplete
}) => {
  const [rental, setRental] = useState<Rental | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentalItems, setRentalItems] = useState<(RentalItem & { inventoryItem?: InventoryItem })[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [currentStep, setCurrentStep] = useState<'inspection' | 'damage' | 'payment' | 'complete'>('inspection');
  const [damageAssessments, setDamageAssessments] = useState<Record<string, DamageAssessment>>({});
  const [lateFees, setLateFees] = useState(0);
  const [totalDamageCharges, setTotalDamageCharges] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'none'>('none');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadRentalDetails();
  }, [rentalId]);

  useEffect(() => {
    // Calculate total damage charges whenever damage assessments change
    let total = 0;
    Object.values(damageAssessments).forEach(assessment => {
      if (assessment.condition === 'damaged' && !assessment.coveredByInsurance) {
        total += assessment.estimatedRepairCost;
      }
    });
    setTotalDamageCharges(total);
  }, [damageAssessments]);

  const loadRentalDetails = async () => {
    try {
      setLoading(true);
      const rentalData = await rentalsService.getRental(rentalId);
      setRental(rentalData);
      
      if (rentalData.rental_items) {
        setRentalItems(rentalData.rental_items);
        
        // Initialize damage assessments for all items
        const initialAssessments: Record<string, DamageAssessment> = {};
        rentalData.rental_items.forEach(item => {
          if (item.inventory_item) {
            initialAssessments[item.inventory_item_id] = {
              itemId: item.inventory_item_id,
              condition: 'good',
              damageDescription: '',
              estimatedRepairCost: 0,
              coveredByInsurance: item.insurance_selected,
              photosUploaded: false
            };
          }
        });
        setDamageAssessments(initialAssessments);
      }
      
      // Load customer details
      if (rentalData.customer_id) {
        const customerData = await customerService.getCustomer(rentalData.customer_id);
        setCustomer(customerData);
      }
      
      // Calculate late fees if applicable
      if (rentalData.end_date) {
        const endDate = new Date(rentalData.end_date);
        const today = new Date();
        
        // Only calculate late fees if return is after due date
        if (today > endDate) {
          const daysLate = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          const lateFeeSettings = settingsService.getSetting('rental.lateFees');
          
          if (lateFeeSettings?.enabled) {
            const graceHours = lateFeeSettings.graceHours || 1;
            const hourlyRate = lateFeeSettings.hourlyRate || 10;
            const maxFee = lateFeeSettings.maxFee || 50;
            
            // Only charge if beyond grace period
            if (daysLate > 0) {
              const calculatedFee = Math.min(daysLate * 24 * hourlyRate, maxFee);
              setLateFees(calculatedFee);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading rental details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConditionChange = (itemId: string, condition: 'excellent' | 'good' | 'fair' | 'damaged') => {
    setDamageAssessments(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        condition,
        // Reset damage description and cost if condition is not damaged
        ...(condition !== 'damaged' && {
          damageDescription: '',
          estimatedRepairCost: 0
        })
      }
    }));
  };

  const handleDamageDescriptionChange = (itemId: string, description: string) => {
    setDamageAssessments(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        damageDescription: description
      }
    }));
  };

  const handleRepairCostChange = (itemId: string, cost: number) => {
    setDamageAssessments(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        estimatedRepairCost: cost
      }
    }));
  };

  const handleInsuranceCoverageChange = (itemId: string, covered: boolean) => {
    setDamageAssessments(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        coveredByInsurance: covered
      }
    }));
  };

  const handlePhotoUploadToggle = (itemId: string) => {
    setDamageAssessments(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photosUploaded: !prev[itemId].photosUploaded
      }
    }));
  };

  const handleSaveInspection = async () => {
    if (!rental) return;
    
    try {
      setProcessingReturn(true);
      console.log('🔄 Processing quick return with good condition...');
      
      // 1. Update rental status to returned
      const updatedRental = await rentalsService.updateRental(rental.id, {
        status: 'returned',
        return_date: returnDate,
        notes: rental.notes + (returnNotes ? `\n\nReturn notes: ${returnNotes}` : '')
      });
      
      console.log('✅ Rental marked as returned:', updatedRental);
      
      // 2. Update inventory items with new condition
      for (const itemId in damageAssessments) {
        const assessment = damageAssessments[itemId];
        
        console.log(`🔄 Updating inventory item ${itemId} to status: available, condition: ${assessment.condition}`);
        
        await inventoryService.updateInventoryItem(itemId, {
          status: 'available',
          condition: assessment.condition,
          current_renter: null,
          expected_return: null
        });
      }
      
      console.log('✅ All inventory items updated successfully');
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('❌ Error saving inspection:', error);
      alert('Error saving inspection. Please try again.');
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleNextStep = () => {
    // Check if any items are damaged
    const hasDamage = Object.values(damageAssessments).some(
      assessment => assessment.condition === 'damaged'
    );
    
    if (currentStep === 'inspection') {
      setCurrentStep(hasDamage ? 'damage' : 'payment');
    } else if (currentStep === 'damage') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      handleCompleteReturn();
    }
  };

  const handleCompleteReturn = async () => {
    if (!rental) return;
    
    try {
      setSubmitting(true);
      console.log('🔄 Processing complete return...');
      
      // 1. Update rental status to returned
      const updatedRental = await rentalsService.updateRental(rental.id, {
        status: 'returned',
        return_date: returnDate,
        late_fees: lateFees,
        damage_charges: totalDamageCharges,
        notes: rental.notes + (returnNotes ? `\n\nReturn notes: ${returnNotes}` : '')
      });
      
      console.log('✅ Rental marked as returned:', updatedRental);
      
      // 2. Update inventory items with new condition
      for (const itemId in damageAssessments) {
        const assessment = damageAssessments[itemId];
        
        console.log(`🔄 Updating inventory item ${itemId} to status: ${assessment.condition === 'damaged' ? 'maintenance' : 'available'}, condition: ${assessment.condition === 'damaged' ? 'needs-repair' : assessment.condition}`);
        
        await inventoryService.updateInventoryItem(itemId, {
          status: assessment.condition === 'damaged' ? 'maintenance' : 'available',
          condition: assessment.condition === 'damaged' ? 'needs-repair' : assessment.condition,
          current_renter: null,
          expected_return: null,
          notes: assessment.damageDescription ? 
            `Damage reported on return (${new Date().toLocaleDateString()}): ${assessment.damageDescription}` : 
            undefined
        });
        
        // 3. Create maintenance record if damaged
        if (assessment.condition === 'damaged') {
          await historyService.addEquipmentMaintenanceRecord({
            equipment_id: itemId,
            maintenance_type: 'repair',
            maintenance_date: new Date().toISOString().split('T')[0],
            performed_by: 'System (Damage Report)',
            description: assessment.damageDescription || 'Damage reported on return',
            cost: assessment.estimatedRepairCost,
            condition_before: 'damaged',
            condition_after: 'needs-repair',
            downtime_hours: 24, // Default 24 hours downtime
            warranty_work: false,
            maintenance_notes: `Damage reported during rental return. ${assessment.coveredByInsurance ? 'Covered by rental insurance.' : 'Not covered by insurance.'}`,
            photos_taken: assessment.photosUploaded
          });
        }
      }
      
      console.log('✅ All inventory items updated successfully');
      
      // 4. Create customer transaction for damage charges if applicable
      if (totalDamageCharges > 0 && rental.customer_id) {
        await historyService.addCustomerTransaction({
          customer_id: rental.customer_id,
          transaction_type: 'rental',
          transaction_date: new Date().toISOString(),
          amount: totalDamageCharges,
          payment_method: paymentMethod === 'none' ? 'cash' : paymentMethod,
          reference_id: rental.id,
          reference_type: 'rental_damage',
          description: 'Damage charges for rental equipment',
          items_json: Object.values(damageAssessments)
            .filter(a => a.condition === 'damaged' && !a.coveredByInsurance)
            .map(a => ({
              name: rentalItems.find(ri => ri.inventory_item_id === a.itemId)?.inventory_item?.name || 'Equipment',
              description: a.damageDescription,
              price: a.estimatedRepairCost
            })),
          staff_member: 'System',
          notes: 'Damage charges collected during equipment return'
        });
      }
      
      // 5. Create customer transaction for late fees if applicable
      if (lateFees > 0 && rental.customer_id) {
        await historyService.addCustomerTransaction({
          customer_id: rental.customer_id,
          transaction_type: 'rental',
          transaction_date: new Date().toISOString(),
          amount: lateFees,
          payment_method: paymentMethod === 'none' ? 'cash' : paymentMethod,
          reference_id: rental.id,
          reference_type: 'rental_late_fee',
          description: 'Late fees for rental equipment',
          items_json: [{
            name: 'Late Return Fee',
            description: `Late return fee for rental #${rental.id}`,
            price: lateFees
          }],
          staff_member: 'System',
          notes: 'Late fees collected during equipment return'
        });
      }
      
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('❌ Error completing return:', error);
      alert('Error completing return. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInspectionStep = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Equipment Condition Inspection</h3>
        <p className="text-cyan-200 mb-6">
          Inspect each item and select its condition upon return. If any damage is found, select "Damaged" and provide details in the next step.
        </p>
        
        <div className="space-y-4">
          {rentalItems.map(item => {
            const inventoryItem = item.inventory_item;
            if (!inventoryItem) return null;
            
            const assessment = damageAssessments[inventoryItem.id];
            if (!assessment) return null;
            
            return (
              <div key={inventoryItem.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{inventoryItem.name}</h4>
                    <p className="text-cyan-200 text-sm">{inventoryItem.brand} {inventoryItem.model}</p>
                    <p className="text-cyan-200 text-xs">ID: {inventoryItem.item_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">Rented: {item.quantity} {item.quantity > 1 ? 'units' : 'unit'}</p>
                    <p className="text-cyan-200 text-xs">
                      {item.insurance_selected ? (
                        <span className="flex items-center text-green-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Insurance Selected
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-400">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No Insurance
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-3">
                  <p className="text-sm text-cyan-200 mb-2">Condition upon return:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleConditionChange(inventoryItem.id, 'excellent')}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center space-x-1 ${
                        assessment.condition === 'excellent' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Excellent</span>
                    </button>
                    <button
                      onClick={() => handleConditionChange(inventoryItem.id, 'good')}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center space-x-1 ${
                        assessment.condition === 'good' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Good</span>
                    </button>
                    <button
                      onClick={() => handleConditionChange(inventoryItem.id, 'fair')}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center space-x-1 ${
                        assessment.condition === 'fair' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Fair</span>
                    </button>
                    <button
                      onClick={() => handleConditionChange(inventoryItem.id, 'damaged')}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center space-x-1 ${
                        assessment.condition === 'damaged' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>Damaged</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Return Notes</h3>
        <textarea
          value={returnNotes}
          onChange={(e) => setReturnNotes(e.target.value)}
          rows={3}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          placeholder="Add any notes about the return process..."
        />
      </div>
      
      <div className="bg-white/5 rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Return Date</h3>
        <input
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>
    </div>
  );

  const renderDamageStep = () => {
    const damagedItems = Object.values(damageAssessments).filter(
      assessment => assessment.condition === 'damaged'
    );
    
    return (
      <div className="space-y-6">
        <div className="bg-red-500/20 rounded-xl p-6 border border-red-500/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            Damage Assessment
          </h3>
          <p className="text-cyan-200 mb-6">
            Please provide details about the damage for each affected item. Include repair cost estimates and determine insurance coverage.
          </p>
          
          <div className="space-y-6">
            {damagedItems.map(assessment => {
              const item = rentalItems.find(ri => ri.inventory_item_id === assessment.itemId)?.inventory_item;
              if (!item) return null;
              
              const rentalItem = rentalItems.find(ri => ri.inventory_item_id === assessment.itemId);
              const hasInsurance = rentalItem?.insurance_selected || false;
              
              return (
                <div key={assessment.itemId} className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{item.name}</h4>
                      <p className="text-cyan-200 text-sm">{item.brand} {item.model}</p>
                      <p className="text-cyan-200 text-xs">ID: {item.item_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 text-sm font-medium">Damaged</p>
                      {hasInsurance ? (
                        <span className="flex items-center text-green-400 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Insurance Selected
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-400 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No Insurance
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-cyan-200 mb-2">
                        Damage Description
                      </label>
                      <textarea
                        value={assessment.damageDescription}
                        onChange={(e) => handleDamageDescriptionChange(assessment.itemId, e.target.value)}
                        rows={3}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="Describe the damage in detail..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cyan-200 mb-2">
                        Estimated Repair Cost
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={assessment.estimatedRepairCost}
                          onChange={(e) => handleRepairCostChange(assessment.itemId, parseFloat(e.target.value) || 0)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`photos-${assessment.itemId}`}
                          checked={assessment.photosUploaded}
                          onChange={() => handlePhotoUploadToggle(assessment.itemId)}
                          className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                        />
                        <label htmlFor={`photos-${assessment.itemId}`} className="text-cyan-200 text-sm">
                          Photos Uploaded
                        </label>
                      </div>
                      
                      <button
                        type="button"
                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        onClick={() => handlePhotoUploadToggle(assessment.itemId)}
                      >
                        <Camera className="h-3 w-3" />
                        <span>Upload Photos</span>
                      </button>
                    </div>
                    
                    {hasInsurance && (
                      <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                        <div className="flex items-start space-x-3">
                          <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h5 className="text-white text-sm font-medium mb-1">Insurance Coverage</h5>
                            <p className="text-cyan-200 text-xs mb-2">
                              This item has rental insurance. Determine if the damage is covered by the insurance policy.
                            </p>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`insurance-${assessment.itemId}`}
                                checked={assessment.coveredByInsurance}
                                onChange={(e) => handleInsuranceCoverageChange(assessment.itemId, e.target.checked)}
                                className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400"
                              />
                              <label htmlFor={`insurance-${assessment.itemId}`} className="text-cyan-200 text-sm">
                                Damage covered by insurance
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentStep = () => {
    const hasDamageCharges = totalDamageCharges > 0;
    const hasLateFees = lateFees > 0;
    const hasCharges = hasDamageCharges || hasLateFees;
    
    return (
      <div className="space-y-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Return Summary</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-cyan-200">Return Date:</span>
              <span className="text-white">{new Date(returnDate).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-cyan-200">Items Returned:</span>
              <span className="text-white">{rentalItems.length}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-cyan-200">Condition:</span>
              <div className="flex items-center space-x-2">
                {Object.values(damageAssessments).some(a => a.condition === 'damaged') ? (
                  <span className="text-red-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Damage Reported
                  </span>
                ) : (
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    All Items Good
                  </span>
                )}
              </div>
            </div>
            
            {hasLateFees && (
              <div className="flex items-center justify-between">
                <span className="text-cyan-200">Late Fees:</span>
                <span className="text-amber-400">${lateFees.toFixed(2)}</span>
              </div>
            )}
            
            {hasDamageCharges && (
              <div className="flex items-center justify-between">
                <span className="text-cyan-200">Damage Charges:</span>
                <span className="text-red-400">${totalDamageCharges.toFixed(2)}</span>
              </div>
            )}
            
            {hasCharges && (
              <div className="flex items-center justify-between font-bold border-t border-white/20 pt-3 mt-3">
                <span className="text-white">Total Due:</span>
                <span className="text-white">${(lateFees + totalDamageCharges).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
        
        {hasCharges && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center justify-between p-3 rounded-lg ${
                  paymentMethod === 'card' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5" />
                  <span>Credit Card</span>
                </div>
                {paymentMethod === 'card' && <Check className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`w-full flex items-center justify-between p-3 rounded-lg ${
                  paymentMethod === 'cash' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5" />
                  <span>Cash</span>
                </div>
                {paymentMethod === 'cash' && <Check className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}
        
        {customer && (
          <div className="bg-blue-500/20 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white text-sm font-medium mb-1">Customer Information</h4>
                <p className="text-cyan-200 text-sm">{customer.full_name}</p>
                <p className="text-cyan-200 text-sm">{customer.email}</p>
                <p className="text-cyan-200 text-sm">{customer.phone}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="bg-green-500/20 rounded-xl p-6 border border-green-500/30 text-center">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Return Completed</h3>
        <p className="text-cyan-200 mb-6">
          All equipment has been successfully returned and processed.
        </p>
        
        <div className="space-y-4 text-left">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-cyan-200">Return Date:</span>
              <span className="text-white">{new Date(returnDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-cyan-200">Items Returned:</span>
              <span className="text-white">{rentalItems.length}</span>
            </div>
          </div>
          
          {(lateFees > 0 || totalDamageCharges > 0) && (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-cyan-200">Total Charges:</span>
                <span className="text-white">${(lateFees + totalDamageCharges).toFixed(2)}</span>
              </div>
              {lateFees > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cyan-200">Late Fees:</span>
                  <span className="text-amber-400">${lateFees.toFixed(2)}</span>
                </div>
              )}
              {totalDamageCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cyan-200">Damage Charges:</span>
                  <span className="text-red-400">${totalDamageCharges.toFixed(2)}</span>
                </div>
              )}
              {paymentMethod !== 'none' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cyan-200">Payment Method:</span>
                  <span className="text-white capitalize">{paymentMethod}</span>
                </div>
              )}
            </div>
          )}
          
          {Object.values(damageAssessments).some(a => a.condition === 'damaged') ? (
            <div className="bg-amber-500/20 rounded-lg p-4 border border-amber-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-white font-medium">Damage Reported</span>
              </div>
              <p className="text-cyan-200 text-sm">
                Damaged items have been marked for maintenance. Repair status can be tracked in the inventory system.
              </p>
            </div>
          ) : (
            <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-white font-medium">All Items in Good Condition</span>
              </div>
              <p className="text-cyan-200 text-sm">
                All items have been returned in satisfactory condition and are ready for the next rental.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={onComplete}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'inspection':
        return renderInspectionStep();
      case 'damage':
        return renderDamageStep();
      case 'payment':
        return renderPaymentStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h3 className="text-xl font-semibold text-white">Processing Equipment Return</h3>
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h3 className="text-xl font-semibold text-white">Equipment Return</h3>
            {rental && (
              <p className="text-cyan-200">
                {rental.customer_name} - {new Date(rental.start_date).toLocaleDateString()} to {new Date(rental.end_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="p-4 bg-white/5 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'inspection' || currentStep === 'damage' || currentStep === 'payment' || currentStep === 'complete'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/20 text-white/70'
              }`}>
                <Package className="h-4 w-4" />
              </div>
              <span className={currentStep === 'inspection' ? 'text-white font-medium' : 'text-white/70'}>
                Inspection
              </span>
            </div>
            
            <div className="w-12 h-0.5 bg-white/20"></div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'damage' || currentStep === 'payment' || currentStep === 'complete'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/20 text-white/70'
              }`}>
                <Clipboard className="h-4 w-4" />
              </div>
              <span className={currentStep === 'damage' ? 'text-white font-medium' : 'text-white/70'}>
                Damage
              </span>
            </div>
            
            <div className="w-12 h-0.5 bg-white/20"></div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'payment' || currentStep === 'complete'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/20 text-white/70'
              }`}>
                <DollarSign className="h-4 w-4" />
              </div>
              <span className={currentStep === 'payment' ? 'text-white font-medium' : 'text-white/70'}>
                Payment
              </span>
            </div>
            
            <div className="w-12 h-0.5 bg-white/20"></div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'complete'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/20 text-white/70'
              }`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className={currentStep === 'complete' ? 'text-white font-medium' : 'text-white/70'}>
                Complete
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {renderStepContent()}
        </div>
        
        {currentStep !== 'complete' && (
          <div className="p-6 border-t border-white/20 bg-white/5 flex justify-between">
            {currentStep !== 'inspection' ? (
              <button
                onClick={() => setCurrentStep(currentStep === 'payment' ? 
                  (Object.values(damageAssessments).some(a => a.condition === 'damaged') ? 'damage' : 'inspection') : 
                  'inspection'
                )}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                disabled={submitting || processingReturn}
              >
                Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                disabled={submitting || processingReturn}
              >
                Cancel
              </button>
            )}
            
            <div className="flex space-x-3">
              {currentStep === 'inspection' && !Object.values(damageAssessments).some(a => a.condition === 'damaged') && (
                <button
                  onClick={handleSaveInspection}
                  disabled={submitting || processingReturn}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {processingReturn ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save & Complete</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleNextStep}
                disabled={submitting || processingReturn || (
                  currentStep === 'damage' && 
                  Object.values(damageAssessments)
                    .filter(a => a.condition === 'damaged')
                    .some(a => !a.damageDescription || a.estimatedRepairCost <= 0)
                ) || (
                  currentStep === 'payment' && 
                  (lateFees > 0 || totalDamageCharges > 0) && 
                  paymentMethod === 'none'
                )}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {submitting || processingReturn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{currentStep === 'payment' ? 'Complete Return' : 'Next'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentReturn;