import React from 'react';

const PaymentMethodSelector = ({ total = 0, onSelectPaymentMethod, selectedMethod, codLimit = 2000 }) => {
  return (
    <div className="bg-white border-1 border-gray-300 rounded-lg p-6 mx-auto">
      <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
      <form className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-20">
        <div className="form-group flex flex-col items-start">
          <label className="flex items-center space-x-2">
            <img src="..//carticons/Credit%20Card%20Icon.png" alt="Online Payment" className="w-6 h-6" />
            <input 
              type="radio" 
              name="paymentMethod" 
              value="online" 
              className="form-radio text-blue-600" 
              checked={selectedMethod === 'online'}
              onChange={() => onSelectPaymentMethod('online')}
            />
            <span>Online Payment</span>
          </label>
        </div>
        {total <= codLimit && (
          <div className="form-group flex flex-col items-start">
            <label className="flex items-center space-x-2">
              <img src="/carticons/Cash%20on%20Delivery%20Icon.png" alt="Cash on Delivery" className="w-6 h-6" />
              <input 
                type="radio" 
                name="paymentMethod" 
                value="cod" 
                className="form-radio text-blue-600" 
                checked={selectedMethod === 'cod'}
                onChange={() => onSelectPaymentMethod('cod')}
              />
              <span>Cash on Delivery</span>
            </label>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaymentMethodSelector;