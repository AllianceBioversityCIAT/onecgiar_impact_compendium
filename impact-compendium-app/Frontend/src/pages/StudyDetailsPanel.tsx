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
            setStudy({
              id: studyData.study_id || studyData.id || studyId,
              title: studyData.title,
              summary: studyData.summary,
              category: typeof studyData.category === 'object' ? studyData.category.name : studyData.category || 'Other',
              year: studyData.year,
              contributors: studyData.contributors || studyData.contributing_initiatives || 'N/A',
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
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      ) : study ? (
        <div className="flex flex-col h-full">
          <div className="flex-1 space-y-6 mb-20">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{study.title}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {study.category}
                </span>
                <span className="text-sm text-gray-500">Year: {study.year}</span>
                <span className="text-sm text-gray-500">ID: {study.id}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{study.summary}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Contributors</h4>
              <div className="flex flex-wrap gap-2">
                {typeof study.contributors === 'string' ? study.contributors.split(',').map((contributor, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {contributor.trim()}
                  </span>
                )) : (
                  <span className="text-sm text-gray-500">N/A</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Impact Areas</h4>
              <div className="flex flex-wrap gap-2">
                {study.impact_areas && study.impact_areas.length > 0 ? (
                  study.impact_areas.map((area: any, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                      {area.name || area}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                      Climate Change
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      Food Security
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Regions</h4>
              <div className="flex flex-wrap gap-2">
                {study.regions && study.regions.length > 0 ? (
                  study.regions.map((region: any, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                      {region.name || region}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                      Sub-Saharan Africa
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                      South Asia
                    </span>
                  </>
                )}
              </div>
            </div>

            {study.countries && study.countries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Countries</h4>
                <div className="flex flex-wrap gap-2">
                  {study.countries.map((country: any, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                      {country.name || country}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {study.indicators && study.indicators.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Indicators</h4>
                <div className="space-y-2">
                  {study.indicators.map((indicator: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm text-gray-900">{indicator.measure || indicator.indicator_name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Result: {indicator.result_reported || indicator.indicator_value}
                        {indicator.unit && !indicator.result_reported?.includes(indicator.unit) && ` ${indicator.unit}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {study.narratives && study.narratives.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Study Narratives</h4>
                <div className="space-y-3">
                  {study.narratives.map((narrative: any, index: number) => (
                    <div key={index} className="border-l-4 border-yellow-400 pl-3 py-2">
                      <div className="font-medium text-sm capitalize text-gray-900">{narrative.section_key}</div>
                      <p className="text-sm text-gray-600 mt-1">{narrative.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {study.doi && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">DOI/Link</h4>
                <a
                  href={study.doi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-yellow-600 hover:text-yellow-800 underline"
                >
                  {study.doi}
                </a>
              </div>
            )}
          </div>

          {/* Fixed Bottom Buttons */}
          <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4 space-y-3">
            <div className="flex gap-3">
              <button 
                onClick={handleEdit} 
                className="flex-1 bg-[#FEC750] hover:bg-[#E5B347] text-black font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Study
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="flex-1 bg-[#F07F34] hover:bg-[#D6722E] text-black font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                disabled={deleting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            <button 
              onClick={onClose} 
              className="w-full border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close Panel
            </button>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Study</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Are you sure you want to delete <span className="font-medium">"{study?.title}"</span>? This action cannot be undone and all associated data will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleDelete} 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 flex items-center justify-center gap-2 transition-all duration-200"
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
                    className="flex-1 font-medium py-3 flex items-center justify-center gap-2 transition-all duration-200"
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
