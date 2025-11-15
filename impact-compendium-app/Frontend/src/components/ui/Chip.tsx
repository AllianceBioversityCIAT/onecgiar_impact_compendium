import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  onRemove,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-200 ${className}`}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-yellow-200 focus:outline-none focus:ring-1 focus:ring-yellow-300"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};
