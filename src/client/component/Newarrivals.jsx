import React, { useState, useEffect } from 'react'
import Newitem from "./utils/Newitem.jsx";
import api from '../../utils/axios.js';

function Newarrivals() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper function to wait
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
        const fetchProducts = async (attempt = 0) => {
            try {
                setLoading(true);
                setError(null);

                // Check if data is cached (simple 5-minute cache)
                const cacheKey = 'newArrivals';
                const cacheTimeKey = 'newArrivalsTime';
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

                // Fetch products from the API
                const response = await api.get('/products/8');

                // Cache the response
                localStorage.setItem(cacheKey, JSON.stringify(response.data));
                localStorage.setItem(cacheTimeKey, now.toString());

                setProducts(response.data);
                setError(null);
            } catch (err) {
                console.error(`Error fetching new arrivals (attempt ${attempt + 1}):`, err);
                
                // Check if it's a database connection error
                const isConnectionError = err.response?.data?.message?.includes('max_connections_per_hour') ||
                                        err.response?.data?.message?.includes('Authentication') ||
                                        err.response?.status === 503 ||
                                        err.code === 'ECONNREFUSED';

                if (isConnectionError && attempt < 2) { // Max 2 retries for new arrivals
                    const delay = 1000 * Math.pow(2, attempt); // 1s, 2s
                    console.log(`Retrying new arrivals in ${delay}ms...`);
                    
                    setError(`Loading... Retrying connection.`);
                    
                    await wait(delay);
                    return fetchProducts(attempt + 1);
                } else {
                    if (isConnectionError) {
                        setError('Server is temporarily busy. Please refresh in a few minutes.');
                    } else {
                        setError('Failed to load new products');
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <section className="pt-10 flex justify-center">
            <div className="max-w-7xl w-full lg:flex justify-between px-2">
                <div className="flex flex-col w-full">
                    <span className="px-2 text-2xl">
                        New Arrivals
                    </span>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F7A313]"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">{error}</div>
                    ) : (
                        <div className="flex overflow-x-auto gap-4 mt-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent lg:grid lg:grid-cols-4 lg:overflow-x-visible lg:gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="flex-shrink-0 w-[280px] lg:w-full">
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

export default Newarrivals