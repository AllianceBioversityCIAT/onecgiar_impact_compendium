import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../layouts/FormLayout';
import { AppLayout } from '../../layouts/AppLayout';
import { StudyContextHeader } from '../../components/ui/StudyContextHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/card';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Notification } from '../../components/ui/Notification';
import { authService } from '../../services/auth';

const steps = [
  { id: 1, label: 'Step 1', completed: true },
  { id: 2, label: 'Step 2', completed: true },
  { id: 3, label: 'Step 3' },
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
      return parsed.indicators || [];
    }
    return []; // Start with empty array instead of default indicator
  };

  // Get Step 1 data for context header
  const getStep1Data = () => {
    const savedData = localStorage.getItem('studyFormStep1');
    return savedData ? JSON.parse(savedData) : { studyId: '', title: '' };
  };

  const step1Data = getStep1Data();

  const [indicators, setIndicators] = useState<Indicator[]>(getSavedData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mappingData, setMappingData] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    show: boolean;
  }>({ type: 'info', title: '', message: '', show: false });
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  // Load study data for edit mode
  React.useEffect(() => {
    if (isEditMode && id) {
      const loadStudyData = async () => {
        try {
          setMappingData(true);

          // Check if we have saved data in localStorage first
          const savedData = localStorage.getItem('studyFormStep3');
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.indicators && parsed.indicators.length > 0) {
              setIndicators(parsed.indicators);
              setMappingData(false);
              return; // Use localStorage data instead of API data
            }
          }

          // If no localStorage data, load from API
          const numericId = id.startsWith('ICD-') ? id.replace('ICD-', '') : id;
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/studies/${numericId}`
          );

          if (response.ok) {
            const apiResponse = await response.json();
            const studyData = apiResponse.data || apiResponse;

            if (studyData.indicators && studyData.indicators.length > 0) {
              const mappedIndicators = studyData.indicators.map(
                (indicator: any, index: number) => ({
                  id: (index + 1).toString(),
                  indicatorMeasured: indicator.indicator_measure || '',
                  unitOfMeasure: indicator.unit_measure || '',
                  resultReported: indicator.result_reported || '',
                })
              );
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

  const handleIndicatorChange = (
    id: string,
    field: keyof Indicator,
    value: string
  ) => {
    setIndicators(prev =>
      prev.map(indicator =>
        indicator.id === id ? { ...indicator, [field]: value } : indicator
      )
    );
  };

  const addIndicator = () => {
    const newId = (indicators.length + 1).toString();
    setIndicators(prev => [
      ...prev,
      {
        id: newId,
        indicatorMeasured: '',
        unitOfMeasure: '',
        resultReported: '',
      },
    ]);
  };

  const removeIndicator = (id: string) => {
    if (indicators.length > 1) {
      setIndicators(prev => prev.filter(indicator => indicator.id !== id));
    }
  };

  const duplicateIndicator = (id: string) => {
    const indicatorToDuplicate = indicators.find(
      indicator => indicator.id === id
    );
    if (indicatorToDuplicate) {
      const newId = (indicators.length + 1).toString();
      const duplicated = { ...indicatorToDuplicate, id: newId };
      setIndicators(prev => [...prev, duplicated]);
    }
  };

  const showNotification = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ) => {
    setNotification({ type, title, message, show: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setSaveProgress(0);

    // Animated progress for better UX
    const progressInterval = setInterval(() => {
      setSaveProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    showNotification(
      'info',
      'Saving Study',
      'Please wait while we save your study to the database...'
    );

    try {
      // Get all form data from localStorage
      const step1Data = JSON.parse(
        localStorage.getItem('studyFormStep1') || '{}'
      );
      const step2Data = JSON.parse(
        localStorage.getItem('studyFormStep2') || '{}'
      );

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
        secondaryCGIARImpactAreas: Array.isArray(
          step2Data.secondaryCGIARImpactArea
        )
          ? step2Data.secondaryCGIARImpactArea.map(String)
          : [step2Data.secondaryCGIARImpactArea].filter(Boolean).map(String),
        countries: (step2Data.countryOfStudy || []).map(String),
        regions: (step2Data.cgiarRegions || []).map(String),
        cropProductType: (step2Data.cropProductType || []).map(String),
        keywords: (step2Data.keywords || []).map(String),
        contributingInitiatives: (step2Data.contributingInitiatives || []).map(
          String
        ),
        contributingCenters: (step2Data.contributingCenters || []).map(String),

        // Step 3 data
        indicators: indicators.map(indicator => ({
          indicatorMeasure: indicator.indicatorMeasured,
          unitMeasure: indicator.unitOfMeasure,
          resultReported: indicator.resultReported,
        })),
      };

      // Get auth headers (with local development bypass)
      const isLocalDev = import.meta.env.VITE_API_BASE_URL?.includes(
        'localhost'
      );
      let authHeaders = {};
      let userEmail = 'testuser@example.com';

      if (!isLocalDev) {
        authHeaders = await authService.getAuthHeaders();
        const currentUser = authService.getCurrentUser();
        userEmail = (currentUser as any)?.email || 'unknown@example.com';
      }

      // Call the complete save endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/studies/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            ...authHeaders,
          },
          body: JSON.stringify(completeStudyData),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: 'Unknown error' }));
        throw new Error(
          errorData.detail || errorData.message || 'Failed to save study'
        );
      }

      // const _result = await response.json();

      // Complete progress
      clearInterval(progressInterval);
      setSaveProgress(100);

      // Clear localStorage
      localStorage.removeItem('studyFormStep1');
      localStorage.removeItem('studyFormStep2');
      localStorage.removeItem('studyFormStep3');

      // Show success notification
      showNotification(
        'success',
        'Study Saved Successfully!',
        `Study ${completeStudyData.studyId} has been saved to the Impact Compendium database.`
      );

      // Show success modal after a brief delay
      setTimeout(() => {
        hideNotification();
        setShowSuccessModal(true);

        // Auto redirect after showing modal (shorter time)
        setTimeout(() => {
          navigate('/studies?sort=id%3Adesc');
        }, 1500);
      }, 1500);

      // Keep isSubmitting true until redirect to prevent multiple clicks
      // isSubmitting will be set to false in finally block after redirect
    } catch (error: any) {
      console.error('Failed to save study:', error);
      clearInterval(progressInterval);
      setSaveProgress(0);

      // Show user-friendly error notification
      const errorMessage =
        error?.message ||
        'An unexpected error occurred while saving your study.';
      showNotification(
        'error',
        'Save Failed',
        `${errorMessage} Please check your data and try again.`
      );

      // Only set isSubmitting to false on error
      setIsSubmitting(false);
    }
    // Note: Don't set isSubmitting to false in finally block to prevent multiple clicks during success flow
  };

  const handleSuccessModalAction = () => {
    setShowSuccessModal(false);
    navigate('/studies?sort=id%3Adesc');
  };

  const handleGoBack = () => {
    // Save current form data before going back
    localStorage.setItem('studyFormStep3', JSON.stringify({ indicators }));
    const backPath = isEditMode
      ? `/studies/edit/${id}/step-2`
      : '/studies/new/step-2';
    navigate(backPath);
  };

  const handleSaveDraft = async () => {
    try {
      showNotification(
        'info',
        'Saving Draft',
        'Saving your progress locally...'
      );

      // Save to localStorage for now (simple approach)
      localStorage.setItem('studyFormStep3', JSON.stringify({ indicators }));

      // Show success notification
      setTimeout(() => {
        showNotification(
          'success',
          'Draft Saved',
          'Your progress has been saved locally and will be available when you return.'
        );
      }, 500);
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      showNotification(
        'error',
        'Draft Save Failed',
        'Failed to save draft. Please try again.'
      );
    }
  };

  const handleClose = () => {
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    // Clear all draft data
    localStorage.removeItem('studyFormStep1');
    localStorage.removeItem('studyFormStep2');
    localStorage.removeItem('studyFormStep3');

    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  const pageTitle = isEditMode ? 'Edit study form' : 'Create new study form';

  if (loading || mappingData) {
    return (
      <AppLayout title={pageTitle} showAddButton={false}>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">
            {pageTitle}
          </h1>
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {mappingData
                  ? 'Loading study data...'
                  : isEditMode
                    ? 'Loading study data...'
                    : 'Loading form...'}
              </span>
            </div>
          </Card>
        </div>

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="🎉 Study Saved Successfully!"
          message={`Your ${isEditMode ? 'study has been updated' : 'new study has been created'} and saved to the Impact Compendium database. You can now view it in the studies list or continue working on other studies.`}
          actionLabel="View All Studies"
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
      onSaveDraft={handleSaveDraft}
      nextLabel={isSubmitting ? 'Saving...' : 'Save Study'}
      isLoading={isSubmitting}
      steps={steps}
      currentStep={3}
      onClose={handleClose}
    >
      {/* Enhanced Notification */}
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        show={notification.show}
        onClose={hideNotification}
        autoClose={notification.type === 'success'}
        duration={notification.type === 'success' ? 3000 : 6000}
      />

      {/* Progress Overlay for Saving */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Saving Your Study
              </h3>
              <p className="text-gray-600 mb-4">
                Please wait while we save your study to the database...
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${saveProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{saveProgress}% complete</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">
          {pageTitle}
        </h1>

        {/* Study Context Header */}
        <StudyContextHeader
          studyId={step1Data.studyId}
          title={step1Data.title}
          currentStep={3}
          isEditMode={isEditMode}
        />

        <div className="space-y-6">
          {/* Add Indicator Button */}
          <div className="flex justify-end">
            <Button
              onClick={addIndicator}
              className="flex items-center space-x-2"
            >
              <span>Add indicator</span>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Button>
          </div>

          {/* Empty State or Indicator Cards */}
          {indicators.length === 0 ? (
            <Card className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    No indicators added yet
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Add indicators to measure the impact and results of your
                    study. Click the "Add indicator" button above to get
                    started.
                  </p>
                </div>
                <Button
                  onClick={addIndicator}
                  className="flex items-center space-x-2 mt-4"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add your first indicator</span>
                </Button>
              </div>
            </Card>
          ) : (
            /* Indicator Cards */
            indicators.map((indicator, index) => (
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIndicator(indicator.id)}
                          className="text-red-500 hover:text-red-700"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
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
                      onChange={e =>
                        handleIndicatorChange(
                          indicator.id,
                          'indicatorMeasured',
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Unit of measure"
                      placeholder="Enter value"
                      value={indicator.unitOfMeasure}
                      onChange={e =>
                        handleIndicatorChange(
                          indicator.id,
                          'unitOfMeasure',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <Input
                    label="Result reported"
                    placeholder="Enter value"
                    value={indicator.resultReported}
                    onChange={e =>
                      handleIndicatorChange(
                        indicator.id,
                        'resultReported',
                        e.target.value
                      )
                    }
                  />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Close Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCloseConfirm}
        title="Discard Draft?"
        message="Are you sure you want to close this form? All unsaved changes and draft data will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        type="warning"
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </FormLayout>
  );
};
