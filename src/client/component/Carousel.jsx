import React, { useState, useEffect } from 'react';

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    { src: "/cake.jpg", alt: "Cake" },
    { src: "/orderimo.webp", alt: "Order" },
    { src: "/pngtree-chocolate-cake-png-image_17407867.png", alt: "Chocolate Cake" }
  ];

  // Auto-advance slides (only for mobile)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto mt-10 mb-10">
      
      {/* Mobile View - Carousel */}
      <div className="block md:hidden">
        <div className="relative h-56 overflow-hidden rounded-lg mx-5">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.src}
                className="absolute block w-full h-full object-cover"
                alt={slide.alt}
              />
            </div>
          ))}
        </div>

        {/* Slider indicators - Mobile only */}
        <div className="flex justify-center mt-4 space-x-3">
          {slides.map((_, index) => (
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
      <div className="hidden md:grid grid-cols-3 gap-6 h-64">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={slide.src}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                alt={slide.alt}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
