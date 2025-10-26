import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  error,
  required,
  options,
  value,
  onChange,
  placeholder = 'Search and select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOption = options.find(opt => opt.value === value);
    setDisplayValue(selectedOption?.label || '');
  }, [value, options]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setDisplayValue(e.target.value);
    setIsOpen(true);
  };

  const handleOptionSelect = (option: SelectOption) => {
    onChange(option.value);
    setDisplayValue(option.label);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm(displayValue);
  };

  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  const inputStyles = `
    w-full px-3 py-2 border rounded-lg text-sm bg-[#F3F3F5]
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500'
    }
    focus:outline-none focus:ring-1
  `;

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label className="block text-sm font-bold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          className={inputStyles}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                  onMouseDown={() => handleOptionSelect(option)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                No options found
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};
