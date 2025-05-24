import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import CartItem from "./CartItem.jsx";

const CartItemDemo = ({ cartItems, onRemove, onIncreaseQuantity, onDecreaseQuantity, removingItems = [] }) => {
    return (
        <div className="flex flex-col -mt-20 lg:mt-0 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold mb-4">Shopping Cart</h2>

                <AnimatePresence>
                    {cartItems.length > 0 ? (
                        cartItems.map((item) => (
                            <motion.div
                                key={item.id}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.3 }}
                                className={removingItems.includes(item.id) ? "opacity-50 scale-95 transition-all duration-300" : ""}
                            >
                                <CartItem
                                    item={{
                                        ...item,
                                        // Pass both original and effective price for display
                                        originalPrice: item.price,
                                        effectivePrice: item.effectivePrice,
                                        isDiscounted: item.discount_percentage > 0
                                    }}
                                    onRemove={onRemove}
                                    onIncreaseQuantity={onIncreaseQuantity}
                                    onDecreaseQuantity={onDecreaseQuantity}
                                    isRemoving={removingItems.includes(item.id)}
                                />
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center p-8">
                            <p className="text-gray-500">Your cart is empty</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CartItemDemo;