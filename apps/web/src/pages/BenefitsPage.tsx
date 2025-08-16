import React, { useState } from 'react';

interface Benefit {
  id: string;
  title: string;
  description: string;
  category: 'health' | 'wellness' | 'financial' | 'lifestyle' | 'travel';
  provider: string;
  discount: string;
  website?: string;
  phone?: string;
  email?: string;
  location?: string;
  validUntil?: string;
  featured: boolean;
}

const BenefitsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API call
  const benefits: Benefit[] = [
    {
      id: '1',
      title: 'Health Insurance Premium',
      description: 'Comprehensive health coverage with low deductibles and wide network coverage',
      category: 'health',
      provider: 'Nayara Health Plan',
      discount: '100% covered by company',
      featured: true
    },
    {
      id: '2',
      title: 'Gym Membership Discount',
      description: 'Discounted membership rates at participating fitness centers',
      category: 'wellness',
      provider: 'FitLife Gyms',
      discount: '25% off monthly fees',
      website: 'https://fitlife.com',
      phone: '+507 123-4567',
      featured: false
    },
    {
      id: '3',
      title: 'Restaurant Discounts',
      description: 'Special discounts at local restaurants and cafes',
      category: 'lifestyle',
      provider: 'Local Dining Partners',
      discount: '15-20% off meals',
      featured: true
    },
    {
      id: '4',
      title: 'Dental Care Package',
      description: 'Complete dental coverage including preventive and major treatments',
      category: 'health',
      provider: 'SmileCare Dental',
      discount: '80% coverage',
      phone: '+507 234-5678',
      featured: false
    },
    {
      id: '5',
      title: 'Hotel Accommodations',
      description: 'Preferred rates at partner hotels worldwide',
      category: 'travel',
      provider: 'Travel Plus Hotels',
      discount: 'Up to 30% off',
      website: 'https://travelplus.com/corporate',
      validUntil: '2024-12-31',
      featured: true
    },
    {
      id: '6',
      title: 'Financial Planning Services',
      description: 'Free consultation with certified financial advisors',
      category: 'financial',
      provider: 'WealthWise Financial',
      discount: 'Free initial consultation',
      email: 'corporate@wealthwise.com',
      phone: '+507 345-6789',
      featured: false
    }
  ];

  const categories = [
    { value: 'all', label: 'All Benefits', icon: '🎁' },
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'wellness', label: 'Wellness', icon: '💪' },
    { value: 'financial', label: 'Financial', icon: '💰' },
    { value: 'lifestyle', label: 'Lifestyle', icon: '🍽️' },
    { value: 'travel', label: 'Travel', icon: '✈️' }
  ];

  const filteredBenefits = benefits.filter(benefit => {
    const matchesCategory = selectedCategory === 'all' || benefit.category === selectedCategory;
    const matchesSearch = benefit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         benefit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         benefit.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredBenefits = benefits.filter(benefit => benefit.featured);

  const getCategoryIcon = (category: string) => {
    const categoryObj = categories.find(cat => cat.value === category);
    return categoryObj?.icon || '🎁';
  };

  const handleContact = (benefit: Benefit) => {
    if (benefit.website) {
      window.open(benefit.website, '_blank');
    } else if (benefit.phone) {
      window.open(`tel:${benefit.phone}`);
    } else if (benefit.email) {
      window.open(`mailto:${benefit.email}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-2">Employee Benefits</h1>
        <p className="text-gray-600">Discover and access your employee benefits and perks</p>
      </div>

      {/* Featured Benefits */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Featured Benefits</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredBenefits.map(benefit => (
              <div key={benefit.id} className="p-4 bg-warm-gold bg-opacity-10 border border-warm-gold rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{getCategoryIcon(benefit.category)}</span>
                  <h4 className="font-semibold text-charcoal">{benefit.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">{benefit.description}</p>
                <div className="text-sm">
                  <p className="text-warm-gold font-medium">{benefit.discount}</p>
                  <p className="text-gray-500">by {benefit.provider}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-warm-gold text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 lg:max-w-md">
            <input
              type="text"
              placeholder="Search benefits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      {filteredBenefits.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">
            No benefits found
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No benefits match "${searchTerm}"`
              : 'No benefits available in this category'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBenefits.map(benefit => (
            <div key={benefit.id} className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getCategoryIcon(benefit.category)}</span>
                    <div>
                      <h3 className="font-semibold text-charcoal">{benefit.title}</h3>
                      {benefit.featured && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-warm-gold text-white rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {benefit.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Provider:</span>
                    <span className="text-sm font-medium text-charcoal">{benefit.provider}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="text-sm font-medium text-green-600">{benefit.discount}</span>
                  </div>
                  {benefit.validUntil && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valid Until:</span>
                      <span className="text-sm font-medium text-orange-600">
                        {new Date(benefit.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4 text-sm">
                  {benefit.website && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <span>🌐</span>
                      <span>Website available</span>
                    </div>
                  )}
                  {benefit.phone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span>📞</span>
                      <span>{benefit.phone}</span>
                    </div>
                  )}
                  {benefit.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span>📧</span>
                      <span>{benefit.email}</span>
                    </div>
                  )}
                  {benefit.location && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span>📍</span>
                      <span>{benefit.location}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleContact(benefit)}
                    className="btn btn-primary flex-1"
                    disabled={!benefit.website && !benefit.phone && !benefit.email}
                  >
                    <span className="mr-2">📞</span>
                    Contact
                  </button>
                  <button className="btn btn-outline">
                    <span>ℹ️</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How to Use Benefits */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">How to Use Your Benefits</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-4xl mb-3">1️⃣</div>
              <h4 className="font-medium text-charcoal mb-2">Browse Benefits</h4>
              <p className="text-sm text-gray-600">
                Explore available benefits by category or search for specific services
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-3">2️⃣</div>
              <h4 className="font-medium text-charcoal mb-2">Contact Provider</h4>
              <p className="text-sm text-gray-600">
                Use the contact information to reach out to the benefit provider
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl mb-3">3️⃣</div>
              <h4 className="font-medium text-charcoal mb-2">Show Employee ID</h4>
              <p className="text-sm text-gray-600">
                Present your employee ID to receive the discount or benefit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Benefits Summary</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {categories.slice(1).map(category => {
              const count = benefits.filter(b => b.category === category.value).length;
              return (
                <div key={category.value} className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">{category.icon}</div>
                  <p className="text-sm text-gray-600 mb-1">{category.label}</p>
                  <p className="text-lg font-bold text-charcoal">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenefitsPage;