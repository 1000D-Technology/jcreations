import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMdClose } from 'react-icons/io';
import api from "../../utils/axios.js";
import { useNavigate, useParams } from 'react-router-dom';
import SearchItem from "./utils/Searchitem.jsx";
import { createPortal } from 'react-dom';
import Categoryitem from "./utils/Categoryitem.jsx";

function SearchByCategory({ isOpen, onClose, initialCategory }) {
    const navigate = useNavigate();
    const params = useParams();
    const categoryFromURL = params.category;

    // Determine if we're in standalone page mode or modal mode
    const isStandalonePage = !!categoryFromURL;

    // UI states
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // Data states
    const [categoryId, setCategoryId] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    // Constants
    const PAGE_SIZE = 20;

    // References
    const isMounted = useRef(true);
    const abortControllerRef = useRef(null);
    const searchStateRef = useRef({
        isSearching: false,
        currentCategoryId: null
    });

    // Set effective category ID based on URL or prop
    useEffect(() => {
        const effectiveId = categoryFromURL || initialCategory;
        if (effectiveId && effectiveId !== categoryId) {
            setCategoryId(effectiveId);
            // Reset products when category changes
            setProducts([]);
        }
    }, [categoryFromURL, initialCategory, categoryId]);

    // Handle back button click
    const handleBack = () => {
        navigate('/');
    };

    // Format product data for consistency
    const formatProductData = useCallback((product) => {
        if (!product) return null;

        return {
            ...product,
            images: Array.isArray(product.images) ? product.images :
                (product.images ? [product.images] : []),
            price: typeof product.price === 'string' ? parseFloat(product.price) :
                (product.price || 0),
            discount_percentage: parseFloat(product.discount_percentage || 0),
            status: product.status || "out_of_stock"
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Fetch category details
    const fetchCategoryDetails = useCallback(async (id) => {
        if (!id) return;

        try {
            const response = await api.get(`/categories/${id}`);
            if (response.data && isMounted.current) {
                setSelectedCategory(response.data);
            }
        } catch (err) {
            console.error("Error fetching category details:", err);
        }
    }, []);

    // Search products function with pagination support
    const searchProducts = useCallback(async (isLoadingMore = false) => {
        // Don't search if already searching or if component is not active
        if (searchStateRef.current.isSearching || (!isOpen && !isStandalonePage)) return;
        if (!categoryId) return;

        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();
        searchStateRef.current.isSearching = true;

        // Set loading state
        if (isLoadingMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            // Only reset products for new searches, not loading more
            if (!isLoadingMore) {
                setProducts([]);
            }
        }
        setError(null);

        try {
            // Build query parameters
            const queryParams = {
                category_id: categoryId
            };

            // Add pagination
            if (isLoadingMore) {
                queryParams.offset = products.length;
            }
            queryParams.limit = PAGE_SIZE;

            console.log("Searching products for category:", categoryId);
            console.log("Query params:", queryParams);

            // Make API request
            const response = await api.get('/products/search', {
                params: queryParams,
                signal: abortControllerRef.current.signal
            });

            if (isMounted.current) {
                if (response.data && Array.isArray(response.data)) {
                    const formattedProducts = response.data.map(formatProductData).filter(Boolean);

                    // Update products array (append or replace)
                    if (isLoadingMore) {
                        setProducts(prev => [...prev, ...formattedProducts]);
                    } else {
                        setProducts(formattedProducts);
                    }

                    // Check if there might be more products
                    setHasMore(formattedProducts.length >= PAGE_SIZE);
                } else {
                    console.error('Invalid response format:', response.data);
                    if (!isLoadingMore) {
                        setProducts([]);
                    }
                    setHasMore(false);
                    setError("Invalid response format from server");
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError' && isMounted.current) {
                console.error("Search error:", err);
                console.error("Error details:", err.response?.data || err.message);
                setError("Failed to search products. Please try again.");
                if (!isLoadingMore) {
                    setProducts([]);
                }
                setHasMore(false);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setLoadingMore(false);
                searchStateRef.current.isSearching = false;
            }
        }
    }, [categoryId, isOpen, isStandalonePage, formatProductData, products.length]);

    // Handle load more button click
    const handleLoadMore = useCallback(() => {
        if (hasMore && !loadingMore && !loading) {
            console.log("Loading more items...");
            searchProducts(true);
        }
    }, [hasMore, loadingMore, loading, searchProducts]);

    // Trigger search and fetch category details when categoryId changes
    useEffect(() => {
        if (categoryId && (isOpen || isStandalonePage)) {
            console.log("Category changed, loading products for:", categoryId);
            searchProducts(false);
            fetchCategoryDetails(categoryId);
        }
    }, [categoryId, isOpen, isStandalonePage, searchProducts, fetchCategoryDetails]);

    // Render content for both modal and standalone page
    const renderContent = () => (
        <div className="max-w-7xl w-full flex flex-col">
            {/* Fixed container for categories in standalone mode */}
            {isStandalonePage && (
                <div className="fixed left-0 right-0 z-40 bg-white py-3 md:hidden">
                    <Categoryitem />
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10 mt-20 md:mt-0">
                {isStandalonePage && (
                    <button onClick={handleBack} className="p-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 19L5 12L12 5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}

                <h2 className="text-xl font-medium">
                    {selectedCategory ? selectedCategory.name : 'Browse Categories'}
                </h2>

                {!isStandalonePage && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <IoMdClose className="text-xl"/>
                    </button>
                )}

                {isStandalonePage && <div className="w-10"></div>} {/* Spacer for alignment */}
            </div>

            {/* Category description */}
            {selectedCategory && selectedCategory.description && (
                <div className="p-5 border-b sticky top-16 bg-white z-10">
                    <div className="text-gray-600">
                        {selectedCategory.description}
                    </div>
                </div>
            )}

            {/* Results section */}
            <div className="flex-1 overflow-auto p-5 pb-24">
                {/* Loading state */}
                {loading && !loadingMore && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-12 h-12 border-4 border-[#F7A313] border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Loading products...</p>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && products.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-red-500">{error}</p>
                        <button
                            onClick={() => searchProducts(false)}
                            className="mt-4 px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty results */}
                {!loading && !error && products.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-600">No products found in this category.</p>
                    </div>
                )}

                {/* Products grid */}
                {products.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-4">{products.length} Results Found</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {products.map((product, index) => (
                                <SearchItem key={product.id || index} product={product} />
                            ))}
                        </div>

                        {/* Load more button */}
                        {loadingMore ? (
                            <div className="flex justify-center mt-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F7A313]"></div>
                            </div>
                        ) : hasMore && (
                            <div className="flex justify-center mt-6">
                                <motion.button
                                    onClick={handleLoadMore}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200"
                                >
                                    Load More
                                </motion.button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Render differently based on whether this is a modal or standalone page
    if (isStandalonePage) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex justify-center overflow-auto">
                {renderContent()}
            </div>
        );
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-white z-50 flex justify-center overflow-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderContent()}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default SearchByCategory;