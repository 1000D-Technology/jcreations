import React, { useState, useEffect } from 'react'
import api from '../../utils/axios.js';
import toast from 'react-hot-toast';
import useCartStore from '../../stores/cartStore'; // Import the cart store
import BottomNavigator from "../component/BottomNavigator.jsx";
import Header from "../component/Header.jsx";
import CartNavigator from '../component/utils/CartNavigator.jsx';
import CartItemDemo from '../component/utils/CartItemDemo.jsx';
import OrderSummary from '../component/utils/OrderSummery.jsx';
import Additionalnotes from '../component/utils/AdditionalNotes.jsx';
import DeliveryInfo from '../component/utils/DeliveryInfo.jsx';
import PaymentMethodSelector from '../component/utils/PaymentMethodSelector.jsx';
import OrderConfirmed from '../component/utils/OrderConfirmed.jsx';

function Cart() {
    // Get cart functions from the store
    const { decreaseItemQuantity } = useCartStore();
    const [orderId, setOrderId] = useState(localStorage.getItem('jcreations_order_id') || null);
    
    useEffect(() => {
        // Scroll to top when cart page loads
        window.scrollTo(0, 0);
    }, []);

    // Sample cart items (fallback data)
    const [cartItems, setCartItems] = useState([]);

    // Add state to track items being removed
    const [removingItems, setRemovingItems] = useState([]);

    // Replace showCartItems with currentStep to track all three stages
    const [currentStep, setCurrentStep] = useState(1);

    // Add state for login status and popup
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginPopup, setShowLoginPopup] = useState(false);

    // Add these at the top with other state variables
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('online');
    const [deliveryInfo, setDeliveryInfo] = useState({
        customer_name: '',
        contact_number: '',
        city: '',
        address: ''
    });

    // Add a new state variable at the top with your other state variables
    const [isLoading, setIsLoading] = useState(false);

    // Add this in the Cart component where other state variables are defined
    const [shipping, setShipping] = useState(300); // Default shipping cost

    // Check if cart is empty
    const isEmpty = cartItems.length === 0;

    const handleRemove = async (id) => {
        try {
            // Add item to removing state first for animation
            setRemovingItems(prev => [...prev, id]);

            // Update UI immediately using zustand
            decreaseItemQuantity(id);

            // Get cart ID from local storage
            const cartId = localStorage.getItem('jcreations_cart_id');
            if (cartId) {
                // Keep existing API call
                await api.delete(`/cart/items/${id}`, {
                    data: { cart_id: parseInt(cartId) }
                });

                // Short delay for animation to complete
                setTimeout(() => {
                    // Update local state after successful API call
                    setCartItems(cartItems.filter((item) => item.id !== id));
                    toast.success("Item removed from cart");
                    // Remove from the removing items array
                    setRemovingItems(prev => prev.filter(itemId => itemId !== id));
                }, 300);
            } else {
                toast.error("Cart information not found");
                setRemovingItems(prev => prev.filter(itemId => itemId !== id));
            }
        } catch (error) {
            console.error("Error removing item from cart:", error);
            toast.error("Failed to remove item from cart");
            // Also remove from removing items array in case of error
            setRemovingItems(prev => prev.filter(itemId => itemId !== id));
        }
    };

    const handleIncreaseQuantity = async (id) => {
        try {
            const item = cartItems.find(item => item.id === id);
            if (!item) return;

            // Get cart ID from local storage
            const cartId = localStorage.getItem('jcreations_cart_id');
            if (cartId) {
                // Updated API endpoint to /cart/items/{id}
                await api.put(`/cart/items/${id}`, {
                    quantity: item.quantity + 1,
                    cart_id: parseInt(cartId)
                });

                // Update local state after successful API call
                setCartItems(
                    cartItems.map((cartItem) =>
                        cartItem.id === id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                    )
                );
            } else {
                toast.error("Cart information not found");
            }
        } catch (error) {
            console.error("Error increasing quantity:", error);
            toast.error("Failed to update quantity");
        }
    };

    const handleDecreaseQuantity = async (id) => {
        try {
            const item = cartItems.find(item => item.id === id);
            if (!item || item.quantity <= 1) return;

            // Update UI immediately using zustand
            decreaseItemQuantity(id);

            // Keep existing API call
            const cartId = localStorage.getItem('jcreations_cart_id');
            if (cartId) {
                await api.put(`/cart/items/${id}`, {
                    quantity: item.quantity - 1,
                    cart_id: parseInt(cartId)
                });

                // Update local state after successful API call
                setCartItems(
                    cartItems.map((cartItem) =>
                        cartItem.id === id ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
                    )
                );
            } else {
                toast.error("Cart information not found");
            }
        } catch (error) {
            console.error("Error decreasing quantity:", error);
            toast.error("Failed to update quantity");
        }
    };

    const handleShippingChange = (charge) => {
        setShipping(charge);
        console.log(`Shipping charge updated to: ${charge}`);
    };

    // Calculate order summary values using the pre-calculated effective price
    const subtotal = cartItems.reduce((total, item) => {
        return total + (item.effectivePrice * item.quantity);
    }, 0);

    const total = subtotal + shipping;

    // Add this useEffect to load Payhere SDK
    useEffect(() => {
        // Load Payhere SDK script
        const script = document.createElement('script');
        script.src = 'https://www.payhere.lk/lib/payhere.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup if needed
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // Update the handleCheckout function to skip login dialog if user is logged in
    const handleCheckout = async () => {
        // Don't proceed if cart is empty
        if (isEmpty) {
            return;
        }

        if (currentStep === 1) {
            // Check if user is logged in - directly check localStorage
            const userId = localStorage.getItem('jcreations_user_uid');
            if (!userId) {
                // Only show login popup if no user ID exists
                setShowLoginPopup(true);
                return;
            }

            // Move from cart to checkout immediately if user is logged in
            setCurrentStep(2);
            console.log("Proceeding to checkout with items:", cartItems);
        } else if (currentStep === 2) {
            // Validate delivery info
            const requiredFields = ['customer_name', 'contact_number', 'city', 'address'];
            const missingFields = requiredFields.filter(field => !deliveryInfo[field]);

            if (missingFields.length > 0) {
                toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
                return;
            }

            // Set loading state to true before API call
            setIsLoading(true);

            try {
                // Get cart ID from local storage
                const cartId = localStorage.getItem('jcreations_cart_id');
                if (!cartId) {
                    toast.error('Cart information not found');
                    setIsLoading(false);
                    return;
                }

                // Get Firebase UID from the correct localStorage key
                const userId = localStorage.getItem('jcreations_user_uid');

                // Prepare request body
                const orderData = {
                    cart_id: parseInt(cartId),
                    customer_name: deliveryInfo.customer_name,
                    contact_number: deliveryInfo.contact_number,
                    city: deliveryInfo.city,
                    address: deliveryInfo.address,
                    req_datetime: new Date().toISOString(),
                    total_amount: total.toFixed(2) // Include calculated total with discounts
                };

                // Add firebase_uid only if available
                if (userId) {
                    orderData.firebase_uid = userId;
                }

                let response;

                if (selectedPaymentMethod === 'cod') {
                    // Cash on Delivery API endpoint
                    response = await api.post('/orders/cod', orderData);
                    console.log('COD order placed successfully:', response.data);

                    // Move to order confirmation for COD
                    if (response && response.data) {
                        if (response.data.orderId) {
                            localStorage.setItem('jcreations_order_id', response.data.orderId);
                            setOrderId(response.data.orderId);
                        }
                        setCurrentStep(3);
                    }
                } else {
                    // For online payment, send to a different endpoint
                    response = await api.post('/orders/online', orderData);
                    console.log('Online payment order initiated:', response.data);

                    // Check if the response has the necessary data
                    if (response && response.data) {
                        const responseData = response.data;

                        // Store order ID before initiating payment
                        if (responseData.order_id) {
                            localStorage.setItem('jcreations_order_id', responseData.order_id);
                            setOrderId(responseData.order_id);
                        }

                        // Check if Payhere SDK is loaded
                        if (typeof window.payhere !== 'undefined') {
                            console.log("Opening Payhere payment gateway...");

                            // Format the items for Payhere
                            const itemsDescription = cartItems
                                .map(item => `${item.name} x${item.quantity}`)
                                .join(', ');

                            // Get payment data from the response
                            const paymentData = responseData.payment_data;

                            if (!paymentData) {
                                throw new Error("Payment data not received from server");
                            }

                            // Configure Payhere payment using data from the API response
                            const payment = {
                                sandbox: true,
                                merchant_id: paymentData.merchant_id,
                                return_url: window.location.origin + '/payment-success',
                                cancel_url: window.location.origin + '/payment-cancelled',
                                notify_url: import.meta.env.VITE_PAYHERE_NOTIFY_URL || 'https://jcreations.1000dtechnology.com/api/payhere/notify',
                                order_id: paymentData.order_id.toString(),
                                items: itemsDescription,
                                amount: paymentData.amount,
                                currency: paymentData.currency,
                                first_name: deliveryInfo.customer_name.split(' ')[0] || "Customer",
                                last_name: deliveryInfo.customer_name.split(' ').slice(1).join(' ') || "",
                                email: "customer@jcreations.com",
                                phone: deliveryInfo.contact_number,
                                address: deliveryInfo.address,
                                city: deliveryInfo.city,
                                country: "Sri Lanka",
                                delivery_address: deliveryInfo.address,
                                delivery_city: deliveryInfo.city,
                                delivery_country: "Sri Lanka",
                                hash: paymentData.hash, // Include the hash from API response
                                custom_1: localStorage.getItem('firebase_uid') || "",
                                custom_2: localStorage.getItem('jcreations_cart_id') || ""
                            };

                            console.log("Payhere payment configuration:", payment);

                            // Define event handlers BEFORE calling startPayment
                            window.payhere.onCompleted = function onCompleted(orderId) {
                                console.log("Payment completed. Order ID:" + orderId);
                                toast.success("Payment successful!");
                                setCurrentStep(3);
                                setIsLoading(false);
                            };

                            window.payhere.onDismissed = function onDismissed() {
                                console.log("Payment dismissed");
                                toast.error("Payment cancelled");
                                setIsLoading(false);
                            };

                            window.payhere.onError = function onError(error) {
                                console.log("Payment error:" + error);
                                toast.error("Payment failed: " + error);
                                setIsLoading(false);
                            };

                            // Important: Start the payment AFTER setting up event handlers
                            try {
                                window.payhere.startPayment(payment);
                            } catch (e) {
                                console.error("Error starting Payhere payment:", e);
                                toast.error("Could not start payment process");
                                setIsLoading(false);
                            }

                            // Don't proceed to next step yet - wait for payment completion
                            return;
                        } else {
                            // Fallback if SDK is not loaded
                            console.error("Payhere SDK not loaded");
                            toast.error("Payment gateway is not available. Please try again later.");
                            setIsLoading(false);
                        }
                    } else {
                        console.error("Invalid response from API");
                        toast.error("Could not process payment. Please try again later.");
                        setIsLoading(false);
                    }
                }

                // Only move to next step if API call was successful (for COD)
                // For online payment, this is handled in the onCompleted callback
            } catch (error) {
                console.error('Error placing order:', error);

                // Provide more specific error messages based on error type
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    toast.error(`Order failed: ${error.response.data.message || 'Please try again later'}`);
                } else if (error.request) {
                    // The request was made but no response was received
                    toast.error('Network error. Please check your internet connection and try again.');
                } else {
                    // Something happened in setting up the request
                    toast.error('Failed to place order. Please try again.');
                }
            } finally {
                // Reset loading state regardless of success or failure
                setIsLoading(false);
            }
        }
    };

    const handleBackToCart = () => {
        setCurrentStep(1);
    };

    const handleLoginRedirect = () => {
        // Redirect to login page
        console.log("Redirecting to login page");
        // Implementation would depend on your routing setup
        window.location.href = '/signin';
        setShowLoginPopup(false);
    };

    const handleContinueAsGuest = () => {
        setShowLoginPopup(false);
        setCurrentStep(2);
        console.log("Continuing as guest");
    };

    const handleClosePopup = () => {
        setShowLoginPopup(false);
    };

    useEffect(() => {
        const fetchCartData = async () => {
            try {
                const cartId = localStorage.getItem('jcreations_cart_id');
                if (cartId) {
                    const response = await api.get(`/cart/${cartId}`);
                    console.log("Raw cart data:", response.data);

                    if (response.data && response.data.items && response.data.items.length > 0) {
                        // Transform API response to match our component's format
                        const transformedItems = response.data.items.map(item => {
                            // Calculate effective price with discount applied
                            const effectivePrice = item.product.discount_percentage > 0
                                ? item.product.price * (1 - item.product.discount_percentage / 100)
                                : item.product.price;

                            return {
                                id: item.id,
                                name: item.product.name,
                                price: item.product.price,
                                effectivePrice: effectivePrice, // Store calculated price
                                quantity: item.quantity,
                                image: item.product.images && item.product.images.length > 0
                                    ? `${import.meta.env.VITE_STORAGE_URL}/${item.product.images[0]}`
                                    : "/category/cake.svg", // Default image if none available
                                product_id: item.product_id,
                                discount_percentage: item.product.discount_percentage || 0
                            };
                        });

                        setCartItems(transformedItems);
                        console.log("Cart data transformed successfully:", transformedItems);
                    }
                } else {
                    console.log("No cart ID found in local storage");
                    // Continue with default cart items from state
                }
            } catch (error) {
                console.error("Error fetching cart data:", error);
                // Keep using the default cart items on error
            }
        };

        fetchCartData();

        // Check login status using the correct localStorage key
        const userId = localStorage.getItem('jcreations_user_uid');
        setIsLoggedIn(!!userId);
    }, []);

    return (
        <div>
            <main className="w-full">
                <CartNavigator currentStep={currentStep} />
                {currentStep === 1 && (
                    // Original layout for cart view
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 px-4 py-6 pt-28 lg:mt-10 md:p-5">
                        <div className="w-full md:w-3/5 transition-all duration-300 ease-in-out ">
                            <CartItemDemo
                                cartItems={cartItems}
                                onRemove={handleRemove}
                                onIncreaseQuantity={handleIncreaseQuantity}
                                onDecreaseQuantity={handleDecreaseQuantity}
                                removingItems={removingItems} // Pass the removing items array
                            />
                        </div>
                        <div className="w-full md:w-2/5">
                            <OrderSummary
                                subtotal={subtotal}
                                shipping={shipping}
                                total={total}
                                onCheckout={handleCheckout}
                                isCheckout={false}
                                isEmpty={isEmpty}
                            />
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    // Restructured layout for checkout
                    <div className="max-w-7xl mx-auto px-4 py-6 pt-28 md:p-28 transition-all duration-300 ease-in-out">
                        <div className="flex justify-start items-center mb-4">
                            <button
                                onClick={handleBackToCart}
                                className="text-amber-500 hover:text-amber-300 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Back to Cart
                            </button>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                            <div className="w-full md:w-3/5 space-y-4">
                                <DeliveryInfo
                                    deliveryInfo={deliveryInfo}
                                    setDeliveryInfo={setDeliveryInfo}
                                    onShippingChange={handleShippingChange}
                                />
                                <PaymentMethodSelector
                                    total={total}
                                    selectedMethod={selectedPaymentMethod}
                                    onSelectPaymentMethod={setSelectedPaymentMethod}
                                />
                                <Additionalnotes />
                            </div>
                            <div className="w-full md:w-2/5 mt-4 md:mt-0">
                                <OrderSummary
                                    subtotal={subtotal}
                                    shipping={shipping}
                                    total={total}
                                    onCheckout={handleCheckout}
                                    isCheckout={true}
                                    isEmpty={isEmpty}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    // Order confirmation
                    <div className="max-w-7xl mx-auto px-4 py-10 pt-20 md:p-20 transition-all duration-300 ease-in-out">
                        <OrderConfirmed id={orderId} />
                    </div>
                )}

                {/* Login Popup */}
                {showLoginPopup && (
                    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl shadow-amber-400 p-4 md:p-6 w-full max-w-md animate-fade-in border border-gray-200 relative">
                            <button
                                onClick={handleClosePopup}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-400 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="mb-4 md:mb-6 mt-2 md:mt-4">
                                <img src="./carticons/Good Idea Icon.png" className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4" alt="Idea Icon" />
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleLoginRedirect}
                                    className="w-full bg-black hover:bg-amber-500 hover:text-black text-white font-medium py-3 md:py-4 px-3 md:px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm md:text-base"
                                >
                                    Log In for Best Experience
                                </button>
                                <button
                                    onClick={handleContinueAsGuest}
                                    className="w-full bg-white hover:bg-amber-500 hover:text-black text-amber-500 border-2 border-amber-500 font-medium py-3 md:py-4 px-3 md:px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm md:text-base"
                                >
                                    Checkout without Logging In
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
                        <div className="bg-white/80 p-6 rounded-lg shadow-lg flex flex-col items-center border border-white/40">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
                            <p className="text-gray-700">Processing your order...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default Cart