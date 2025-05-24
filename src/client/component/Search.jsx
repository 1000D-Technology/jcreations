import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMdClose } from 'react-icons/io';
import { FiSearch, FiFilter } from 'react-icons/fi';
import api from "../../utils/axios.js";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import SearchItem from "./utils/Searchitem.jsx";

function Search({ isOpen, onClose, initialCategory }) {
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

    // Store current search params for pagination
    const searchParamsRef = useRef({
        query: '',
        categoryId: '',
        priceRange: [0, 10000],
        status: ''
    });

    // Reference to track if component is mounted
    const isMounted = useRef(true);
    const abortControllerRef = useRef(null);

    // Set category ID when initialCategory prop changes or when search opens
    useEffect(() => {
        if (isOpen && initialCategory) {
            setCategoryId(initialCategory);
            // Show filters panel when category is selected
            setShowFilters(true);

            // Update search params and trigger search with the category
            if (searchParamsRef.current.categoryId !== initialCategory) {
                searchParamsRef.current.categoryId = initialCategory;
                // Small delay to ensure state has updated
                setTimeout(() => {
                    searchProducts(false);
                }, 100);
            }
        }
    }, [isOpen, initialCategory]);

    // Format product data to ensure consistency
    const formatProductData = useCallback((product) => {
        if (!product) return null;

        return {
            ...product,
            // Ensure images is always an array
            images: Array.isArray(product.images) ? product.images :
                (product.images ? [product.images] : []),
            // Format price as a number
            price: typeof product.price === 'string' ? parseFloat(product.price) :
                (product.price || 0), // Default to 0 if undefined
            // Ensure discount_percentage exists and is a number
            discount_percentage: parseFloat(product.discount_percentage || 0),
            // Ensure status is a string
            status: product.status || "out_of_stock"
        };
    }, []);

    // Reset mounted ref when component unmounts
    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Load categories for filter options
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                if (response.data && Array.isArray(response.data)) {
                    setCategories(response.data);
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };

        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    // Search function
    const searchProducts = useCallback(async (isLoadingMore = false) => {
        if (!isOpen) return;

        // Cancel previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        if (isLoadingMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            // Build query using the correct format from API spec
            const queryParams = {};
            if (searchQuery.trim()) queryParams.q = searchQuery.trim();
            if (categoryId) queryParams.category_id = categoryId;
            if (priceRange[0] > 0) queryParams.min_price = priceRange[0];
            if (priceRange[1] < 10000) queryParams.max_price = priceRange[1];
            if (status) queryParams.status = status;

            // Save current search params for pagination
            searchParamsRef.current = {
                query: searchQuery.trim(),
                categoryId,
                priceRange: [...priceRange],
                status
            };

            // Note: limit is a path parameter not a query parameter
            const endpoint = `/products/search/${searchLimit}`;

            console.log("Search endpoint:", endpoint);
            console.log("Search parameters:", queryParams);
            console.log("Using limit:", searchLimit);

            // Save recent search
            if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
                const updatedSearches = [searchQuery.trim(), ...recentSearches.slice(0, 4)];
                setRecentSearches(updatedSearches);
                localStorage.setItem('jcreations_recent_searches', JSON.stringify(updatedSearches));
            }

            // Make the API request matching the API specification
            const response = await api.get(endpoint, {
                params: queryParams,
                signal: abortControllerRef.current.signal
            });

            console.log("API response:", response);

            if (isMounted.current) {
                // The API returns an array of products
                if (response.data && Array.isArray(response.data)) {
                    // Format each product to ensure consistent data structure
                    const formattedProducts = response.data.map(formatProductData).filter(Boolean);
                    console.log("Formatted products:", formattedProducts);

                    if (isLoadingMore) {
                        // Append new products to existing list
                        setProducts(prev => [...prev, ...formattedProducts]);
                    } else {
                        // Replace products with new results
                        setProducts(formattedProducts);
                    }

                    // Check if we received the maximum number of items, indicating there might be more
                    setHasMore(formattedProducts.length >= 20);
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
                toast.error("Search failed. Please check your connection.");
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

    // Handle load more button click
    const handleLoadMore = useCallback(() => {
        console.log("Loading more items, increasing limit from", searchLimit);
        setSearchLimit(prevLimit => prevLimit + 20);
    }, [searchLimit]);

    // Watch for changes to searchLimit to load more items
    useEffect(() => {
        if (!isOpen || loading) return;

        // If this isn't the initial render (limit > 20) and we're not already loading
        if (searchLimit > 20 && !loadingMore) {
            console.log("SearchLimit changed to", searchLimit, "- loading more items");
            searchProducts(true);
        }
    }, [searchLimit, isOpen, loading, loadingMore, searchProducts]);

    // Search when search parameters change (with debounce)
    useEffect(() => {
        if (!isOpen) return;

        // Reset to initial limit when search params change
        if (searchLimit > 20 &&
            (searchParamsRef.current.query !== searchQuery.trim() ||
                searchParamsRef.current.categoryId !== categoryId ||
                searchParamsRef.current.status !== status ||
                searchParamsRef.current.priceRange[0] !== priceRange[0] ||
                searchParamsRef.current.priceRange[1] !== priceRange[1])) {
            setSearchLimit(20);
        }

        const timer = setTimeout(() => {
            searchProducts(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchProducts, isOpen, searchQuery, categoryId, status, priceRange]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                document.getElementById('search-input')?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        searchProducts(false);
    };

    // Handle price range changes
    const handlePriceChange = (e, index) => {
        const value = parseInt(e.target.value) || 0;
        setPriceRange(prev => {
            const newRange = [...prev];
            newRange[index] = value;

            // Ensure min <= max
            if (index === 0 && value > newRange[1]) {
                newRange[1] = value;
            } else if (index === 1 && value < newRange[0]) {
                newRange[0] = value;
            }

            return newRange;
        });
    };

    // Handle recent search click
    const handleRecentSearchClick = (search) => {
        setSearchQuery(search);
    };

    return (
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
                            <h2 className="text-xl font-medium">Search Products</h2>
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                <IoMdClose className="text-xl" />
                            </motion.button>
                        </div>

                        {/* Search and filters section */}
                        <div className="p-5 border-b sticky top-16 bg-white z-10">
                            {/* Search input form */}
                            <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="search-input"
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search for products..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F7A313] focus:border-transparent"
                                    />
                                </div>
                                <motion.button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`p-2 rounded-full ${showFilters ? 'bg-[#F7A313] text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    <FiFilter className="text-xl" />
                                </motion.button>
                            </form>

                            {/* Filter panel */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pb-4">
                                            {/* Category filter */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                                <select
                                                    value={categoryId}
                                                    onChange={(e) => setCategoryId(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F7A313] focus:border-transparent"
                                                >
                                                    <option value="">All Categories</option>
                                                    {categories.map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Status filter */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                                <select
                                                    value={status}
                                                    onChange={(e) => setStatus(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F7A313] focus:border-transparent"
                                                >
                                                    <option value="">All Status</option>
                                                    <option value="in_stock">In Stock</option>
                                                    <option value="out_of_stock">Out of Stock</option>
                                                    <option value="limited">Limited Stock</option>
                                                </select>
                                            </div>

                                            {/* Price range filter */}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500 mb-1">Min</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10000"
                                                            value={priceRange[0]}
                                                            onChange={(e) => handlePriceChange(e, 0)}
                                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F7A313] focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500 mb-1">Max</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10000"
                                                            value={priceRange[1]}
                                                            onChange={(e) => handlePriceChange(e, 1)}
                                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F7A313] focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Filter buttons */}
                                        <div className="flex justify-end gap-2 border-t pt-3">
                                            <motion.button
                                                type="button"
                                                onClick={() => {
                                                    setCategoryId('');
                                                    setPriceRange([0, 10000]);
                                                    setStatus('');
                                                }}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                className="px-4 py-1.5 border border-gray-300 rounded-full text-sm"
                                            >
                                                Reset Filters
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                onClick={() => searchProducts(false)}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                className="px-4 py-1.5 bg-[#F7A313] text-white rounded-full text-sm"
                                            >
                                                Apply Filters
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Results section - Added pb-24 to create space for bottom navigation */}
                        <div className="flex-1 overflow-auto p-5 pb-24">
                            {/* Recent searches */}
                            {!searchQuery && recentSearches.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Searches</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map((search, index) => (
                                            <motion.button
                                                key={index}
                                                onClick={() => handleRecentSearchClick(search)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                                            >
                                                {search}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Search results */}
                            {loading && !loadingMore ? (
                                <div className="flex justify-center items-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F7A313]"></div>
                                </div>
                            ) : error ? (
                                <div className="text-center py-10 text-red-500">{error}</div>
                            ) : products.length > 0 ? (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-4">{products.length} Results Found</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {products.map((product, index) => {
                                            console.log(`Rendering product ${index}:`, product);
                                            return (
                                                <SearchItem key={product.id || index} product={product} />
                                            );
                                        })}
                                    </div>

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
                            ) : (searchQuery || categoryId || priceRange[0] > 0 || priceRange[1] < 10000 || status) ? (
                                <div className="text-center py-10">
                                    <div className="text-gray-400 mb-2 text-xl">No results found</div>
                                    <p className="text-gray-500">Try different keywords or filters</p>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="text-gray-400 mb-2 text-xl">Search for products</div>
                                    <p className="text-gray-500">Enter keywords above to find products</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Search;