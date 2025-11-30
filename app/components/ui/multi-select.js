// File: components/ui/multi-select.js
import { useState } from "react";

export function MultiSelect({ options, selectedValues, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option];
    onChange(newSelectedValues);
  };

  return (
    <div className="relative">
      <div
        className="border rounded px-4 py-2 cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length > 0
          ? selectedValues.join(", ")
          : "Select options"}
      </div>
      {isOpen && (
        <div className="absolute mt-2 border rounded bg-white z-10 max-h-40 overflow-auto shadow-md">
          {options.map((option) => (
            <div
              key={option}
              className={`px-4 py-2 cursor-pointer ${
                selectedValues.includes(option) ? "bg-blue-100" : ""
              }`}
              onClick={() => toggleOption(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
