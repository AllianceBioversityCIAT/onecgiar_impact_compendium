import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  error,
  required,
  options,
  placeholder = 'Select an option',
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>(
    'bottom'
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropdownPosition(
        spaceBelow < 200 && spaceAbove > 200 ? 'top' : 'bottom'
      );
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const selectStyles = `
    w-full px-3 py-2 border rounded-lg text-sm cursor-pointer
    ${
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-[#F3F3F5]'
        : 'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-[#F3F3F5]'
    }
    focus:outline-none focus:ring-1
  `;

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-bold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          className={`${selectStyles} ${className} flex justify-between items-center`}
          onClick={handleToggle}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {displayValue}
          </span>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isOpen && (
          <div
            className={`absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto ${
              dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            {options.map(option => (
              <div
                key={option.value}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                  value === option.value
                    ? 'bg-yellow-50 text-yellow-800'
                    : 'text-gray-900'
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};
