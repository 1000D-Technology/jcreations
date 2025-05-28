import React, { useState, useEffect } from 'react';
import { FaEdit, FaToggleOn, FaToggleOff, FaImage, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import api from '../../../utils/axios';
import toast from 'react-hot-toast';

function Category() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({
        name: '',
        active: true,
        image: null
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [togglingCategories, setTogglingCategories] = useState([]);
    const [addingCategory, setAddingCategory] = useState(false);

    // Helper function to get the full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `${import.meta.env.VITE_STORAGE_URL}/${imagePath}`;
    };

    useEffect(() => {
        fetchCategories();

        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories');
            const formattedCategories = (response.data || []).map(category => ({
                id: category.id,
                name: category.name,
                imageUrl: category.img,
                active: category.status,
                created_at: category.created_at,
                updated_at: category.updated_at
            }));
            setCategories(formattedCategories);
        } catch (error) {
            toast.error('Failed to fetch categories');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setCurrentCategory(prev => ({ ...prev, [name]: checked }));
        } else {
            setCurrentCategory(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
            return;
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            toast.error('Image size should be less than 2MB');
            return;
        }

        setCurrentCategory(prev => ({ ...prev, image: file }));
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentCategory.name) {
            toast.error('Please provide a category name');
            return;
        }

        if (!currentCategory.image && !isEditing) {
            toast.error('Please upload a category image');
            return;
        }

        setAddingCategory(true);
        const formData = new FormData();
        formData.append('name', currentCategory.name);
        formData.append('status', currentCategory.active);

        if (currentCategory.image instanceof File) {
            formData.append('img', currentCategory.image);
        }

        try {
            if (isEditing) {
                await api.put(`/admin/categories/${currentCategory.id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                toast.success('Category updated successfully');
            } else {
                const response = await api.post('/admin/categories', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                console.log('Category added:', response.data);
                toast.success('Category added successfully');
            }

            resetForm();
            fetchCategories();
        } catch (error) {
            console.error('Error details:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || (isEditing ? 'Failed to update category' : 'Failed to add category'));
        } finally {
            setAddingCategory(false);
        }
    };

    const resetForm = () => {
        setCurrentCategory({ name: '', active: true, image: null });
        setPreviewImage(null);
        setIsEditing(false);
    };

    const handleEdit = (category) => {
        setCurrentCategory({
            id: category.id,
            name: category.name,
            active: category.active,
            image: null
        });
        setPreviewImage(getImageUrl(category.imageUrl));
        setIsEditing(true);
        setShowForm(true);
    };

    const toggleActive = async (category) => {
        try {
            setTogglingCategories(prev => [...prev, category.id]);

            const response = await api.patch(`/admin/categories/${category.id}/toggle-status`);

            const updatedCategory = response.data;

            setCategories(prevCategories =>
                prevCategories.map(cat =>
                    cat.id === category.id
                        ? { ...cat, active: updatedCategory.status }
                        : cat
                )
            );

            toast.success(`Category ${updatedCategory.status ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            toast.error('Failed to update category status');
            console.error(error);
        } finally {
            setTogglingCategories(prev => prev.filter(id => id !== category.id));
        }
    };

    const getGreeting = () => {
        const hour = currentDateTime.getHours();
        if (hour < 12) return 'Good Morning!';
        if (hour < 18) return 'Good Afternoon!';
        return 'Good Evening!';
    };

    const formattedDateTime = `${currentDateTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | ${currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;

    return (
        <div className="flex flex-col">
            <div className="bg-[#F2EFE7] w-full h-[200px] px-6 pt-6">
                <div className="flex items-center justify-between px-6 pt-6 mb-6">
                    <h2 className="text-2xl font-semibold text-[#333333] mt-[-10px] ml-[-20px]">Category Management</h2>
                    <span className="text-sm text-gray-500 mt-[-10px] absolute right-8">
                        {formattedDateTime} | {getGreeting()}
                    </span>
                </div>

                <div className="flex gap-6 b-8">
                    <div className="flex items-center gap-4 p-4 bg-white shadow-md rounded-xl w-60">
                        <div className="p-3 text-purple-600 bg-purple-100 rounded-full">
                            <FaImage size={20}/>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Categories</p>
                            <p className="text-lg font-semibold">
                                {loading ? 'Loading...' : categories.length}
                            </p>
                        </div>
                    </div>

                    <button
                        className="flex items-center gap-3 p-4 bg-white shadow-md rounded-xl hover:bg-gray-50"
                        onClick={() => {
                            resetForm();
                            setShowForm(!showForm);
                        }}
                    >
                        <div className="p-3 text-green-600 bg-green-100 rounded-full">
                            {showForm ? <FaChevronUp size={20}/> : <FaChevronDown size={20}/>}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{showForm ? 'Hide Form' : 'Add Category'}</p>
                        </div>
                    </button>
                </div>
            </div>

            <div className="h-full w-full bg-white rounded-b-2xl">
                {showForm && (
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-medium mb-3">{isEditing ? 'Edit Category' : 'Add New Category'}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-3 md:col-span-2">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={currentCategory.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        placeholder="Category name"
                                        required
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        name="active"
                                        checked={currentCategory.active}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                                    />
                                    <label htmlFor="active" className="ml-2 text-gray-700 text-sm">
                                        Active
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                    Category Image
                                </label>
                                <div className="border border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:bg-gray-50 h-36">
                                    {previewImage ? (
                                        <div className="relative h-full">
                                            <img
                                                src={previewImage}
                                                alt="Category preview"
                                                className="h-full max-h-full mx-auto object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreviewImage(null);
                                                    setCurrentCategory(prev => ({ ...prev, image: null }));
                                                }}
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
                                                required={!isEditing}
                                            />
                                        </label>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supported formats: JPEG, PNG, GIF, WEBP. Max size: 2MB
                                </p>
                            </div>
                            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                                    disabled={addingCategory}
                                >
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm flex items-center justify-center min-w-[80px]"
                                    disabled={addingCategory}
                                >
                                    {addingCategory ? (
                                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    ) : (
                                        isEditing ? 'Update' : 'Add'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center my-6">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {categories.length > 0 ? (
                                categories.map(category => (
                                    <div
                                        key={category.id}
                                        className="bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                    >
                                        <div className="h-28 bg-gray-100 relative overflow-hidden justify-center items-center flex">
                                            {category.imageUrl ? (
                                                <img
                                                    src={getImageUrl(category.imageUrl)}
                                                    alt={category.name}
                                                    className="w-24 h-24 object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    <FaImage size={20} />
                                                </div>
                                            )}
                                            <div className="absolute top-1 right-1">
                                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                                    category.active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {category.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <h3 className="font-medium text-sm text-gray-800 truncate">{category.name}</h3>
                                            <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-100">
                                                <button
                                                    onClick={() => toggleActive(category)}
                                                    className={`${
                                                        category.active
                                                            ? 'text-green-500 hover:text-green-600'
                                                            : 'text-gray-400 hover:text-gray-500'
                                                    }`}
                                                    title={category.active ? 'Deactivate' : 'Activate'}
                                                    disabled={togglingCategories.includes(category.id)}
                                                >
                                                    {togglingCategories.includes(category.id) ? (
                                                        <div className="w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin" />
                                                    ) : (
                                                        category.active ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="text-amber-500 hover:text-amber-600"
                                                    title="Edit category"
                                                >
                                                    <FaEdit size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-5 text-gray-500 bg-white rounded-md shadow-sm">
                                    <FaImage size={24} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm">No categories found. Add your first category!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Category;