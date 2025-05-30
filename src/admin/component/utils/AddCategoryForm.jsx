// src/admin/component/utils/AddCategoryForm.jsx
import React, { useState, useEffect } from "react";
import api from "../../../utils/axios.js";
import toast from 'react-hot-toast';
import { FaImage } from 'react-icons/fa';

const AddCategoryForm = ({ onSuccess, initialData, isEditing }) => {
    const [name, setName] = useState("");
    const [active, setActive] = useState(true);
    const [image, setImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formValidated, setFormValidated] = useState(false);

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
    const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    // Load initial data if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setActive(initialData.active || true);

            // Handle existing image
            if (initialData.imageUrl) {
                const storageUrl = import.meta.env.VITE_STORAGE_URL || '';
                const imgUrl = initialData.imageUrl.startsWith('http')
                    ? initialData.imageUrl
                    : `${storageUrl}/${initialData.imageUrl}`;
                setPreviewImage(imgUrl);
            }
        }
    }, [initialData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        if (!VALID_TYPES.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
            e.target.value = '';
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Image size should be less than 2MB');
            e.target.value = '';
            return;
        }

        setImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const validateForm = () => {
        if (!name.trim()) {
            toast.error("Category name is required");
            return false;
        }

        // For editing, we don't require a new image if one already exists
        if (!isEditing && !image && !previewImage) {
            toast.error("Please upload a category image");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent multiple submissions
        if (loading) return;

        // Set form as validated to prevent additional toast messages
        setFormValidated(true);

        if (!validateForm()) {
            setFormValidated(false);
            return;
        }

        setLoading(true);
        const formData = new FormData();

        formData.append('name', name);
        formData.append('status', active);

        if (image instanceof File) {
            formData.append('img', image);
        }

        // Add _method parameter for updates
        if (isEditing) {
            formData.append('_method', 'PUT');
        }

        try {
            if (isEditing && initialData?.id) {
                await api.post(`/admin/categories/${initialData.id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Category updated successfully');
            } else {
                await api.post('/admin/categories', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Category added successfully');
            }

            // Reset form and notify parent
            resetForm();
            if (typeof onSuccess === 'function') {
                onSuccess();
            }
        } catch (error) {
            console.error("Error saving category:", error);
            const errorMessage = error.response?.data?.message ||
                (isEditing ? "Failed to update category" : "Failed to add category");
            toast.error(errorMessage);
        } finally {
            setLoading(false);
            setFormValidated(false);
        }
    };

    const resetForm = () => {
        setName("");
        setActive(true);
        setImage(null);
        setPreviewImage(null);
        setFormValidated(false);
    };

    const removeImage = () => {
        setImage(null);
        setPreviewImage(null);
    };

    return (
        <div className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium mb-4">{isEditing ? 'Edit Category' : 'Add New Category'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Name */}
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Category name"
                    />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="active-status"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                    />
                    <label htmlFor="active-status" className="ml-2 text-gray-700 text-sm">
                        Active
                    </label>
                </div>

                {/* Category Image */}
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                        Category Image
                    </label>
                    <div className="border border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:bg-gray-50 h-32">
                        {previewImage ? (
                            <div className="relative h-full">
                                <img
                                    src={previewImage}
                                    alt="Category preview"
                                    className="h-full max-h-full mx-auto object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <label className="cursor-pointer block h-full flex flex-col items-center justify-center">
                                <FaImage className="h-8 w-8 text-gray-300" />
                                <span className="text-sm text-gray-500 mt-1">Click to upload image</span>
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                />
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Supported formats: JPEG, PNG, GIF, WEBP. Max size: 2MB
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                        disabled={loading}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm flex items-center justify-center min-w-[80px]"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : (
                            isEditing ? 'Update' : 'Add'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddCategoryForm;