import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/axios.js';

function Invoices() {
    const [invoice, setInvoice] = useState(null);
    const { id } = useParams();
    const printRef = useRef();
    const [contactNumber, setContactNumber] = useState('');

    useEffect(() => {
        // Fetch contact numbers
        fetchContactNumbers();

        // Fetch invoice data
        api.get(`/orders/${id}`)
            .then(response => setInvoice(response.data))
            .catch(error => console.error('Error fetching invoice:', error));

    }, [id]);

    const handlePrint = () => {
        window.print();
    };

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
    if (!invoice) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
    );

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100">
            {/* Print button - hidden when printing */}
            <button
                onClick={handlePrint}
                className="bg-[#F7A313] text-white px-6 py-2 rounded-md mb-4 print:hidden hover:bg-[#e89400]"
            >
                Print Invoice
            </button>

            {/* Invoice paper */}
            <div
                ref={printRef}
                className="bg-white max-w-3xl w-full mx-auto shadow-md print:shadow-none p-8 print:p-0 mb-10 print:mb-0"
                style={{ minHeight: '29.7cm' }}
            >
                {/* Receipt Header */}
                <div className="flex justify-between border-b-2 border-gray-200 pb-6">
                    <div>
                        <img src="/logo.png" alt="JCreations Logo" className="h-16 mb-2" />
                        <h1 className="text-2xl font-bold text-gray-800">JCreations</h1>
                        <p className="text-sm text-gray-600">Premium Cakes & Desserts</p>
                        <p className="text-sm text-gray-600">{contactNumber}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-gray-800 uppercase mb-1">Invoice</h2>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Invoice #:</span> {invoice.id}</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Date:</span> {formatDate(invoice.created_at)}</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span> {invoice.status}</p>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="flex flex-col md:flex-row justify-between py-6">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-gray-600 font-semibold uppercase text-sm mb-1">Bill To:</h3>
                        <p className="font-medium text-gray-800">{invoice.customer_name}</p>
                        <p className="text-gray-600 text-sm">{invoice.email || 'N/A'}</p>
                        <p className="text-gray-600 text-sm">{invoice.phone}</p>
                        <p className="text-gray-600 text-sm whitespace-pre-line">{invoice.address}</p>
                    </div>
                    <div>
                        <h3 className="text-gray-600 font-semibold uppercase text-sm mb-1">Shipping:</h3>
                        <p className="text-gray-600 text-sm">{invoice.shipping_method || 'Standard Shipping'}</p>
                        <p className="text-gray-600 text-sm">Delivery Note: {invoice.delivery_note || 'None'}</p>
                    </div>
                </div>

                {/* Order Items */}
                <div className="mt-6">
                    <div className="bg-gray-100 p-3 rounded-t border-b border-gray-300">
                        <div className="grid grid-cols-12 text-sm font-semibold text-gray-700">
                            <div className="col-span-6">Item</div>
                            <div className="col-span-2 text-right">Unit Price</div>
                            <div className="col-span-2 text-right">Qty</div>
                            <div className="col-span-2 text-right">Amount</div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {invoice.order_items.map((item, index) => (
                            <div key={item.id || index} className="py-3 grid grid-cols-12 text-sm">
                                <div className="col-span-6 text-gray-800">{item.product_name}</div>
                                <div className="col-span-2 text-right text-gray-600">Rs. {parseFloat(item.unit_price).toFixed(2)}</div>
                                <div className="col-span-2 text-right text-gray-600">{item.quantity}</div>
                                <div className="col-span-2 text-right font-medium">Rs. {parseFloat(item.total_price).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Dotted line - traditional receipt element */}
                    <div className="my-4 border-b border-dashed border-gray-300"></div>

                    {/* Totals */}
                    <div className="flex flex-col items-end mt-4 space-y-1">
                        <div className="flex justify-between w-full md:w-1/3 text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>Rs. {invoice.order_items.reduce((sum, item) =>
                                sum + parseFloat(item.total_price), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between w-full md:w-1/3 text-sm">
                            <span className="text-gray-600">Shipping Fee:</span>
                            <span>Rs. {parseFloat(invoice.shipping_charge).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between w-full md:w-1/3 text-base font-bold pt-1">
                            <span>Total:</span>
                            <span>Rs. {(invoice.order_items.reduce((sum, item) =>
                                    sum + parseFloat(item.total_price), 0) +
                                parseFloat(invoice.shipping_charge)).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-gray-700 font-semibold mb-2">Payment Information</h3>
                    <p className="text-sm text-gray-600">Method: {invoice.payment_method || 'Cash on Delivery'}</p>
                </div>

                {/* Notes and Terms */}
                <div className="mt-8 text-sm text-gray-600">
                    <h3 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
                    <p>1. All items are non-refundable once delivered.</p>
                    <p>2. Please check the product upon delivery.</p>
                    <p>3. For any queries contact us at 070 568 7994.</p>
                </div>

                {/* Thank You Note */}
                <div className="mt-10 text-center">
                    <p className="font-medium text-gray-700">Thank you for your order!</p>
                    <p className="text-sm text-gray-600 mt-1">Visit us at www.jcreations.com</p>
                </div>

                {/* Receipt footer */}
                <div className="mt-10 pt-4 border-t border-dashed border-gray-300 text-center text-xs text-gray-500">
                    <p>This is a computer-generated invoice and does not require a signature.</p>
                </div>
            </div>

            {/* Print styles */}
            <style jsx>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}

export default Invoices;