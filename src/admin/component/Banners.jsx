import React, {useEffect, useState} from 'react';
import { FaTrash } from 'react-icons/fa';
import { FiUpload } from 'react-icons/fi';
import api from '../../utils/axios.js';
import toast, { Toaster } from 'react-hot-toast';

const Banners = () => {
  const [newBannerFile, setNewBannerFile] = useState(null);
  const [newBannerPreview, setNewBannerPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentBanners, setCurrentBanners] = useState({ mobile: null, desktop: null });
  const [featuredBanners, setFeaturedBanners] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [bannerForm, setBannerForm] = useState({
    type: 'mobile',
    title: '',
    subtitle: '',
    link: ''
  });

  const storageUrl = import.meta.env.VITE_STORAGE_URL;
  // Fetch current banners
  useEffect(() => {
    const fetchCurrentBanners = async () => {
      setFetchLoading(true);
      try {
        const response = await api.get('/banner');
        if (response.status === 200 && response.data) {
          setCurrentBanners(response.data);
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
      } finally {
        setFetchLoading(false);
      }
    };

    const fetchFeaturedBanners = async () => {
      try {
        const response = await api.get('/featured-banners');
        if (response.status === 200 && response.data) {
          setFeaturedBanners(response.data);
        }
      } catch (err) {
        console.error('Error fetching featured banners:', err);
      }
    };

    fetchCurrentBanners();
    fetchFeaturedBanners();
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = `${currentDateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | ${currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;

  // Get appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }

      setNewBannerFile(file);
      setNewBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }

      setNewBannerFile(file);
      setNewBannerPreview(URL.createObjectURL(file));
    }
  };
  const handleCancel = () => {
    setNewBannerFile(null);
    setNewBannerPreview(null);
    setError(null);
    setBannerForm({
      type: 'mobile',
      title: '',
      subtitle: '',
      link: ''
    });
  };

  const toggleBannerStatus = async (bannerId, currentStatus) => {
    try {
      // Using the same API pattern for mobile/desktop banners
      const response = await api.patch(`/admin/banner/${bannerId}/toggle`, {
        is_active: !currentStatus
      });
      
      if (response.status === 200) {
        toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        // Refresh featured banners
        const featuredResponse = await api.get('/featured-banners');
        if (featuredResponse.status === 200 && featuredResponse.data) {
          setFeaturedBanners(featuredResponse.data);
        }
      }
    } catch (err) {
      console.error('Error toggling banner status:', err);
      toast.error('Failed to update banner status');
    }
  };

  const deleteFeaturedBanner = async (bannerId) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        // Using admin endpoint for featured banner deletion
        const response = await api.delete(`/admin/banner/featured/${bannerId}`);
        
        if (response.status === 200) {
          toast.success('Banner deleted successfully');
          // Refresh featured banners
          const featuredResponse = await api.get('/featured-banners');
          if (featuredResponse.status === 200 && featuredResponse.data) {
            setFeaturedBanners(featuredResponse.data);
          }
        }
      } catch (err) {
        console.error('Error deleting banner:', err);
        toast.error('Failed to delete banner');
      }
    }
  };
  const validateForm = () => {
    if (!newBannerFile) {
      toast.error('Please select a banner image');
      return false;
    }
    if (!bannerForm.title.trim()) {
      toast.error('Please enter a banner title');
      return false;
    }
    return true;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('image', newBannerFile);
    formData.append('type', bannerForm.type);
    formData.append('title', bannerForm.title);
    formData.append('subtitle', bannerForm.subtitle);
    formData.append('link', bannerForm.link);

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/admin/banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Banner uploaded successfully');

        // Refresh banners after successful upload
        if (bannerForm.type === 'featured') {
          const featuredResponse = await api.get('/featured-banners');
          if (featuredResponse.status === 200 && featuredResponse.data) {
            setFeaturedBanners(featuredResponse.data);
          }
        } else {
          const bannerResponse = await api.get('/banner');
          if (bannerResponse.status === 200 && bannerResponse.data) {
            setCurrentBanners(bannerResponse.data);
          }
        }

        handleCancel();
      } else {
        throw new Error('Failed to upload banner');
      }
    } catch (err) {
      console.error('Error uploading banner:', err);
      const errorMessage = err.response?.data?.message || 'Failed to upload banner';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex flex-col h-screen">
        <Toaster position="top-right" />
        {/* Fixed header section */}
        <div className="bg-[#F2EFE7] w-full pb-6 px-6 pt-6 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 pt-6 mb-6">
            <h2 className="text-2xl font-semibold text-[#333333] mt-[-10px] ml-[-20px]">Banners</h2>
            <span className="text-sm text-gray-500 mt-[-10px] absolute right-8">
            {formattedDateTime} | {getGreeting()}
          </span>
          </div>
        </div>        {/* Scrollable content section */}
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="mt-6">
            <h3 className="mb-3 px-6 text-lg font-light text-[#333333]">Current Banners</h3>

            {/* Current Banners Display */}
            <div className="px-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mobile Banner */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Mobile Banner</h4>
                  <div className="relative rounded-lg overflow-hidden w-full">
                    {fetchLoading ? (
                        <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">Loading banner...</p>
                        </div>
                    ) : currentBanners.mobile ? (
                        <div className="relative">
                          <img
                              src={`${storageUrl}/${currentBanners.mobile.image_path}`}
                              alt="Mobile Banner"
                              className="w-full h-auto rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/hero/home back.webp";
                                toast.error("Failed to load mobile banner image");
                              }}
                          />
                          {currentBanners.mobile.title && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                                <p className="font-medium text-sm">{currentBanners.mobile.title}</p>
                                {currentBanners.mobile.subtitle && (
                                    <p className="text-xs text-gray-300">{currentBanners.mobile.subtitle}</p>
                                )}
                              </div>
                          )}
                        </div>
                    ) : (
                        <div className="relative">
                          <img
                              src="/hero/home back.webp"
                              alt="Default Mobile Banner"
                              className="w-full h-auto rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                            <p className="text-white text-sm">No mobile banner available</p>
                          </div>
                        </div>
                    )}
                  </div>
                </div>

                {/* Desktop Banner */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Desktop Banner</h4>
                  <div className="relative rounded-lg overflow-hidden w-full">
                    {fetchLoading ? (
                        <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">Loading banner...</p>
                        </div>
                    ) : currentBanners.desktop ? (
                        <div className="relative">
                          <img
                              src={`${storageUrl}/${currentBanners.desktop.image_path}`}
                              alt="Desktop Banner"
                              className="w-full h-auto rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/hero/home back.webp";
                                toast.error("Failed to load desktop banner image");
                              }}
                          />
                          {currentBanners.desktop.title && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                                <p className="font-medium text-sm">{currentBanners.desktop.title}</p>
                                {currentBanners.desktop.subtitle && (
                                    <p className="text-xs text-gray-300">{currentBanners.desktop.subtitle}</p>
                                )}
                              </div>
                          )}
                        </div>
                    ) : (
                        <div className="relative">
                          <img
                              src="/hero/home back.webp"
                              alt="Default Desktop Banner"
                              className="w-full h-auto rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                            <p className="text-white text-sm">No desktop banner available</p>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Banners Display */}
            <div className="px-6 mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                Featured Banners 
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {featuredBanners.length} total
                </span>
              </h4>
              
              {featuredBanners.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No featured banners</h3>
                  <p className="text-gray-500">Add your first featured banner to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredBanners.map((banner) => (
                    <div key={banner.id} className="bg-white rounded-lg shadow-md overflow-hidden border">
                      <div className="relative">
                        <img
                          src={`${storageUrl}/${banner.image_path}`}
                          alt={banner.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/hero/home back.webp";
                          }}
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            banner.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {banner.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button
                            onClick={() => deleteFeaturedBanner(banner.id)}
                            className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs"
                            title="Delete"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Banner Info */}
                      <div className="p-4">
                        <h5 className="font-semibold text-gray-900 mb-1 truncate">{banner.title}</h5>
                        {banner.subtitle && (
                          <p className="text-sm text-gray-600 mb-2 truncate">{banner.subtitle}</p>
                        )}
                        
                        {/* Metadata */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Created: {new Date(banner.created_at).toLocaleDateString()}
                          </p>
                          {banner.updated_at !== banner.created_at && (
                            <p className="text-xs text-gray-500">
                              Updated: {new Date(banner.updated_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h3 className="mb-3 px-6 text-lg font-light text-[#333333]">Upload New Banner</h3>

            {/* Banner Form */}
            <div className="px-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Banner Type */}
                <div>
                  <label htmlFor="banner-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Type
                  </label>
                  <select
                      id="banner-type"
                      value={bannerForm.type}
                      onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="mobile">Mobile</option>
                    <option value="desktop">Desktop</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>

                {/* Banner Title */}
                <div>
                  <label htmlFor="banner-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                      type="text"
                      id="banner-title"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="Enter banner title"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Banner Subtitle */}
                <div>
                  <label htmlFor="banner-subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                      type="text"
                      id="banner-subtitle"
                      value={bannerForm.subtitle}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      placeholder="Enter banner subtitle"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Banner Link */}
                <div>
                  <label htmlFor="banner-link" className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL
                  </label>
                  <input
                      type="url"
                      id="banner-link"
                      value={bannerForm.link}
                      onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>            {/* Upload New Banner Section */}
            <div className="px-6 mb-6">
              <div
                  className={`border-2 border-dashed ${newBannerPreview ? 'border-green-300' : 'border-gray-300'} rounded-lg p-8 flex flex-col items-center justify-center w-full ${newBannerPreview ? 'h-auto' : 'h-36'}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
              >
                {newBannerPreview ? (
                    <div className="w-full relative max-w-md">
                      <img
                          src={newBannerPreview}
                          alt="New Banner Preview"
                          className="w-full h-auto rounded-lg"
                      />
                      <button
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                          onClick={() => {
                            setNewBannerFile(null);
                            setNewBannerPreview(null);
                          }}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                ) : (
                    <>
                      <input
                          type="file"
                          id="banner-upload"
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*"
                      />
                      <label htmlFor="banner-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <FiUpload size={42} className="text-gray-400 mb-2" />
                          <p className="text-sm text-gray-700 font-medium">Drag and drop your new banner</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {bannerForm.type === 'mobile' && 'Recommended: Mobile (375x200px) - Max 2MB'}
                            {bannerForm.type === 'desktop' && 'Recommended: Desktop (1200x400px) - Max 2MB'}
                            {bannerForm.type === 'featured' && 'Recommended: Featured (800x600px) - Max 2MB'}
                          </p>
                        </div>
                      </label>
                    </>
                )}
              </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="px-6 mb-4">
                  <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 mt-4 flex">
              <button
                  className="border border-gray-300 rounded-lg px-6 py-2 mr-3 font-medium hover:bg-gray-50 transition-colors"
                  onClick={handleCancel}
                  disabled={loading}
              >
                Cancel
              </button>
              <button
                  className="bg-black text-white rounded-lg px-8 py-2 font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={loading}
              >
                {loading ? 'Uploading...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Banners;