import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../../utils/axios";
import { useNavigate } from "react-router-dom";
import useCartStore from "../../../stores/cartStore"; // Import the cart store

const Productitem = forwardRef(({ onLoadingChange }, ref) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(20); // Start with 20 items
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Get cart functions from the store
  const { cartItems, increaseItemQuantity } = useCartStore();

  // Ensure price is a valid number and format it
  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  // Calculate discounted price safely
  const calculateDiscountedPrice = (price, discountPercentage) => {
    const numPrice = parseFloat(price);
    const numDiscount = parseFloat(discountPercentage);
    if (isNaN(numPrice) || isNaN(numDiscount)) return 0;
    return numPrice * (1 - numDiscount / 100);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (onLoadingChange) onLoadingChange(true);

      // First get total count of products
      const countResponse = await api.get('/products/count');
      const count = countResponse.data.count || 0;
      setTotalCount(count);



      // Fetch products with current limit
      const response = await api.get(`/products/${limit}`);
      const newProducts = response.data;
      console.log(`Loaded ${newProducts.length} products`);

      setProducts(newProducts);

      // FIXED: Compare the current loaded products count with total count
      const moreAvailable = newProducts.length < count;
      console.log(`More products available: ${moreAvailable}`);
      setHasMore(moreAvailable);

    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  // Load initial products and when limit changes
  useEffect(() => {
    fetchProducts();
  }, [limit]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    loadMore: () => {
      console.log("loadMore called, current limit:", limit);
      if (!loading) {
        setLimit(prevLimit => prevLimit + 20);
      }
    },
    hasMore: hasMore,
    totalCount: totalCount,
    loadedCount: products.length
  }), [hasMore, loading, limit, products.length, totalCount]);

  const handleProductClick = (productId) => {
    navigate(`/singleproduct/${productId}`);
  };

  const handleAddToCart = async (productId, e) => {
    if (e) e.stopPropagation();

    try {
      const existingCartId = localStorage.getItem("jcreations_cart_id");
      const payload = {
        product_id: productId,
        quantity: 1
      };
      if (existingCartId) {
        payload.cart_id = existingCartId;
      }

      // First, check if the item is already in the cart
      const existingItem = cartItems.find(item => item.product_id === productId);
      
      if (existingItem) {
        // If item exists, just increase the quantity
        increaseItemQuantity(existingItem.id);
      } else {
        // If not in cart, add via API and then update local state
        const response = await api.post("/cart/items", payload);
        if (response.data && response.data.cart_id) {
          localStorage.setItem("jcreations_cart_id", response.data.cart_id);
          
          // After API success, update local cart state
          // We'll need to fetch the cart to get the new item with correct ID
          const { fetchCart } = useCartStore.getState();
          await fetchCart();
        }
      }

      toast.success("Added to cart successfully");
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error(err.response?.data?.message || "Failed to add item to cart");
    }
  };

  if (loading && products.length === 0) return <div className="col-span-2 text-center">Loading products...</div>;
  if (error) return <div className="col-span-2 text-center">Error: {error}</div>;

  return (
      <>
        {products.map((product) => (
            <motion.div
                key={product.id}
                className="bg-white rounded-2xl border-2 border-[#F0F0F0] overflow-hidden flex cursor-pointer"
                whileHover={{
                  scale: 1.01,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
                }}
                transition={{ duration: 0.3 }}
                onClick={() => handleProductClick(product.id)}
            >
              <div className="relative w-1/3">
                {/* Only show discount tag for in-stock products with discounts */}
                {product.discount_percentage > 0 && product.status === "in_stock" && (
                    <motion.div
                        className="absolute top-0 left-0 bg-[#F7A313] text-white py-1 px-6 rounded-br-2xl text-sm w-full text-center font-semibold"
                        whileHover={{
                          backgroundColor: "#e69200",
                          y: [0, -2, 0],
                        }}
                        transition={{ duration: 0.5 }}
                    >
                      {product.discount_percentage}% OFF
                    </motion.div>
                )}

                {/* Show Out of Stock tag when product is unavailable */}
                {product.status !== "in_stock" && (
                    <motion.div
                        className="absolute top-0 left-0 z-50 bg-gray-500 text-white py-1 px-6 rounded-br-2xl text-sm w-full text-center font-semibold"
                        whileHover={{
                          backgroundColor: "#3a3a3a",
                          y: [0, -2, 0],
                        }}
                        transition={{ duration: 0.5 }}
                    >
                      Out of Stock
                    </motion.div>
                )}

                <div className="w-full h-full flex justify-center items-center">
                  <motion.img
                      src={`${import.meta.env.VITE_STORAGE_URL}/${product.images[0]}`}
                      alt={product.name}
                      className={`lg:w-full lg:h-[175px] w-full h-full object-cover rounded-2xl p-1 ${product.status !== "in_stock" ? 'opacity-70' : ''}`}           
                      transition={{ type: "spring", stiffness: 300 }}
                  />
                </div>
              </div>

              <div className="p-4 w-2/3">
                <motion.h2
                    className="lg:text-xl font-semibold text-gray-800 mb-2"
                    whileHover={{ color: "#F7A313" }}
                    transition={{ duration: 0.2 }}
                >
                  {product.name}
                </motion.h2>
                <p className="text-[#A5A0A0] text-sm mb-2 text-[10px]">
                  {product.description && (product.description.length > 100 ? product.description.slice(0, 100) + "..." : product.description)}
                </p>

                {/* Product Status Field */}
                <div className="mb-2 flex items-center">

                  {product.status === "in_stock" ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  In Stock
                </span>
                  ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  Out of Stock
                </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <motion.div
                      className="flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                  >
                    {product.discount_percentage > 0 ? (
                        <>
                          <p className="text-[#F7A313] lg:text-lg font-semibold">
                            Rs.{formatPrice(calculateDiscountedPrice(product.price, product.discount_percentage))}
                          </p>
                          <p className="text-[#A5A0A0] text-[10px] line-through">
                            Rs.{formatPrice(product.price)}
                          </p>
                        </>
                    ) : (
                        <p className="text-[#F7A313] lg:text-lg font-semibold">
                          Rs.{formatPrice(product.price)}
                        </p>
                    )}
                  </motion.div>

                  {/* Disable Add to Cart button for out-of-stock products */}
                  <motion.button
                      className={`${product.status === "in_stock" ? 'bg-[#F7A313] hover:bg-yellow-600' : 'bg-gray-400 cursor-not-allowed'} text-white font-bold p-2 rounded-full`}
                      whileHover={{
                        scale: product.status === "in_stock" ? 1.1 : 1,
                        backgroundColor: product.status === "in_stock" ? "#e69200" : undefined,
                      }}
                      whileTap={{ scale: product.status === "in_stock" ? 0.95 : 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => product.status === "in_stock" && handleAddToCart(product.id, e)}
                  >
                    <img
                        src="/bottomicon/cart.svg"
                        alt="Add to cart"
                        className="lg:w-6 lg:h-6 w-4 h-4"
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>
        ))}
        {loading && <div className="col-span-2 text-center mt-4 lg:block hidden">Loading more products...</div>}
      </>
  );
});

export default Productitem;