import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaRegWindowClose, FaTags, FaEye } from "react-icons/fa";
import { AiOutlineReload } from "react-icons/ai";
import { BsThreeDots } from "react-icons/bs";
import OrderDetailsModal from './utils/OrderDetailsModal';
import useAuthStore from '../../stores/authStore';
import api from "../../utils/axios.js";
import toast from 'react-hot-toast';

function DashboardMain() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [dailySales, setDailySales] = useState(0);
    const [orderCount, setOrderCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    // Status options for dropdown
    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'returned', label: 'Returned' }
    ];

    // Status class mapping
    const statusClasses = {
        pending: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800',
        shipped: 'bg-orange-100 text-orange-800',
        delivered: 'bg-green-100 text-green-800',
        returned: 'bg-red-100 text-red-800'
    };

    useEffect(() => {
        if (!user || !user.roles || !user.roles.includes('admin')) {
            navigate('/adminlogin');
        } else {
            fetchOrders();
        }

        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, [user, navigate]);

    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Fetching orders from API');

            let response;
            try {
                response = await api.get('/orders');
                console.log('Successfully fetched from /orders');
            } catch (err) {
                console.log('Failed to fetch from /orders, trying /admin/orders');
                response = await api.get('/admin/orders');
                console.log('Successfully fetched from /admin/orders');
            }

            let ordersArray = [];

            if (Array.isArray(response.data)) {
                ordersArray = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                ordersArray = response.data.data;
            } else if (response.data.orders && Array.isArray(response.data.orders)) {
                ordersArray = response.data.orders;
            } else if (typeof response.data === 'object') {
                const possibleArrays = Object.values(response.data).filter(val =>
                    Array.isArray(val) && val.length > 0);
                if (possibleArrays.length > 0) {
                    ordersArray = possibleArrays[0];
                }
            }

            if (ordersArray.length > 0) {
                // Keep all orders including delivered and returned
                setPendingOrders(ordersArray);
                calculateDailyStats(ordersArray);
                setCurrentPage(1);

                if (ordersArray.length === 0) {
                    toast.info('No orders found');
                }
            } else {
                setPendingOrders([]);
                toast.info('No orders found in the system');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);

            if (error.response) {
                setError(`Server error: ${error.response.status}. ${error.response.data?.message || ''}`);
            } else if (error.request) {
                setError('Network error: No response from server.');
            } else {
                setError(`Request error: ${error.message}`);
            }

            toast.error('Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to update order status
    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingStatus(orderId);
        try {
            // Get token from auth store
            const token = user?.token;

            const response = await api.put(`/admin/orders/${orderId}/status`,
                { status: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Check for successful status code
            if (response.status === 200) {
                console.log('Status update response:', response.data);
                toast.success(response.data.message || `Order #${response.data.order_id} status updated successfully`);

                // Update the local state with the new status
                setPendingOrders(prevOrders =>
                    prevOrders.map(order =>
                        order.id === orderId ? {...order, status: newStatus} : order
                    )
                );

                // No need to fetch orders again as we want to keep all items in the list
                // Even if status changes to delivered or returned
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(`Failed to update status: ${errorMessage}`);

            // Log detailed error info for debugging
            if (error.response) {
                console.log('Error response:', error.response.data);
                console.log('Status code:', error.response.status);
            }
        } finally {
            setUpdatingStatus(null);
        }
    };

    const calculateDailyStats = (orders) => {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at).toISOString().split('T')[0];
            return orderDate === today;
        });

        setOrderCount(todayOrders.length);
        const totalSales = todayOrders.reduce((sum, order) => {
            return sum + parseFloat(order.total_amount || 0);
        }, 0);

        setDailySales(totalSales);
    };

    const handleRowClick = (orderId) => {
        setSelectedOrderId(orderId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    };

    const getGreeting = () => {
        const hour = currentDateTime.getHours();
        if (hour < 12) return 'Good Morning!';
        if (hour < 18) return 'Good Afternoon!';
        return 'Good Evening!';
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = pendingOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(pendingOrders.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const formattedDateTime = `${currentDateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | ${currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;

    return (
        <div className="flex flex-col">
            <div className="bg-[#F2EFE7] w-full h-[200px] px-6 pt-6">
                <div className="flex items-center justify-between px-6 pt-6 mb-6">
                    <h2 className="text-2xl font-semibold text-[#333333] mt-[-10px] ml-[-20px]">Dashboard</h2>
                    <span className="text-sm text-gray-500 mt-[-10px] absolute right-8">
                        {formattedDateTime} | {getGreeting()}
                    </span>
                </div>

                <div className="flex gap-6 b-8">
                    <div className="flex items-center gap-4 p-4 bg-white shadow-md rounded-xl w-60">
                        <div className="p-3 text-purple-600 bg-purple-100 rounded-full">
                            <FaMoneyBillWave size={20}/>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Today's Sales</p>
                            <p className="text-lg font-semibold">
                                {isLoading ? 'Loading...' : `LKR ${dailySales.toFixed(2)}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white shadow-md rounded-xl w-60">
                        <div className="p-3 text-green-600 bg-green-100 rounded-full">
                            <FaTags size={20}/>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Today's Orders</p>
                            <p className="text-lg font-semibold">
                                {isLoading ? 'Loading...' : orderCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-full w-full bg-white rounded-b-2xl">
                <div className="px-8 pt-4 flex justify-between">
                    <span className="text-lg font-semibold">All Orders</span>
                    <button
                        onClick={fetchOrders}
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                        <AiOutlineReload className="text-lg" />
                        <span className="text-sm">Refresh</span>
                    </button>
                </div>
                <div className="px-8 pt-8 pb-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                            <div className="text-red-500 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 mb-2">{error}</h3>
                            <button
                                onClick={fetchOrders}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : pendingOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No orders found</div>
                    ) : (
                        <>
                            <div className="overflow-auto max-h-[calc(100vh-350px)]">
                                <table className="w-full bg-white rounded-lg shadow-sm text-sm text-left table-fixed">
                                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[8%]">OrderID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">Address</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">Payment</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[7%]">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                        >
                                            <td className="px-4 py-3 truncate" onClick={() => handleRowClick(order.id)}>{order.id}</td>
                                            <td className="px-4 py-3 truncate" onClick={() => handleRowClick(order.id)}>{order.customer?.name || order.customer_name || 'Unknown'}</td>
                                            <td className="px-4 py-3 truncate" onClick={() => handleRowClick(order.id)}>{order.customer?.phone || order.contact_number || 'N/A'}</td>
                                            <td className="px-4 py-3 truncate" onClick={() => handleRowClick(order.id)}>{order.shipping_address || order.address || 'N/A'}</td>
                                            <td className="px-4 py-3 truncate" onClick={() => handleRowClick(order.id)}>{formatDateTime(order.created_at)}</td>
                                            <td className="px-4 py-3 truncate font-medium" onClick={() => handleRowClick(order.id)}>
                                                LKR {parseFloat(order.total_amount || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3" onClick={() => handleRowClick(order.id)}>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        order.payment_type === 'cod' || order.payment_type === 'cash_on_delivery'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-green-100 text-green-800'
                                                    }`}
                                                >
                                                    {order.payment_type === 'cod' || order.payment_type === 'cash_on_delivery'
                                                        ? 'COD'
                                                        : order.payment_type === 'card_payment'
                                                            ? 'Card'
                                                            : 'Online'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                {updatingStatus === order.id ? (
                                                    <div className="w-24 h-6 flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-amber-500"></div>
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={order.status || 'pending'}
                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                        className={`px-2 py-1 rounded-md text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500 ${statusClasses[order.status] || 'bg-gray-100 text-gray-700'}`}
                                                    >
                                                        {statusOptions.map(option => {
                                                            // Define status workflow order
                                                            const statusOrder = {
                                                                'pending': 0,
                                                                'in_progress': 1,
                                                                'delivered': 2,
                                                                'returned': 3
                                                            };

                                                            // Disable if option is the current status or comes before it
                                                            const currentStatusOrder = statusOrder[order.status || 'pending'];
                                                            const optionStatusOrder = statusOrder[option.value];
                                                            const shouldDisable = optionStatusOrder <= currentStatusOrder;

                                                            return (
                                                                <option
                                                                    key={option.value}
                                                                    value={option.value}
                                                                    disabled={shouldDisable}
                                                                >
                                                                    {option.label}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleRowClick(order.id)}
                                                    className="w-full h-full flex justify-center items-center cursor-pointer"
                                                    aria-label={`View details of order #${order.id}`}
                                                >
                                                    <BsThreeDots className="text-blue-400 text-lg hover:text-blue-600"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <nav className="flex items-center">
                                        <button
                                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 rounded-md mr-2 bg-gray-100 text-gray-700 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>

                                        <div className="flex space-x-1">
                                            {[...Array(totalPages).keys()].map(number => (
                                                <button
                                                    key={number + 1}
                                                    onClick={() => paginate(number + 1)}
                                                    className={`px-3 py-1 rounded-md ${
                                                        currentPage === number + 1
                                                            ? 'bg-amber-500 text-white'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {number + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 rounded-md ml-2 bg-gray-100 text-gray-700 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </nav>
                                </div>
                            )}

                            <div className="text-center text-gray-500 text-sm mt-4">
                                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, pendingOrders.length)} of {pendingOrders.length} orders
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={closeModal}
                orderId={selectedOrderId}
            />
        </div>
    )
}

export default DashboardMain