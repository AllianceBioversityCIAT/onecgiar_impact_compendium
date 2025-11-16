import React from 'react';

export const EnvironmentBanner: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
  const isDev = import.meta.env.DEV;
  const mode = import.meta.env.MODE;
  
  const shouldShow = apiUrl.includes('testing') || isDev || mode === 'development';
  
  if (!shouldShow) return null;

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-medium shadow-lg">
        🚧 TEST
      </div>
    </div>
  );
};
