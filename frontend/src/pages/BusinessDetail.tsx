import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { businessAPI } from '../services/api';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Tag,
  Users,
  Calendar,
  Star,
  Briefcase,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ExternalLink
} from 'lucide-react';

interface Business {
  _id: string;
  name: string;
  category?: string;
  industry?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags?: string[];
  products?: string[];
  services?: string[];
  employees?: number;
  yearFounded?: number;
  revenue?: number;
  rating?: number;
  verified?: boolean;
  featured?: boolean;
  logo?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  createdAt?: string;
}

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadBusiness();
    }
  }, [id]);

  const loadBusiness = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await businessAPI.getBusiness(id);
      if (response.data.success) {
        setBusiness(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load business');
      }
    } catch (err: any) {
      console.error('Error loading business:', err);
      setError(err.response?.data?.message || 'Failed to load business');
    } finally {
      setLoading(false);
    }
  };

  const getBusinessAddress = (business: Business): string => {
    if (!business.address) return 'Address not available';
    const parts = [
      business.address.street,
      business.address.city,
      business.address.state,
      business.address.zipCode,
    ].filter(Boolean);
    return parts.join(', ') || 'Address not available';
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The business you are looking for does not exist.'}</p>
          <Link
            to="/businesses"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Business Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/businesses"
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Business Directory
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                {business.verified && (
                  <div className="relative group">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Verified Business
                    </span>
                  </div>
                )}
                {business.featured && (
                  <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded">
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {business.category && (
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    {business.category}
                  </div>
                )}
                {business.industry && (
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    {business.industry}
                  </div>
                )}
                {business.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    {business.rating.toFixed(1)}/5.0
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {business.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{business.description}</p>
              </div>
            )}

            {/* Products */}
            {business.products && business.products.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Products</h2>
                <div className="flex flex-wrap gap-2">
                  {business.products.map((product, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {business.services && business.services.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {business.services.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {business.tags && business.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {business.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                {business.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-gray-900 font-medium">Address</p>
                      <p className="text-gray-600">{getBusinessAddress(business)}</p>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-900 font-medium">Phone</p>
                      <a
                        href={`tel:${business.phone}`}
                        className="text-green-600 hover:text-green-700"
                      >
                        {business.phone}
                      </a>
                    </div>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-900 font-medium">Email</p>
                      <a
                        href={`mailto:${business.email}`}
                        className="text-green-600 hover:text-green-700"
                      >
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                {business.website && (
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-900 font-medium">Website</p>
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 flex items-center"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="space-y-4">
                {business.yearFounded && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-600 text-sm">Founded</p>
                      <p className="text-gray-900 font-medium">{business.yearFounded}</p>
                    </div>
                  </div>
                )}

                {business.employees && (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-600 text-sm">Employees</p>
                      <p className="text-gray-900 font-medium">{business.employees.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {business.revenue && (
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-600 text-sm">Revenue</p>
                      <p className="text-gray-900 font-medium">{formatCurrency(business.revenue)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media */}
            {business.socialMedia && (
              (business.socialMedia.facebook ||
               business.socialMedia.twitter ||
               business.socialMedia.instagram ||
               business.socialMedia.linkedin) && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Follow Us</h2>
                  <div className="flex flex-wrap gap-3">
                    {business.socialMedia.facebook && (
                      <a
                        href={`https://facebook.com/${business.socialMedia.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </a>
                    )}
                    {business.socialMedia.twitter && (
                      <a
                        href={`https://twitter.com/${business.socialMedia.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                      >
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    )}
                    {business.socialMedia.instagram && (
                      <a
                        href={`https://instagram.com/${business.socialMedia.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram
                      </a>
                    )}
                    {business.socialMedia.linkedin && (
                      <a
                        href={`https://linkedin.com/company/${business.socialMedia.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;

