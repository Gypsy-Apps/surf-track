import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Package, 
  Users, 
  FileText, 
  DollarSign, 
  MapPin, 
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  TrendingUp,
  CreditCard,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { customerService, testConnection } from '../lib/supabase';

interface Transaction {
  id: string;
  type: 'rental' | 'lesson' | 'waiver_only' | 'purchase' | 'campground';
  date: string;
  amount: number;
  description: string;
  details: any;
  status: string;
}

interface CustomerTransactionHistoryProps {
  customerId: string;
  customerName: string;
}

const CustomerTransactionHistory: React.FC<CustomerTransactionHistoryProps> = ({
  customerId,
  customerName
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    checkConnectionAndLoadData();
  }, [customerId]);

  const checkConnectionAndLoadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('checking');

      // First test the connection
      const isConnected = await testConnection();
      
      if (!isConnected) {
        setConnectionStatus('failed');
        setError('Unable to connect to the database. Please check your internet connection and Supabase configuration.');
        return;
      }

      setConnectionStatus('connected');
      await loadTransactionHistory();
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('failed');
      setError(error instanceof Error ? error.message : 'Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      // Get customer visits
      const visits = await customerService.getCustomerVisits(customerId);
      
      // Transform visits into transaction format
      const transactionHistory: Transaction[] = visits.map(visit => ({
        id: visit.id,
        type: visit.visit_type as any,
        date: visit.visit_date,
        amount: visit.total_amount,
        description: getTransactionDescription(visit),
        details: visit.items || [],
        status: 'completed'
      }));

      // Sort by date (most recent first by default)
      transactionHistory.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      setTransactions(transactionHistory);
      setError(null);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transaction history';
      setError(errorMessage);
    }
  };

  const handleRetry = () => {
    checkConnectionAndLoadData();
  };

  const getTransactionDescription = (visit: any): string => {
    switch (visit.visit_type) {
      case 'rental':
        const itemCount = visit.items?.length || 0;
        return `Equipment Rental - ${itemCount} item${itemCount !== 1 ? 's' : ''}`;
      case 'lesson':
        return `Surf Lesson - ${visit.items?.[0]?.type || 'Group Lesson'}`;
      case 'waiver_only':
        return 'Waiver Collection Only';
      case 'purchase':
        return `Equipment Purchase - ${visit.items?.length || 0} item(s)`;
      case 'campground':
        return 'Campground Stay';
      default:
        return 'Transaction';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'rental':
        return <Package className="h-4 w-4 text-blue-400" />;
      case 'lesson':
        return <Users className="h-4 w-4 text-emerald-400" />;
      case 'waiver_only':
        return <FileText className="h-4 w-4 text-purple-400" />;
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-green-400" />;
      case 'campground':
        return <MapPin className="h-4 w-4 text-orange-400" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'rental':
        return 'bg-blue-500/20 border-blue-500/30';
      case 'lesson':
        return 'bg-emerald-500/20 border-emerald-500/30';
      case 'waiver_only':
        return 'bg-purple-500/20 border-purple-500/30';
      case 'purchase':
        return 'bg-green-500/20 border-green-500/30';
      case 'campground':
        return 'bg-orange-500/20 border-orange-500/30';
      default:
        return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.details.some((item: any) => 
                           item.name?.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesType && matchesSearch;
  });

  const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalTransactions = transactions.length;

  // Connection status indicator
  const ConnectionStatus = () => {
    if (connectionStatus === 'checking') {
      return (
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-400"></div>
          <span>Checking connection...</span>
        </div>
      );
    }
    
    if (connectionStatus === 'failed') {
      return (
        <div className="flex items-center space-x-2 text-red-400 text-sm">
          <AlertCircle className="h-3 w-3" />
          <span>Connection failed</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-green-400 text-sm">
        <div className="h-2 w-2 bg-green-400 rounded-full"></div>
        <span>Connected</span>
      </div>
    );
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          <ConnectionStatus />
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
          <p className="text-red-200 mb-4">{error}</p>
          
          <div className="space-y-2 text-sm text-red-200 mb-6">
            <p>• Check your internet connection</p>
            <p>• Verify Supabase configuration in .env file</p>
            <p>• Ensure your Supabase project is active</p>
            <p>• Try refreshing the page</p>
          </div>
          
          <button
            onClick={handleRetry}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          <ConnectionStatus />
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
          <span className="ml-3 text-cyan-200">Loading transaction history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        <ConnectionStatus />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-cyan-200 text-sm">Total Spent</span>
          </div>
          <p className="text-white font-bold text-xl">${totalSpent.toFixed(2)}</p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span className="text-cyan-200 text-sm">Total Visits</span>
          </div>
          <p className="text-white font-bold text-xl">{totalTransactions}</p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-400" />
            <span className="text-cyan-200 text-sm">Average Spend</span>
          </div>
          <p className="text-white font-bold text-xl">
            ${totalTransactions > 0 ? (totalSpent / totalTransactions).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <input
              type="text"
              placeholder="Search transactions..."
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="all" className="bg-gray-800">All Types</option>
              <option value="rental" className="bg-gray-800">Rentals</option>
              <option value="lesson" className="bg-gray-800">Lessons</option>
              <option value="purchase" className="bg-gray-800">Purchases</option>
              <option value="waiver_only" className="bg-gray-800">Waivers</option>
              <option value="campground" className="bg-gray-800">Campground</option>
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

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-cyan-200">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : `${customerName} hasn't made any transactions yet`
              }
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`rounded-lg border p-4 transition-all duration-200 hover:bg-white/5 ${getTransactionColor(transaction.type)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <h4 className="text-white font-medium">{transaction.description}</h4>
                    <div className="flex items-center space-x-4 text-sm text-cyan-200">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(transaction.date).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-white font-bold">${transaction.amount.toFixed(2)}</p>
                    <p className="text-cyan-200 text-sm capitalize">{transaction.status}</p>
                  </div>
                  
                  {transaction.details.length > 0 && (
                    <button
                      onClick={() => setExpandedTransaction(
                        expandedTransaction === transaction.id ? null : transaction.id
                      )}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {expandedTransaction === transaction.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedTransaction === transaction.id && transaction.details.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h5 className="text-cyan-200 text-sm font-medium mb-2">Transaction Details:</h5>
                  <div className="space-y-2">
                    {transaction.details.map((item: any, index: number) => (
                      <div key={index} className="bg-white/5 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">{item.name || item.type || 'Item'}</p>
                            {item.description && (
                              <p className="text-cyan-200 text-sm">{item.description}</p>
                            )}
                            {item.quantity && (
                              <p className="text-cyan-200 text-sm">Quantity: {item.quantity}</p>
                            )}
                          </div>
                          {item.price && (
                            <p className="text-white font-medium">${item.price}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerTransactionHistory;