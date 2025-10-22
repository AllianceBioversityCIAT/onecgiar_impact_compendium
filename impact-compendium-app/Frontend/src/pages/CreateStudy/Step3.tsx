import React, { useState } from 'react';
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
  const [indicators, setIndicators] = useState<Indicator[]>([
    { id: '1', indicatorMeasured: '', unitOfMeasure: '', resultReported: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        // Step 1 fields
        study_id: step1Data.studyId,
        title: step1Data.title,
        summary: step1Data.summary,
        year_of_report: parseInt(step1Data.yearOfReport),
        link_or_doi: step1Data.linkOrDoi,
        category: step1Data.category,
        period_start: step1Data.periodStart,
        period_end: step1Data.periodEnd,
        intervention_type: step1Data.interventionType,
        intervention_details: step1Data.interventionDetails,
        
        // Step 2 fields
        crop_product_type: step2Data.cropProductType,
        keywords: step2Data.keywords,
        contributing_initiatives: step2Data.contributingInitiatives,
        contributing_centers: step2Data.contributingCenters,
        primary_cgiar_impact_area: step2Data.primaryCGIARImpactArea,
        secondary_cgiar_impact_area: step2Data.secondaryCGIARImpactArea,
        country_of_study: step2Data.countryOfStudy,
        cgiar_regions: step2Data.cgiarRegions,
        
        // Step 3 fields
        indicators: indicators.map(indicator => ({
          indicator_measured: indicator.indicatorMeasured,
          unit_of_measure: indicator.unitOfMeasure,
          result_reported: indicator.resultReported
        }))
      };

      await studyAPI.create(completeStudyData);
      
      // Clear localStorage
      localStorage.removeItem('studyFormStep1');
      localStorage.removeItem('studyFormStep2');
      
      console.log('Study created successfully, navigate to success page');
      
    } catch (error) {
      console.error('Failed to create study:', error);
      alert('Failed to create study. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    console.log('Navigate back to Step 2');
  };

  return (
    <AppLayout title="Create new study form" showAddButton={false}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleGoBack} className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Go Back</span>
          </Button>
          <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">Create new study form</h1>
        </div>

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

          {/* Finish Button */}
          <div className="flex justify-end pt-6">
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
