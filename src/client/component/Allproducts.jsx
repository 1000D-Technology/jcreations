import React, { useState, useRef, useEffect } from 'react'
import Productitem from './utils/Productitem'
import { motion } from "framer-motion"

function Allproducts() {
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreItems, setHasMoreItems] = useState(true);
    const productItemRef = useRef(null);

    useEffect(() => {
        // Check immediately when component mounts
        const checkHasMore = () => {
            if (productItemRef.current) {
                setHasMoreItems(productItemRef.current.hasMore);
            }
        };

        // First immediate check
        const timer = setTimeout(checkHasMore, 100);

        return () => clearTimeout(timer);
    }, []);

    // Use another effect to check when loading changes
    useEffect(() => {
        if (productItemRef.current) {
            setHasMoreItems(productItemRef.current.hasMore);
        }
    }, [isLoading]);

    // Function to handle "See More" button click with scroll position preservation
    const handleSeeMore = () => {
        if (!isLoading && productItemRef.current && productItemRef.current.loadMore) {
            // Save current scroll position
            const scrollPosition = window.scrollY;

            // Set loading state
            setIsLoading(true);

            // Load more items and preserve scroll position
            const loadMorePromise = productItemRef.current.loadMore();

            if (loadMorePromise && typeof loadMorePromise.then === 'function') {
                loadMorePromise.finally(() => {
                    // Use setTimeout to ensure DOM has updated
                    setTimeout(() => {
                        window.scrollTo({
                            top: scrollPosition,
                            behavior: 'auto' // Use auto to avoid smooth scrolling animation
                        });
                    }, 10);
                });
            }
        }
    };

    return (
        <>
            <section className="pt-10 flex justify-center">
                <div className={'max-w-7xl w-full lg:flex justify-between px-2'}>
                    <div className={'flex flex-col w-full'}>
                        <span className={'px-2 text-2xl'}>
                            All Products
                        </span>

                        <div className={'grid grid-cols-1 lg:grid-cols-2 mt-4 gap-4'}>
                            <Productitem
                                ref={productItemRef}
                                onLoadingChange={setIsLoading}
                            />
                        </div>

                        {/* See More Button */}
                        <div className="flex justify-center mt-6 mb-8">
                            <motion.button
                                onClick={handleSeeMore}
                                className={`px-6 py-2 bg-[#F7A313] text-white rounded-full font-medium cursor-pointer ${isLoading ? 'opacity-70' : ''}`}
                                whileHover={{
                                    scale: 1.05,
                                    backgroundColor: "#e69200"
                                }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'See More'}
                            </motion.button>

                            {isLoading && (
                                <div className="ml-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F7A313]"></div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Allproducts