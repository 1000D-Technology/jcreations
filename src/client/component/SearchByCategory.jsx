import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IoMdClose } from 'react-icons/io';
import { FiArrowLeft } from 'react-icons/fi';
import api from "../../utils/axios.js";
import { useNavigate, useParams } from 'react-router-dom';
import SearchItem from "./utils/Searchitem.jsx";
import { createPortal } from 'react-dom';
import Categoryitem from "./utils/Categoryitem.jsx";
// Remove toast if not using it
// import toast from 'react-hot-toast';

function SearchByCategory({ isOpen, onClose, initialCategory }) {
    const navigate = useNavigate();
    const params = useParams();
    const categoryFromURL = params.category;

    // Determine if standalone page or modal mode
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
    const isSearchingRef = useRef(false);

    // Set category ID from URL or props
    useEffect(() => {
        const effectiveId = categoryFromURL || initialCategory;
        if (effectiveId && effectiveId !== categoryId) {
            setCategoryId(effectiveId);
            setProducts([]);
            setHasMore(false);
        }
    }, [categoryFromURL, initialCategory, categoryId]);

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
            setError("Failed to load category details.");
        }
    }, []);

    // Search products function
    const searchProducts = useCallback(async (isLoadingMore = false) => {
        // Prevent concurrent requests
        if (isSearchingRef.current) return;
        if (!categoryId || (!isOpen && !isStandalonePage)) return;

        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Set new abort controller
        abortControllerRef.current = new AbortController();
        isSearchingRef.current = true;

        // Set loading state
        if (isLoadingMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            if (!isLoadingMore) {
                setProducts([]);
            }
        }

        setError(null);

        try {
            // Use the correct API endpoint with limit as path parameter
            const endpoint = `/products/search/${PAGE_SIZE}`;

            // Build query parameters
            const queryParams = {
                category_id: categoryId
            };

            // Add offset for pagination
            if (isLoadingMore) {
                queryParams.offset = products.length;
            }

            console.log(`Fetching products for category: ${categoryId}`);

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

                    // Determine if more products are available
                    setHasMore(formattedProducts.length >= PAGE_SIZE);
                } else {
                    if (!isLoadingMore) {
                        setProducts([]);
                    }
                    setHasMore(false);
                    setError("Invalid response from server");
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError' && isMounted.current) {
                console.error("Search error:", err);
                setError("Failed to load products. Please try again.");
                if (!isLoadingMore) {
                    setProducts([]);
                }
                setHasMore(false);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setLoadingMore(false);
                isSearchingRef.current = false;
            }
        }
    }, [categoryId, isOpen, isStandalonePage, formatProductData, products.length]);

    // Handle load more button click
    const handleLoadMore = useCallback(() => {
        if (hasMore && !loadingMore && !loading) {
            searchProducts(true);
        }
    }, [hasMore, loadingMore, loading, searchProducts]);

    // Navigate back
    const handleBack = useCallback(() => {
        navigate('/');
    }, [navigate]);

    // Load products when category changes
    useEffect(() => {
        if (categoryId && (isOpen || isStandalonePage)) {
            searchProducts(false);
            fetchCategoryDetails(categoryId);
        }
    }, [categoryId, isOpen, isStandalonePage, searchProducts, fetchCategoryDetails]);

    // Render content
    const renderContent = () => (
        <div className="max-w-7xl w-full flex flex-col">
            {/* Categories bar for mobile in standalone mode */}
            {isStandalonePage && (
                <div className="fixed left-0 right-0 z-40 bg-white py-3 md:hidden">
                    <Categoryitem />
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10 mt-20 md:mt-0">
                {isStandalonePage && (
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <FiArrowLeft className="text-xl" />
                    </button>
                )}

                <h2 className="text-xl font-medium">
                    {selectedCategory ? selectedCategory.name : 'Loading category...'}
                </h2>

                {!isStandalonePage && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <IoMdClose className="text-xl"/>
                    </button>
                )}

                {isStandalonePage && <div className="w-10"></div>}
            </div>

            {/* Category description */}
            {selectedCategory && selectedCategory.description && (
                <div className="p-5 border-b bg-white">
                    <p className="text-gray-600">{selectedCategory.description}</p>
                </div>
            )}

            {/* Results section */}
            <div className="flex-1 overflow-auto p-5 pb-24">
                {/* Loading indicator */}
                {loading && !loadingMore && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-12 h-12 border-4 border-[#F7A313] border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Loading products...</p>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && products.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => searchProducts(false)}
                            className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200"
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
                        <h3 className="text-sm font-medium text-gray-500 mb-4">
                            {products.length} products found
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                <button
                                    onClick={handleLoadMore}
                                    className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200"
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Render component based on mode
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