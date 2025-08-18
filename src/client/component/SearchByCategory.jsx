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
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // References
    const isMounted = useRef(true);
    const abortControllerRef = useRef(null);
    const lastCategoryRef = useRef(null); // Used to detect when the category changes

    // Navigate to home page when back button is clicked
    const handleBack = () => {
        navigate('/');
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

    // Search products function
    const searchProducts = useCallback(async (limitParam = 20, forcedCategoryId = null, offsetParam = null) => {
        if (!isOpen && !isStandalonePage) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);

        try {
            const queryParams = {};
            const limitToUse = limitParam || 20;
            const offsetToUse = offsetParam !== null ? offsetParam : offset;
            const categoryIdToUse = forcedCategoryId || categoryId || params.category;
            
            if (!categoryIdToUse) {
                setLoading(false);
                return; // Don't search if there's no category
            }

            queryParams.category_id = categoryIdToUse;
            queryParams.offset = offsetToUse;
            queryParams.limit = limitToUse;
            
            const endpoint = `/products/search`;
            const response = await api.get(endpoint, {
                params: queryParams,
                signal: abortControllerRef.current.signal
            });

            if (isMounted.current) {
                if (response.data && Array.isArray(response.data)) {
                    const formattedProducts = response.data
                        .map(formatProductData)
                        .filter(Boolean);

                    // Determine whether to replace the list (new category) or append new items (load more)
                    const isNewSearch = categoryIdToUse !== lastCategoryRef.current || offsetToUse === 0;

                    if (isNewSearch) {
                        lastCategoryRef.current = categoryIdToUse;
                        setProducts(formattedProducts);
                    } else {
                        // Append new items for "Load More"
                        setProducts(prev => [...prev, ...formattedProducts]);
                    }

                    // Update offset based on the new total length
                    setOffset(currentOffset => currentOffset + formattedProducts.length);
                    setHasMore(formattedProducts.length === limitToUse);
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
    // ✅ FIX: Added `offset`, `categoryId`, and `params.category` to the dependency array.
    // This ensures the function always has the latest state values and isn't "stale".
    }, [isOpen, isStandalonePage, formatProductData, offset, categoryId, params.category]);

    // Initialize category search when component mounts or category changes
    useEffect(() => {
        if ((isOpen || isStandalonePage) && effectiveCategoryId) {
            setCategoryId(effectiveCategoryId);
            
            // If the category is different from the last one we searched, reset everything.
            if (effectiveCategoryId !== lastCategoryRef.current) {
                setProducts([]); // Clear old products immediately for better UX
                setOffset(0);
                searchProducts(20, effectiveCategoryId, 0);
                fetchCategoryDetails(effectiveCategoryId);
            }
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

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const renderContent = () => {
        const showLoadingSpinner = loading && products.length === 0;
        const showLoadMoreSpinner = loading && products.length > 0;
        
        return (
        <div className="max-w-7xl w-full flex flex-col">
            {isStandalonePage && (
                <div className="fixed left-0 right-0 z-40 bg-white py-3 md:hidden">
                    <Categoryitem />
                </div>
            )}
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
                    {selectedCategory ? selectedCategory.name : 'Loading Category...'}
                </h2>
                {!isStandalonePage && (
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <IoMdClose className="text-xl"/>
                    </button>
                )}
                {isStandalonePage && <div className="w-10"></div>}
            </div>
            <div className="p-5 ">
                {selectedCategory && selectedCategory.description && (
                    <div className="mb-4 text-gray-600">
                        {selectedCategory.description}
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-auto p-5 pb-24">
                {showLoadingSpinner && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-12 h-12 border-4 border-[#F7A313] border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Loading products...</p>
                    </div>
                )}
                {error && !loading && products.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-red-500">{error}</p>
                    </div>
                )}
                {!loading && !error && products.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-600">No products found in this category.</p>
                    </div>
                )}
                {products.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-4">{products.length} Results Found</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {products.map((product) => (
                                <SearchItem key={product.id} product={product} />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => searchProducts()}
                                    disabled={loading}
                                    className="px-4 py-2 bg-[#F7A313] text-white rounded-full hover:opacity-90 disabled:opacity-60"
                                >
                                    {showLoadMoreSpinner ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        );
    };

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
                <div className="fixed inset-0 bg-white z-50 flex justify-center overflow-auto">
                    {renderContent()}
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default SearchByCategory;