import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMdClose } from 'react-icons/io';
import api from "../../utils/axios.js";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import SearchItem from "./utils/Searchitem.jsx";
import { createPortal } from 'react-dom';

function SearchByCategory({ isOpen, onClose, initialCategory }) {
    const navigate = useNavigate();
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState(() => {
        const saved = localStorage.getItem('jcreations_recent_searches');
        return saved ? JSON.parse(saved) : ['birthday cake', 'chocolate cupcake', 'wedding cake'];
    });

    // UI states
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Filter states
    const [categoryId, setCategoryId] = useState('');
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [status, setStatus] = useState('');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchLimit, setSearchLimit] = useState(20);
    const [hasMore, setHasMore] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Store current search params for pagination
    const searchParamsRef = useRef({
        query: '',
        categoryId: '',
        priceRange: [0, 10000],
        status: ''
    });

    // References
    const isMounted = useRef(true);
    const abortControllerRef = useRef(null);
    const hasInitialSearchRef = useRef(false);

    // Updated useEffect to use forcedCategoryId
    useEffect(() => {
        if (isOpen && initialCategory) {
            setCategoryId(initialCategory);
            searchParamsRef.current.categoryId = initialCategory;

            // Pass initialCategory directly to searchProducts
            setLoading(true);
            searchProducts(false, initialCategory);

            // Fetch category details
            fetchCategoryDetails(initialCategory);
        } else if (!isOpen) {
            // Reset when modal closes
            hasInitialSearchRef.current = false;
        }
    }, [isOpen, initialCategory]);

    // Fetch category details
    const fetchCategoryDetails = async (id) => {
        if (!id) return;

        try {
            const response = await api.get(`/categories/${id}`);
            if (response.data) {
                setSelectedCategory(response.data);
            }
        } catch (err) {
            console.error("Error fetching category details:", err);
        }
    };

    // Format product data
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

    // Load categories for filter
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                if (response.data && Array.isArray(response.data)) {
                    setCategories(response.data);

                    // Set selected category details
                    if (initialCategory) {
                        const category = response.data.find(cat => cat.id.toString() === initialCategory.toString());
                        if (category) {
                            setSelectedCategory(category);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };

        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen, initialCategory]);

    // Updated searchProducts function with forcedCategoryId parameter
    const searchProducts = useCallback(async (isLoadingMore = false, forcedCategoryId = null) => {
        if (!isOpen) return;

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        if (isLoadingMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            // Build query params
            const queryParams = {};
            if (searchQuery.trim()) queryParams.q = searchQuery.trim();

            // Use forcedCategoryId if provided, otherwise use categoryId state
            const effectiveCategoryId = forcedCategoryId || categoryId;
            if (effectiveCategoryId) queryParams.category_id = effectiveCategoryId;

            if (priceRange[0] > 0) queryParams.min_price = priceRange[0];
            if (priceRange[1] < 10000) queryParams.max_price = priceRange[1];
            if (status) queryParams.status = status;

            // Save current search params
            searchParamsRef.current = {
                query: searchQuery.trim(),
                categoryId: effectiveCategoryId,
                priceRange: [...priceRange],
                status
            };

            const endpoint = `/products/search/${searchLimit}`;

            // Save recent search
            if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
                const updatedSearches = [searchQuery.trim(), ...recentSearches.slice(0, 4)];
                setRecentSearches(updatedSearches);
                localStorage.setItem('jcreations_recent_searches', JSON.stringify(updatedSearches));
            }

            // API request
            const response = await api.get(endpoint, {
                params: queryParams,
                signal: abortControllerRef.current.signal
            });

            if (isMounted.current) {
                if (response.data && Array.isArray(response.data)) {
                    const formattedProducts = response.data.map(formatProductData).filter(Boolean);

                    if (isLoadingMore) {
                        setProducts(prev => [...prev, ...formattedProducts]);
                    } else {
                        setProducts(formattedProducts);
                    }

                    // Check for more items
                    setHasMore(formattedProducts.length >= 20);
                } else {
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
            }
        }
    }, [isOpen, searchQuery, categoryId, priceRange, status, searchLimit, recentSearches, formatProductData]);

    // Handle load more
    const handleLoadMore = useCallback(() => {
        setSearchLimit(prevLimit => prevLimit + 20);
    }, []);

    // Watch for searchLimit changes
    useEffect(() => {
        if (!isOpen || loading) return;

        if (searchLimit > 20 && !loadingMore) {
            searchProducts(true);
        }
    }, [searchLimit, isOpen, loading, loadingMore, searchProducts]);

    // Handle recent search click
    const handleRecentSearchClick = (search) => {
        setSearchQuery(search);
    };

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
                    <div className="max-w-7xl w-full flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-medium">
                                {selectedCategory ? selectedCategory.name : 'Browse Categories'}
                            </h2>
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                <IoMdClose className="text-xl" />
                            </motion.button>
                        </div>

                        {/* Search and filters */}
                        <div className="p-5 sticky top-16 bg-white z-10">
                            {/* Category description */}
                            {selectedCategory && selectedCategory.description && (
                                <div className="mb-4 text-gray-600">
                                    {selectedCategory.description}
                                </div>
                            )}
                        </div>

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
                                    <p className="text-gray-600">No products found. Try adjusting your filters.</p>
                                </div>
                            )}

                            {/* Products grid */}
                            {products.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-4">{products.length} Results Found</h3>
                                    <div className="grid grid-cols-1 gap-4">
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
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default SearchByCategory;