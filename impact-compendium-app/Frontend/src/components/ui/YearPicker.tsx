import React, { useState, useRef, useEffect } from 'react';

interface YearPickerProps {
  label: string;
  value: string;
  onChange: (year: string) => void;
  required?: boolean;
  error?: string;
}

export const YearPicker: React.FC<YearPickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i + 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearSelect = (year: number) => {
    onChange(year.toString());
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div
        className={`w-full px-3 py-2 border rounded-lg cursor-pointer bg-white flex items-center justify-between ${
          error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || 'Select year'}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {years.map((year) => (
            <div
              key={year}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                value === year.toString() ? 'bg-yellow-50 text-yellow-800' : 'text-gray-900'
              }`}
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
