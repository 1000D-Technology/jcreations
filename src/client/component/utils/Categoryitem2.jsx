import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from "../../../utils/axios.js";
import { useNavigate } from 'react-router-dom';

function Categoryitem() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);
    const DEFAULT_IMAGE = "/placeholder.png";
    const navigate = useNavigate();

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                // Filter to only include active categories (status = true)
                const activeCategories = response.data.filter(category => category.status === true);
                setCategories(activeCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setError('Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Handle category click - navigate to category route
    const handleCategoryClick = (categoryId) => {
        navigate(`/category/${categoryId}`);
    };

    // Get image source with fallback
    const getImageSrc = (category) => {
        if (!category || !category.img) return DEFAULT_IMAGE;

        const storageUrl = import.meta.env.VITE_STORAGE_URL || 'https://jcreations.1000dtechnology.com/storage';
        return `${storageUrl}/${category.img}`;
    };

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
                when: "beforeChildren"
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    // Horizontal scroll handling
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const handleWheel = (e) => {
            if (window.innerWidth < 768) {
                e.preventDefault();
                scrollContainer.scrollLeft += e.deltaY;
            }
        };

        scrollContainer.addEventListener("wheel", handleWheel, { passive: false });
        return () => scrollContainer.removeEventListener("wheel", handleWheel);
    }, []);

    if (loading) {
        return (
            <motion.div
                className="w-full mt-4"
                initial="hidden"
                animate="visible"
                variants={container}
            >
                {/* Loading skeleton */}
                <div className="hidden md:grid md:grid-cols-6 md:gap-4">
                    {[...Array(6)].map((_, index) => (
                        <motion.div
                            key={index}
                            className="flex flex-col items-center"
                            variants={item}
                        >
                            <div className="rounded-full w-36 h-36 bg-gray-200 animate-pulse"></div>
                            <div className="mt-2 h-4 w-20 bg-gray-200 animate-pulse"></div>
                        </motion.div>
                    ))}
                </div>
                <div className="md:hidden flex gap-4 overflow-x-hidden px-2">
                    {[...Array(6)].map((_, index) => (
                        <motion.div
                            key={index}
                            className="flex-shrink-0 flex flex-col items-center"
                            variants={item}
                        >
                            <div className="rounded-full w-16 h-16 bg-gray-200 animate-pulse"></div>
                            <div className="mt-2 h-3 w-14 bg-gray-200 animate-pulse"></div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div
                className="w-full mt-4 text-center text-red-500"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring" }}
            >
                {error}
            </motion.div>
        );
    }

    return (
        <>
            <motion.div
                className="w-full mt-4 overflow-visible"
                initial="hidden"
                animate="visible"
                variants={container}
            >
                {/* Desktop view */}
                <div className="hidden md:grid md:grid-cols-6 md:gap-4">
                    {categories.map((category, index) => (
                        <motion.div
                            className="flex flex-col justify-center items-center cursor-pointer"
                            key={category.id || index}
                            variants={item}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCategoryClick(category.id)}
                        >
                            <motion.div
                                className="rounded-full flex flex-col items-center justify-center w-36 h-36 p-4 bg-[#FFF7E6] border-[#F7A313] border-2 shadow-gray-200"
                                whileHover={{
                                    borderColor: "#F7A313",
                                    boxShadow: "0px 4px 20px rgba(247, 163, 19, 0.25)",
                                    scale: 1.03
                                }}
                                transition={{ type: "spring", stiffness: 300 }}
                                initial={false}
                                animate={{ scale: 1 }}
                            >
                                <motion.img
                                    src={getImageSrc(category)}
                                    alt={category.name}
                                    className="w-20 h-20 object-contain"
                                    onError={(e) => { e.target.src = DEFAULT_IMAGE }}
                                />
                            </motion.div>
                            <motion.span
                                className="mt-2 text-center font-medium"
                                whileHover={{ color: "#F7A313" }}
                                initial={false}
                                animate={{ fontWeight: 500, scale: 1 }}
                            >
                                {category.name}
                            </motion.span>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile view with icons and names */}
                <div
                    ref={scrollRef}
                    className="md:hidden flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2 snap-x snap-mandatory"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {categories.map((category, index) => (
                        <motion.div
                            className="flex-shrink-0 snap-center flex flex-col items-center"
                            key={category.id || index}
                            variants={item}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCategoryClick(category.id)}
                        >
                            <motion.div
                                className="rounded-full flex items-center justify-center w-16 h-16 bg-[#FFF7E6] border-[#F7A313] border shadow-sm"
                                whileHover={{
                                    borderColor: "#F7A313",
                                    boxShadow: "0px 4px 10px rgba(247, 163, 19, 0.2)",
                                    scale: 1.03
                                }}
                                initial={false}
                                animate={{ scale: 1 }}
                            >
                                <motion.img
                                    src={getImageSrc(category)}
                                    alt={category.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => { e.target.src = DEFAULT_IMAGE }}
                                />
                            </motion.div>
                            <motion.span
                                className="mt-1 text-center text-xs font-medium w-20 truncate"
                                whileHover={{ color: "#F7A313" }}
                                initial={false}
                                animate={{ fontWeight: 500, scale: 1 }}
                            >
                                {category.name}
                            </motion.span>
                        </motion.div>
                    ))}
                </div>

                {/* Scroll indicator */}
                <AnimatePresence>
                    {categories.length > 4 && (
                        <motion.div
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md md:hidden z-10"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            whileHover={{ scale: 1.2, backgroundColor: "rgba(247, 163, 19, 0.1)" }}
                        >
                            <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 5L16 12L9 19" stroke="#F7A313" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            {/* Custom CSS */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
}

export default Categoryitem;