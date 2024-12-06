import React, { useState } from "react";

const TransactionFeeSlider = () => {
  const [selected, setSelected] = useState("Low"); // Default is "Low"

  const handleSelection = (level) => {
    setSelected(level);
  };

  const getSliderStyle = () => {
    if (selected === "Low") return "bg-yellow-500 w-1/3";
    if (selected === "Average") return "bg-yellow-500 w-2/3";
    if (selected === "High") return "bg-yellow-500 w-full";
    return "";
  };

  return (
    <div className="flex flex-col items-center p-6 text-white" style={{ backgroundColor: "#001A47" }}>
      <h3 className="mb-4 text-lg font-semibold">Transaction Fee</h3>
      <div className="relative w-full max-w-md">
        {/* Background Bar */}
        <div className="w-full h-2 bg-gray-400 rounded-full"></div>
        {/* Dynamic Fill */}
        <div
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getSliderStyle()}`}
        ></div>
        {/* Buttons */}
        <div className="absolute flex justify-between w-full -top-2">
          {["Low", "Average", "High"].map((level) => (
            <button
              key={level}
              className={`w-4 h-4 rounded-full focus:outline-none ${
                selected === level ? "bg-yellow-500" : "bg-gray-400"
              }`}
              onClick={() => handleSelection(level)}
            ></button>
          ))}
        </div>
      </div>
      {/* Labels */}
      <div className="flex justify-between w-full max-w-md mt-2 text-sm">
        <span>Low</span>
        <span>Average</span>
        <span>High</span>
      </div>
    </div>
  );
};

export default TransactionFeeSlider;
