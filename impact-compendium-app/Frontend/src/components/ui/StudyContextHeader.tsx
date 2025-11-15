import React from 'react';

interface StudyContextHeaderProps {
  studyId: string;
  title: string;
  currentStep: number;
  isEditMode?: boolean;
}

export const StudyContextHeader: React.FC<StudyContextHeaderProps> = ({ 
  studyId, 
  title, 
  currentStep, 
  isEditMode = false 
}) => {
  return (
    <div className="bg-gradient-to-r from-[#FEC750]/10 to-[#F07F34]/10 rounded-xl p-6 border border-[#FEC750]/20 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#FEC750] to-[#F07F34] rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {isEditMode ? 'Editing Study' : 'Creating Study'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 3 - Continue building your study
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Study ID:</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-[#FEC750]/20 text-gray-900 border border-[#FEC750]/30">
                {studyId || 'Pending'}
              </span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-700 mt-0.5">Title:</span>
              <p className="text-sm text-gray-900 font-medium leading-relaxed flex-1">
                {title || 'No title provided yet'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <div className="w-8 h-8 bg-white/80 rounded-lg border border-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#F07F34]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
