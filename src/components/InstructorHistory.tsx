import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Clock,
  MapPin,
  Star,
  BarChart3,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  Activity
} from 'lucide-react';
import { historyService, InstructorLessonHistory, InstructorPerformanceMetrics } from '../lib/historyService';

interface InstructorHistoryProps {
  instructorId: string;
  instructorName: string;
  onClose: () => void;
}

const InstructorHistory: React.FC<InstructorHistoryProps> = ({
  instructorId,
  instructorName,
  onClose
}) => {
  const [lessonHistory, setLessonHistory] = useState<InstructorLessonHistory[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<InstructorPerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lessons' | 'performance' | 'analytics'>('lessons');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInstructorData();
  }, [instructorId, dateRange]);

  const loadInstructorData = async () => {
    try {
      setLoading(true);
      const [lessons, metrics] = await Promise.all([
        historyService.getInstructorLessonHistory(instructorId, dateRange.start, dateRange.end),
        historyService.getInstructorPerformanceMetrics(instructorId, dateRange.start, dateRange.end)
      ]);
      
      setLessonHistory(lessons);
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error loading instructor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRevenue = () => {
    return lessonHistory.reduce((sum, lesson) => sum + lesson.total_revenue, 0);
  };

  const calculateTotalStudents = () => {
    return lessonHistory.reduce((sum, lesson) => sum + lesson.participant_count, 0);
  };

  const calculateAverageClassSize = () => {
    const totalStudents = calculateTotalStudents();
    return lessonHistory.length > 0 ? totalStudents / lessonHistory.length : 0;
  };

  const getRevenueByLessonType = () => {
    return lessonHistory.reduce((acc, lesson) => {
      acc[lesson.lesson_type] = (acc[lesson.lesson_type] || 0) + lesson.total_revenue;
      return acc;
    }, {} as Record<string, number>);
  };

  const filteredLessons = lessonHistory.filter(lesson => {
    const matchesType = filterType === 'all' || lesson.lesson_type.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch = lesson.lesson_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const renderLessonsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <input
              type="text"
              placeholder="Search lessons..."
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
              <option value="beginner" className="bg-gray-800">Beginner</option>
              <option value="intermediate" className="bg-gray-800">Intermediate</option>
              <option value="advanced" className="bg-gray-800">Advanced</option>
              <option value="private" className="bg-gray-800">Private</option>
              <option value="kids" className="bg-gray-800">Kids</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lesson History */}
      <div className="space-y-3">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No lessons found</h3>
            <p className="text-cyan-200">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No lessons taught in the selected date range'
              }
            </p>
          </div>
        ) : (
          filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <Users className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{lesson.lesson_type}</h4>
                    <div className="flex items-center space-x-4 text-sm text-cyan-200">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(lesson.lesson_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{lesson.lesson_time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{lesson.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-white font-bold">${lesson.total_revenue.toFixed(2)}</p>
                    <p className="text-cyan-200 text-sm">{lesson.participant_count} students</p>
                  </div>
                  
                  <button
                    onClick={() => setExpandedLesson(
                      expandedLesson === lesson.id ? null : lesson.id
                    )}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {expandedLesson === lesson.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedLesson === lesson.id && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Lesson Details:</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-cyan-200">Duration:</span>
                          <span className="text-white">{lesson.lesson_duration_minutes || 90} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-200">Price per student:</span>
                          <span className="text-white">${lesson.lesson_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-200">Status:</span>
                          <span className={`font-medium ${
                            lesson.lesson_status === 'completed' ? 'text-green-400' :
                            lesson.lesson_status === 'cancelled' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {lesson.lesson_status.charAt(0).toUpperCase() + lesson.lesson_status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Performance:</h5>
                      <div className="space-y-1 text-sm">
                        {lesson.participant_feedback_avg && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Student Rating:</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-400" />
                              <span className="text-white">{lesson.participant_feedback_avg.toFixed(1)}/5</span>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-cyan-200">Safety Incidents:</span>
                          <span className={`font-medium ${lesson.safety_incidents === 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {lesson.safety_incidents}
                          </span>
                        </div>
                        {lesson.weather_conditions && (
                          <div className="flex justify-between">
                            <span className="text-cyan-200">Weather:</span>
                            <span className="text-white">{lesson.weather_conditions}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {lesson.instructor_notes && (
                    <div className="mt-4">
                      <h5 className="text-cyan-200 text-sm font-medium mb-2">Instructor Notes:</h5>
                      <p className="text-white text-sm bg-white/5 rounded p-3">{lesson.instructor_notes}</p>
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

  const renderPerformanceTab = () => {
    const revenueByType = getRevenueByLessonType();
    
    return (
      <div className="space-y-6">
        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="text-cyan-200 text-sm">Lessons Taught</span>
            </div>
            <p className="text-white font-bold text-xl">{lessonHistory.length}</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-cyan-200 text-sm">Total Students</span>
            </div>
            <p className="text-white font-bold text-xl">{calculateTotalStudents()}</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-cyan-200 text-sm">Total Revenue</span>
            </div>
            <p className="text-white font-bold text-xl">${calculateTotalRevenue().toFixed(2)}</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              <span className="text-cyan-200 text-sm">Avg Class Size</span>
            </div>
            <p className="text-white font-bold text-xl">{calculateAverageClassSize().toFixed(1)}</p>
          </div>
        </div>

        {/* Revenue by Lesson Type */}
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Revenue by Lesson Type</h4>
          <div className="space-y-3">
            {Object.entries(revenueByType).map(([type, revenue]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-cyan-200">{type}</span>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/10 rounded-full h-2 w-32">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${(revenue / calculateTotalRevenue()) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-medium">${revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics Over Time */}
        {performanceMetrics.length > 0 && (
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Performance Trends</h4>
            <div className="space-y-4">
              {performanceMetrics.slice(0, 10).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-white/5 rounded">
                  <div>
                    <p className="text-white font-medium">{new Date(metric.metric_date).toLocaleDateString()}</p>
                    <p className="text-cyan-200 text-sm">{metric.lessons_taught} lessons, {metric.total_students} students</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${metric.total_revenue.toFixed(2)}</p>
                    <p className="text-cyan-200 text-sm">Avg: {metric.average_class_size.toFixed(1)} students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-white/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
        <p className="text-cyan-200">
          Detailed analytics and insights coming soon. This will include student retention rates, 
          seasonal performance trends, and comparative analysis with other instructors.
        </p>
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
          <h3 className="text-xl font-semibold text-white">{instructorName} - Performance History</h3>
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
          { id: 'lessons', name: 'Lesson History', icon: Users },
          { id: 'performance', name: 'Performance', icon: TrendingUp },
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
        {activeTab === 'lessons' && renderLessonsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
};

export default InstructorHistory;