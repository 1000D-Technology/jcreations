import React, { useState, useEffect } from 'react'
import Newitem from "./utils/Newitem.jsx";
import api from '../../utils/axios.js';

function FeaturedProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // Start with 1 second

    // Helper function to wait
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
        const fetchFeaturedProducts = async (attempt = 0) => {
            try {
                setLoading(true);
                setError(null);
                
                // Check if data is cached (simple 5-minute cache)
                const cacheKey = 'featuredProducts';
                const cacheTimeKey = 'featuredProductsTime';
                const cachedData = localStorage.getItem(cacheKey);
                const cacheTime = localStorage.getItem(cacheTimeKey);
                const now = Date.now();
                const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

                // Use cached data if available and fresh
                if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
                    setProducts(JSON.parse(cachedData));
                    setLoading(false);
                    return;
                }

                // Fetch featured products from the API
                const response = await api.get('/featured');

                // Cache the response
                localStorage.setItem(cacheKey, JSON.stringify(response.data));
                localStorage.setItem(cacheTimeKey, now.toString());

                setProducts(response.data);
                setError(null);
                setRetryCount(0);
            } catch (err) {
                console.error(`Error fetching featured products (attempt ${attempt + 1}):`, err);
                
                // Check if it's a database connection error
                const isConnectionError = err.response?.data?.message?.includes('max_connections_per_hour') ||
                                        err.response?.data?.message?.includes('Authentication') ||
                                        err.response?.status === 503 ||
                                        err.code === 'ECONNREFUSED';

                if (isConnectionError && attempt < MAX_RETRIES) {
                    // Exponential backoff: 1s, 2s, 4s
                    const delay = RETRY_DELAY * Math.pow(2, attempt);
                    console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
                    
                    setRetryCount(attempt + 1);
                    setError(`Connection issue. Retrying... (${attempt + 1}/${MAX_RETRIES})`);
                    
                    await wait(delay);
                    return fetchFeaturedProducts(attempt + 1);
                } else {
                    // Final error handling
                    if (isConnectionError) {
                        setError('Server is temporarily busy. Please try again in a few minutes.');
                    } else {
                        setError('Failed to load featured products');
                    }
                    setRetryCount(0);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
    }, []);

    return (
        <section className="pt-10 flex justify-center">
            <div className="max-w-7xl w-full lg:flex justify-between px-2">
                <div className="flex flex-col w-full">
                    <div className="flex items-center gap-3 px-2">
                        <span className="text-2xl font-semibold text-gray-800">
                            Featured Products
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-[#F7A313] text-lg">⭐</span>
                            <span className="text-sm text-gray-500 bg-[#FFF7E6] px-2 py-1 rounded-full">
                                Hand Picked
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F7A313]"></div>
                                {retryCount > 0 && (
                                    <p className="text-sm text-gray-500">
                                        Retrying connection... ({retryCount}/{MAX_RETRIES})
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-3">⚠️</div>
                            <div className="text-red-500 mb-3">{error}</div>
                            {error.includes('Server is temporarily busy') && (
                                <div className="text-sm text-gray-500 max-w-md mx-auto">
                                    <p className="mb-2">Our servers are experiencing high traffic.</p>
                                    <p>This usually resolves within a few minutes. You can:</p>
                                    <ul className="text-left mt-2 space-y-1">
                                        <li>• Wait a few minutes and refresh the page</li>
                                        <li>• Browse other sections while we resolve this</li>
                                        <li>• Check our regular products below</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <div className="text-4xl mb-2">⭐</div>
                            <p>No featured products available right now</p>
                            <p className="text-sm">Check back later for our curated selection!</p>
                        </div>
                    ) : (
                        <div className="flex overflow-x-auto gap-4 mt-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent lg:grid lg:grid-cols-4 lg:overflow-x-visible lg:gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="flex-shrink-0 w-[280px] lg:w-full relative">
                                    {/* Featured Badge */}
                                    <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                                        Featured
                                    </div>
                                    <Newitem product={product} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default FeaturedProducts