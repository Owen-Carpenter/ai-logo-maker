'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/generate/Sidebar';
import Link from 'next/link';
import Loading from '../../../components/ui/Loading';
import SubscriptionGate from '../../../components/SubscriptionGate';
import SmartGenerateLink from '../../../components/SmartGenerateLink';
import Footer from '../../../components/Footer';
import { generateFileName, downloadPNGImage } from '../../../lib/download-utils';

interface SavedLogo {
  id: string;
  name: string;
  image_url: string;
  prompt?: string;
  style?: string;
  color?: string;
  created_at: string;
  tags: string[];
  format: 'PNG' | 'SVG' | 'ICO';
  is_favorite: boolean;
}

export default function LibraryPage() {
  const { user, hasActiveSubscription, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedLogos, setSavedLogos] = useState<SavedLogo[]>([]);
  const [isLoadingLogos, setIsLoadingLogos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logoToDelete, setLogoToDelete] = useState<SavedLogo | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<SavedLogo | null>(null);
  const [showContent, setShowContent] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch logos from database (only once on mount)
  useEffect(() => {
    if (hasActiveSubscription && user) {
      fetchLogos();
    }
  }, [hasActiveSubscription, user]);

  const fetchLogos = async () => {
    setIsLoadingLogos(true);
    setError(null);
    
    try {
      const response = await fetch('/api/icons');
      
      if (response.ok) {
        const data = await response.json();
        setSavedLogos(data.icons || []);
      } else {
        throw new Error('Failed to fetch logos');
      }
    } catch (error) {
      console.error('Error fetching logos:', error);
      setError('Failed to load your logos. Please try again.');
      // Don't set mock data on error - let the error state display
      setSavedLogos([]);
    } finally {
      setIsLoadingLogos(false);
    }
  };

  const filteredLogos = savedLogos.filter(logo => {
    const matchesSearch = logo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         logo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleDownload = async (logo: SavedLogo) => {
    try {
      // Always download as PNG from the image URL
      const fileName = generateFileName(logo.name, 'png');
      await downloadPNGImage(logo.image_url, fileName);
    } catch (error) {
      console.error('Error downloading logo:', error);
      alert('Failed to download logo as PNG. Please try again.');
    }
  };

  const openDeleteModal = (logo: SavedLogo) => {
    setLogoToDelete(logo);
    setShowDeleteModal(true);
  };

  const openImageModal = (logo: SavedLogo) => {
    setSelectedLogo(logo);
    setShowImageModal(true);
  };

  const handleDelete = async () => {
    if (!logoToDelete) return;

    try {
      const response = await fetch(`/api/icons/${logoToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the logo from the local state
        setSavedLogos(prevLogos => prevLogos.filter(logo => logo.id !== logoToDelete.id));
        setShowDeleteModal(false);
        setLogoToDelete(null);
      } else {
        throw new Error('Failed to delete logo');
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      alert('Failed to delete logo. Please try again.');
    }
  };

  // Add timeout fallback for loading state
  useEffect(() => {
    if (!loading && !isLoadingLogos) {
      setShowContent(true);
    } else {
      // Show content after 3 seconds even if still loading
      const timer = setTimeout(() => setShowContent(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, isLoadingLogos]);

  if ((loading || isLoadingLogos) && !showContent) {
    return <Loading text="Loading your logo library..." />;
  }

  // Show subscription gate if user doesn't have active subscription
  if (!hasActiveSubscription) {
    return (
      <SubscriptionGate 
        title="Logo Library"
        description="Access your saved logos and manage your collection. A subscription is required to access the logo library."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
      <div className="flex lg:flex-row relative min-h-screen">
        <Sidebar currentPage="library" />
        
        <div className="flex-1 relative lg:ml-16 pb-24">
          {/* Header */}
          <div className="px-6 sm:px-8 lg:px-12 py-8 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
              Logo{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Library</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-neutral-700 mb-8 max-w-2xl mx-auto px-4">
              Manage and organize your collection of saved logos
            </p>
          </div>

          {/* Search and Controls */}
          <div className="px-6 sm:px-8 lg:px-12 mb-8">
            <div className="bg-gradient-to-r from-white to-neutral-50 border border-neutral-200 rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-black/20">
              <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                {/* Search Section */}
                <div className="flex-1 w-full lg:max-w-2xl">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-primary-600/80 group-hover:text-primary-600 transition-colors duration-300 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search your logo collection..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border-2 border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-300 text-lg backdrop-blur-sm hover:bg-midnight-800/90"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sunset-300/60 hover:text-primary-600 transition-colors duration-200 z-10"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium">View:</span>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="flex bg-neutral-100 rounded-2xl border border-neutral-300 p-1 backdrop-blur-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-gradient-to-r from-sunset-500 to-coral-500 text-neutral-900 shadow-lg shadow-sunset-500/25' : 'text-sunset-300/70 hover:text-neutral-600 hover:bg-neutral-100'}`}
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-gradient-to-r from-sunset-500 to-coral-500 text-neutral-900 shadow-lg shadow-sunset-500/25' : 'text-sunset-300/70 hover:text-neutral-600 hover:bg-neutral-100'}`}
                      title="List View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Stats Bar */}
              <div className="mt-6 pt-6 border-t border-midnight-600/30">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-neutral-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="font-medium">{filteredLogos.length} {filteredLogos.length === 1 ? 'Logo' : 'Logos'}</span>
                    </div>
                    {searchTerm && (
                      <div className="flex items-center gap-2 text-primary-600/80">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="font-medium">Filtered by "{searchTerm}"</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sunset-300/60 text-xs">
                    All logos are PNG format
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logos Grid/List */}
          <div className="px-6 sm:px-8 lg:px-12 pb-32">
            {isLoadingLogos ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'space-y-4'}>
                {[...Array(10)].map((_, index) => (
                  <div key={index} className={`bg-white border border-neutral-200 rounded-xl backdrop-blur-sm animate-pulse ${viewMode === 'list' ? 'flex items-center p-4' : 'p-6 flex flex-col'}`}>
                    {viewMode === 'grid' ? (
                      <>
                        <div className="bg-neutral-200 rounded-xl p-4 mb-4 flex items-center justify-center h-24">
                          <div className="w-12 h-12 bg-neutral-300 rounded-lg"></div>
                        </div>
                        <div className="bg-neutral-200 rounded h-4 mb-2 w-3/4"></div>
                        <div className="bg-neutral-200 rounded h-3 mb-4 w-1/2 ml-auto"></div>
                        <div className="flex gap-1 mt-auto">
                          <div className="flex-1 bg-neutral-200 rounded-md h-8"></div>
                          <div className="bg-neutral-200 rounded-md w-8 h-8"></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-neutral-200 rounded-xl p-3 mr-4 w-16 h-16 flex items-center justify-center">
                          <div className="w-8 h-8 bg-neutral-300 rounded-lg"></div>
                        </div>
                        <div className="flex-1">
                          <div className="bg-neutral-200 rounded h-4 w-2/3 mb-2"></div>
                          <div className="bg-neutral-200 rounded h-3 w-1/3"></div>
                        </div>
                        <div className="flex gap-1">
                          <div className="bg-neutral-200 rounded-md h-8 w-24"></div>
                          <div className="bg-neutral-200 rounded-md w-8 h-8"></div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : filteredLogos.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'space-y-4'}>
                {filteredLogos.map((logo) => (
                  <div key={logo.id} className={`bg-white border border-neutral-200 rounded-xl backdrop-blur-sm hover:shadow-xl hover:shadow-primary-500/20 transition-all duration-300 hover:scale-105 hover:border-primary-400 ${viewMode === 'list' ? 'flex items-center p-4' : 'p-6 flex flex-col'}`}>
                    {viewMode === 'grid' ? (
                      <>
                        <div 
                          className="bg-neutral-100 rounded-xl p-4 mb-4 flex items-center justify-center h-24 hover:bg-neutral-200 transition-colors duration-300 cursor-pointer group"
                          onClick={() => openImageModal(logo)}
                        >
                          <img src={logo.image_url} alt={logo.name} className="w-12 h-12 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <h3 className="text-neutral-900 font-semibold mb-2 truncate">{logo.name}</h3>
                        <div className="flex items-center justify-end text-xs text-neutral-600 mb-4">
                          <span>{new Date(logo.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-1 mt-auto">
                          <button
                            onClick={() => handleDownload(logo)}
                            className="flex-1 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-neutral-900 text-xs py-1.5 px-2 rounded-md transition-all duration-300 font-medium flex items-center justify-center gap-1 min-w-0 sm:py-2 sm:px-3 sm:rounded-lg"
                          >
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate hidden sm:inline">Download PNG</span>
                            <span className="truncate sm:hidden">PNG</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(logo)}
                            className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-neutral-900 text-xs py-1.5 px-2 rounded-md transition-all duration-300 flex items-center justify-center flex-shrink-0 sm:py-2 sm:px-3 sm:rounded-lg"
                            title="Delete Logo"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div 
                          className="bg-neutral-100 rounded-xl p-3 mr-4 flex items-center justify-center cursor-pointer group hover:bg-neutral-200 transition-colors duration-300"
                          onClick={() => openImageModal(logo)}
                        >
                          <img src={logo.image_url} alt={logo.name} className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-neutral-900 font-semibold">{logo.name}</h3>
                          <div className="flex items-center gap-4 text-xs text-neutral-600 mt-1">
                            <span>{new Date(logo.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDownload(logo)}
                            className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-neutral-900 text-xs py-1.5 px-2 rounded-md transition-all duration-300 font-medium flex items-center gap-1 sm:text-sm sm:py-2 sm:px-4 sm:rounded-lg"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="hidden sm:inline">Download PNG</span>
                            <span className="sm:hidden">PNG</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(logo)}
                            className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-neutral-900 text-xs py-1.5 px-2 rounded-md transition-all duration-300 flex items-center justify-center sm:text-sm sm:py-2 sm:px-3 sm:rounded-lg"
                            title="Delete Logo"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="bg-white border border-red-200 rounded-2xl p-12 max-w-md mx-auto backdrop-blur-sm">
                  <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-neutral-900 text-xl font-semibold mb-3">Error Loading Logos</h3>
                  <p className="text-neutral-600 mb-8 leading-relaxed">{error}</p>
                  <button
                    onClick={fetchLogos}
                    className="inline-flex items-center bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-neutral-900 px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white border border-neutral-200 rounded-2xl p-12 max-w-md mx-auto backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-neutral-900 text-xl font-semibold mb-3">No logos found</h3>
                  <p className="text-neutral-600 mb-8 leading-relaxed">
                    {searchTerm 
                      ? 'Try adjusting your search to find what you\'re looking for'
                      : 'Start creating logos to build your personal library'
                    }
                  </p>
                  <SmartGenerateLink 
                    className="inline-flex items-center bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-neutral-900 px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <span className="mr-2">🎨</span>
                    Create Your First Logo
                  </SmartGenerateLink>
                  </div>
                </div>
              )}
            </div>
                  </div>
      </div>
      
      {/* Footer positioned at bottom */}
      <Footer />


      {/* Image Preview Modal */}
      {showImageModal && selectedLogo && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowImageModal(false);
            setSelectedLogo(null);
          }}
        >
          <div 
            className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl border border-neutral-200 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900">{selectedLogo.name}</h3>
                  <p className="text-neutral-600 text-sm">Created {new Date(selectedLogo.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedLogo(null);
                }}
                className="text-gray-400 hover:text-neutral-900 transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-neutral-100 rounded-xl p-8 mb-6 flex items-center justify-center min-h-[300px]">
              <img 
                src={selectedLogo.image_url} 
                alt={selectedLogo.name} 
                className="max-w-full max-h-[400px] object-contain"
              />
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDownload(selectedLogo)}
                className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-neutral-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PNG
              </button>
              <button
                onClick={() => openDeleteModal(selectedLogo)}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-neutral-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && logoToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl border border-neutral-200 p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Delete Logo</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-neutral-900">"{logoToDelete.name}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setLogoToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-neutral-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-neutral-900 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 