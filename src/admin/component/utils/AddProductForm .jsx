import React, { useState, useEffect } from "react";
import api from "../../../utils/axios.js";
import toast, { Toaster } from 'react-hot-toast';

const AddProductForm = ({ onSuccess, initialData, isEditing }) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");    const [discountedPrice, setDiscountedPrice] = useState("");
    const [description, setDescription] = useState("");
    const [characterCount, setCharacterCount] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Individual image fields
    const [formData, setFormData] = useState({
        image1: null,
        image2: null,
        image3: null
    });

    // Image previews
    const [previews, setPreviews] = useState({
        image1: null,
        image2: null,
        image3: null
    });

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
    const MAX_IMAGES = 3;
    const DEFAULT_IMAGE = "/placeholder.png";    // Load initial data if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setCategory(initialData.category_id?.toString() || initialData.category || "");
            setPrice(initialData.price || "");
            setDiscountPercentage(initialData.discount_percentage || "");
            setDiscountedPrice(initialData.discounted_price || "");
            setDescription(initialData.description || "");
            setCharacterCount(initialData.character_count || "");

            // Handle existing images if any
            if (initialData.images && initialData.images.length) {
                const newPreviews = { ...previews };

                initialData.images.forEach((img, index) => {
                    const fieldName = `image${index + 1}`;
                    if (typeof img === 'string') {
                        // If it's a URL path from the server
                        if (img.startsWith('http')) {
                            newPreviews[fieldName] = img;
                        } else {
                            // If it's a relative path, prepend storage URL
                            newPreviews[fieldName] = `${import.meta.env.VITE_STORAGE_URL}/${img}`;
                        }
                    }
                });

                setPreviews(newPreviews);
            }
        }
    }, [initialData]);

    // Fetch categories when component mounts
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setError("Failed to load categories");
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const { files } = e.target;

        if (files && files[0]) {
            // Check file size
            if (files[0].size > MAX_FILE_SIZE) {
                toast.error(`Image size exceeds 2MB limit. Please choose a smaller file.`);
                // Clear the file input
                e.target.value = '';
                return;
            }

            // Find next available slot
            let nextSlot = null;
            for (let i = 1; i <= MAX_IMAGES; i++) {
                const fieldName = `image${i}`;
                if (!formData[fieldName]) {
                    nextSlot = fieldName;
                    break;
                }
            }

            if (!nextSlot) {
                toast.error(`Maximum ${MAX_IMAGES} images allowed`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviews(prev => ({
                    ...prev,
                    [nextSlot]: e.target.result
                }));
            };
            reader.readAsDataURL(files[0]);

            setFormData(prev => ({
                ...prev,
                [nextSlot]: files[0]
            }));
        }
    };

    const handleRemoveImage = (fieldName) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: null
        }));

        setPreviews(prev => ({
            ...prev,
            [fieldName]: null
        }));
    };

    const validateForm = () => {
        let isValid = true;

        if (!name.trim()) {
            toast.error("Product name is required");
            isValid = false;
        }

        if (!category) {
            toast.error("Please select a category");
            isValid = false;
        }

        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            toast.error("Please enter a valid price");
            isValid = false;
        }

        // Description validation removed - now optional

        // Check if at least one image is selected
        const hasImages = Object.values(previews).some(img => img !== null);
        if (!hasImages) {
            toast.error("Please add at least one product image");
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        const formDataToSend = new FormData();        // Append text fields
        formDataToSend.append('name', name);
        formDataToSend.append('category_id', category);
        formDataToSend.append('price', price);
        formDataToSend.append('description', description);
        formDataToSend.append('status', 'in_stock');

        // Add character count if it's provided
        if (characterCount) {
            formDataToSend.append('character_count', characterCount);
        }

        // Add either discount percentage or discounted price (not both)
        if (discountPercentage) {
            formDataToSend.append('discount_percentage', discountPercentage);
        } else if (discountedPrice) {
            formDataToSend.append('discounted_price', discountedPrice);
        }

        // Append image files
        Object.keys(formData).forEach(key => {
            if (formData[key] instanceof File) {
                formDataToSend.append(key, formData[key]);
            }
        });

        try {
            if (isEditing && initialData?.id) {
                formDataToSend.append('_method', 'PUT'); // Laravel requires this for PUT/PATCH
                await api.post(`/admin/products/${initialData.id}`, formDataToSend);
                toast.success("Product updated successfully");
            } else {
                await api.post('/admin/products', formDataToSend);
                toast.success("Product added successfully");
            }

            // Reset form
            resetForm();

            // Call success callback with true to indicate refresh is needed
            if (typeof onSuccess === 'function') {
                onSuccess(true);
            }
        } catch (error) {
            console.error("Error saving product:", error);
            toast.error(isEditing ? "Failed to update product" : "Failed to add product");
        } finally {
            setLoading(false);
        }
    };    const resetForm = () => {
        setName("");
        setCategory("");
        setPrice("");
        setDiscountPercentage("");
        setDiscountedPrice("");
        setDescription("");
        setCharacterCount("");
        setFormData({
            image1: null,
            image2: null,
            image3: null
        });
        setPreviews({
            image1: null,
            image2: null,
            image3: null
        });
    };

    // Get count of active images
    const getImageCount = () => {
        return Object.values(previews).filter(img => img !== null).length;
    };

    // Check if selected category is cakes
    const isCakeCategory = () => {
        const selectedCategory = categories.find(cat => cat.id.toString() === category);
        return selectedCategory?.name?.toLowerCase() === 'cakes' || 
               (category === "1" && categories.length === 0); // fallback for hardcoded option
    };

    return (
        <div className="w-full bg-transparent py-4 px-2 md:px-6">
            {/* Add Toaster component directly in the form */}
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

            <h2 className="text-2xl font-semibold mb-6">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
                {/* Product Name + Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="transition-all duration-300 hover:shadow-md">
                        <input
                            type="text"
                            placeholder="Product Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 w-full bg-white/70 backdrop-blur-sm transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="transition-all duration-300 hover:shadow-md">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 w-full bg-white/70 backdrop-blur-sm transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            required
                        >
                            <option value="">Select Category</option>
                            {loading ? (
                                <option value="" disabled>Loading categories...</option>
                            ) : categories.length > 0 ? (
                                categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="1">Cakes</option>
                                    <option value="2">Pastries</option>
                                    <option value="3">Cookies</option>
                                    <option value="4">Desserts</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                {/* Price + Discount Percentage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="transition-all duration-300 hover:shadow-md">
                        <input
                            type="number"
                            placeholder="Price"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 w-full bg-white/70 backdrop-blur-sm transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>
                    <div className={'flex w-full gap-2 items-center'}>
                        <div className="relative transition-all duration-300 hover:shadow-md w-1/2">
                            <input
                                type="number"
                                placeholder="Discount Percentage"
                                value={discountPercentage}
                                onChange={(e) => {
                                    setDiscountPercentage(e.target.value);
                                    if (e.target.value) setDiscountedPrice("");
                                }}
                                className="border border-gray-300 rounded-lg p-3 w-full bg-white/70 backdrop-blur-sm transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                min="0"
                                max="100"
                                step="0.1"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xs">
                                %
                            </span>
                        </div>
                        <span>or</span>
                        <div className="relative transition-all duration-300 hover:shadow-md w-1/2">
                            <input
                                type="number"
                                placeholder="Discounted Price"
                                value={discountedPrice}
                                onChange={(e) => {
                                    setDiscountedPrice(e.target.value);
                                    if (e.target.value) setDiscountPercentage("");
                                }}
                                className="border border-gray-300 rounded-lg p-3 w-full bg-white/70 backdrop-blur-sm transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>                {/* Product Description */}
                <div className="transition-all duration-300 hover:shadow-md">
                    <textarea
                        placeholder="Product Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        className="border border-gray-300 rounded-lg p-3 w-full bg-white/70  transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                </div>

                {/* Character Count - Only show for cakes category */}
                {isCakeCategory() && (
                    <div className="transition-all duration-300 hover:shadow-md">
                        <input
                            type="number"
                            placeholder="Character Count"
                            value={characterCount}
                            onChange={(e) => setCharacterCount(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 w-full bg-white/70 backdrop-blur-sm transition-all focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            min="1"
                            step="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of characters for cake customization</p>
                    </div>
                )}

                {/* Image Upload */}
                <div
                    className="bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-sm mb-3 text-gray-600 font-medium">
                        Product Images <span className="text-xs text-gray-400">(At least 1 image required, max 3)</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Show existing images */}
                        {Object.entries(previews).map(([key, preview]) =>
                                preview && (
                                    <div key={key} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`product preview`}
                                            className="w-20 h-20 rounded-lg object-cover shadow-sm"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(key)}
                                                className="text-white p-1 mx-1 text-sm"
                                                title="Remove image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                )
                        )}

                        {/* Show upload button if less than MAX_IMAGES */}
                        {getImageCount() < MAX_IMAGES && (
                            <label className="border-2 border-dashed border-gray-300 rounded-lg w-20 h-20 flex items-center justify-center cursor-pointer bg-white/50 hover:bg-white/80 transition-all">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <span className="text-3xl text-gray-400">+</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* Error message if any */}
                {error && (
                    <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onSuccess}
                        className="border border-gray-400 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-100 transition-all"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-all shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Product" : "Add Product")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProductForm;