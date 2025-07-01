import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { LuCodesandbox } from "react-icons/lu";
import { FaRegWindowClose } from "react-icons/fa";
import { AiOutlineReload } from "react-icons/ai";
import { BsThreeDots, BsArrowLeft, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { FiPackage } from "react-icons/fi";
import AddProductForm from './utils/AddProductForm .jsx';
import UpdateProductForm from './utils/UpdateProductForm .jsx';
import ProductPreviewModal from './utils/ProductPreviewModal.jsx';
import toast, {Toaster} from 'react-hot-toast';
import api from "../../utils/axios.js";
import useAuthStore from '../../stores/authStore';
import {IoIosInformationCircleOutline} from "react-icons/io";

function Products() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [showAddForm, setShowAddForm] = useState(false);
    const [updateProduct, setUpdateProduct] = useState(null);
    const [previewProduct, setPreviewProduct] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10000000000;

    // Daily deals update state
    const [updatingDailyDeals, setUpdatingDailyDeals] = useState(null);

    // Check admin authentication
    useEffect(() => {
        if (!user || !user.roles || !user.roles.includes('admin')) {
            navigate('/adminlogin');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchProducts();
    }, []);

    // Apply sorting and filtering whenever products, sortBy or searchTerm changes
    useEffect(() => {
        let result = [...products];

        // Apply search filter
        if (searchTerm) {
            result = result.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply sorting only if sortBy has a value
        if (sortBy) {
            switch(sortBy) {
                case "name":
                    result.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case "date":
                    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    break;
                case "category":
                    result.sort((a, b) => {
                        const catA = a.category?.name || a.category_id || '';
                        const catB = b.category?.name || b.category_id || '';
                        return catA.localeCompare(catB);
                    });
                    break;
                case "price_low":
                    result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    break;
                case "price_high":
                    result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    break;
                default:
                    break;
            }
        }

        setDisplayedProducts(result);
        // Reset to first page when filter/sort criteria change
        setCurrentPage(1);
    }, [products, sortBy, searchTerm]);

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = displayedProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(displayedProducts.length / itemsPerPage);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            console.log('Fetching products from admin API');

            // Get token from auth store
            const token = user?.token;

            // Use the correct endpoint with limit parameter
            const endpoint = `/admin/products/limit/${itemsPerPage}`;

            const response = await api.get(endpoint, {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('API Response status:', response.status);
            console.log('API Response data:', response.data);

            // Handle different response formats
            let productData = [];
            if (Array.isArray(response.data)) {
                productData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                productData = response.data.data;
            } else if (response.data.products && Array.isArray(response.data.products)) {
                productData = response.data.products;
            } else if (typeof response.data === 'object') {
                // Handle nested object structures
                if (response.data.id && response.data.name) {
                    productData = [response.data];
                } else {
                    const possibleProducts = Object.values(response.data).find(val =>
                        Array.isArray(val) && val.length > 0 && val[0]?.id);
                    if (possibleProducts) {
                        productData = possibleProducts;
                    }
                }
            }

            console.log('Processed product data:', productData);
            setProducts(productData);
            setDisplayedProducts(productData);
            setError(null);

            // Get total count from headers if available
            const totalCount = parseInt(response.headers['x-total-count'] || response.headers['X-Total-Count']);
            if (totalCount) {
                const totalPages = Math.ceil(totalCount / itemsPerPage);
                console.log(`Total products: ${totalCount}, Total pages: ${totalPages}`);
            }

            if (productData.length === 0) {
                toast.info('No products found');
            }
        } catch (error) {
            console.error('Error fetching products:', error);

            if (error.response) {
                setError(`Server error: ${error.response.status}. ${error.response.data?.message || ''}`);
            } else if (error.request) {
                setError('Network error: No response from server.');
            } else {
                setError(`Request error: ${error.message}`);
            }

            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

// Update useEffect to fetch products when pagination changes
    useEffect(() => {
        fetchProducts();
    }, [currentPage, itemsPerPage]); // Re-fetch when page or items per page changes

    // Pagination navigation functions
    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const goToPreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    // Rest of your existing functions...
    const updateProductStatus = async (productId, newStatus) => {
        setUpdatingStatus(productId);
        try {
            // Get token from auth store
            const token = user?.token;

            const response = await api.put(`/admin/products/${productId}`,
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
                toast.success(`Product status updated to ${newStatus.replace('_', ' ')}`);

                // Update the local state with the new status
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product.id === productId ? {...product, status: newStatus} : product
                    )
                );
            }
        } catch (error) {
            console.error('Error updating product status:', error);
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(`Failed to update status: ${errorMessage}`);

            if (error.response) {
                console.log('Error response:', error.response.data);
                console.log('Status code:', error.response.status);
            }
        } finally {
            setUpdatingStatus(null);
        }
    };    const updateDailyDealsStatus = async (productId, isActive) => {
        setUpdatingDailyDeals(productId);
        try {
            const token = user?.token;
            const status = isActive ? 'active' : 'deactive';

            const response = await api.put(`/admin/products/${productId}`, 
                { daily_deals: status },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                console.log('Daily deals status update response:', response.data);
                toast.success(`Product ${isActive ? 'added to' : 'removed from'} daily deals`);

                // Update the local state with the new daily deals status
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product.id === productId ? {...product, daily_deals: status} : product
                    )
                );
            }
        } catch (error) {
            console.error('Error updating daily deals status:', error);
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(`Failed to update daily deals: ${errorMessage}`);

            if (error.response) {
                console.log('Error response:', error.response.data);
                console.log('Status code:', error.response.status);
            }
        } finally {
            setUpdatingDailyDeals(null);
        }
    };

    const handleAddProductClick = () => {
        setShowAddForm(true);
        setUpdateProduct(null);
    };

    const handleAddProductSuccess = (needsRefresh) => {
        setShowAddForm(false);  // Hide the form

        if (needsRefresh) {
            fetchProducts();  // Reload the products table
        }
    };

    const handleUpdateProductSuccess = (needsRefresh) => {
        setUpdateProduct(false);  // Hide the form

        if (needsRefresh) {
            fetchProducts();  // Reload the products table
        }
    };

    const handleUpdateProductClick = (product) => {
        setUpdateProduct(product);
        setShowAddForm(false);
    };

    const handlePreviewClick = (product) => {
        setPreviewProduct({
            ...product,
            image: `${import.meta.env.VITE_STORAGE_URL}/${product.images}`,
            offerPrice: parseFloat(product.price * (1 - (product.discount_percentage / 100))).toFixed(2),
            discountPrice: parseFloat(product.price * (1 - (product.discount_percentage / 100))).toFixed(2),
            discount: product.discount_percentage || 0,
            listDate: new Date(product.created_at).toISOString().split('T')[0],
            category: product.category?.name || product.category_id,
            description: product.description || 'No description available'
        });
        setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
    };

    const handleBackToProducts = () => {
        setShowAddForm(false);
        setUpdateProduct(null);
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Status options for dropdown - updated to include all three states
    const statusOptions = [
        { value: 'in_stock', label: 'In Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' },
        { value: 'deactive', label: 'Deactive' }
    ];

    const statusClasses = {
        in_stock: 'bg-green-100 text-green-700',
        out_of_stock: 'bg-red-100 text-red-700',
        deactive: 'bg-gray-100 text-gray-700',
        discontinued: 'bg-gray-100 text-gray-700'
    };

    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);
    const formattedDateTime = `${currentDateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | ${currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;

    // Get appropriate greeting based on time of day
    const getGreeting = () => {
        const hour = currentDateTime.getHours();
        if (hour < 12) return 'Good Morning!';
        if (hour < 18) return 'Good Afternoon!';
        return 'Good Evening!';
    };
    return (
        <div className="flex flex-col min-h-[500px]">
            <Toaster
                position="top-right"
                reverseOrder={false}
                className="z-50"
            />
            {!showAddForm && !updateProduct && (
                <div className="bg-[#F2EFE7] w-full h-[200px] px-6 pt-6">
                    <div className="flex items-center justify-between px-6 pt-6 mb-6">
                        <h2 className="text-2xl font-semibold text-[#333333] mt-[-10px] ml-[-20px]">
                            Products
                        </h2>
                        <span className="text-sm text-gray-500 mt-[-10px] absolute right-8">
                            {formattedDateTime} | {getGreeting()}
                        </span>
                    </div>

                    <div className="flex gap-6 b-8">
                        <div className="flex items-center gap-4 p-4 bg-white shadow-md rounded-xl w-60">
                            <div className="p-3 text-purple-600 bg-purple-100 rounded-full">
                                <LuCodesandbox size={20} className="text-[#A962FF] text-xl"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Products</p>
                                <p className="text-lg font-semibold">{products.length}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-white shadow-md rounded-xl w-60">
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <IoIosInformationCircleOutline  size={20} className="text-yellow-800 text-xl"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Out of Stock </p>
                                <p className="text-lg font-semibold">
                                    {products.filter(p => p.status === 'out_of_stock').length}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white shadow-md rounded-xl w-60">
                            <div className="p-3 bg-red-100 rounded-full">
                                <FaRegWindowClose size={20} className="text-[#FF0000] text-xl"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Disabled Products</p>
                                <p className="text-lg font-semibold">
                                    {products.filter(p => p.status === 'deactive').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`h-full w-full ${(!showAddForm && !updateProduct) ? 'bg-white rounded-b-2xl' : 'rounded-2xl'}`}>
                {showAddForm ? (
                    <div className="w-full pt-4 px-4">
                        <button
                            onClick={handleBackToProducts}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 cursor-pointer ml-4"
                        >
                            <BsArrowLeft/> Back to Products
                        </button>
                        <AddProductForm onSuccess={handleAddProductSuccess}/>
                    </div>
                ) : updateProduct ? (
                    <div className="w-full pt-4 px-4">
                        <button
                            onClick={handleBackToProducts}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 cursor-pointer ml-4"
                        >
                            <BsArrowLeft /> Back to Products
                        </button>

                        <UpdateProductForm product={updateProduct} onSuccess={handleUpdateProductSuccess} />
                    </div>
                ) : (
                    <>
                        <div className="px-8 pt-4 flex justify-between">
                            <button
                                onClick={handleAddProductClick}
                                className="bg-[#FDE3B6] p-2 flex justify-center items-center rounded-lg cursor-pointer"
                            >
                                + Add New Product
                            </button>
                            <div className="flex items-center gap-2">
                                <div>
                                    <span className="text-sm text-[#C6C6C6]">Sort By:</span>
                                    <select
                                        value={sortBy}
                                        onChange={handleSortChange}
                                        className="border border-[#C6C6C6] rounded-lg p-2 ml-2 focus:outline-none focus:ring-2 focus:ring-[#F7A313]"
                                    >
                                        <option value="">None</option>
                                        <option value="name">Name</option>
                                        <option value="date">Date</option>
                                        <option value="category">Category</option>
                                        <option value="price_low">Price: Low to High</option>
                                        <option value="price_high">Price: High to Low</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7A313] focus:border-transparent"
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                             viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 pt-8 pb-8">
                            {loading ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="h-10 w-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                                    <span className="ml-3 text-gray-600">Loading products...</span>
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
                                        onClick={fetchProducts}
                                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : displayedProducts.length === 0 ? (
                                <div className="text-center py-12 rounded-lg shadow-sm">
                                    <div className="text-gray-400 mb-4">
                                        <FiPackage className="h-16 w-16 mx-auto" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-700 mb-1">No products found</h3>
                                    <p className="text-gray-500 mb-4">Start by adding your first product</p>
                                    <button
                                        onClick={handleAddProductClick}
                                        className="px-4 py-2 bg-[#FDE3B6] text-gray-800 rounded-lg hover:bg-[#FAD59D] transition-colors"
                                    >
                                        + Add New Product
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                                        <div className="max-h-[550px] overflow-y-auto">
                                            <table className="min-w-full divide-y divide-gray-200 table-fixed">                                                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%]">ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[18%]">Product Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[12%]">Category</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[8%]">Price</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[8%]">Discount</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[8%]">Image</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[8%]">More</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[8%]">Update</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[12%]">Daily Deals</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[13%]">Status</th>
                                                </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">                                                {currentItems.map((product) => (
                                                    <tr key={product.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap w-[5%]">{product.id}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[18%]">{product.name}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[12%]">{product.category?.name || product.category_id}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[8%]">Rs.{parseFloat(product.price).toFixed(2)}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[8%]">{product.discount_percentage || 0}%</td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[8%]">
                                                            <img
                                                                src={
                                                                    product.images
                                                                        ? Array.isArray(product.images)
                                                                            ? `${import.meta.env.VITE_STORAGE_URL}/${product.images[0]}`
                                                                            : typeof product.images === 'string'
                                                                                ? `${import.meta.env.VITE_STORAGE_URL}/${product.images}`
                                                                                : 'https://via.placeholder.com/150'
                                                                        : 'https://via.placeholder.com/150'
                                                                }
                                                                alt={product.name || 'Product image'}
                                                                className="w-10 h-10 object-cover rounded border border-gray-200"
                                                                onError={(e) => {
                                                                    console.log(`Failed to load image for product: ${product.id} - ${product.name}`);
                                                                    e.target.src = 'https://via.placeholder.com/150';
                                                                    e.target.onerror = null;
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[8%]">
                                                            <button
                                                                onClick={() => handlePreviewClick(product)}
                                                                className="w-full h-full flex justify-center items-center cursor-pointer"
                                                                aria-label={`View details of ${product.name}`}
                                                            >
                                                                <BsThreeDots
                                                                    className="text-blue-400 text-lg hover:text-blue-600"/>
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[8%]">
                                                            <button
                                                                onClick={() => handleUpdateProductClick(product)}
                                                                className="w-full h-full flex justify-center items-center cursor-pointer"
                                                                aria-label={`Update ${product.name}`}
                                                            >
                                                                <AiOutlineReload className="text-yellow-500 text-lg hover:text-yellow-600"/>
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[12%]">
                                                            <div className="flex justify-center items-center">
                                                                {updatingDailyDeals === product.id ? (
                                                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                                                ) : (
                                                                    <label className="flex items-center cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={product.daily_deals === 'active'}
                                                                            onChange={(e) => updateDailyDealsStatus(product.id, e.target.checked)}
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                                        />
                                                                        <span className="ml-2 text-sm text-gray-700">
                                                                            {product.daily_deals === 'active' ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap w-[13%]">
                                                            {updatingStatus === product.id ? (
                                                                <div className="w-full flex justify-center">
                                                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-amber-500"></div>
                                                                </div>
                                                            ) : (
                                                                <select
                                                                    value={product.status || 'in_stock'}
                                                                    onChange={(e) => updateProductStatus(product.id, e.target.value)}
                                                                    className={`px-2 py-1 rounded-md text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500 ${statusClasses[product.status] || 'bg-gray-100 text-gray-700'}`}
                                                                >
                                                                    {statusOptions.map(option => (
                                                                        <option
                                                                            key={option.value}
                                                                            value={option.value}
                                                                        >
                                                                            {option.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="flex hidden justify-between items-center mt-4 px-2">
                                        <div className="text-sm text-gray-500">
                                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, displayedProducts.length)} of {displayedProducts.length} products
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={goToPreviousPage}
                                                disabled={currentPage === 1}
                                                className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <BsChevronLeft size={16} />
                                            </button>

                                            {/* Page number buttons - show up to 5 pages */}
                                            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                                // Calculate the page number to display
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = idx + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = idx + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + idx;
                                                } else {
                                                    pageNum = currentPage - 2 + idx;
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => goToPage(pageNum)}
                                                        className={`w-8 h-8 flex items-center justify-center rounded-md ${
                                                            currentPage === pageNum
                                                                ? 'bg-black text-white'
                                                                : 'border hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                onClick={goToNextPage}
                                                disabled={currentPage === totalPages || totalPages === 0}
                                                className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <BsChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Product Preview Modal */}
            <ProductPreviewModal
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                product={previewProduct || {}}
            />
        </div>
    );
}

export default Products;