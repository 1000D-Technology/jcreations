import React, { useState, useEffect } from 'react'
import { FiUser } from "react-icons/fi";
import { FaPhoneAlt } from "react-icons/fa";
import { LuShoppingBag } from "react-icons/lu";
import { Link } from "react-router-dom";
import Search from './Search';
import axios from 'axios';
// Import cart store
import useCartStore from '../../stores/cartStore';
import api from "../../utils/axios.js";

function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [contactNumber, setContactNumber] = useState('');

    // Get cart item count from store
    const { itemCount, fetchCart } = useCartStore();


    const fetchContactNumbers = async () => {
        try {
            const response = await api.get('/mobile-numbers', {
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Check if response data exists and is an array
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Get the first number from the array
                const phoneNumber = response.data[0].number;


                // Set contact number to state
                setContactNumber(phoneNumber);
                console.log('Contact number set to:', phoneNumber);
            } else {
                console.warn('No valid contact numbers found in the response');
            }
        } catch (error) {
            console.error('Error fetching contact numbers:', error);
            // Keep default number in case of error
        }
    };

    // Fetch cart data and contact numbers
    useEffect(() => {
        fetchCart();
        fetchContactNumbers();

        // Refresh cart data periodically
        const intervalId = setInterval(fetchCart, 10000);
        return () => clearInterval(intervalId);
    }, [fetchCart]);

    // Track scroll for styling purposes
    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearchClick = () => {
        setIsSearchOpen(true);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
    };

    return (
        <>
            <header
                className={`flex justify-center w-full px-0 z-50 py-3 bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300 ${
                    scrollPosition > 50 ? 'rounded-b-xl' : ''
                }`}
            >
                {/* Logo */}
                <div className={'flex flex-col w-full lg:max-w-7xl '}>
                    <div className={'flex items-center justify-between'}>
                        <Link to={"/"} className="flex items-center space-x-2">
                            <img src="/logo.png" alt="Logo" className="w-10 h-10"/>
                            <h1 className="lg:text-xl text-sm font-bold text-[#000F20]">JCreations</h1>
                        </Link>

                        {/* Search Bar */}
                        <div className="relative w-1/3 max-w-md hidden md:block">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-full focus:outline-none cursor-pointer"
                                onClick={handleSearchClick}
                                readOnly
                            />
                        </div>

                        {/* Contact Info and Icons */}
                        <div className="flex items-center space-x-4">
                            <Link to={`tel:${contactNumber}`} type={'button'} className="flex items-center space-x-2 text-gray-700">
                                <FaPhoneAlt className="text-[#000F20] w-4 "/>
                                <span className="font-medium text-[10px] lg:text-sm">{contactNumber}</span>
                            </Link>
                            <Link to={'/cart'} className="p-2 shadow-lg shadow-[#FDEAC9] rounded-full hover:bg-[#F7A313] transition-colors relative">
                                <LuShoppingBag className="text-[#000F20] w-4 lg:w-full" size={20}/>
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#F7A313] text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                            <Link to={'/account'} className="p-2 shadow-lg shadow-[#FDEAC9] rounded-full hover:bg-[#F7A313] transition-colors">
                                <FiUser className="text-[#000F20] w-4 lg:w-full" size={20}/>
                            </Link>
                        </div>
                    </div>

                    <div className="relative w-full lg:hidden md:hidden justify-center flex mt-4 ">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-full focus:outline-none cursor-pointer"
                            onClick={handleSearchClick}
                            readOnly
                        />
                    </div>
                </div>
            </header>

            {/* Search Drawer */}
            <Search isOpen={isSearchOpen} onClose={closeSearch} />
        </>
    )
}

export default Header