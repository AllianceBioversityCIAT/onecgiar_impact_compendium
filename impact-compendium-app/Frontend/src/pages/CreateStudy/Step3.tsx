import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../layouts/FormLayout';
import { AppLayout } from '../../layouts/AppLayout';
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { studyAPI } from '../../services/api';
import { authService } from '../../services/auth';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mappingData, setMappingData] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({ type: 'info', message: '', show: false });

  // Load study data for edit mode
  React.useEffect(() => {
    if (isEditMode && id) {
      const loadStudyData = async () => {
        try {
          setMappingData(true);
          const numericId = id.startsWith('ICD-') ? id.replace('ICD-', '') : id;
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/studies/${numericId}`);
          
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
        } finally {
          setMappingData(false);
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

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    showNotification('info', 'Saving your study...');
    
    try {
      // Get all form data from localStorage
      const step1Data = JSON.parse(localStorage.getItem('studyFormStep1') || '{}');
      const step2Data = JSON.parse(localStorage.getItem('studyFormStep2') || '{}');
      
      // Get current user
      const currentUser = authService.getCurrentUser();
      
      // Prepare complete study data according to backend schema
      const completeStudyData = {
        // Step 1 data
        studyId: parseInt(step1Data.studyId),
        title: step1Data.title,
        summary: step1Data.summary,
        year: parseInt(step1Data.year),
        doi: step1Data.doi,
        category: step1Data.category,
        periodStart: step1Data.periodStart,
        periodEnd: step1Data.periodEnd,
        interventionType: step1Data.interventionType?.toString() || '',
        interventionDetails: step1Data.interventionDetails,
        
        // Step 2 data
        primaryCGIARImpactArea: step2Data.primaryCGIARImpactArea || '',
        secondaryCGIARImpactAreas: Array.isArray(step2Data.secondaryCGIARImpactArea) ? step2Data.secondaryCGIARImpactArea.map(String) : [step2Data.secondaryCGIARImpactArea].filter(Boolean).map(String),
        countries: (step2Data.countryOfStudy || []).map(String),
        regions: (step2Data.cgiarRegions || []).map(String),
        cropProductType: (step2Data.cropProductType || []).map(String),
        keywords: (step2Data.keywords || []).map(String),
        contributingInitiatives: (step2Data.contributingInitiatives || []).map(String),
        contributingCenters: (step2Data.contributingCenters || []).map(String),
        
        // Step 3 data
        indicators: indicators.map(indicator => ({
          indicatorMeasure: indicator.indicatorMeasured,
          unitMeasure: indicator.unitOfMeasure,
          resultReported: indicator.resultReported
        }))
        
        // Note: created_by is now automatically captured from logged-in user in backend
      };

      // Log the complete data being sent to the API
      console.log('=== STEP 3 SAVE DATA ===');
      console.log('Complete study data being sent:', JSON.stringify(completeStudyData, null, 2));
      console.log('========================');

      // Call the complete save endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/studies/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': currentUser?.email || 'unknown@example.com',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(completeStudyData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || errorData.message || 'Failed to save study');
      }
      
      const result = await response.json();
      
      // Clear localStorage
      localStorage.removeItem('studyFormStep1');
      localStorage.removeItem('studyFormStep2');
      localStorage.removeItem('studyFormStep3');
      
      // Show success notification
      showNotification('success', `Study ${completeStudyData.studyId} saved successfully! Redirecting to studies list...`);
      
      // Show success modal after a brief delay
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 1500);
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/studies?sort=id%3Adesc');
      }, 3000);
      
      // Clear localStorage after successful save
      
    } catch (error) {
      console.error('Failed to save study:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Show user-friendly error notification
      const errorMessage = error.message || 'An unexpected error occurred while saving your study.';
      showNotification('error', `Save failed: ${errorMessage} Please check your data and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalAction = () => {
    setShowSuccessModal(false);
    navigate('/studies?sort=id%3Adesc');
  };

  const handleGoBack = () => {
    // Save current form data before going back
    localStorage.setItem('studyFormStep3', JSON.stringify({ indicators }));
    const backPath = isEditMode ? `/studies/edit/${id}/step-2` : '/studies/new/step-2';
    navigate(backPath);
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  const pageTitle = isEditMode ? "Edit study form" : "Create new study form";

  if (loading || mappingData) {
    return (
      <AppLayout title={pageTitle} showAddButton={false}>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {mappingData ? 'Loading study data...' : 
                 isEditMode ? 'Loading study data...' : 'Loading form...'}
              </span>
            </div>
          </Card>
        </div>

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Study Saved Successfully!"
          message={`Your ${isEditMode ? 'study has been updated' : 'new study has been created'} and saved to the Impact Compendium database. You can now view it in the studies list or continue working on other studies.`}
          actionLabel="View Studies"
          onAction={handleSuccessModalAction}
        />
      </AppLayout>
    );
  }

  return (
    <FormLayout 
      title={pageTitle}
      onBack={handleGoBack}
      onNext={handleFinish}
      nextLabel={isSubmitting ? 'Saving...' : 'Save'}
      isLoading={isSubmitting}
      steps={steps}
      currentStep={3}
      onClose={handleClose}
    >
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>

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
        </div>
      </div>
    </FormLayout>
  );
};
