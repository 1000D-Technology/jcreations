import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaMinus, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useParams, useLocation } from 'react-router-dom';
import api from '../../utils/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion'; // Add framer-motion for animations

function SingleProduct() {
    // Get the ID parameter from the URL
    const { id } = useParams();
    const location = useLocation();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [direction, setDirection] = useState(0); // For slide direction

    useEffect(() => {
        // Scroll to top when cart page loads
        window.scrollTo(0, 0);
    }, []);


    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get UID from search params if available
                const searchParams = new URLSearchParams(location.search);
                const uid = searchParams.get('uid');

                console.log(`Fetching product ID: ${id} with UID: ${uid || 'none'}`);

                // Make the API request
                const response = await api.get(`/product/single/${id}`, {
                    params: uid ? { uid } : {}
                });

                console.log("API response:", response.data);
                setProduct(response.data);
            } catch (err) {
                console.error("Error fetching product:", err);
                setError(err.response?.data?.message || "Failed to load product");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id, location.search]);

    // Image slider navigation
    const nextImage = () => {
        if (!product?.images?.length) return;
        setDirection(1);
        setCurrentImageIndex((prev) =>
            prev === product.images.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        if (!product?.images?.length) return;
        setDirection(-1);
        setCurrentImageIndex((prev) =>
            prev === 0 ? product.images.length - 1 : prev - 1
        );
    };

    const goToImage = (index) => {
        if (index > currentImageIndex) setDirection(1);
        else if (index < currentImageIndex) setDirection(-1);
        setCurrentImageIndex(index);
    };

    const handleIncrease = () => {
        setQuantity(prevQuantity => prevQuantity + 1);
    };

    const handleDecrease = () => {
        setQuantity(prevQuantity => (prevQuantity > 1 ? prevQuantity - 1 : 1));
    };

    const handleAddToCart = async () => {
        if (product?.status !== "in_stock") {
            toast.error("This product is out of stock");
            return;
        }

        try {
            const existingCartId = localStorage.getItem("jcreations_cart_id");
            const payload = {
                product_id: product.id,
                quantity: quantity
            };
            if (existingCartId) {
                payload.cart_id = existingCartId;
            }

            // Include UID if present in URL
            const searchParams = new URLSearchParams(location.search);
            const uid = searchParams.get('uid');
            if (uid) {
                payload.uid = uid;
            }

            const response = await api.post("/cart/items", payload);
            if (response.data && response.data.cart_id) {
                localStorage.setItem("jcreations_cart_id", response.data.cart_id);
            }

            toast.success("Added to cart successfully");
        } catch (err) {
            console.error("Error adding to cart:", err);
            toast.error(err.response?.data?.message || "Failed to add item to cart");
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl">Loading product details...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl text-red-500">Error: {error}</p>
            </div>
        );
    }

    // Product not found
    if (!product) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl">Product not found</p>
            </div>
        );
    }

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <>
            <section className="pt-0 -mt-4 lg:mt-2 flex justify-center">
                <div className="max-w-7xl w-full mt-10 lg:mt-0 px-5 lg:px-2">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.history.back()}>
                        <span className="font-semibold text-sm text-gray-500"><FaArrowLeft /></span>
                        <span className="font-semibold text-sm text-gray-500">Back to Home</span>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden mt-3 lg:flex">
                        <div className="relative w-full lg:w-1/3">
                            {/* Discount tag */}
                            {product.discount_percentage > 0 && product.status === "in_stock" && (
                                <div className="absolute top-0 left-0 bg-[#F7A313] text-white py-1 px-6 rounded-br-2xl text-sm w-1/3 text-center font-semibold z-10">
                                    {product.discount_percentage}% OFF
                                </div>
                            )}

                            {/* Out of Stock tag */}
                            {product.status !== "in_stock" && (
                                <div className="absolute top-0 left-0 bg-gray-500 text-white py-1 px-6 rounded-br-2xl text-sm w-1/3 text-center font-semibold z-10">
                                    Out of Stock
                                </div>
                            )}

                            {/* Image Slider */}
                            <div className="relative w-full h-[300px] lg:h-[400px] overflow-hidden">
                                {product.images && product.images.length > 0 && (
                                    <>
                                        <AnimatePresence initial={false} custom={direction}>
                                            <motion.img
                                                key={currentImageIndex}
                                                custom={direction}
                                                variants={variants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{
                                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                                    opacity: { duration: 0.2 }
                                                }}
                                                src={`https://jcreations.1000dtechnology.com/storage/${product.images[currentImageIndex]}`}
                                                alt={`${product.name} - view ${currentImageIndex + 1}`}
                                                className={`absolute w-full h-full object-contain ${product.status !== "in_stock" ? 'opacity-70' : ''}`}
                                            />
                                        </AnimatePresence>

                                        {/* Navigation arrows */}
                                        {product.images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-2 z-10"
                                                >
                                                    <FaChevronLeft />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-2 z-10"
                                                >
                                                    <FaChevronRight />
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Image dots/indicators */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex justify-center gap-2 py-4">
                                    {product.images.map((_, index) => (
                                        <div
                                            key={index}
                                            onClick={() => goToImage(index)}
                                            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                                                currentImageIndex === index
                                                    ? 'bg-[#F7A313] scale-125'
                                                    : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Thumbnail images */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex justify-center gap-2 pb-4 overflow-x-auto px-2">
                                    {product.images.map((image, index) => (
                                        <div
                                            key={index}
                                            className={`min-w-[60px] h-[60px] rounded-md border-2 cursor-pointer ${
                                                currentImageIndex === index ? 'border-[#F7A313]' : 'border-gray-200'
                                            }`}
                                            onClick={() => goToImage(index)}
                                        >
                                            <img
                                                src={`https://jcreations.1000dtechnology.com/storage/${image}`}
                                                alt={`${product.name} thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover rounded"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 lg:pl-10 w-full lg:w-2/3">
                            <h2 className="text-lg lg:text-xl font-semibold text-gray-800">
                                {product.name}
                            </h2>

                            {/* Product Status */}
                            <div className="mt-2 mb-2">
                                {product.status === "in_stock" ? (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                        In Stock
                                    </span>
                                ) : (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                        Out of Stock
                                    </span>
                                )}
                            </div>

                            {/* Price display */}
                            <h3 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                                {product.discount_percentage > 0 ? (
                                    <>
                                        <span className="text-[#F7A313]">
                                            LKR.{(product.price * (1 - product.discount_percentage / 100)).toFixed(2)}
                                        </span>
                                        <span className="text-gray-400 text-sm line-through">
                                            LKR.{product.price.toFixed(2)}
                                        </span>
                                    </>
                                ) : (
                                    <span>LKR.{product.price.toFixed(2)}</span>
                                )}
                            </h3>

                            <p className="text-gray-400 text-sm mb-4 w-full lg:w-3/4">
                                {product.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 lg:mt-10">
                                    <button
                                        className={`${product.status === "in_stock" ? 'bg-black' : 'bg-gray-400'} text-white font-bold p-2 rounded-full ${product.status !== "in_stock" ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        onClick={handleDecrease}
                                        disabled={product.status !== "in_stock"}
                                    >
                                        <FaMinus />
                                    </button>
                                    <p className="px-2 font-bold text-lg">{quantity}</p>
                                    <button
                                        className={`${product.status === "in_stock" ? 'bg-[#F7A313]' : 'bg-gray-400'} text-white font-bold p-2 rounded-full ${product.status !== "in_stock" ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        onClick={handleIncrease}
                                        disabled={product.status !== "in_stock"}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            </div>

                            <button
                                className={`${product.status === "in_stock" ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'} text-white font-semibold p-2 w-full lg:w-3/4 rounded-lg mt-5 lg:mt-10 text-sm`}
                                onClick={handleAddToCart}
                                disabled={product.status !== "in_stock"}
                            >
                                {product.status === "in_stock" ? "Add to Order" : "Out of Stock"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default SingleProduct;