import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { ProgressStepper } from './ProgressStepper';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderBarProps {
  title: string;
  onAddStudy?: () => void;
  showAddButton?: boolean;
  steps?: Array<{ id: number; label: string; completed?: boolean }>;
  currentStep?: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ 
  title, 
  onAddStudy, 
  showAddButton = true,
  steps,
  currentStep
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Redirect anyway
      window.location.href = '/login';
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const isActive = (path: string) => {
    return window.location.pathname === path;
  };

  // Get user initials from logged user's email
  const getUserInitials = () => {
    if (user && user.email) {
      const email = user.email;
      const namePart = email.split('@')[0]; // Get part before @
      const parts = namePart.split('.'); // Split by dots (e.g., john.doe)
      
      if (parts.length >= 2) {
        // If email is like john.doe@example.com, use J.D
        return (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        // If email is like johndoe@example.com, use first two letters
        return namePart.substring(0, 2).toUpperCase();
      }
    }
    return "U"; // Default fallback
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[var(--ic-border-light)] shadow-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.svg" 
            alt="Impact Compendium Database" 
            className="h-6 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          />
        </div>
      </div>

      {/* Center - Navigation or Steps */}
      {steps && currentStep ? (
        <div className="flex-1 flex justify-center">
          <ProgressStepper steps={steps} currentStep={currentStep} />
        </div>
      ) : (
        <div className="flex-1 flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-normal tracking-[-0.15px] transition-colors ${
                isActive('/') 
                  ? 'bg-[#FFF9E6] border-b-2 border-[#FFC84F] text-[#B96A28]' 
                  : 'text-[#777777] hover:text-[#333333]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>
            <button
              onClick={() => navigate('/studies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-normal tracking-[-0.15px] transition-colors ${
                isActive('/studies') || isActive('/dashboard')
                  ? 'bg-[#FFF9E6] border-b-2 border-[#FFC84F] text-[#B96A28]' 
                  : 'text-[#777777] hover:text-[#333333]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M9 17H7a2 2 0 01-2-2V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v11a2 2 0 01-2 2h-5m-6 0a2 2 0 002 2h4a2 2 0 002-2m-6 0a2 2 0 012-2h4a2 2 0 012 2m-6 0h6" />
              </svg>
              Studies
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-normal tracking-[-0.15px] text-[#777777] hover:text-[#333333] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>
      )}

      <div className="flex items-center space-x-4">
        {showAddButton ? (
          <>
            <Button onClick={onAddStudy} className="flex items-center space-x-2">
              <span>Add study</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
            
            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 bg-[var(--ic-color-primary)] text-black rounded-full flex items-center justify-center font-semibold hover:opacity-90 transition-opacity"
              >
                {getUserInitials()}
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">
                    My Account
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* X button for form mode */
          <button
            onClick={() => navigate('/studies')}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
};
