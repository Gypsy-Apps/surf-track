import React, { useState, useEffect, Suspense } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import WeatherDisplay from './components/WeatherDisplay';
import { 
  Waves, 
  Users, 
  Package, 
  ClipboardCheck, 
  Settings as SettingsIcon,
  Menu,
  BarChart3,
  Calendar,
  UserCheck,
  Archive,
  Home,
  GraduationCap,
  Loader
} from 'lucide-react';
import { settingsService } from './lib/settingsService';

// Lazy load components
const Rentals = React.lazy(() => import('./components/Rentals'));
const Lessons = React.lazy(() => import('./components/Lessons'));
const Waivers = React.lazy(() => import('./components/Waivers'));
const Customers = React.lazy(() => import('./components/Customers'));
const Inventory = React.lazy(() => import('./components/Inventory'));
const Instructors = React.lazy(() => import('./components/Instructors'));
const Settings = React.lazy(() => import('./components/Settings'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full py-12">
    <div className="flex flex-col items-center">
      <Loader className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
      <p className="text-cyan-200">Loading component...</p>
    </div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [waiverCustomerName, setWaiverCustomerName] = useState('');
  const [waiverActivities, setWaiverActivities] = useState<string[]>([]);
  const [waiverLessonId, setWaiverLessonId] = useState<string | undefined>(undefined);
  const [waiverCustomerId, setWaiverCustomerId] = useState<string | undefined>(undefined);

  const navItems = [
    { name: 'Home', icon: Home, key: 'landing' },
    { name: 'Dashboard', icon: BarChart3, key: 'dashboard' },
    { name: 'Customers', icon: UserCheck, key: 'customers' },
    { name: 'Rentals', icon: Package, key: 'rentals' },
    { name: 'Lessons', icon: Users, key: 'lessons' },
    { name: 'Instructors', icon: GraduationCap, key: 'instructors' },
    { name: 'Gear Inventory', icon: Archive, key: 'inventory' },
    { name: 'Waivers', icon: ClipboardCheck, key: 'waivers' },
    { name: 'Settings', icon: SettingsIcon, key: 'settings' },
  ];

  const handleOpenWaiver = (customerName: string, activities: string[], lessonId?: string, customerId?: string) => {
    console.log('🎯 App.tsx - Opening waiver with:', {
      customerName,
      activities,
      lessonId,
      customerId
    });
    
    setWaiverCustomerName(customerName);
    setWaiverActivities(activities);
    setWaiverLessonId(lessonId);
    setWaiverCustomerId(customerId);
    setCurrentPage('waivers');
    setShowWaiverModal(true);
  };

  const handleNavigateToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigateToPage = (page: string) => {
    setCurrentPage(page);
    // Close any open modals when navigating
    setShowWaiverModal(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigateToDashboard={handleNavigateToDashboard} />;
      case 'dashboard':
        return (
          <Dashboard 
            onNavigateToPage={handleNavigateToPage}
            onOpenWaiver={handleOpenWaiver}
          />
        );
      case 'customers':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Customers />
          </Suspense>
        );
      case 'rentals':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Rentals onOpenWaiver={handleOpenWaiver} />
          </Suspense>
        );
      case 'lessons':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Lessons onOpenWaiver={handleOpenWaiver} />
          </Suspense>
        );
      case 'instructors':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Instructors />
          </Suspense>
        );
      case 'inventory':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Inventory />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        );
      case 'waivers':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Waivers 
              showModal={showWaiverModal}
              onCloseModal={() => setShowWaiverModal(false)}
              prefilledCustomerName={waiverCustomerName}
              prefilledActivities={waiverActivities}
              lessonId={waiverLessonId}
              customerId={waiverCustomerId}
            />
          </Suspense>
        );
      default:
        return <LandingPage onNavigateToDashboard={handleNavigateToDashboard} />;
    }
  };

  // Show landing page without navigation
  if (currentPage === 'landing') {
    return renderPage();
  }

  // Show app with navigation for all other pages
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 rounded-xl overflow-hidden mb-2">
                <img src="/Untitled (52).png" alt="Surf Track Logo" className="h-full w-full object-cover" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl surf-font" style={{ color: '#4bccc5' }}>Surf Track</h1>
                <p className="text-sm text-cyan-200">Gear. Lessons. Waves. Paperless....For Real.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <WeatherDisplay />
              </div>
              <button 
                onClick={() => setCurrentPage('settings')}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 'settings' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <SettingsIcon className="h-5 w-5" />
              </button>
              <button className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setCurrentPage(item.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                    currentPage === item.key
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
