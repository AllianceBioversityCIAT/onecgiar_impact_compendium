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

  useEffect(() => {
    if (isOpen && studyId) {
      setLoading(true);
      
      // Use the new detail endpoint
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/studies/${studyId}`)
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

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Study Details">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      ) : study ? (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-6 pb-20">
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
          <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4 flex gap-3">
            <Button onClick={handleEdit} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white">
              Edit Study
            </Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Close Panel
            </Button>
          </div>
        </div>
      ) : null}
    </SlideOver>
  );
};
