import React, { useState, useEffect } from 'react';
import { 
  Waves, 
  Users, 
  Package, 
  ClipboardCheck, 
  Plus, 
  Play, 
  Upload,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { inventoryService } from '../lib/inventoryService';
import { testConnection } from '../lib/supabase';

interface DashboardProps {
  onNavigateToPage?: (page: string) => void;
  onOpenWaiver?: (customerName: string, activities: string[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToPage, onOpenWaiver }) => {
  const [dashboardStats, setDashboardStats] = useState({
    todayRentals: 0,
    upcomingLessons: 0,
    waiversCollected: 0,
    gearAvailable: 0,
    gearInUse: 0
  });

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  // Test database connection and load stats
  useEffect(() => {
    const initializeDashboard = async () => {
      setConnectionStatus('connecting');
      setErrorMessage('');

      try {
        // Test connection first
        const isConnected = await testConnection();
        
        if (!isConnected) {
          setConnectionStatus('error');
          setErrorMessage('Unable to connect to database. Please check your internet connection.');
          return;
        }

        // Load inventory stats
        const stats = await inventoryService.getInventoryStats();
        setDashboardStats(prev => ({
          ...prev,
          gearAvailable: stats.available,
          gearInUse: stats.rented
        }));

        setConnectionStatus('connected');
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        setConnectionStatus('error');
        
        if (error instanceof Error) {
          if (error.message.includes('Network error')) {
            setErrorMessage('Network connection failed. Please check your internet connection and try again.');
          } else if (error.message.includes('Missing Supabase')) {
            setErrorMessage('Database configuration error. Please check your environment settings.');
          } else {
            setErrorMessage(`Connection error: ${error.message}`);
          }
        } else {
          setErrorMessage('An unexpected error occurred while connecting to the database.');
        }
      }
    };

    initializeDashboard();
  }, []);

  // Retry connection function
  const retryConnection = async () => {
    setIsRetrying(true);
    
    try {
      const isConnected = await testConnection();
      
      if (isConnected) {
        // Reload stats
        const stats = await inventoryService.getInventoryStats();
        setDashboardStats(prev => ({
          ...prev,
          gearAvailable: stats.available,
          gearInUse: stats.rented
        }));
        
        setConnectionStatus('connected');
        setErrorMessage('');
      } else {
        setConnectionStatus('error');
        setErrorMessage('Still unable to connect to database. Please check your connection.');
      }
    } catch (error) {
      console.error('Retry connection error:', error);
      setConnectionStatus('error');
      setErrorMessage('Connection retry failed. Please try again later.');
    } finally {
      setIsRetrying(false);
    }
  };

  // Quick action handlers
  const handleAddRental = () => {
    if (onNavigateToPage) {
      onNavigateToPage('rentals');
    }
  };

  const handleStartLesson = () => {
    if (onNavigateToPage) {
      onNavigateToPage('lessons');
    }
  };

  const handleUploadWaiver = () => {
    if (onOpenWaiver) {
      // Open waiver modal with default activities
      onOpenWaiver('', ['Equipment Rental', 'Surf Lessons']);
    } else if (onNavigateToPage) {
      // Fallback to navigate to waivers page
      onNavigateToPage('waivers');
    }
  };

  const stats = [
    {
      title: "Today's Rentals",
      value: dashboardStats.todayRentals.toString(),
      change: dashboardStats.todayRentals > 0 ? `+${dashboardStats.todayRentals} today` : "Ready to start",
      icon: Package,
      color: "from-blue-500 to-cyan-400"
    },
    {
      title: "Upcoming Lessons",
      value: dashboardStats.upcomingLessons.toString(),
      change: dashboardStats.upcomingLessons > 0 ? `+${dashboardStats.upcomingLessons} scheduled` : "No lessons yet",
      icon: Users,
      color: "from-emerald-500 to-teal-400"
    },
    {
      title: "Waivers Collected",
      value: dashboardStats.waiversCollected.toString(),
      change: dashboardStats.waiversCollected > 0 ? `+${dashboardStats.waiversCollected} today` : "All digital",
      icon: ClipboardCheck,
      color: "from-orange-500 to-amber-400"
    },
    {
      title: "Gear Available",
      value: connectionStatus === 'connected' ? dashboardStats.gearAvailable.toString() : "—",
      change: connectionStatus === 'connected' 
        ? (dashboardStats.gearInUse > 0 ? `${dashboardStats.gearInUse} in use` : dashboardStats.gearAvailable > 0 ? "All available" : "Add inventory")
        : "Loading...",
      icon: Waves,
      color: "from-indigo-500 to-purple-400"
    }
  ];

  const quickActions = [
    {
      title: "Add Rental",
      description: "New gear rental",
      icon: Plus,
      color: "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600",
      onClick: handleAddRental
    },
    {
      title: "Start Lesson",
      description: "Begin surf session",
      icon: Play,
      color: "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600",
      onClick: handleStartLesson
    },
    {
      title: "Upload Waiver",
      description: "Add signed waiver",
      icon: Upload,
      color: "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600",
      onClick: handleUploadWaiver
    }
  ];

  // Recent activity - empty state since we removed demo data
  const recentActivity = [
    // Empty array - no demo activities
  ];

  return (
    <>
      {/* Connection Status Banner */}
      {connectionStatus === 'error' && (
        <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <h4 className="text-red-200 font-medium">Database Connection Error</h4>
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={retryConnection}
              disabled={isRetrying}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome back, Surfer! 🏄‍♂️</h2>
        <p className="text-cyan-200">Here's what's happening at your surf school today</p>
        {connectionStatus === 'connecting' && (
          <p className="text-cyan-300 text-sm mt-1 flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Connecting to database...</span>
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-cyan-400 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-cyan-200 text-sm">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`${action.color} p-6 rounded-2xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl group ${
                  connectionStatus === 'error' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={connectionStatus === 'error'}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-lg">{action.title}</h4>
                    <p className="text-white/80 text-sm">{action.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
          <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">View All</button>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/5 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Waves className="h-8 w-8 text-white/30" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No Recent Activity</h4>
            <p className="text-cyan-200 text-sm mb-6">Activity will appear here as you start using the system</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleAddRental}
                className={`bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                  connectionStatus === 'error' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={connectionStatus === 'error'}
              >
                <Package className="h-4 w-4" />
                <span>Create First Rental</span>
              </button>
              <button 
                onClick={handleStartLesson}
                className={`bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                  connectionStatus === 'error' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={connectionStatus === 'error'}
              >
                <Users className="h-4 w-4" />
                <span>Book First Lesson</span>
              </button>
              <button 
                onClick={handleUploadWaiver}
                className={`bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                  connectionStatus === 'error' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={connectionStatus === 'error'}
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>Collect First Waiver</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'rental' ? 'bg-blue-500/20 text-blue-400' :
                  activity.type === 'lesson' ? 'bg-emerald-500/20 text-emerald-400' :
                  activity.type === 'waiver' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {activity.type === 'rental' && <Package className="h-4 w-4" />}
                  {activity.type === 'lesson' && <Users className="h-4 w-4" />}
                  {activity.type === 'waiver' && <ClipboardCheck className="h-4 w-4" />}
                  {activity.type === 'return' && <Waves className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-cyan-200 text-sm">{activity.item}</p>
                </div>
                <span className="text-white/60 text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;