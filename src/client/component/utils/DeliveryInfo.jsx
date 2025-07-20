import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';

const DeliveryInfo = ({ deliveryInfo, setDeliveryInfo, onShippingChange }) => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateTimeError, setDateTimeError] = useState('');

  // Calculate minimum allowed datetime (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm
  };

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/locations');
        if (response.data && response.data.locations) {
          setLocations(response.data.locations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'deliveryDateTime') {
      const selectedDateTime = new Date(value);
      const minDateTime = new Date(getMinDateTime());

      // Clear validation errors by default
      setDateTimeError('');

      // Check if the selected time is valid (at least 1 hour from now)
      if (selectedDateTime < minDateTime) {
        setDateTimeError(`Please select a time after ${minDateTime.toLocaleTimeString()} today`);
        return;
      }

      // Check if the selected time falls within delivery windows
      const hour = selectedDateTime.getHours();
      const isValidDeliveryWindow =
          (hour >= 9 && hour < 11) ||  // Morning: 9:00 AM - 11:00 AM
          (hour >= 12 && hour < 18) || // Evening: 12:00 PM - 6:00 PM
          (hour >= 19 && hour <= 22);  // Night: 7:00 PM - 10:00 PM

      if (!isValidDeliveryWindow) {
        setDateTimeError('Please select a time within our delivery windows');
        return;
      }
    }

    setDeliveryInfo(prev => ({ ...prev, [name]: value }));

    // When city changes, find the corresponding shipping charge and notify parent
    if (name === 'city' && value) {
      const selectedLocation = locations.find(location => location.city === value);
      if (selectedLocation && onShippingChange) {
        onShippingChange(parseFloat(selectedLocation.shipping_charge));
      }
    }
  };

  return (
      <div className="bg-white rounded-lg border-1 border-gray-300 p-6 mx-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Delivery Information</h3>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={deliveryInfo.customer_name || ''}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-900 focus:border-indigo-900"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">Location</label>

                {/* Dropdown for location selection */}
                <select
                    id="city"
                    name="city"
                    value={deliveryInfo.city || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-900 focus:border-indigo-900"
                    disabled={isLoading}
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                      <option key={location.id} value={location.city}>
                        {location.city} (Rs.{location.shipping_charge})
                      </option>
                  ))}
                </select>
                {isLoading && <p className="text-xs text-gray-500">Loading locations...</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="deliveryDateTime" className="block text-sm font-medium text-gray-700">Date & Time for Delivery</label>
                <input
                    type="datetime-local"
                    id="deliveryDateTime"
                    name="deliveryDateTime"
                    value={deliveryInfo.deliveryDateTime || ''}
                    onChange={handleChange}
                    min={getMinDateTime()}
                    className={`w-full px-3 py-2 border-2 ${dateTimeError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-indigo-900 focus:border-indigo-900`}
                />
                {dateTimeError && <p className="text-xs text-red-500 mt-1">{dateTimeError}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Please select a time at least 1 hour from now within our delivery windows
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                    type="text"
                    id="contact_number"
                    name="contact_number"
                    value={deliveryInfo.contact_number || ''}
                    onChange={handleChange}
                    placeholder="Enter your contact number"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-900 focus:border-indigo-900"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <input
                    type="text"
                    id="address"
                    name="address"
                    value={deliveryInfo.address || ''}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-900 focus:border-indigo-900"
                />
              </div>
            </div>
          </div>
          <div className={'flex flex-col items-start mt-4'}>
            <span className={'text-sm text-red-700'}>Delivery is possible from two hours after confirmation of the order.</span>
            <span className={'font-semibold text-sm text-green-400'}>Dilivery Times</span>
            <ul className={'list-disc list-inside text-sm text-gray-600'}>
              <li>Morning: 9:00 AM - 11:00 AM</li>
              <li>Evening: 12:00 PM - 6:00 PM</li>
              <li>Night: 7:00 PM - 10:00 PM</li>
            </ul>
          </div>
        </form>
      </div>
  );
};

export default DeliveryInfo;