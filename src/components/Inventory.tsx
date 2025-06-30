import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package, 
  Tag, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  X,
  Waves,
  Calendar,
  Clock,
  User,
  Wrench,
  History,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Users,
  CircleUser,
  Baby,
  RefreshCw
} from 'lucide-react';
import { inventoryService, InventoryItem } from '../lib/inventoryService';
import { historyService } from '../lib/historyService';
import { rentalsService } from '../lib/rentalsService';
import EquipmentHistory from './EquipmentHistory';

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    item_id: '',
    name: '',
    category: 'surfboard',
    gender: 'unisex',
    age_group: 'adult',
    brand: '',
    model: '',
    size: '',
    color: '',
    condition: 'excellent',
    status: 'available',
    purchase_date: '',
    purchase_price: 0,
    rental_price: 0,
    location: '',
    notes: '',
    image_url: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await inventoryService.getInventoryItems();
      setInventoryItems(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
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
      // Finally reload the inventory
      await loadInventory();
      alert('Inventory status refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing inventory status:', error);
      alert('Error refreshing inventory status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await inventoryService.createInventoryItem(formData as any);
      await loadInventory();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating inventory item:', error);
      alert('Error creating inventory item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedItem) return;

    try {
      setIsSubmitting(true);
      await inventoryService.updateInventoryItem(selectedItem.id, formData);
      await loadInventory();
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      alert('Error updating inventory item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this inventory item? This action cannot be undone.')) {
      return;
    }

    try {
      await inventoryService.deleteInventoryItem(itemId);
      await loadInventory();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Error deleting inventory item. Please try again.');
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      item_id: item.item_id,
      name: item.name,
      category: item.category,
      gender: item.gender || 'unisex',
      age_group: item.age_group || 'adult',
      brand: item.brand,
      model: item.model || '',
      size: item.size || '',
      color: item.color || '',
      condition: item.condition,
      status: item.status,
      purchase_date: item.purchase_date || '',
      purchase_price: item.purchase_price,
      rental_price: item.rental_price,
      location: item.location || '',
      notes: item.notes || '',
      image_url: item.image_url || ''
    });
    setShowEditModal(true);
  };

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setFormData({
      item_id: '',
      name: '',
      category: 'surfboard',
      gender: 'unisex',
      age_group: 'adult',
      brand: '',
      model: '',
      size: '',
      color: '',
      condition: 'excellent',
      status: 'available',
      purchase_date: '',
      purchase_price: 0,
      rental_price: 0,
      location: '',
      notes: '',
      image_url: ''
    });
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.item_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesGender = genderFilter === 'all' || item.gender === genderFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesGender;
  });

  // Determine if an item is a board type
  const isBoardType = (category: string): boolean => {
    return ['surfboard', 'bodyboard', 'skimboard'].includes(category);
  };

  // Group items by category first, then by gender and age group
  const groupedItems = filteredItems.reduce((acc, item) => {
    // For boards, we'll put them in their own category regardless of gender
    if (isBoardType(item.category)) {
      const key = `boards-${item.category}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }
    
    // For other items, group by gender and age
    const gender = item.gender || 'unisex';
    const ageGroup = item.age_group || 'adult';
    
    // Convert "unisex" to appropriate gender based on item name/size
    let effectiveGender = gender;
    if (gender === 'unisex') {
      if (item.name.toLowerCase().includes('women') || 
          item.name.toLowerCase().includes('woman') || 
          item.size?.toLowerCase().includes('women') || 
          item.size?.toLowerCase().includes('woman')) {
        effectiveGender = 'female';
      } else if (item.name.toLowerCase().includes('men') || 
                item.name.toLowerCase().includes('man') || 
                item.size?.toLowerCase().includes('men') || 
                item.size?.toLowerCase().includes('man')) {
        effectiveGender = 'male';
      }
    }
    
    const key = `${effectiveGender}-${ageGroup}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Further group by category within each gender/age group
  const groupedByCategory = Object.entries(groupedItems).reduce((acc, [key, items]) => {
    // For board categories, handle differently
    if (key.startsWith('boards-')) {
      const category = key.split('-')[1];
      if (!acc[key]) {
        acc[key] = {
          gender: 'boards',
          ageGroup: 'all',
          categories: {}
        };
      }
      
      if (!acc[key].categories[category]) {
        acc[key].categories[category] = [];
      }
      
      acc[key].categories[category] = items;
      return acc;
    }
    
    // For regular gender/age groups
    const [gender, ageGroup] = key.split('-');
    
    if (!acc[key]) {
      acc[key] = {
        gender,
        ageGroup,
        categories: {}
      };
    }
    
    // Group by category
    items.forEach(item => {
      if (!acc[key].categories[item.category]) {
        acc[key].categories[item.category] = [];
      }
      
      acc[key].categories[item.category].push(item);
    });
    
    return acc;
  }, {} as Record<string, { gender: string; ageGroup: string; categories: Record<string, InventoryItem[]> }>);

  const toggleGroupExpanded = (key: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rented': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'maintenance': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'retired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-amber-400';
      case 'needs-repair': return 'text-red-400';
      case 'retired': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return <CircleUser className="h-5 w-5 text-blue-400" />;
      case 'female': return <CircleUser className="h-5 w-5 text-pink-400" />;
      case 'kids': return <Baby className="h-5 w-5 text-amber-400" />;
      case 'boards': return <Waves className="h-5 w-5 text-emerald-400" />;
      default: return <Users className="h-5 w-5 text-purple-400" />;
    }
  };

  const getGenderLabel = (gender: string, ageGroup: string) => {
    if (gender === 'boards') return "Boards";
    if (gender === 'male' && ageGroup === 'adult') return "Men's";
    if (gender === 'female' && ageGroup === 'adult') return "Women's";
    if (ageGroup === 'kids') return "Kids'";
    return "Unisex";
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'surfboard': return 'Surfboards';
      case 'bodyboard': return 'Bodyboards';
      case 'skimboard': return 'Skimboards';
      case 'wetsuit': return 'Wetsuits';
      case 'boots': return 'Boots';
      case 'gloves': return 'Gloves';
      case 'flippers': return 'Flippers';
      case 'hooded-vest': return 'Hooded Vests';
      case 'accessories': return 'Accessories';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const renderInventoryModal = (isEdit: boolean = false) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h3 className="text-xl font-semibold text-white">
            {isEdit ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h3>
          <button
            onClick={() => {
              if (isEdit) {
                setShowEditModal(false);
                setSelectedItem(null);
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

        <form onSubmit={isEdit ? handleUpdateItem : handleCreateItem} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Item ID *</label>
              <input
                type="text"
                value={formData.item_id}
                onChange={(e) => setFormData(prev => ({ ...prev, item_id: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g., SB-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g., Beginner Foam Surfboard"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                <option value="surfboard" className="bg-gray-800">Surfboard</option>
                <option value="bodyboard" className="bg-gray-800">Bodyboard</option>
                <option value="skimboard" className="bg-gray-800">Skimboard</option>
                <option value="wetsuit" className="bg-gray-800">Wetsuit</option>
                <option value="boots" className="bg-gray-800">Boots</option>
                <option value="gloves" className="bg-gray-800">Gloves</option>
                <option value="flippers" className="bg-gray-800">Flippers</option>
                <option value="hooded-vest" className="bg-gray-800">Hooded Vest</option>
                <option value="accessories" className="bg-gray-800">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="unisex" className="bg-gray-800">Unisex</option>
                <option value="male" className="bg-gray-800">Men's</option>
                <option value="female" className="bg-gray-800">Women's</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Age Group</label>
              <select
                value={formData.age_group}
                onChange={(e) => setFormData(prev => ({ ...prev, age_group: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="adult" className="bg-gray-800">Adult</option>
                <option value="kids" className="bg-gray-800">Kids</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Brand *</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g., Wavestorm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g., Classic 8ft"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g., 8ft, Medium, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g., Blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Condition *</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                <option value="excellent" className="bg-gray-800">Excellent</option>
                <option value="good" className="bg-gray-800">Good</option>
                <option value="fair" className="bg-gray-800">Fair</option>
                <option value="needs-repair" className="bg-gray-800">Needs Repair</option>
                <option value="retired" className="bg-gray-800">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                <option value="available" className="bg-gray-800">Available</option>
                <option value="rented" className="bg-gray-800">Rented</option>
                <option value="maintenance" className="bg-gray-800">Maintenance</option>
                <option value="retired" className="bg-gray-800">Retired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Purchase Date</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Purchase Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Rental Price (per day) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.rental_price}
                onChange={(e) => setFormData(prev => ({ ...prev, rental_price: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Storage Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g., Rack A, Shelf 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Image URL</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="https://example.com/image.jpg"
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
              placeholder="Additional notes about the item..."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setSelectedItem(null);
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
              {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Item' : 'Create Item')}
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
            <h3 className="text-xl font-semibold text-white">Equipment History</h3>
            <p className="text-cyan-200">{selectedItem?.name} ({selectedItem?.item_id})</p>
          </div>
          <button
            onClick={() => {
              setShowHistoryModal(false);
              setSelectedItem(null);
            }}
            className="text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {selectedItem && (
            <EquipmentHistory
              equipmentId={selectedItem.id}
              equipmentName={selectedItem.name}
              onClose={() => {
                setShowHistoryModal(false);
                setSelectedItem(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderInventoryCard = (item: InventoryItem) => (
    <div key={item.id} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-cyan-200 text-sm">{item.brand} {item.model}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">{item.item_id}</span>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <Tag className="h-4 w-4 text-cyan-200" />
            <span className="text-cyan-200">Category:</span>
            <span className="text-white capitalize">{item.category.replace('-', ' ')}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Waves className="h-4 w-4 text-cyan-200" />
            <span className="text-cyan-200">Condition:</span>
            <span className={`capitalize ${getConditionColor(item.condition)}`}>
              {item.condition.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <DollarSign className="h-4 w-4 text-cyan-200" />
            <span className="text-cyan-200">Rental Price:</span>
            <span className="text-white">${item.rental_price}/day</span>
          </div>

          {item.size && (
            <div className="flex items-center space-x-2 text-sm text-cyan-200">
              <span>Size: {item.size}</span>
              {item.color && <span>• Color: {item.color}</span>}
            </div>
          )}

          {item.status === 'rented' && item.current_renter && (
            <div className="flex items-center space-x-2 text-sm text-blue-400">
              <User className="h-4 w-4" />
              <span>Rented to: {item.current_renter}</span>
            </div>
          )}

          {item.status === 'rented' && item.expected_return && (
            <div className="flex items-center space-x-2 text-sm text-blue-400">
              <Calendar className="h-4 w-4" />
              <span>Due back: {new Date(item.expected_return).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-white/5 rounded-lg">
          <div className="text-center">
            <p className="text-white font-bold text-lg">{item.total_rentals}</p>
            <p className="text-cyan-200 text-xs">Rentals</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">${item.total_revenue.toFixed(0)}</p>
            <p className="text-cyan-200 text-xs">Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">
              {item.purchase_price > 0 && item.total_revenue >= item.purchase_price ? (
                <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
              ) : (
                <TrendingUp className="h-4 w-4 text-blue-400 mx-auto" />
              )}
            </p>
            <p className="text-cyan-200 text-xs">ROI</p>
          </div>
        </div>

        {/* Location */}
        {item.location && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-sm text-cyan-200">
              <span>Location: {item.location}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="mb-4">
            <p className="text-white/70 text-sm italic line-clamp-2">{item.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewHistory(item)}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
              title="View History"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditItem(item)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              title="Edit Item"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => handleDeleteItem(item.id)}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
            title="Delete Item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderInventoryList = (item: InventoryItem) => (
    <div key={item.id} className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4 hover:bg-white/15 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            item.status === 'available' ? 'bg-green-500/20' :
            item.status === 'rented' ? 'bg-blue-500/20' :
            item.status === 'maintenance' ? 'bg-amber-500/20' :
            'bg-red-500/20'
          }`}>
            <Package className={`h-4 w-4 ${
              item.status === 'available' ? 'text-green-400' :
              item.status === 'rented' ? 'text-blue-400' :
              item.status === 'maintenance' ? 'text-amber-400' :
              'text-red-400'
            }`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-white font-medium">{item.name}</h4>
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">{item.item_id}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-cyan-200">
              <span>{item.brand} {item.model}</span>
              {item.size && <span>Size: {item.size}</span>}
              <span className={`capitalize ${getConditionColor(item.condition)}`}>
                {item.condition.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-white font-medium">${item.rental_price}/day</p>
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(item.status)}`}>
              {item.status}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {item.status === 'rented' && (
              <div className="text-right text-sm">
                <p className="text-blue-400">{item.current_renter}</p>
                {item.expected_return && (
                  <p className="text-cyan-200">Due: {new Date(item.expected_return).toLocaleDateString()}</p>
                )}
              </div>
            )}
            
            <button
              onClick={() => handleViewHistory(item)}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
              title="View History"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditItem(item)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              title="Edit Item"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
              title="Delete Item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
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
          <h2 className="text-3xl font-bold text-white mb-2">Gear Inventory</h2>
          <p className="text-cyan-200">Manage rental equipment and track maintenance</p>
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
            <span>Add Item</span>
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
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-white/70" />
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all" className="bg-gray-800">All Genders</option>
                <option value="male" className="bg-gray-800">Men's</option>
                <option value="female" className="bg-gray-800">Women's</option>
                <option value="kids" className="bg-gray-800">Kids'</option>
                <option value="unisex" className="bg-gray-800">Unisex</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-white/70" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all" className="bg-gray-800">All Categories</option>
                <option value="surfboard" className="bg-gray-800">Surfboards</option>
                <option value="bodyboard" className="bg-gray-800">Bodyboards</option>
                <option value="skimboard" className="bg-gray-800">Skimboards</option>
                <option value="wetsuit" className="bg-gray-800">Wetsuits</option>
                <option value="boots" className="bg-gray-800">Boots</option>
                <option value="gloves" className="bg-gray-800">Gloves</option>
                <option value="flippers" className="bg-gray-800">Flippers</option>
                <option value="hooded-vest" className="bg-gray-800">Hooded Vests</option>
                <option value="accessories" className="bg-gray-800">Accessories</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-white/70" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all" className="bg-gray-800">All Status</option>
                <option value="available" className="bg-gray-800">Available</option>
                <option value="rented" className="bg-gray-800">Rented</option>
                <option value="maintenance" className="bg-gray-800">Maintenance</option>
                <option value="retired" className="bg-gray-800">Retired</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                title="Grid View"
              >
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                title="List View"
              >
                <div className="flex flex-col space-y-1">
                  <div className="w-4 h-1 bg-current rounded-sm"></div>
                  <div className="w-4 h-1 bg-current rounded-sm"></div>
                  <div className="w-4 h-1 bg-current rounded-sm"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Organized by Gender and Category */}
      {Object.entries(groupedByCategory).length > 0 ? (
        <div className="space-y-6">
          {/* First show the Boards section */}
          {Object.entries(groupedByCategory)
            .filter(([key]) => key.startsWith('boards-'))
            .map(([key, group]) => {
              const isExpanded = expandedGroups[key] !== false; // Default to expanded if not set
              
              return (
                <div key={key} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  {/* Section Header with Toggle */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => toggleGroupExpanded(key)}
                  >
                    <div className="flex items-center space-x-3">
                      {getGenderIcon(group.gender)}
                      <h3 className="text-xl font-semibold text-white">
                        {getGenderLabel(group.gender, group.ageGroup)} Equipment
                      </h3>
                    </div>
                    <button className="text-white/70 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-6">
                      {Object.entries(group.categories).map(([category, items]) => (
                        <div key={`${key}-${category}`} className="mt-4">
                          <div className="flex items-center mb-3">
                            <div className="h-px bg-white/20 flex-grow mr-3"></div>
                            <h4 className="text-lg font-medium text-cyan-200">
                              {getCategoryLabel(category)} ({items.length})
                            </h4>
                            <div className="h-px bg-white/20 flex-grow ml-3"></div>
                          </div>
                          
                          {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                              {items.map(item => renderInventoryCard(item))}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {items.map(item => renderInventoryList(item))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
          {/* Then show the other sections */}
          {Object.entries(groupedByCategory)
            .filter(([key]) => !key.startsWith('boards-'))
            .map(([key, group]) => {
              const isExpanded = expandedGroups[key] !== false; // Default to expanded if not set
              
              return (
                <div key={key} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  {/* Section Header with Toggle */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => toggleGroupExpanded(key)}
                  >
                    <div className="flex items-center space-x-3">
                      {getGenderIcon(group.gender)}
                      <h3 className="text-xl font-semibold text-white">
                        {getGenderLabel(group.gender, group.ageGroup)} Equipment
                      </h3>
                    </div>
                    <button className="text-white/70 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-6">
                      {Object.entries(group.categories).map(([category, items]) => (
                        <div key={`${key}-${category}`} className="mt-4">
                          <div className="flex items-center mb-3">
                            <div className="h-px bg-white/20 flex-grow mr-3"></div>
                            <h4 className="text-lg font-medium text-cyan-200">
                              {getCategoryLabel(category)} ({items.length})
                            </h4>
                            <div className="h-px bg-white/20 flex-grow ml-3"></div>
                          </div>
                          
                          {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                              {items.map(item => renderInventoryCard(item))}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {items.map(item => renderInventoryList(item))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No inventory items found</h3>
          <p className="text-cyan-200 mb-6">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || genderFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add your first inventory item to get started'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add First Item
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && renderInventoryModal(false)}
      {showEditModal && renderInventoryModal(true)}
      {showHistoryModal && renderHistoryModal()}
    </div>
  );
};

export default Inventory;