import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
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
    const effectiveCategoryId = categoryFromURL || initialCategory;

    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter states
    const [categoryId, setCategoryId] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // References
    const isMounted = useRef(true);
    const abortControllerRef = useRef(null);

    // Navigate to home page when back button is clicked
    const handleBack = () => {
        navigate('/');
    };

    // Initialize category search when component mounts or category changes
    useEffect(() => {
        if ((isOpen || isStandalonePage) && effectiveCategoryId) {
            setCategoryId(effectiveCategoryId);

            // Load products for this category
            setLoading(true);
            searchProducts(effectiveCategoryId);

            // Fetch category details
            fetchCategoryDetails(effectiveCategoryId);
        }
    }, [isOpen, effectiveCategoryId, isStandalonePage]);

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

    // Search products function
    const searchProducts = useCallback(async (forcedCategoryId = null) => {
        if (!isOpen && !isStandalonePage) return;

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);

        try {
            // Build query params
            const queryParams = {};

            // Use forcedCategoryId if provided, otherwise use categoryId state
            const effectiveCategoryId = forcedCategoryId || categoryId;
            if (effectiveCategoryId) queryParams.category_id = effectiveCategoryId;

            const endpoint = `/products/search/50`; // Get up to 50 products at once

            // API request
            const response = await api.get(endpoint, {
                params: queryParams,
                signal: abortControllerRef.current.signal
            });

            if (isMounted.current) {
                if (response.data && Array.isArray(response.data)) {
                    const formattedProducts = response.data.map(formatProductData).filter(Boolean);
                    setProducts(formattedProducts);
                } else {
                    setProducts([]);
                    setError("Invalid response format from server");
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError' && isMounted.current) {
                console.error("Search error:", err);
                setError("Failed to search products. Please try again.");
                setProducts([]);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [isOpen, isStandalonePage, categoryId, formatProductData]);

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
            <div className="flex justify-between items-center p-5 border-b sticky bg-white z-10 mt-20 md:mt-0">
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
            <div className="p-5 sticky top-16 bg-white z-10">
                {selectedCategory && selectedCategory.description && (
                    <div className="mb-4 text-gray-600">
                        {selectedCategory.description}
                    </div>
                )}
            </div>

            {/* Results section */}
            <div className="flex-1 overflow-auto p-5 pb-24">
                {/* Loading state */}
                {loading && (
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
                            onClick={() => searchProducts()}
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
                {!loading && products.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-4">{products.length} Results Found</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {products.map((product, index) => (
                                <SearchItem key={product.id || index} product={product} />
                            ))}
                        </div>
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
                <div
                    className="fixed inset-0 bg-white z-50 flex justify-center overflow-auto"
                >
                    {renderContent()}
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default SearchByCategory;