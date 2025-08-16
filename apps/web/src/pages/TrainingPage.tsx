import React, { useState } from 'react';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  dueDate?: string;
  completedDate?: string;
  score?: number;
  required: boolean;
}

const TrainingPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API call
  const trainingModules: TrainingModule[] = [
    {
      id: '1',
      title: 'Workplace Safety Fundamentals',
      description: 'Essential safety protocols and procedures for all employees',
      duration: '45 minutes',
      difficulty: 'beginner',
      category: 'Safety',
      progress: 100,
      status: 'completed',
      completedDate: '2024-01-15',
      score: 95,
      required: true
    },
    {
      id: '2',
      title: 'Customer Service Excellence',
      description: 'Best practices for delivering exceptional customer service',
      duration: '60 minutes',
      difficulty: 'intermediate',
      category: 'Customer Service',
      progress: 65,
      status: 'in_progress',
      dueDate: '2024-02-28',
      required: false
    },
    {
      id: '3',
      title: 'Data Privacy and Security',
      description: 'Understanding GDPR and data protection requirements',
      duration: '30 minutes',
      difficulty: 'beginner',
      category: 'Compliance',
      progress: 0,
      status: 'not_started',
      dueDate: '2024-03-15',
      required: true
    },
    {
      id: '4',
      title: 'Advanced Leadership Skills',
      description: 'Developing leadership capabilities for senior roles',
      duration: '90 minutes',
      difficulty: 'advanced',
      category: 'Leadership',
      progress: 0,
      status: 'not_started',
      required: false
    }
  ];

  const categories = [
    'all',
    ...Array.from(new Set(trainingModules.map(module => module.category)))
  ];

  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  const filteredModules = trainingModules.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || module.status === selectedStatus;
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'in_progress':
        return <span className="badge badge-warning">In Progress</span>;
      case 'not_started':
        return <span className="badge badge-neutral">Not Started</span>;
      default:
        return <span className="badge badge-neutral">Unknown</span>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <span className="badge bg-green-100 text-green-800">Beginner</span>;
      case 'intermediate':
        return <span className="badge bg-yellow-100 text-yellow-800">Intermediate</span>;
      case 'advanced':
        return <span className="badge bg-red-100 text-red-800">Advanced</span>;
      default:
        return <span className="badge badge-neutral">{difficulty}</span>;
    }
  };

  const handleStartModule = (moduleId: string) => {
    console.log('Starting module:', moduleId);
    // TODO: Navigate to training module or start training
  };

  const handleContinueModule = (moduleId: string) => {
    console.log('Continuing module:', moduleId);
    // TODO: Navigate to training module
  };

  // Calculate overall statistics
  const stats = {
    total: trainingModules.length,
    completed: trainingModules.filter(m => m.status === 'completed').length,
    inProgress: trainingModules.filter(m => m.status === 'in_progress').length,
    required: trainingModules.filter(m => m.required).length,
    averageScore: trainingModules
      .filter(m => m.score !== undefined)
      .reduce((sum, m) => sum + (m.score || 0), 0) / 
      trainingModules.filter(m => m.score !== undefined).length || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-2">Training</h1>
        <p className="text-gray-600">Complete your training modules and track progress</p>
      </div>

      {/* Training Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">📚</div>
          <p className="text-sm text-gray-600 mb-1">Total Modules</p>
          <p className="text-xl font-bold text-charcoal">{stats.total}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-sm text-gray-600 mb-1">In Progress</p>
          <p className="text-xl font-bold text-orange-600">{stats.inProgress}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-sm text-gray-600 mb-1">Required</p>
          <p className="text-xl font-bold text-red-600">{stats.required}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-sm text-gray-600 mb-1">Avg Score</p>
          <p className="text-xl font-bold text-blue-600">
            {stats.averageScore ? Math.round(stats.averageScore) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 lg:max-w-md">
            <input
              type="text"
              placeholder="Search training modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input w-auto"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input w-auto"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Training Modules */}
      {filteredModules.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">
            No training modules found
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No modules match "${searchTerm}"`
              : 'No training modules available'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredModules.map(module => (
            <div key={module.id} className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-charcoal">
                        {module.title}
                      </h3>
                      {module.required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {module.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(module.status)}
                    {getDifficultyBadge(module.difficulty)}
                    <span className="badge badge-info">{module.category}</span>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Duration: {module.duration}</span>
                    {module.score && (
                      <span className="font-medium text-green-600">
                        Score: {module.score}%
                      </span>
                    )}
                  </div>

                  {module.dueDate && (
                    <div className="text-sm text-orange-600">
                      Due: {new Date(module.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  {module.completedDate && (
                    <div className="text-sm text-green-600">
                      Completed: {new Date(module.completedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {module.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{module.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          module.status === 'completed' 
                            ? 'bg-green-500' 
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex space-x-2">
                  {module.status === 'not_started' && (
                    <button
                      onClick={() => handleStartModule(module.id)}
                      className="btn btn-primary flex-1"
                    >
                      <span className="mr-2">▶️</span>
                      Start Training
                    </button>
                  )}
                  {module.status === 'in_progress' && (
                    <button
                      onClick={() => handleContinueModule(module.id)}
                      className="btn btn-warning flex-1"
                    >
                      <span className="mr-2">⏯️</span>
                      Continue Training
                    </button>
                  )}
                  {module.status === 'completed' && (
                    <button
                      onClick={() => handleContinueModule(module.id)}
                      className="btn btn-outline flex-1"
                    >
                      <span className="mr-2">📋</span>
                      Review
                    </button>
                  )}
                  <button className="btn btn-secondary">
                    <span>ℹ️</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Training Calendar */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Upcoming Deadlines</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {trainingModules
              .filter(module => module.dueDate && module.status !== 'completed')
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .map(module => (
                <div key={module.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-charcoal">{module.title}</p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(module.dueDate!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(module.status)}
                    {module.required && (
                      <p className="text-xs text-red-600 mt-1">Required</p>
                    )}
                  </div>
                </div>
              ))}
            {trainingModules.filter(module => module.dueDate && module.status !== 'completed').length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <div className="text-4xl mb-2">🎉</div>
                <p>No upcoming deadlines!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;