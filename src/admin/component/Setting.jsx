import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import contactData from '../../json/contact.json';
import toast, { Toaster } from 'react-hot-toast';

function Setting() {
    const [deliveryLocations, setDeliveryLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        city: '',
        shipping_charge: 0,
        is_active: true
    });
    const [editId, setEditId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Contact number state
    const [contactNumber, setContactNumber] = useState('');
    const [updatingContact, setUpdatingContact] = useState(false);
    const [mobileNumberData, setMobileNumberData] = useState(null);
    const [fetchingContact, setFetchingContact] = useState(false);

    // Date and time state
    const [currentDateTime, setCurrentDateTime] = useState(new Date());    // COD limit state
    const [codLimit, setCodLimit] = useState({
        limit_amount: 0
    });
    const [codLimitData, setCodLimitData] = useState(null);
    const [updatingCodLimit, setUpdatingCodLimit] = useState(false);
    const [fetchingCodLimit, setFetchingCodLimit] = useState(false);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Format date and time
    const formattedDateTime = `${currentDateTime.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })} | ${currentDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })}`;

    // Get appropriate greeting based on time of day
    const getGreeting = () => {
        const hour = currentDateTime.getHours();
        if (hour < 12) return 'Good Morning!';
        if (hour < 18) return 'Good Afternoon!';
        return 'Good Evening!';
    };

    // Fetch mobile number data
    const fetchMobileNumber = async (number) => {
        setFetchingContact(true);
        try {
            if (number) {
                // Fetch specific mobile number
                const response = await api.get(`/mobile-numbers/${number}`);
                setMobileNumberData(response.data);
                setContactNumber(response.data.number || '');
                toast.success('Contact details fetched successfully');
            } else {
                // Fetch all mobile numbers (fallback)
                const response = await api.get('/mobile-numbers');
                if (response.data && response.data.length > 0) {
                    setMobileNumberData(response.data[0]);
                    setContactNumber(response.data[0].number || '');
                }
            }
        } catch (err) {
            console.error('Error fetching mobile number:', err);
            toast.error('Failed to load contact number');
            // Fallback to JSON data if API fails
            setContactNumber(contactData.contact_number || '');
        } finally {
            setFetchingContact(false);
        }
    };    // Fetch COD limit data
    const fetchCodLimit = async () => {
        setFetchingCodLimit(true);
        try {
            const response = await api.get('/cod-limit');
            setCodLimitData(response.data.data);
            setCodLimit({
                limit_amount: response.data.data.limit_amount || 0
            });
        } catch (err) {
            console.error('Error fetching COD limit:', err);
            toast.error('Failed to load COD limit');
        } finally {
            setFetchingCodLimit(false);
        }
    };    // Update COD limit
    const updateCodLimit = async () => {
        // Validate input
        if (codLimit.limit_amount < 0) {
            toast.error('Please enter a valid limit amount');
            return;
        }

        setUpdatingCodLimit(true);
        try {
            const payload = {
                limit_amount: parseFloat(codLimit.limit_amount),
                is_active: true
            };

            console.log('Updating COD limit:', payload);

            const response = await api.put(
                '/admin/cod-limit',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('API response:', response.data);
            toast.success(response.data?.message || 'COD limit updated successfully');
            await fetchCodLimit();
        } catch (err) {
            console.error('Error updating COD limit:', err);

            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Response data:', err.response.data);
                toast.error(err.response.data?.message || 'Failed to update COD limit');
            } else if (err.request) {
                toast.error('Server did not respond. Please check your connection.');
            } else {
                toast.error(`Error: ${err.message}`);
            }
        } finally {
            setUpdatingCodLimit(false);
        }
    };    // Cancel COD limit update
    const cancelCodLimitUpdate = () => {
        setCodLimit({
            limit_amount: codLimitData?.limit_amount || 0
        });
        toast.info('Changes discarded');
    };

    // Handle COD limit input changes
    const handleCodLimitChange = (e) => {
        const { name, value } = e.target;
        setCodLimit({
            ...codLimit,
            [name]: name === 'limit_amount' ? parseFloat(value) || 0 : value
        });
    };

    // Load contact number on component mount
    useEffect(() => {
        // Initially fetch all mobile numbers
        fetchMobileNumber();
    }, []);

    // Load COD limit on component mount
    useEffect(() => {
        fetchCodLimit();
    }, []);

    const saveContactNumber = async () => {
        // Validate input
        if (!contactNumber || !contactNumber.trim()) {
            toast.error('Please enter a valid contact number');
            return;
        }

        setUpdatingContact(true);
        try {
            // Prepare payload
            const payload = {
                number: contactNumber.trim()
            };

            console.log('Updating contact number:', contactNumber);

            // Make API request without any authentication
            const response = await api.put(
                `/admin/mobile-numbers/1`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('API response:', response.data);
            toast.success(response.data?.message || 'Contact number updated successfully');
            await fetchMobileNumber();
        } catch (err) {
            console.error('Error updating contact number:', err);

            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Response data:', err.response.data);
                toast.error(err.response.data?.message || 'Failed to update contact number');
            } else if (err.request) {
                toast.error('Server did not respond. Please check your connection.');
            } else {
                toast.error(`Error: ${err.message}`);
            }
        } finally {
            setUpdatingContact(false);
        }
    };

    // Cancel contact number update
    const cancelContactUpdate = () => {
        setContactNumber(mobileNumberData?.number || contactData.contact_number || '');
        toast.info('Changes discarded');
    };

    // Handle contact number input change
    const handleContactNumberChange = (e) => {
        setContactNumber(e.target.value);
    };

    // Get specific mobile number details
    const getMobileNumberDetails = async () => {
        if (!contactNumber.trim()) {
            toast.error('Please enter a contact number to fetch');
            return;
        }

        await fetchMobileNumber(contactNumber);
    };

    // Fetch all delivery locations
    const fetchDeliveryLocations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/locations');
            setDeliveryLocations(response.data.locations || []);
        } catch (err) {
            toast.error('Failed to fetch delivery locations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Create new delivery location
    const createDeliveryLocation = async () => {
        setLoading(true);
        try {
            await api.post('/admin/locations', formData);
            fetchDeliveryLocations();
            resetForm();
            toast.success('Location added successfully');
        } catch (err) {
            toast.error('Failed to create delivery location');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Update delivery location
    const updateDeliveryLocation = async () => {
        setLoading(true);
        try {
            await api.put(`/admin/locations/${editId}`, formData);
            fetchDeliveryLocations();
            closeModal();
            toast.success('Location updated successfully');
        } catch (err) {
            toast.error('Failed to update delivery location');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Delete delivery location
    const deleteDeliveryLocation = async (id) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            setLoading(true);
            try {
                await api.delete(`/admin/locations/${id}`);
                fetchDeliveryLocations();
                toast.success('Location deleted successfully');
            } catch (err) {
                toast.error('Failed to delete delivery location');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked :
                name === 'shipping_charge' ? parseFloat(value) : value
        });
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editId) {
            updateDeliveryLocation();
        } else {
            createDeliveryLocation();
        }
    };

    // Set up form for editing and open modal
    const handleEdit = (location) => {
        setFormData({
            city: location.city,
            shipping_charge: location.shipping_charge,
            is_active: location.is_active
        });
        setEditId(location.id);
        setShowModal(true);
    };

    // Close modal and reset form
    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            city: '',
            shipping_charge: 0,
            is_active: true
        });
        setEditId(null);
    };

    // Load delivery locations on component mount
    useEffect(() => {
        fetchDeliveryLocations();
    }, []);

    return (
        <div className="w-full max-w-6xl mx-auto py-8 px-4 h-screen overflow-auto">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#333',
                        color: '#fff',
                    }
                }}
            />

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                <span className="text-sm text-gray-500">
                    {formattedDateTime} | {getGreeting()}
                </span>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className={'flex flex-col p-6'}>
                    <span className={'font-semibold pb-2 text-lg'}>Contact Number Update</span>
                    <div className={'gap-4 flex flex-col md:flex-row'}>
                        <div className="w-full md:w-1/2 flex gap-2">
                            <input
                                type="text"
                                value={contactNumber}
                                onChange={handleContactNumberChange}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter contact number"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={saveContactNumber}
                                disabled={updatingContact}
                                className={'bg-green-300 px-3 py-2 rounded-md font-semibold cursor-pointer hover:bg-green-400'}>
                                {updatingContact ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={cancelContactUpdate}
                                className={'bg-gray-300 px-3 py-2 rounded-md font-semibold cursor-pointer hover:bg-gray-400'}>
                                Cancel
                            </button>
                        </div>
                    </div>

                </div>                <div className={'flex flex-col p-6 border-b border-gray-200'}>
                    <span className={'font-semibold pb-2 text-lg'}>COD Limit Update</span>
                    <div className={'gap-4 flex flex-col md:flex-row'}>
                        <div className="w-full md:w-1/2 flex gap-2">
                            <input
                                type="number"
                                name="limit_amount"
                                value={codLimit.limit_amount}
                                onChange={handleCodLimitChange}
                                step="0.01"
                                min="0"
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter COD limit amount"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={updateCodLimit}
                                disabled={updatingCodLimit}
                                className={'bg-green-300 px-3 py-2 rounded-md font-semibold cursor-pointer hover:bg-green-400'}>
                                {updatingCodLimit ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={cancelCodLimitUpdate}
                                className={'bg-gray-300 px-3 py-2 rounded-md font-semibold cursor-pointer hover:bg-gray-400'}>
                                Cancel
                            </button>
                        </div>
                    </div>
                    {fetchingCodLimit && (
                        <div className="mt-2 text-sm text-gray-500">
                            Loading COD limit...
                        </div>
                    )}
                    {codLimitData && (
                        <div className="mt-2 text-sm text-gray-600">
                            Current limit: Rs. {parseFloat(codLimitData.limit_amount || 0).toFixed(2)}
                            {codLimitData.is_active ? ' (Active)' : ' (Inactive)'}
                        </div>
                    )}
                </div>

                <div className="px-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Delivery Locations</h3>

                    {/* Add Location Form */}
                    <div className="bg-gray-50 rounded-lg px-6 py-4 mb-6 border border-gray-200 ">
                        <h4 className="text-lg font-medium text-gray-700 mb-4">
                            Add New Location
                        </h4>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter city name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Shipping Charge (Rs)
                                    </label>
                                    <input
                                        type="number"
                                        name="shipping_charge"
                                        value={formData.shipping_charge}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center">
                                        <input
                                            id="is_active"
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                            Active
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            {loading ? 'Processing...' : 'Add Location'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Locations Table */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-medium text-gray-700">All Delivery Locations</h4>

                            {loading && !editId && (
                                <span className="text-sm text-gray-500">Loading...</span>
                            )}
                        </div>

                        {deliveryLocations.length > 0 ? (
                            <div
                                className="overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 ">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            City
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Shipping Charge
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Updated
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {deliveryLocations.map((location) => (
                                        <tr key={location.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{location.city}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div
                                                    className="text-sm text-gray-900">Rs.{parseFloat(location.shipping_charge || 0).toFixed(2)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {location.is_active ? (
                                                    <span
                                                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            Active
                                                        </span>
                                                ) : (
                                                    <span
                                                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            Inactive
                                                        </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(location.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(location.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(location)}
                                                        className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div
                                className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                <p>No delivery locations found</p>
                                <p className="text-sm mt-2">Add your first location using the form above</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Location Modal */}
            {showModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        {/* Modal panel */}
                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-headline"
                        >
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-headline">
                                            Edit Location
                                        </h3>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Shipping Charge (Rs)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="shipping_charge"
                                                        value={formData.shipping_charge}
                                                        onChange={handleInputChange}
                                                        step="0.01"
                                                        min="0"
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    id="modal_is_active"
                                                    type="checkbox"
                                                    name="is_active"
                                                    checked={formData.is_active}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="modal_is_active" className="ml-2 block text-sm text-gray-700">
                                                    Active
                                                </label>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={updateDeliveryLocation}
                                    disabled={loading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update Location'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Setting;