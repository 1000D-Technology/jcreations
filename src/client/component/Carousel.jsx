import React, { useState, useEffect } from 'react';
import { enhancedAPI } from '../../utils/apiHelpers.js';

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch featured banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response = await enhancedAPI.get('/featured-banners');
        
        // Filter only active banners
        const activeBanners = response.data.filter(banner => banner.is_active);
        setBanners(activeBanners);
        setError(null);
      } catch (err) {
        console.error('Error fetching featured banners:', err);
        setError(err);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto-advance slides (only for mobile and when we have banners)
  useEffect(() => {
    if (banners.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleBannerClick = (banner) => {
    if (banner.link) {
      window.open(banner.link, '_blank');
    }
  };

  // Don't render component if loading, error, or no banners
  if (loading) {
    return null; // or you could return a loading skeleton
  }

  if (error || banners.length === 0) {
    return null; // Don't render component if no banners
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto mt-10 mb-10">
      
      {/* Mobile View - Carousel */}
      <div className="block md:hidden">
        <div className="relative h-56 overflow-hidden rounded-lg">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={() => handleBannerClick(banner)}
            >
              <img
                src={`${import.meta.env.VITE_API_URL}/storage/${banner.image_path}`}
                className="absolute block w-full h-full object-cover"
                alt={banner.title || 'Featured Banner'}
              />
              {/* Banner content overlay */}
              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <div className="absolute bottom-4 left-4 text-white">
                    {banner.title && (
                      <h3 className="text-lg font-semibold mb-1">{banner.title}</h3>
                    )}
                    {banner.subtitle && (
                      <p className="text-sm opacity-90">{banner.subtitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Slider indicators - Mobile only */}
        <div className="flex justify-center mt-4 space-x-3">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-current={index === currentSlide}
              aria-label={`Slide ${index + 1}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Desktop View - Horizontal Grid */}
      <div className="hidden md:grid grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
            onClick={() => handleBannerClick(banner)}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={`${import.meta.env.VITE_API_URL}/storage/${banner.image_path}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                alt={banner.title || 'Featured Banner'}
              />
            </div>
            {/* Banner content overlay */}
            {(banner.title || banner.subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <div className="absolute bottom-4 left-4 text-white">
                  {banner.title && (
                    <h3 className="text-lg font-semibold mb-1">{banner.title}</h3>
                  )}
                  {banner.subtitle && (
                    <p className="text-sm opacity-90">{banner.subtitle}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
