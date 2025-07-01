import React from "react";

const OrderConfirmed = ({ id }) => {
  return (
    <div className="max-w-7xl mx-auto mt-10 p-6 bg-white shadow-2xl rounded-xl">
      <div className="text-center">
        {/* Success Icon */}
        <div className="flex justify-center items-center mb-4">
          <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
            <img
              src="/carticons/Checked%20Icon.png"
              alt="Checked Icon"
              className="w-22 h-22"
            />
          </div>
        </div>

        {/* Confirmation Message */}
        <h2 className="text-3xl text-gray-800 mb-4">
          Your order is confirmed!
        </h2>
        <p className="text-gray-400 mb-3">
            <span className="text-center mb-3">Thank you for shopping with JCreations! Your treats</span> <br/>
            <span className="text-center mt-4">and gifts are being prepared with love.</span>
        </p>

        {/* Order Number */}
        <p className="text-md text-black mb-6">

        </p>

        {/* Continue Shopping Button */}
        <a 
          href=""
          className="inline-block mt-8 px-20 py-3 bg-yellow-500 text-black font-medium rounded-3xl shadow hover:bg-yellow-600 transition cursor-pointer"
        >
          Continue Shopping
        </a>

        {/* Contact Information */}
        <p className="text-sm text-gray-400 mt-3 mb-6">
          Questions? Contact us at{" "}
          <a
            href="mailto:jcreations.lk@gmail.com"
            className="underline"
          >
            jcreations.lk@gmail.com
          </a>{" "}
          or call <span className="font-medium">077 543 2440</span>.
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmed;
