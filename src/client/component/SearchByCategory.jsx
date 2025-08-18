import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { IoMdClose } from 'react-icons/io';

import api from "../../utils/axios.js";
import SearchItem from "./utils/Searchitem.jsx";
import Categoryitem from "./utils/Categoryitem.jsx";

// Define a constant for how many items to fetch per page
const PAGE_LIMIT = 20;

function SearchByCategory({ isOpen, onClose, initialCategory }) {
    const navigate = useNavigate();
    const { category: categoryFromURL } = useParams();

    // Determine if the component is running as a standalone page or a modal
    const isStandalonePage = !!categoryFromURL;
    const effectiveCategoryId = categoryFromURL || initialCategory;

    // State for data, loading, and errors
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // State for pagination
    const [currentLimit, setCurrentLimit] = useState(PAGE_LIMIT);
    const [hasMore, setHasMore] = useState(true);

    // Refs to manage side effects
    const abortControllerRef = useRef(null);
    const lastFetchedCategory = useRef(null);

    const handleBack = () => navigate('/');

    // Memoized helper to ensure product data has a consistent shape
    const formatProductData = useCallback((product) => {
        if (!product) return null;
        return {
            ...product,
            images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []),
            price: parseFloat(product.price) || 0,
            discount_percentage: parseFloat(product.discount_percentage) || 0,
            status: product.status || "out_of_stock",
        };
    }, []);
    
    // Fetches details of the currently selected category to display its name and description
    const fetchCategoryDetails = useCallback(async (id) => {
        if (!id) return;
        try {
            const { data } = await api.get(`/categories/${id}`);
            setSelectedCategory(data);
        } catch (err) {
            console.error("Error fetching category details:", err);
            setSelectedCategory(null); // Reset on error
        }
    }, []);

    // Core function to fetch products based on the category
    const fetchProducts = useCallback(async ({ isNewSearch = false } = {}) => {
        // For "load more", prevent fetching if already loading or no more data exists
        if (loading || (!isNewSearch && !hasMore)) return;
        
        // Abort previous requests to prevent race conditions
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const limitToUse = isNewSearch ? PAGE_LIMIT : currentLimit + PAGE_LIMIT;

        setLoading(true);
        setError(null);

        try {
            if (!effectiveCategoryId) return;

            // API endpoint format: /products/search/{limit}?category_id={id}
            const endpoint = `/products/search/${limitToUse}`;
            const queryParams = { category_id: effectiveCategoryId };

            const response = await api.get(endpoint, {
                params: queryParams,
                signal: abortControllerRef.current.signal,
            });

            if (response.data && Array.isArray(response.data)) {
                const newProducts = response.data.map(formatProductData);

                // API returns the full list up to the new limit, so we replace the state
                setProducts(newProducts);
                setCurrentLimit(limitToUse);

                // If the returned count is less than the requested limit, we've reached the end
                setHasMore(newProducts.length === limitToUse);
            } else {
                setProducts([]);
                setHasMore(false);
            }
        } catch (err) {
            // AbortError is expected when a new request cancels an old one, so we ignore it
            if (err.name !== 'AbortError') {
                console.error("Search error:", err);
                setError("Failed to fetch products. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, [currentLimit, hasMore, loading, effectiveCategoryId, formatProductData]);

    // Effect to trigger a new search when the component opens or the category ID changes
    useEffect(() => {
        const shouldStartSearch = (isOpen || isStandalonePage) && effectiveCategoryId;
        const isNewCategory = effectiveCategoryId !== lastFetchedCategory.current;

        if (shouldStartSearch && isNewCategory) {
            lastFetchedCategory.current = effectiveCategoryId;
            
            // Reset all state for the new category
            setProducts([]);
            setCurrentLimit(PAGE_LIMIT);
            setHasMore(true);
            setError(null);

            fetchCategoryDetails(effectiveCategoryId);
            fetchProducts({ isNewSearch: true });
        }
    }, [isOpen, isStandalonePage, effectiveCategoryId, fetchProducts, fetchCategoryDetails]);
    
    // Cleanup effect to abort any pending requests on unmount
    useEffect(() => {
        return () => abortControllerRef.current?.abort();
    }, []);

    // --- Rendering Logic ---

    const renderHeader = () => (
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-20 mt-20 md:mt-0">
            {isStandalonePage ? (
                <button onClick={handleBack} className="p-2" aria-label="Go back">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 19L5 12L12 5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            ) : null}
            <h2 className="text-xl font-medium">
                {selectedCategory?.name || 'Loading Category...'}
            </h2>
            {!isStandalonePage ? (
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
                    <IoMdClose className="text-xl"/>
                </button>
            ) : <div className="w-10" />} {/* Spacer to balance the header */}
        </div>
    );
    
    const renderProductList = () => {
        const showInitialLoading = loading && products.length === 0;
        const showLoadMoreLoading = loading && products.length > 0;

        if (showInitialLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-12 h-12 border-4 border-[#F7A313] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
            );
        }
        if (error && products.length === 0) {
            return <div className="text-center py-10 text-red-500">{error}</div>;
        }
        if (!loading && products.length === 0) {
            return <div className="text-center py-10 text-gray-600">No products found in this category.</div>;
        }

        return (
            <>
                <h3 className="text-sm font-medium text-gray-500 mb-4">{products.length} Results Found</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => <SearchItem key={product.id} product={product} />)}
                </div>
                {hasMore && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => fetchProducts()}
                            disabled={loading}
                            className="px-4 py-2 bg-[#F7A313] text-white rounded-full hover:opacity-90 disabled:opacity-60"
                        >
                            {showLoadMoreLoading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </>
        );
    };

    const content = (
        <div className="max-w-7xl w-full flex flex-col">
            {isStandalonePage && (
                <div className="fixed left-0 right-0 z-40 bg-white py-3 md:hidden">
                    <Categoryitem />
                </div>
            )}
            {renderHeader()}
            <div className="p-5 pt-0 sticky top-[73px] bg-white z-10">
                <p className="text-gray-600">{selectedCategory?.description || ''}</p>
            </div>
            <main className="flex-1 p-5 pb-24">
                {renderProductList()}
            </main>
        </div>
    );

    // Render as a standalone page
    if (isStandalonePage) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex justify-center overflow-auto">
                {content}
            </div>
        );
    }

    // Render as a modal using a portal
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-white z-50 flex justify-center overflow-auto">
                    {content}
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default SearchByCategory;