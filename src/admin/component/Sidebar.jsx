import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaOpencart } from 'react-icons/fa';
import { CiImageOn } from 'react-icons/ci';
import { IoSettingsOutline } from 'react-icons/io5';
import { AiOutlineProduct } from 'react-icons/ai';
import { IoIosLogOut } from 'react-icons/io';
import { BsBoxes } from "react-icons/bs";
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import {TbCategory2} from "react-icons/tb";

export default function Sidebar() {
    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const inactivityTimeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);

    const resetInactivityTimer = () => {
        // Clear existing timeouts
        if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

        // Set warning timeout for 29.5 minutes
        warningTimeoutRef.current = setTimeout(() => {
            toast.error('You will be logged out in 30 seconds due to inactivity', {
                duration: 30000, // Toast stays for 30 seconds
            });
        }, 29.5 * 60 * 1000);

        // Set actual logout timeout for 30 minutes
        inactivityTimeoutRef.current = setTimeout(() => {
            handleLogout();
        }, 30 * 60 * 1000);
    };

    // Setup activity listeners
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Throttle function to avoid excessive calls
        let throttlePause;
        const throttleFunction = (func, delay) => {
            if (throttlePause) return;
            throttlePause = true;
            setTimeout(() => {
                func();
                throttlePause = false;
            }, delay);
        };

        // Event handler
        const activityHandler = () => {
            throttleFunction(resetInactivityTimer, 1000);
        };

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, activityHandler);
        });

        // Initialize timer when component mounts
        resetInactivityTimer();

        // Clean up
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, activityHandler);
            });
            if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        };
    }, []);

    // Reset the timer when the component is re-focused
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                resetInactivityTimer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const response = await axios.get('/admin/logout', {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.status === 200) {
                // Clear auth state
                logout();

                // Show success message
                toast.success('Logged out successfully');

                // Redirect to login page
                navigate('/adminlogin');
            }
        } catch (error) {
            console.error('Logout error:', error);

            let errorMessage = 'Failed to logout. Please try again.';

            if (error.response) {
                errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
            }

            toast.error(errorMessage);
        }
    };

    return (
        <div className="w-64 h-screen bg-white shadow-lg flex flex-col justify-between">
            <div>
                <div className="flex items-center px-6 py-6">
                    <img src="/logo.png" alt="Logo" className="h-10 mr-3" />
                    <span className="font-bold text-lg">JCreations</span>
                </div>
                <nav className="mt-4 flex flex-col space-y-2 px-4">
                    <SidebarItem to="/dashboard" icon={<AiOutlineProduct className="w-5 h-5" />} label="Dashboard" end />
                    <SidebarItem to="/dashboard/products" icon={<BsBoxes className="w-5 h-5" />} label="Products" />
                    <SidebarItem to="/dashboard/orders" icon={<FaOpencart className="w-5 h-5" />} label="Orders" />
                    <SidebarItem to="/dashboard/banners" icon={<CiImageOn className="w-5 h-5" />} label="Banners" />
                    <SidebarItem to="/dashboard/category" icon={<TbCategory2  className="w-5 h-5" />} label="Category" />
                    <SidebarItem to="/dashboard/settings" icon={<IoSettingsOutline className="w-5 h-5" />} label="Settings" />
                </nav>
            </div>
            <div className="px-4 py-6">
                <button
                    className="flex items-center text-red-500 hover:text-red-600 cursor-pointer"
                    onClick={handleLogout}
                >
                    <IoIosLogOut className="w-5 h-5 mr-2" />
                    Logout
                </button>
            </div>
        </div>
    );
}

function SidebarItem({ to, icon, label, end }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                    isActive ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`
            }
            replace
        >
            {icon}
            <span className="ml-3">{label}</span>
        </NavLink>
    );
}