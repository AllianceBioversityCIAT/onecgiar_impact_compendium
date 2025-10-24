import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { ProgressStepper } from './ProgressStepper';
import { authService } from '../../services/auth';

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
  
  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const handleLogoClick = () => {
    navigate('/studies');
  };

  // Get user initials from logged user's email
  const getUserInitials = () => {
    const user = authService.getCurrentUser();
    
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

      {/* Center - Steps for forms */}
      {steps && currentStep && (
        <div className="flex-1 flex justify-center">
          <ProgressStepper steps={steps} currentStep={currentStep} />
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
