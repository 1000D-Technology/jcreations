import React, { useEffect, useState } from "react";
import api from "../../../utils/axios.js";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

const OrderDetailsModal = ({ isOpen, onClose, orderId }) => {
    const [showModal, setShowModal] = useState(false);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setShowModal(true);
            if (orderId) {
                fetchOrderDetails(orderId);
            }
        } else {
            setTimeout(() => {
                setShowModal(false);
                setOrder(null);
            }, 300);
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/orders/${id}`);
            console.log('Order details:', response.data);

            let orderData;
            if (response.data.data) {
                orderData = response.data.data;
            } else if (response.data.order) {
                orderData = response.data.order;
            } else {
                orderData = response.data;
            }

            setOrder(orderData);
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError('Failed to load order details');
            toast.error('Could not load order details');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    };

    const getStatusClass = (status) => {
        const statusClasses = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    };

    if (!showModal && !isOpen) return null;

    return (
        <div
            className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 ${
                isOpen ? "bg-white/30 opacity-100" : "bg-transparent opacity-0"
            }`}
            onClick={onClose}
        >
            <div
                className={`bg-white/80 backdrop-filter backdrop-blur-md shadow-xl rounded-xl w-full max-w-2xl p-6 relative border border-white/20 transition-all duration-300 ${
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={onClose}
                >
                    ✕
                </button>

                {loading ? (
                    <div className="py-12 flex justify-center items-center">
                        <FaSpinner className="animate-spin text-amber-500 text-3xl" />
                    </div>
                ) : error ? (
                    <div className="py-12 text-center">
                        <p className="text-red-500 mb-2">{error}</p>
                        <button
                            onClick={() => fetchOrderDetails(orderId)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : order ? (
                    <>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">
                                Order #{order.id}
                            </h2>
                            <p className="text-sm text-gray-500">Date: {formatDateTime(order.created_at)}</p>
                            <span
                                className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-2 ${getStatusClass(order.status)}`}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                            </span>
                            <p className="text-lg text-green-500">Requested Date: {formatDateTime(order.req_datetime)}</p>
                        </div>

                        <div className="space-y-1 mb-4 text-sm text-gray-700">
                        <p><span className="font-medium">Customer:</span> {order.customer?.name || order.customer_name || 'N/A'}</p>
                            <p><span className="font-medium">Contact:</span> {order.customer?.phone || order.contact_number || 'N/A'}</p>
                            <p><span className="font-medium">Email:</span> {order.customer?.email || order.email || 'N/A'}</p>
                            <p><span className="font-medium">Address:</span> {order.shipping_address || order.address || 'N/A'}</p>
                            <p><span className="font-medium">Payment Method:</span> {
                                order.payment_type === 'cod'
                                    ? 'Cash on Delivery'
                                    : order.payment_type === 'card_payment'
                                        ? 'Card Payment'
                                        : 'Online Payment'
                            }</p>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-medium mb-2">Order Items</h3>
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-sm text-left">                                    <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Product</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Price</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Qty</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider text-right">Subtotal</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {(order.items || order.order_items || []).map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-3 py-3">                                                <div>
                                                    <p className="font-medium">{item.product?.name || item.product_name || 'Unknown Product'}</p>
                                                    {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                                                    {/* Display wish message when it exists */}
                                                    {item.wish && (
                                                        <div className="mt-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="flex items-center justify-center w-5 h-5 bg-amber-100 rounded-full">
                                                                    <span className="text-amber-600 text-xs">✨</span>
                                                                </div>
                                                                <span className="text-xs font-medium text-amber-800">Special Message:</span>
                                                            </div>
                                                            <p className="text-sm text-amber-700 italic font-medium pl-7">"{item.wish}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                LKR {parseFloat(item.price || item.unit_price || 0).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {item.quantity || 1}
                                            </td>
                                            <td className="px-3 py-3 text-right font-medium">
                                                LKR {parseFloat((item.price || item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}

                                    {(!order.items && !order.order_items || (order.items || order.order_items || []).length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="px-3 py-3 text-center text-gray-500">
                                                No items found for this order
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="text-right mt-4 space-y-1 text-sm">
                                <p className="text-gray-600">Subtotal: <span className="font-medium">LKR {parseFloat(order.subtotal || (order.total_amount || 0)).toFixed(2)}</span></p>
                                {order.shipping_fee ? (
                                    <p className="text-gray-600">Shipping: <span className="font-medium">LKR {parseFloat(order.shipping_fee || 0).toFixed(2)}</span></p>
                                ) : null}
                                {order.discount ? (
                                    <p className="text-gray-600">Discount: <span className="font-medium">- LKR {parseFloat(order.discount || 0).toFixed(2)}</span></p>
                                ) : null}
                                <p className="text-lg font-semibold mt-2">Total: <span className="text-amber-600">LKR {parseFloat(order.total_amount || 0).toFixed(2)}</span></p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-8 text-center text-gray-500">
                        No order information available
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetailsModal;