import React, { useState } from 'react';
import { 
  Waves, 
  Users, 
  Package, 
  ClipboardCheck, 
  Plus, 
  Play, 
  Upload,
  Shield,
  Smartphone,
  Cloud,
  Zap,
  TrendingUp,
  Settings,
  CheckCircle,
  Database,
  Workflow,
  X,
  ArrowRight,
  Download,
  FileText,
  UserCheck,
  Archive,
  BarChart3
} from 'lucide-react';
import BrochureGenerator from './BrochureGenerator';

interface LandingPageProps {
  onNavigateToDashboard: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToDashboard }) => {
  const [showBrochureModal, setShowBrochureModal] = useState(false);

  const features = [
    {
      category: "Customer Management",
      icon: UserCheck,
      color: "from-blue-500 to-cyan-400",
      items: [
        "Complete customer profiles with contact info & emergency contacts",
        "Visit history and spending analytics",
        "Waiver status tracking with expiry dates",
        "Campground guest management with discount eligibility",
        "Advanced search and filtering capabilities",
        "Customer notes and preferences tracking"
      ]
    },
    {
      category: "Gear Rentals",
      icon: Package,
      color: "from-emerald-500 to-teal-400",
      items: [
        "Real-time rental tracking with due dates",
        "Equipment condition assessment on return",
        "Insurance coverage and damage charge calculation",
        "Automated overdue notifications",
        "Rental history and revenue tracking",
        "Quick rental creation with gear selection"
      ]
    },
    {
      category: "Surf Lessons",
      icon: Users,
      color: "from-orange-500 to-amber-400",
      items: [
        "Instructor scheduling and assignment",
        "Group and private lesson management",
        "Participant waiver verification",
        "Lesson cancellation with refund processing",
        "Revenue tracking and analytics",
        "Location and weather condition notes"
      ]
    },
    {
      category: "Digital Waivers",
      icon: ClipboardCheck,
      color: "from-purple-500 to-pink-400",
      items: [
        "iPad-optimized signature collection",
        "Automatic PDF generation with embedded signatures",
        "Legal compliance with digital timestamps",
        "Emergency contact information capture",
        "Activity-specific waiver customization",
        "Secure cloud storage and retrieval"
      ]
    },
    {
      category: "Gear Inventory",
      icon: Archive,
      color: "from-indigo-500 to-purple-400",
      items: [
        "Complete equipment catalog with photos",
        "Real-time availability tracking",
        "Maintenance scheduling and history",
        "Purchase price and ROI analytics",
        "Location and storage management",
        "Condition monitoring and alerts"
      ]
    },
    {
      category: "Business Analytics",
      icon: BarChart3,
      color: "from-red-500 to-pink-400",
      items: [
        "Daily, weekly, and monthly revenue reports",
        "Customer lifetime value analysis",
        "Equipment utilization and profitability",
        "Instructor performance metrics",
        "Seasonal trend analysis",
        "Real-time dashboard with key metrics"
      ]
    }
  ];

  const benefits = [
    {
      icon: Smartphone,
      title: "iPad Optimized",
      description: "Perfect for beachside operations with touch-friendly interface"
    },
    {
      icon: Cloud,
      title: "Cloud-Based",
      description: "Access your data anywhere with automatic backups"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Quick operations to keep customers moving"
    },
    {
      icon: Shield,
      title: "Legally Compliant",
      description: "Digital waivers with legal timestamps and signatures"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Analytics to optimize pricing and operations"
    },
    {
      icon: Settings,
      title: "Easy to Use",
      description: "Intuitive design that your staff will love"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Hero Section with Custom Background */}
      <div className="relative overflow-hidden min-h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/Untitled (49).png')`,
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-screen flex items-center">
          <div className="w-full">
            {/* Logo and Brand */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="h-64 w-64 rounded-full overflow-hidden mb-4">
                <img src="/Untitled (52).png" alt="Surf Track Logo" className="h-full w-full object-cover" />
              </div>
              <div className="text-center">
                <h1 className="text-5xl md:text-7xl surf-font drop-shadow-2xl" style={{ color: '#4bccc5' }}>Surf Track</h1>
                <p className="text-xl md:text-2xl text-cyan-200 font-medium drop-shadow-lg">Gear. Lessons. Waves. Paperless....For Real.</p>
              </div>
            </div>

            {/* Hero Text */}
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
                Built for surf schools and rental shops — 
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  no paper, no stress.
                </span>
              </h2>
              
              <p className="text-xl text-cyan-200 mb-4 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
                Surf Track lets you manage gear, lessons, waivers, and customers all in one seamless platform.
              </p>

              <p className="text-lg text-cyan-300 mb-8 max-w-3xl mx-auto font-medium drop-shadow-lg">
                From the shoreline to the shop counter, Surf Track keeps your business flowing.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={onNavigateToDashboard}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center space-x-3 shadow-2xl"
                >
                  <Play className="h-6 w-6" />
                  <span>Try Live Demo</span>
                  <ArrowRight className="h-6 w-6" />
                </button>
                
                <button 
                  onClick={() => setShowBrochureModal(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 border border-white/20 flex items-center space-x-3 shadow-2xl"
                >
                  <Download className="h-6 w-6" />
                  <span>Download Brochure</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Surf Track?
            </h3>
            <div className="max-w-4xl mx-auto space-y-4">
              <p className="text-xl text-cyan-200">
                Built by one developer, just for surf shops & schools.
              </p>
              <p className="text-lg text-cyan-300">
                No bloated systems. No corporate overhead.
              </p>
              <p className="text-lg text-cyan-300">
                Just fast, paperless workflows that work — at a fraction of the cost.
              </p>
              <p className="text-xl text-white font-semibold mt-6">
                It's time to ditch old software and ride the wave of smart, modern tools.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 text-center"
                >
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{benefit.title}</h4>
                  <p className="text-cyan-200">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Complete Feature Set
            </h3>
            <p className="text-xl text-cyan-200 max-w-3xl mx-auto">
              Everything you need to run a modern surf business, all in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className={`bg-gradient-to-r ${feature.color} p-3 rounded-xl`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-white">{feature.category}</h4>
                  </div>
                  
                  <ul className="space-y-3">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-cyan-200">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Developer Background Section */}
      <div className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built by Business Systems Experts
            </h3>
            <p className="text-xl text-cyan-200 max-w-4xl mx-auto">
              Surf Track is developed by Berkner Platform Solutions, with extensive experience in creating paperless systems and reference database solutions that improve business flow for customers and companies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">Proven</div>
              <div className="text-cyan-200">Database Systems</div>
              <p className="text-cyan-300 text-sm mt-2">
                Extensive experience building reference database systems for streamlined operations
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">Paperless</div>
              <div className="text-cyan-200">System Expertise</div>
              <p className="text-cyan-300 text-sm mt-2">
                Specialized in creating digital solutions that eliminate paper-based processes
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Workflow className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">Business</div>
              <div className="text-cyan-200">Flow Optimization</div>
              <p className="text-cyan-300 text-sm mt-2">
                Track record of improving customer and business workflows through smart software design
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Innovation Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              A New Platform for Surf Businesses
            </h3>
            <p className="text-xl text-cyan-200 max-w-3xl mx-auto">
              Surf Track is a brand new platform designed specifically for the surf industry, bringing modern software solutions to traditional beach businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Waves className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">New</div>
              <div className="text-cyan-200">Platform Launch</div>
              <p className="text-cyan-300 text-sm mt-2">
                Fresh approach to surf business management
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">Early</div>
              <div className="text-cyan-200">Adopter Program</div>
              <p className="text-cyan-300 text-sm mt-2">
                Be among the first to experience the platform
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-cyan-200">Surf-Focused</div>
              <p className="text-cyan-300 text-sm mt-2">
                Built specifically for surf schools and rental shops
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 backdrop-blur-md rounded-3xl p-12 border border-white/20">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Experience the Future of Surf Business Management?
            </h3>
            <p className="text-xl text-cyan-200 mb-8 max-w-2xl mx-auto">
              Explore our comprehensive demo to see how Surf Track can transform your surf school or rental shop operations. 
              Experience the power of paperless systems designed specifically for your industry.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onNavigateToDashboard}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center space-x-3"
              >
                <Play className="h-6 w-6" />
                <span>Explore Live Demo</span>
                <ArrowRight className="h-6 w-6" />
              </button>
              
              <button 
                onClick={() => setShowBrochureModal(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 border border-white/20"
              >
                Download Brochure
              </button>
            </div>

            <p className="text-cyan-300 text-sm mt-6">
              💡 <strong>Pro Tip:</strong> Click "Explore Live Demo" to see the full platform in action with sample data
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-white/10 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-20 w-20 rounded-full overflow-hidden">
                <img src="/Untitled (52).png" alt="Surf Track Logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <h4 className="text-lg surf-font" style={{ color: '#4bccc5' }}>Surf Track</h4>
                <p className="text-sm text-cyan-200">Gear. Lessons. Waves. Paperless....For Real.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-cyan-200">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10">
            {/* Berkner Platform Solutions Section */}
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="text-center">
                <h5 className="text-lg font-semibold text-white">Berkner Platform Solutions Ltd</h5>
                <p className="text-sm text-cyan-200">Paperless Systems & Database Solutions</p>
              </div>
              <p className="text-cyan-300 text-sm text-center max-w-2xl">
                Surf Track is developed by Berkner Platform Solutions Ltd, 
                specialists in creating paperless systems and reference database solutions that improve business flow for customers and companies.
              </p>
            </div>

            <div className="text-center text-cyan-300">
              <p>&copy; 2025 Surf Track. All rights reserved. Made for surf businesses worldwide.</p>
              <p className="text-xs mt-2 text-cyan-400">
                Developed by Berkner Platform Solutions Ltd
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Brochure Modal */}
      {showBrochureModal && (
        <BrochureGenerator onClose={() => setShowBrochureModal(false)} />
      )}
    </div>
  );
};

export default LandingPage;

