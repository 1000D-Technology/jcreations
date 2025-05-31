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
                console.log("Ref current:", productItemRef.current);
                console.log("Has more:", productItemRef.current.hasMore);
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
            console.log("Loading changed, checking hasMore");
            setHasMoreItems(productItemRef.current.hasMore);
        }
    }, [isLoading]);

    // Function to handle "See More" button click
    const handleSeeMore = () => {
        console.log("See More clicked");
        if (productItemRef.current && productItemRef.current.loadMore) {
            productItemRef.current.loadMore();
        }
    };

    console.log("Rendering Allproducts. isLoading:", isLoading, "hasMoreItems:", hasMoreItems);

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
                            {/* Use regular button for 1-2 renders for testing */}
                            <motion.button
                                onClick={handleSeeMore}
                                className="px-6 py-2 bg-[#F7A313] text-white rounded-full font-medium cursor-pointer"
                                whileHover={{
                                    scale: 1.05,
                                    backgroundColor: "#e69200"
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                See More
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