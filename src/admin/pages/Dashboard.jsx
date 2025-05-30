import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from '../component/Sidebar.jsx';
import Products from '../component/Products.jsx';
import Orders from '../component/Orders.jsx';
import Banners from '../component/Banners.jsx';
import Setting from '../component/Setting.jsx';
import DashboardMain from "../component/DashboardMain.jsx";
import Category from "../component/Category.jsx";

function Dashboard() {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-grow">
                <Routes>
                    <Route path="/" element={<DashboardMain />} />
                    <Route path="products" element={<Products />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="banners" element={<Banners />} />
                    <Route path="category" element={<Category />} />
                    <Route path="settings" element={<Setting />} />
                </Routes>
            </div>
        </div>
    );
}

export default Dashboard;