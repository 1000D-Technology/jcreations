import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const CartItem = ({ item, onRemove, onIncreaseQuantity, onDecreaseQuantity, onWishUpdate, isRemoving }) => {
  const [wishText, setWishText] = useState(item.wish || "");

  // Debounce function to update wish text
  const debounceWishUpdate = useCallback(
    (text) => {
      const timeoutId = setTimeout(() => {
        if (onWishUpdate && text !== item.wish) {
          onWishUpdate(item.id, text);
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(timeoutId);
    },
    [item.id, item.wish, onWishUpdate]
  );

  // Update wish text when it changes with debounce
  useEffect(() => {
    if (wishText !== item.wish) {
      const cleanup = debounceWishUpdate(wishText);
      return cleanup;
    }
  }, [wishText, debounceWishUpdate, item.wish]);

  // Update local state when item.wish changes (from API)
  useEffect(() => {
    setWishText(item.wish || "");
  }, [item.wish]);

  // Helper function to safely format price
  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  return (
      <motion.div
          className={`relative flex flex-col bg-white border border-gray-300 rounded-lg p-4 mb-4 ${
              isRemoving ? "opacity-50 scale-95" : "opacity-100 scale-100"
          } transition-all duration-300`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
      >
        {/* Remove Button */}
        <button
            onClick={() => onRemove(item.id)}
            className="absolute top-4 right-4"
            aria-label="Remove item"
        >
          <img
              src="/bottomicon/remove.png"
              alt="Remove item"
              className="h-5 w-5 sm:h-6 sm:w-6 hover:opacity-80"
          />
        </button>

        {/* Product Image and Details */}
        <div className="flex">
          {/* Left: Product Image */}
          <img
              src={item.image}
              alt={item.name}
              className="h-16 w-16 lg:h-24 lg:w-24  object-cover rounded-md"
          />

          {/* Right: Product Details and Bottom Controls */}
          <div className="ml-4 flex flex-col flex-grow">
            {/* Product Details */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-800">{item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name}</h3>
              
              {/* Price Display - Show discount if applicable */}
              {item.discount_percentage > 0 ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm text-gray-600">
                      {item.quantity} x
                    </p>
                    <span className="">
                    Rs.{formatPrice(item.effectivePrice)}
                  </span>
                    <span className="text-gray-400 line-through text-xs">
                    Rs.{formatPrice(item.price)}
                  </span>
                  </div>
              ) : (
                  <p className="text-xs sm:text-sm text-gray-600">
                    {item.quantity} x Rs.{formatPrice(item.price)}
                  </p>
              )}
            </div>            {/* Wish Text Input for Cakes */}
            {item.category_id === 1 && (
              <div className="mt-3 bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-amber-100 rounded-full">
                    <span className="text-amber-600 text-sm">✨</span>
                  </div>
                  <label className="text-sm font-medium text-amber-800">
                    Add your special message
                  </label>
                </div>
                
                <div className="relative">
                  <textarea
                    placeholder="Make this cake extra special with your personal message... 🎂"
                    value={wishText}
                    onChange={(e) => setWishText(e.target.value)}
                    className="w-full text-sm border-2 border-amber-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder:text-amber-400/70"
                    maxLength={item.character_count > 0 ? item.character_count : 100}
                    rows="2"
                  />
                  
                  {/* Floating character count */}
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
                    <span className={`text-xs font-medium transition-colors ${
                      item.character_count > 0 && wishText.length > item.character_count * 0.8 
                        ? 'text-amber-600' 
                        : 'text-gray-500'
                    }`}>
                      {wishText.length}{item.character_count > 0 ? `/${item.character_count}` : ''}
                    </span>
                  </div>
                </div>

                {/* Status indicators */}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    {wishText.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <span>✓</span>
                        <span>Message added</span>
                      </div>
                    )}
                    {item.character_count > 0 && wishText.length > item.character_count * 0.9 && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <span>⚠</span>
                        <span>{item.character_count - wishText.length} left</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Auto-save indicator */}
                  {wishText !== item.wish && wishText.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Auto-saving...</span>
                    </div>
                  )}
                </div>

                {/* Quick suggestions for empty state */}
                {wishText.length === 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-amber-600 mb-1">Quick suggestions:</span>
                    {['Happy Birthday! 🎉', 'Congratulations! 🎊', 'With Love ❤️'].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setWishText(suggestion)}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-1 rounded-full transition-colors duration-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Row: Total Price and Quantity Controls */}
            <div className="flex justify-between items-center mt-3">
              {/* Total Price */}
              <div className="text-base sm:text-lg font-semibold text-amber-500">
                LKR.{formatPrice(parseFloat(item.effectivePrice || item.price || 0) * item.quantity)}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center">
                <button
                    onClick={() => onDecreaseQuantity(item.id)}
                    disabled={item.quantity <= 1}
                    className="w-5 h-5 rounded-full bg-black hover:bg-gray-200 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-base sm:text-lg font-bold">-</span>
                </button>
                <span className="mx-2 sm:mx-3 text-base sm:text-lg font-medium">{item.quantity}</span>
                <button
                    onClick={() => onIncreaseQuantity(item.id)}
                    className="w-5 h-5 rounded-full bg-amber-500 hover:bg-gray-200 flex items-center justify-center text-gray-700"
                >
                  <span className="text-base sm:text-lg font-bold">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
  );
};

export default CartItem;