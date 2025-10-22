import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  required,
  className = '',
  ...props
}) => {
  const textareaStyles = `
    w-full px-3 py-2 border rounded-lg text-sm resize-vertical min-h-[80px]
    ${error 
      ? 'border-[var(--ic-error)] focus:border-[var(--ic-error)] focus:ring-[var(--ic-error)]' 
      : 'border-[var(--ic-border)] focus:border-[var(--ic-color-primary)] focus:ring-[var(--ic-color-primary)]'
    }
    focus:outline-none focus:ring-1 bg-white
    placeholder:text-[var(--ic-color-neutral)]
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[var(--ic-color-text)]">
          {label}
          {required && <span className="text-[var(--ic-error)] ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`${textareaStyles} ${className}`}
        {...props}
      />
      {error && (
        <div className="flex items-center gap-1 text-sm text-[var(--ic-error)]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};
