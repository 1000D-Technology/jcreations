import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRightLong } from "react-icons/fa6";
import api from '../../utils/axios.js';

function Hero() {
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);

    const storageUrl = import.meta.env.VITE_STORAGE_URL;

    // Fetch banner on component mount
    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const response = await api.get('/banner');
                if (response.status === 200 && response.data) {
                    setBanner(response.data);
                }
            } catch (err) {
                console.error('Error fetching banner:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, []);

// Function to scroll to products section with improved reliability
    const scrollToProducts = () => {
        // Short timeout to ensure DOM is fully loaded
        setTimeout(() => {
            // Try to find the products section - check for multiple possible IDs
            const productsSection =
                document.getElementById('products') ||
                document.getElementById('all-products') ||
                document.querySelector('.products-section');

            if (productsSection) {
                productsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                // Fallback: scroll down a reasonable amount if section not found
                window.scrollTo({
                    top: window.innerHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };
    // Define animation variants
    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    return (
        <>
            <section className="flex justify-center mt-10">
                <motion.div
                    className={'max-w-7xl w-full lg:flex md:flex justify-between hidden px-2'}
                    initial="hidden"
                    animate="visible"
                    variants={container}
                >
                    <div className={'flex flex-col w-1/2'}>
                        <motion.div variants={item}>
                            <div className={'bg-[#FEF4E3] rounded-full flex items-center w-96'}>
                                <motion.div
                                    className={'bg-[#F7A313] rounded-bl-3xl rounded-tl-3xl p-2 rounded-br-[50px]'}
                                    animate={{
                                        scale: [1, 1.05, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    🍰🎂🍫🍬🍭🕯️🎉
                                </motion.div>
                                <span className={'px-2'}>
                                    Eat delicious foods
                                </span>
                            </div>
                        </motion.div>

                        <motion.span
                            className={'lg:text-7xl font-bold leading-tight text-[#000F20] mt-6 md:text-5xl'}
                            variants={item}
                        >
                            Be The <motion.span
                            className={'text-[#F7A313]'}
                            animate={{
                                color: ["#F7A313", "#e69200", "#F7A313"]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >First</motion.span><br/> Delivery &<br/> Easy Pick Up
                        </motion.span>

                        <motion.p
                            className={'mt-4'}
                            variants={item}
                        >
                            We will deliver your food within 45 minutes in your town,If
                            we would fail,we will give the food free.
                        </motion.p>

                        <motion.div variants={item}>
                            <motion.div
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                            >
                                <button
                                    onClick={scrollToProducts}
                                    className={'flex items-center gap-2 bg-[#F7A313] text-white rounded-bl-3xl rounded-tr-3xl justify-center px-6 py-3 mt-4 w-56 cursor-pointer'}>
                                    Order Now
                                    <motion.div
                                        animate={{
                                            x: [0, 5, 0]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <FaArrowRightLong/>
                                    </motion.div>
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>

                    <motion.div
                        className={'w-1/2'}
                        variants={item}
                        whileHover={{scale: 1.02}}
                        transition={{duration: 0.3}}
                    >
                        <motion.img
                            src="/hero/herolg.webp"
                            alt="hero"
                            className={'w-full'}
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            transition={{duration: 0.7}}
                        />
                    </motion.div>
                </motion.div>
                <div className={'px-2 lg:hidden md:hidden w-full -mt-8'}>
                    <div className="w-full rounded-3xl shadow-lg overflow-hidden">
                        <div className="relative">
                            {loading ? (
                                // Loading state
                                <div className="w-full h-[250px] bg-gray-200 animate-pulse rounded-3xl flex items-center justify-center">
                                    <span className="text-gray-400">Loading banner...</span>
                                </div>
                            ) : (
                                <img
                                    src={banner?.image_path ? `${storageUrl}/${banner.image_path}` : "/hero/home back.webp"}
                                    alt="Banner"
                                    className="w-full h-[250px] object-cover rounded-3xl"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/hero/home back.webp";
                                        console.error("Failed to load banner image");
                                    }}
                                />
                            )}
                            {/*<div*/}
                            {/*    className="absolute top-8 right-8 bg-white p-2 rounded-lg shadow-md text-sm font-semibold text-gray-700">*/}
                            {/*    <div*/}
                            {/*        className="absolute -top-3 -right-3 stamp text-white text-xs p-4 rounded-full font-bold">*/}
                            {/*        %*/}
                            {/*    </div>*/}
                            {/*    <span className="text-2xl font-bold text-[#F7A313]">10%</span>*/}
                            {/*    <p className="text-sm font-medium">Discount <br/></p>*/}
                            {/*</div>*/}
                            {/*<div*/}
                            {/*    className="absolute bottom-4 left-4 p-2 rounded-lg shadow-md text-sm font-semibold text-gray-700">*/}
                            {/*    <span className={'font-bold leading-tight text-white mt-6 0 text-2xl'}>Be The <span*/}
                            {/*        className={'text-[#F7A313]'}>First</span><br/> Delivery &<br/> Easy Pick Up</span>*/}
                            {/*</div>*/}
                            <button
                                onClick={scrollToProducts}
                                className="absolute bottom-4 right-4 bg-[#F7A313] p-2 px-4 rounded-tl-3xl text-sm rounded-br-3xl text-white flex items-center gap-2 cursor-pointer">
                                Order Now <FaArrowRightLong/>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Hero