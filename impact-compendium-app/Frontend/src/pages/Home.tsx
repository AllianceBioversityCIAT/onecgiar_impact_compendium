import React from 'react';
import { AppLayout } from '../layouts/AppLayout';

export const Home: React.FC = () => {
  const handleCreateStudy = () => {
    localStorage.removeItem('studyFormStep1');
    localStorage.removeItem('studyFormStep2');
    localStorage.removeItem('studyFormStep3');
    window.location.href = '/studies/new/step-1';
  };

  const handleBrowseStudies = () => {
    window.location.href = '/studies';
  };

  return (
    <AppLayout title="Home" showAddButton={false}>
      <div className="min-h-screen bg-[#FAFAFA] -m-6">
        <div className="flex flex-col items-start px-16 pb-20 gap-8 max-w-[95vw] mx-auto">
        
        {/* Hero Section */}
        <div className="w-full h-[400px] relative bg-gradient-to-br from-[#B96A28] to-[#DC9700] rounded-3xl overflow-hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(185,106,40,0.92)] to-[rgba(139,69,19,0.85)]"></div>
          
          {/* Content */}
          <div className="absolute left-12 top-10 flex flex-col gap-4 w-[768px]">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-[#FFC84F] rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.33} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-[#FFC84F] text-base font-normal tracking-[-0.3125px]">CGIAR Impact Compendium</span>
            </div>

            {/* Heading */}
            <div className="text-white">
              <h1 className="text-[42px] leading-[50px] tracking-[0.369px] font-normal">
                Your Innovative Digital Impact
              </h1>
              <h1 className="text-[42px] leading-[50px] tracking-[0.369px] font-normal">
                Reporting Solution
              </h1>
            </div>

            {/* Description */}
            <p className="text-[#E0E7FF] text-lg leading-[29px] tracking-[-0.44px] font-normal max-w-[717px]">
              Welcome to the Impact Compendium Database! Explore comprehensive research insights and manage your impact studies with our innovative platform.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCreateStudy}
                className="bg-gradient-to-br from-[#FFC84F] to-[#F07E28] text-black font-medium text-sm leading-5 tracking-[-0.15px] px-6 py-3 rounded-2xl flex items-center gap-3 h-12"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M12 4v16m8-8H4" />
                </svg>
                Create New Study
              </button>
              <button 
                onClick={handleBrowseStudies}
                className="bg-[rgba(255,255,255,0.1)] border border-white text-white font-medium text-sm leading-5 tracking-[-0.15px] px-4 py-3 rounded-2xl flex items-center gap-3 h-12"
              >
                Browse Studies
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Actions Section */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#333333] text-2xl leading-9 tracking-[0.07px] font-normal">Main Actions</h2>
            <p className="text-[#777777] text-[15px] leading-[22px] tracking-[-0.23px] font-normal">
              Effortlessly access your key actions and get started with your research workflow.
            </p>
          </div>

          {/* Action Cards */}
          <div className="flex gap-6">
            {/* Create New Study Card */}
            <div className="w-[496px] h-[321px] bg-gradient-to-br from-[#FFF9E6] to-[#FFFFFF] rounded-2xl shadow-[0px_4px_20px_rgba(255,200,79,0.15)] p-8 flex flex-col justify-between">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFC84F] to-[#DC9700] rounded-2xl shadow-[0px_8px_16px_rgba(255,200,79,0.3)] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.67} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-[#333333] text-xl leading-[30px] tracking-[-0.45px] font-normal">Create New Study</h3>
                <p className="text-[#777777] text-sm leading-[22px] tracking-[-0.15px] font-normal">
                  Start documenting a new impact study with our guided workflow and comprehensive templates.
                </p>
                <button 
                  onClick={handleCreateStudy}
                  className="flex items-center gap-2 text-[#FFC84F] text-sm leading-[21px] tracking-[-0.15px] font-normal"
                >
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Browse Studies Card */}
            <div className="w-[496px] h-[321px] bg-gradient-to-br from-[#FFEBE0] to-[#FFFFFF] rounded-2xl shadow-[0px_4px_20px_rgba(240,126,40,0.15)] p-8 flex flex-col justify-between">
              <div className="w-16 h-16 bg-gradient-to-br from-[#F07E28] to-[#B96A28] rounded-2xl shadow-[0px_8px_16px_rgba(240,126,40,0.3)] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.67} d="M9 17H7a2 2 0 01-2-2V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v11a2 2 0 01-2 2h-5m-6 0a2 2 0 002 2h4a2 2 0 002-2m-6 0a2 2 0 012-2h4a2 2 0 012 2m-6 0h6" />
                </svg>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-[#333333] text-xl leading-[30px] tracking-[-0.45px] font-normal">Browse Studies</h3>
                <p className="text-[#777777] text-sm leading-[22px] tracking-[-0.15px] font-normal">
                  Explore and manage all impact studies in the database with advanced search and filtering capabilities.
                </p>
                <button 
                  onClick={handleBrowseStudies}
                  className="flex items-center gap-2 text-[#F07E28] text-sm leading-[21px] tracking-[-0.15px] font-normal"
                >
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* View Analytics Card */}
            <div className="w-[496px] h-[321px] bg-gradient-to-br from-[#FFF8E6] to-[#FFFFFF] rounded-2xl shadow-[0px_4px_20px_rgba(209,159,42,0.15)] p-8 flex flex-col justify-between">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D19F2A] to-[#DC9700] rounded-2xl shadow-[0px_8px_16px_rgba(209,159,42,0.3)] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.67} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-[#333333] text-xl leading-[30px] tracking-[-0.45px] font-normal">View Analytics</h3>
                <p className="text-[#777777] text-sm leading-[22px] tracking-[-0.15px] font-normal">
                  Track insights and metrics across your research portfolio with comprehensive analytics dashboard.
                </p>
                <button className="flex items-center gap-2 text-[#D19F2A] text-sm leading-[21px] tracking-[-0.15px] font-normal">
                  See Insights
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Overview Section */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#333333] text-2xl leading-9 tracking-[0.07px] font-normal">Data Overview</h2>
            <p className="text-[#777777] text-[15px] leading-[22px] tracking-[-0.23px] font-normal">
              Insights with real-time data updates
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-6">
            <div className="w-[372px] h-[143px] bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.06)] p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[#777777] text-sm leading-[21px] tracking-[-0.15px] font-normal">Total Studies</span>
                <svg className="w-5 h-5 text-[#FFC84F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.67} d="M9 17H7a2 2 0 01-2-2V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v11a2 2 0 01-2 2h-5m-6 0a2 2 0 002 2h4a2 2 0 002-2m-6 0a2 2 0 012-2h4a2 2 0 012 2m-6 0h6" />
                </svg>
              </div>
              <span className="text-[#333333] text-[28px] leading-[42px] tracking-[0.38px] font-normal">15</span>
            </div>

            <div className="w-[372px] h-[143px] bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.06)] p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[#777777] text-sm leading-[21px] tracking-[-0.15px] font-normal">Impact Studies</span>
                <svg className="w-5 h-5 text-[#F07E28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.67} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-[#333333] text-[28px] leading-[42px] tracking-[0.38px] font-normal">5</span>
            </div>

            <div className="w-[372px] h-[143px] bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.06)] p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[#777777] text-sm leading-[21px] tracking-[-0.15px] font-normal">Recent (2024-25)</span>
                <svg className="w-5 h-5 text-[#D19F2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.67} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[#333333] text-[28px] leading-[42px] tracking-[0.38px] font-normal">0</span>
            </div>

            <div className="w-[372px] h-[143px] bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.06)] p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[#777777] text-sm leading-[21px] tracking-[-0.15px] font-normal">Regions</span>
                <svg className="w-5 h-5 text-[#B96A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.67} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[#333333] text-[28px] leading-[42px] tracking-[0.38px] font-normal">27</span>
            </div>
          </div>
        </div>
        
        </div>
      </div>
    </AppLayout>
  );
};
