

const Additionalnotes = ({ codLimit = 2000 }) => {
  return (
    <div className="additional-notes-container mx-auto p-6 bg-white rounded-lg border border-gray-300">
      <h2 className="additional-notes-header text-black font-bold text-xl mb-4">Additional Notes</h2>      <div className="notes-content text-gray-600 text-base leading-relaxed">
        {`If the cart value is below ${parseFloat(codLimit).toFixed(0)} LKR, both Cash on Delivery (COD) and Card Payment options are available.`}
      </div>
    </div>
  );
};

export default Additionalnotes;