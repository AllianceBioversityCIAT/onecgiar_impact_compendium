import React, { useState } from 'react';
import { ContactModal } from './ContactModal';

export const Footer: React.FC = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Contact Button */}
            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-2 text-[#FFC850] hover:text-[#E5B347] transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact Us
            </button>

            {/* Divider */}
            <div className="w-16 h-px bg-gray-200"></div>

            {/* Copyright */}
            <div className="text-sm text-gray-600 text-center">
              © {currentYear} CGIAR System Organization. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </>
  );
};
