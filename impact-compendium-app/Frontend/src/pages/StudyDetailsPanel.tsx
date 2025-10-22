import React, { useState, useEffect } from 'react';
import { SlideOver } from '../components/ui/SlideOver';
import { Button } from '../components/ui/Button';
import { studyAPI } from '../services/api';

interface Study {
  id: number;
  title: string;
  summary: string;
  category: string;
  year: number;
  contributors: string;
  doi?: string;
}

interface StudyDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  studyId: number | null;
}

export const StudyDetailsPanel: React.FC<StudyDetailsPanelProps> = ({ isOpen, onClose, studyId }) => {
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studyId) {
      setLoading(true);
      studyAPI.getById(studyId.toString())
        .then(response => {
          const studyData = response.success ? response.data : response;
          setStudy({
            id: studyData.study_id || studyData.id,
            title: studyData.title,
            summary: studyData.summary,
            category: studyData.category || 'Other',
            year: studyData.year,
            contributors: studyData.contributors || studyData.contributing_initiatives || 'N/A',
            doi: studyData.doi
          });
        })
        .catch(() => {
          setStudy({
            id: studyId,
            title: 'Study Details',
            summary: 'Unable to load study details.',
            category: 'Other',
            year: 2024,
            contributors: 'N/A'
          });
        })
        .finally(() => setLoading(false));
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
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{study.title}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {study.category}
              </span>
              <span className="text-sm text-gray-500">{study.year}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{study.summary}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Contributors</h4>
            <div className="flex flex-wrap gap-2">
              {study.contributors.split(',').map((contributor, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {contributor.trim()}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Impact Areas</h4>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                Climate Change
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                Food Security
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Regions</h4>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                Sub-Saharan Africa
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                South Asia
              </span>
            </div>
          </div>

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

          <div className="border-t pt-6 flex gap-3">
            <Button onClick={handleEdit} className="flex-1">
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
