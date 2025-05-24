import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import './App.css';
import Home from "./client/pages/Home.jsx";
import Cart from "./client/pages/Cart.jsx";
import Order from "./client/pages/Order.jsx";
import Account from "./client/pages/Account.jsx";
import Footer from './client/component/Footer.jsx';
import Header from './client/component/Header.jsx';
import BottomNavigator from './client/component/BottomNavigator.jsx';
import SignIn from "./client/pages/SignIn.jsx";
import SingleProduct from "./client/pages/SingleProduct.jsx";
import AdminLogin from "./admin/pages/AdminLogin.jsx";
import Dashboard from "./admin/pages/Dashboard.jsx";
import ProtectedAdminRoute from "./admin/component/ProtectedAdminRoute.jsx";
import { useEffect, useState } from "react";
import useAuthStore from "./stores/authStore";
import {Toaster} from "react-hot-toast";
import Refund from "./client/component/Refund.jsx";
import Privacy from "./client/component/Privacy.jsx";
import Terms from "./client/component/Terms.jsx";
import Invoices from "./client/pages/Invoices.jsx";



function App() {
    const location = useLocation();
    const isAuthPage = location.pathname === "/signin" || location.pathname === "/adminlogin";
    const isSingleProductPage = location.pathname === "/singleproduct";
    const isDashboardPage = location.pathname.startsWith("/dashboard");
    const initAuth = useAuthStore(state => state.initAuth);

    // Initialize authentication when app loads
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    return (
        <div className="flex flex-col min-h-screen">
            {!isAuthPage && !isDashboardPage && <Header />}
            <Toaster
                position="top-right"
                reverseOrder={false}
            />

            <main className={`flex-grow ${!isAuthPage && !isDashboardPage ? 'pt-4' : ''}`}>
                <Routes location={location} key={location.pathname}>
                    {/* Public client routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/order" element={<Order />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/signin" element={<SignIn />} />

                    <Route path="/singleproduct/:id" element={<SingleProduct />} />
                    <Route path="/refund-policy" element={<Refund />} />
                    <Route path="/privacy-policy" element={<Privacy />} />
                    <Route path="/terms-conditions" element={<Terms />} />
                    <Route path="/invoice/:id" element={<Invoices />} />


                    {/* Admin routes */}
                    <Route path="/adminlogin" element={<AdminLogin />} />

                    {/* Protected Admin routes */}
                    <Route element={<ProtectedAdminRoute />}>
                        <Route path="/dashboard/*" element={<Dashboard />} />
                    </Route>
                </Routes>
            </main>

            {!isAuthPage && !isSingleProductPage && !isDashboardPage && <BottomNavigator />}
            {!isAuthPage && !isSingleProductPage && !isDashboardPage && <Footer />}
        </div>
    );
}

function AppWrapper() {
    return (
        <Router>
            <App />
        </Router>
    );
}

export default AppWrapper;