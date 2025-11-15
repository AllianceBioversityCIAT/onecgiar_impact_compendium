import React, { useState, useEffect } from 'react';
import { SlideOver } from '../components/ui/SlideOver';
import { Button } from '../components/ui/Button';

interface Study {
  id: string;
  title: string;
  summary: string;
  category: string; // Changed to string to avoid object rendering issues
  year: number;
  contributors: any;
  doi?: string;
  indicators?: any[];
  impact_areas?: any[];
  regions?: any[];
  countries?: any[];
  narratives?: any[];
}

interface StudyDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  studyId: string | null;
}

export const StudyDetailsPanel: React.FC<StudyDetailsPanelProps> = ({ isOpen, onClose, studyId }) => {
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && studyId) {
      setLoading(true);
      
      // Use the new detail endpoint
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/studies/${studyId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            const studyData = data.data;
            
            // Try different possible field names for contributors
            const contributingInitiatives = studyData.contributing_initiatives || 
                                           studyData.contributingInitiatives || 
                                           studyData.initiatives || [];
            const contributingCenters = studyData.contributing_centers || 
                                       studyData.contributingCenters || 
                                       studyData.centers || [];
            const allContributors = [...contributingInitiatives, ...contributingCenters];
            
            setStudy({
              id: studyData.study_id || studyData.id || studyId,
              title: studyData.title,
              summary: studyData.summary,
              category: typeof studyData.category === 'object' ? studyData.category.name : studyData.category || 'Other',
              year: studyData.year,
              contributors: allContributors.length > 0 ? allContributors : 'N/A',
              doi: studyData.doi,
              indicators: studyData.indicators || [],
              impact_areas: studyData.impact_areas || [],
              regions: studyData.regions || [],
              countries: studyData.countries || [],
              narratives: studyData.narratives || []
            });
          } else {
            console.error('Failed to fetch study details');
          }
        })
        .catch(error => {
          console.error('Error fetching study details:', error);
          setStudy({
            id: studyId,
            title: 'Study Details',
            summary: 'Unable to load study details.',
            category: 'Other',
            year: 2024,
            contributors: 'N/A'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, studyId]);

  const handleEdit = () => {
    window.location.href = `/studies/edit/${studyId}`;
  };

  const handleDelete = async () => {
    if (!studyId) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/studies/${studyId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onClose();
        window.location.reload(); // Refresh the dashboard
      } else {
        alert('Failed to delete study');
      }
    } catch (error) {
      console.error('Error deleting study:', error);
      alert('Error deleting study');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Study Details">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FEC750] mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading study details...</p>
          </div>
        </div>
      ) : study ? (
        <div className="relative min-h-full">
          <div className="space-y-8 pb-40">
            {/* Study Header - Enhanced */}
            <div className="bg-gradient-to-r from-[#FEC750]/10 to-[#F07F34]/10 rounded-xl p-6 border border-[#FEC750]/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{study.title}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-[#FEC750] text-gray-900 shadow-sm">
                      {study.category}
                    </span>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {study.year}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        ID: {study.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Section - Enhanced */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#FEC750]/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#F07F34]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Summary</h4>
              </div>
              <p className="text-gray-700 leading-relaxed text-base">{study.summary || 'No summary available for this study.'}</p>
            </div>

            {/* Contributors Section - Enhanced */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Contributors</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(study.contributors) ? study.contributors.map((contributor, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {typeof contributor === 'object' ? contributor.name || contributor.title : contributor}
                  </span>
                )) : typeof study.contributors === 'string' && study.contributors !== 'N/A' ? study.contributors.split(',').map((contributor, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {contributor.trim()}
                  </span>
                )) : (
                  <div className="flex items-center gap-2 text-gray-500 py-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-sm">No contributors listed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Impact Areas Section - Enhanced */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Impact Areas</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {study.impact_areas && study.impact_areas.length > 0 ? (
                  study.impact_areas.map((area: any, index: number) => (
                    <span key={index} className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 transition-colors">
                      {area.name || area}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-800 border border-green-200">
                      Climate Change
                    </span>
                    <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-800 border border-green-200">
                      Food Security
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Regions Section - Enhanced */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Regions</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {study.regions && study.regions.length > 0 ? (
                  study.regions.map((region: any, index: number) => (
                    <span key={index} className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors">
                      {region.name || region}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-800 border border-purple-200">
                      Sub-Saharan Africa
                    </span>
                    <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-800 border border-purple-200">
                      South Asia
                    </span>
                  </>
                )}
              </div>
            </div>

            {study.countries && study.countries.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Countries</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {study.countries.map((country: any, index: number) => (
                    <span key={index} className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 transition-colors">
                      {country.name || country}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {study.indicators && study.indicators.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Key Indicators</h4>
                </div>
                <div className="space-y-3">
                  {study.indicators.map((indicator: any, index: number) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                      <div className="font-semibold text-gray-900 mb-2">{indicator.measure || indicator.indicator_name}</div>
                      <div className="text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Result:</span>
                        <span>{indicator.result_reported || indicator.indicator_value}</span>
                        {indicator.unit && !indicator.result_reported?.includes(indicator.unit) && (
                          <span className="text-indigo-600 font-medium">{indicator.unit}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {study.narratives && study.narratives.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Study Narratives</h4>
                </div>
                <div className="space-y-4">
                  {study.narratives.map((narrative: any, index: number) => (
                    <div key={index} className="border-l-4 border-[#FEC750] bg-amber-50/50 pl-4 pr-4 py-3 rounded-r-lg">
                      <div className="font-semibold text-gray-900 capitalize mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#F07F34]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                        </svg>
                        {narrative.section_key}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{narrative.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {study.doi && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">DOI/Link</h4>
                </div>
                <a
                  href={study.doi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2 px-4 py-3 bg-gradient-to-r from-[#FEC750]/10 to-[#F07F34]/10 border border-[#FEC750]/30 rounded-lg text-[#F07F34] hover:from-[#FEC750]/20 hover:to-[#F07F34]/20 hover:border-[#F07F34]/50 transition-all duration-200 font-medium w-full"
                >
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="break-all text-sm leading-relaxed">{study.doi}</span>
                </a>
              </div>
            )}
          </div>

          {/* Fixed Bottom Action Panel - Enhanced */}
          <div className="fixed bottom-0 right-0 w-96 bg-gradient-to-r from-white to-gray-50/50 border-t border-gray-200 shadow-2xl backdrop-blur-sm">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleEdit} 
                  className="group flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-[#FEC750] to-[#FEC750]/90 hover:from-[#E5B347] hover:to-[#E5B347]/90 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border border-[#FEC750]/30"
                >
                  <svg className="w-4 h-4 group-hover:scale-125 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Study
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="group flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-[#F07F34] to-[#F07F34]/90 hover:from-[#D6722E] hover:to-[#D6722E]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border border-[#F07F34]/30"
                  disabled={deleting}
                >
                  <svg className="w-4 h-4 group-hover:scale-125 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
              <button 
                onClick={onClose} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-300 text-gray-700 hover:from-gray-50 hover:to-gray-100 hover:border-gray-400 font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close Panel
              </button>
            </div>
          </div>

          {/* Enhanced Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Study</h3>
                    <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                  </div>
                </div>
                <div className="mb-8">
                  <p className="text-gray-700 leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">"{study?.title}"</span>? 
                    All associated data will be permanently removed from the system.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleDelete} 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 flex items-center justify-center gap-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                    disabled={deleting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleting ? 'Deleting...' : 'Delete Study'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowDeleteConfirm(false)} 
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 flex items-center justify-center gap-2 rounded-xl transition-all duration-200"
                    disabled={deleting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </SlideOver>
  );
};
