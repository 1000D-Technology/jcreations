import React, { useState, useEffect } from "react";

const OrderSummary = ({ subtotal, shipping, total, onCheckout, isCheckout = false, isEmpty = false, locationSelected = false }) => {
    const [initialShipping] = useState(shipping);
    // Update when shipping changes based on location selection
    const hasShippingChanged = shipping !== initialShipping;
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 w-full mx-auto ">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-medium text-gray-800">LKR {subtotal.toFixed(2)}</span>
            </div>
            
            <div className="mb-3 rounded-md  ">                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700">Shipping</span>
                        {hasShippingChanged && (
                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Updated</span>
                        )}
                    </div>                    <div className="flex flex-col items-end">
                        {locationSelected ? (
                            <span className="text-sm font-medium text-gray-800">LKR {shipping.toFixed(2)}</span>
                        ) : (
                            <span className="text-sm font-medium text-gray-800">-</span>
                        )}
                        {hasShippingChanged && locationSelected && (
                            <span className="text-xs text-gray-500 line-through">LKR {initialShipping.toFixed(2)}</span>
                        )}
                    </div>
                </div>                <div className="flex items-center mt-1.5">
                    <div className="flex items-center py-0.5 text-left">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-500 mr-1 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>                        <span className="text-xs text-amber-700">
                            {!locationSelected
                                ? "Please select your delivery location to view shipping cost."
                                : hasShippingChanged 
                                    ? "Shipping fee updated based on your delivery location." 
                                    : "Shipping fees change based on your delivery location."}
                        </span>
                    </div>
                </div>
            </div>
            <hr className="my-4 text-gray-300" />            <div className="flex justify-between items-center mb-4">
                <span className="text-base font-semibold text-gray-800">Total</span>
                <div className="flex flex-col items-end">
                    <span className="text-base font-bold text-amber-500">
                        {locationSelected ? 
                            `LKR ${(subtotal + shipping).toFixed(2)}` : 
                            `LKR ${subtotal.toFixed(2)} + Shipping`
                        }
                        {hasShippingChanged && locationSelected && (
                            <span className="ml-2 text-xs text-green-600 font-medium animate-pulse">
                                Updated
                            </span>
                        )}
                    </span>
                    {hasShippingChanged && (
                        <span className="text-xs text-gray-500 line-through">
                            LKR {total.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>            <button
                onClick={() => onCheckout()}
                disabled={isEmpty || (isCheckout && !locationSelected)}
                className={`w-full text-sm font-medium py-2 px-4 rounded-4xl transition ${
                    isEmpty || (isCheckout && !locationSelected)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-amber-500 text-black hover:bg-amber-600"
                }`}
            >
                {isCheckout ? "Confirm Order" : "Proceed to checkout"}
            </button>            {isEmpty && (
                <p className="text-red-500 text-xs mt-2 text-center">
                    Your cart is empty. Add items to proceed.
                </p>
            )}
            
            {!isEmpty && !locationSelected && (
                <p className="text-amber-600 text-xs mt-2 text-center">
                    Please select a delivery location to proceed.
                </p>
            )}
        </div>
    );
};

export default OrderSummary;