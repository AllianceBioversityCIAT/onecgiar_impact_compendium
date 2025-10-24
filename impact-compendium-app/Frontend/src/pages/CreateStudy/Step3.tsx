import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { studyAPI } from '../../services/api';

const steps = [
  { id: 1, label: 'Step 1', completed: true },
  { id: 2, label: 'Step 2', completed: true },
  { id: 3, label: 'Step 3' }
];

interface Indicator {
  id: string;
  indicatorMeasured: string;
  unitOfMeasure: string;
  resultReported: string;
}

export const CreateStudyStep3: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  // Load saved data immediately and synchronously
  const getSavedData = () => {
    const savedData = localStorage.getItem('studyFormStep3');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return parsed.indicators || [{ id: '1', indicatorMeasured: '', unitOfMeasure: '', resultReported: '' }];
    }
    return [{ id: '1', indicatorMeasured: '', unitOfMeasure: '', resultReported: '' }];
  };

  const [indicators, setIndicators] = useState<Indicator[]>(getSavedData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load study data for edit mode
  React.useEffect(() => {
    if (isEditMode && id) {
      const loadStudyData = async () => {
        try {
          const numericId = id.startsWith('ICD-') ? id.replace('ICD-', '') : id;
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/studies/${numericId}`);
          
          if (response.ok) {
            const apiResponse = await response.json();
            const studyData = apiResponse.data || apiResponse;
            
            if (studyData.indicators && studyData.indicators.length > 0) {
              const mappedIndicators = studyData.indicators.map((indicator: any, index: number) => ({
                id: (index + 1).toString(),
                indicatorMeasured: indicator.indicator_measure || '',
                unitOfMeasure: indicator.unit_measure || '',
                resultReported: indicator.result_reported || ''
              }));
              setIndicators(mappedIndicators);
            }
          }
        } catch (error) {
          console.error('Step3: Failed to load study data:', error);
        }
      };
      loadStudyData();
    }
    
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, [isEditMode, id]);

  const handleIndicatorChange = (id: string, field: keyof Indicator, value: string) => {
    setIndicators(prev => prev.map(indicator => 
      indicator.id === id ? { ...indicator, [field]: value } : indicator
    ));
  };

  const addIndicator = () => {
    const newId = (indicators.length + 1).toString();
    setIndicators(prev => [...prev, { 
      id: newId, 
      indicatorMeasured: '', 
      unitOfMeasure: '', 
      resultReported: '' 
    }]);
  };

  const removeIndicator = (id: string) => {
    if (indicators.length > 1) {
      setIndicators(prev => prev.filter(indicator => indicator.id !== id));
    }
  };

  const duplicateIndicator = (id: string) => {
    const indicatorToDuplicate = indicators.find(indicator => indicator.id === id);
    if (indicatorToDuplicate) {
      const newId = (indicators.length + 1).toString();
      const duplicated = { ...indicatorToDuplicate, id: newId };
      setIndicators(prev => [...prev, duplicated]);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      // Combine all form data from localStorage and current indicators
      const step1Data = JSON.parse(localStorage.getItem('studyFormStep1') || '{}');
      const step2Data = JSON.parse(localStorage.getItem('studyFormStep2') || '{}');
      
      const completeStudyData = {
        // Step 1 fields - map to database columns
        title: step1Data.title,
        summary: step1Data.summary,
        year: parseInt(step1Data.yearOfReport),
        doi: step1Data.linkOrDoi,
        category_id: step1Data.category,
        period_start: step1Data.periodStart,
        period_end: step1Data.periodEnd,
        intervention_details: step1Data.interventionDetails,
        
        // Step 2 fields - map to relationship tables
        crop_types: step2Data.cropProductType || [],
        keywords: step2Data.keywords || [],
        initiatives: step2Data.contributingInitiatives || [],
        centers: step2Data.contributingCenters || [],
        impact_areas: [
          ...(step2Data.primaryCGIARImpactArea ? [step2Data.primaryCGIARImpactArea] : []),
          ...(step2Data.secondaryCGIARImpactArea || [])
        ],
        countries: step2Data.countryOfStudy || [],
        regions: step2Data.cgiarRegions || [],
        
        // Step 3 fields
        indicators: indicators.map(indicator => ({
          indicator_measured: indicator.indicatorMeasured,
          unit_of_measure: indicator.unitOfMeasure,
          result_reported: indicator.resultReported
        }))
      };

      if (isEditMode && id) {
        // Update existing study
        const numericId = id.startsWith('ICD-') ? id.replace('ICD-', '') : id;
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/studies-crud/complete/${numericId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completeStudyData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update study');
        }
        
        console.log('Study updated successfully');
        navigate('/studies');
      } else {
        // Create new study
        await studyAPI.create(completeStudyData);
        
        // Clear localStorage
        localStorage.removeItem('studyFormStep1');
        localStorage.removeItem('studyFormStep2');
        
        console.log('Study created successfully');
        navigate('/studies');
      }
      
    } catch (error) {
      console.error('Failed to create study:', error);
      alert('Failed to create study. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    // Save current form data before going back
    localStorage.setItem('studyFormStep3', JSON.stringify({ indicators }));
    const backPath = isEditMode ? `/studies/edit/${id}/step-2` : '/studies/new/step-2';
    navigate(backPath);
  };

  const pageTitle = isEditMode ? "Edit study form" : "Create new study form";

  if (loading) {
    return (
      <AppLayout title={pageTitle} showAddButton={false}>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>
          <ProgressStepper steps={steps} currentStep={3} />
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {isEditMode ? 'Loading study data...' : 'Loading form...'}
              </span>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={pageTitle} showAddButton={false}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>

        <ProgressStepper steps={steps} currentStep={3} />

        <div className="space-y-6">
          {/* Add Indicator Button */}
          <div className="flex justify-end">
            <Button onClick={addIndicator} className="flex items-center space-x-2">
              <span>Add indicator</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>

          {/* Indicator Cards */}
          {indicators.map((indicator, index) => (
            <Card key={indicator.id} className="relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-green-600">
                    Indicator #{index + 1}
                  </h3>
                  
                  {indicators.length > 1 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateIndicator(indicator.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIndicator(indicator.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Indicator measured"
                    placeholder="Enter value"
                    value={indicator.indicatorMeasured}
                    onChange={(e) => handleIndicatorChange(indicator.id, 'indicatorMeasured', e.target.value)}
                  />
                  
                  <Input
                    label="Unit of measure"
                    placeholder="Enter value"
                    value={indicator.unitOfMeasure}
                    onChange={(e) => handleIndicatorChange(indicator.id, 'unitOfMeasure', e.target.value)}
                  />
                </div>

                <Input
                  label="Result reported"
                  placeholder="Enter value"
                  value={indicator.resultReported}
                  onChange={(e) => handleIndicatorChange(indicator.id, 'resultReported', e.target.value)}
                />
              </div>
            </Card>
          ))}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Go Back</span>
            </Button>
            <Button 
              onClick={handleFinish} 
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Finish'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
