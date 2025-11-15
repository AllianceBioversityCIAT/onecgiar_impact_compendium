import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../layouts/FormLayout';
import { AppLayout } from '../../layouts/AppLayout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { getReferenceData } from '../../services/api';

const steps = [
  { id: 1, label: 'Step 1' },
  { id: 2, label: 'Step 2' },
  { id: 3, label: 'Step 3' },
];

export const CreateStudyStep1: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({ type: 'info', message: '', show: false });
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Load saved data immediately and synchronously
  const getSavedData = () => {
    if (isEditMode) {
      // Don't load from localStorage in edit mode
      return {
        studyId: '',
        title: '',
        summary: '',
        year: new Date().getFullYear().toString(),
        doi: '',
        category: '',
        periodStart: '',
        periodEnd: '',
        interventionType: '',
        interventionDetails: '',
      };
    }

    const savedData = localStorage.getItem('studyFormStep1');
    return savedData
      ? JSON.parse(savedData)
      : {
          studyId: '',
          title: '',
          summary: '',
          year: new Date().getFullYear().toString(),
          doi: '',
          category: '',
          periodStart: '',
          periodEnd: '',
          interventionType: '',
          interventionDetails: '',
        };
  };

  const [formData, setFormData] = useState(getSavedData);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [validatingStudyId, setValidatingStudyId] = useState(false);
  const [options, setOptions] = useState<{
    categories: Array<{ value: string; label: string }>;
    interventionTypes: Array<{ value: string; label: string }>;
  }>({
    categories: [],
    interventionTypes: [],
  });

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [categories, interventionTypes] = await Promise.all([
          getReferenceData.categories(),
          getReferenceData.interventionTypes(),
        ]);

        setOptions({
          categories: categories.map((cat: any) => ({
            value: cat.id.toString(),
            label: cat.name,
          })),
          interventionTypes: interventionTypes.map((type: any) => ({
            value: type.id.toString(),
            label: type.name,
          })),
        });
      } catch (error) {
        console.error('Failed to load reference data:', error);
        // Fallback options
        setOptions({
          categories: [
            { value: 'impact-study', label: 'Impact Study' },
            { value: 'outcome-study', label: 'Outcome Study' },
            { value: 'impact-outcome-story', label: 'Impact Outcome Story' },
            { value: 'other', label: 'Other' },
          ],
          interventionTypes: [
            { value: 'technology', label: 'Technology' },
            { value: 'policy', label: 'Policy' },
            { value: 'capacity-building', label: 'Capacity Building' },
            { value: 'other', label: 'Other' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  const [studyData, setStudyData] = useState(null);
  const [formDataInitialized, setFormDataInitialized] = useState(false);

  // Load study data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadStudyData = async () => {
        try {
          const numericId = id.startsWith('ICD-') ? id.replace('ICD-', '') : id;
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/studies/${numericId}`
          );

          if (response.ok) {
            const apiResponse = await response.json();
            const data = apiResponse.data || apiResponse;
            setStudyData(data);
          }
        } catch (error) {
          console.error('Failed to load study data:', error);
        }
      };
      loadStudyData();
    }
  }, [isEditMode, id]);

  // Set form data when both study data and options are available (only once)
  useEffect(() => {
    if (
      studyData &&
      options.interventionTypes.length > 0 &&
      !formDataInitialized
    ) {
      const data = studyData as any;
      setFormData({
        studyId: data.id || data.study_id || '',
        title: data.title || '',
        summary: data.summary || '',
        year: data.year?.toString() || '2025',
        doi: data.doi || data.link_or_doi || '',
        category: data.category?.id?.toString() || '',
        periodStart: data.period?.start?.toString() || '',
        periodEnd: data.period?.end?.toString() || '',
        interventionType: (
          data.intervention?.id ||
          data.intervention?.type ||
          ''
        ).toString(),
        interventionDetails:
          data.intervention?.detailsShort || data.intervention_details || '',
      });

      setFormDataInitialized(true);
    }
  }, [studyData, options.interventionTypes.length, formDataInitialized]);

  // Validate Study ID uniqueness
  const validateStudyId = async (studyId: string) => {
    if (!studyId || studyId === id) return; // Skip validation if empty or same as current ID in edit mode

    setValidatingStudyId(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/studies/check-id/${encodeURIComponent(studyId)}`
      );
      const data = await response.json();

      if (data.exists) {
        setErrors(prev => ({
          ...prev,
          studyId:
            'This Study ID already exists. Please choose a different one.',
        }));
      } else {
        setErrors(prev => ({ ...prev, studyId: '' }));
      }
    } catch (error) {
      console.error('Failed to validate Study ID:', error);
      // Don't show error to user for validation failures
    } finally {
      setValidatingStudyId(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }

    // Validate Study ID on change with debounce
    if (field === 'studyId' && value) {
      clearTimeout((window as any).studyIdTimeout);
      (window as any).studyIdTimeout = setTimeout(
        () => validateStudyId(value),
        500
      );
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studyId) newErrors.studyId = 'This field is required.';
    if (!formData.title) newErrors.title = 'This field is required.';
    if (!formData.category) newErrors.category = 'This field is required.';
    if (!formData.doi) {
      newErrors.doi = 'This field is required.';
    } else {
      // Validate URL format - support multiple patterns found in database
      const urlPattern = /^https?:\/\/.+/; // Any valid HTTP/HTTPS URL
      const doiPattern = /^10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/; // Plain DOI format
      const doiUrlPattern =
        /^https:\/\/doi\.org\/10\.\d{4,}\/[-._;()/:a-zA-Z0-9]+$/; // DOI URL
      const cgspacePattern = /^https:\/\/cgspace\.cgiar\.org\/.+/; // CGIAR repository
      const melPattern = /^https:\/\/mel\.cgiar\.org\/.+/; // MEL repository
      const handlePattern = /^https:\/\/hdl\.handle\.net\/.+/; // Handle URLs

      if (
        !urlPattern.test(formData.doi) &&
        !doiPattern.test(formData.doi) &&
        !doiUrlPattern.test(formData.doi) &&
        !cgspacePattern.test(formData.doi) &&
        !melPattern.test(formData.doi) &&
        !handlePattern.test(formData.doi)
      ) {
        newErrors.doi = 'Please enter a valid URL or DOI format.';
      }
    }
    if (!formData.periodStart) {
      newErrors.periodStart = 'This field is required.';
    } else if (!/^\d{4}$/.test(formData.periodStart)) {
      newErrors.periodStart = 'Please enter a valid 4-digit year.';
    }
    if (!formData.periodEnd) {
      newErrors.periodEnd = 'This field is required.';
    } else if (!/^\d{4}$/.test(formData.periodEnd)) {
      newErrors.periodEnd = 'Please enter a valid 4-digit year.';
    }
    if (!formData.interventionType)
      newErrors.interventionType = 'This field is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleGoBack = () => {
    navigate('/dashboard');
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

  const handleNext = async () => {
    if (validatingStudyId) {
      // Wait for validation to complete
      return;
    }

    if (validateForm()) {
      // Store form data locally only
      localStorage.setItem('studyFormStep1', JSON.stringify(formData));

      const nextPath = isEditMode
        ? `/studies/edit/${id}/step-2`
        : '/studies/new/step-2';
      navigate(nextPath);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    try {
      showNotification('info', 'Saving draft...');

      // Save to localStorage for now (simple approach)
      localStorage.setItem('studyFormStep1', JSON.stringify(formData));

      // Show success notification
      showNotification('success', 'Draft saved locally!');
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      showNotification('error', 'Failed to save draft. Please try again.');
    }
  };

  const pageTitle = isEditMode ? 'Edit study form' : 'Create new study form';

  if (loading) {
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
                {isEditMode ? 'Loading study data...' : 'Loading form...'}
              </span>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <FormLayout
      title={pageTitle}
      onBack={handleGoBack}
      onNext={handleNext}
      onSaveDraft={handleSaveDraft}
      steps={steps}
      currentStep={1}
      onClose={handleClose}
    >
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg
                className="w-5 h-5 animate-spin"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h1 className="text-xl font-bold text-[var(--ic-color-text)]">
          {pageTitle}
        </h1>

        <Card>
          <div className="space-y-4">
            {/* Study ID */}
            <div className="w-1/3 relative">
              <Input
                label="Study ID"
                required
                type="number"
                placeholder="Enter numeric study identifier"
                value={formData.studyId}
                onChange={e => handleInputChange('studyId', e.target.value)}
                error={errors.studyId}
              />
              {validatingStudyId && (
                <div className="absolute right-3 top-9 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
              {formData.studyId && !validatingStudyId && !errors.studyId && (
                <div className="absolute right-3 top-9 flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Title */}
            <Input
              label="Title"
              required
              placeholder="Enter value"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              error={errors.title}
            />

            {/* Summary */}
            <Textarea
              label="Summary"
              placeholder="Enter value"
              value={formData.summary}
              onChange={e => handleInputChange('summary', e.target.value)}
            />

            {/* Year of report and Category Row */}
            <div className="grid grid-cols-2 gap-6">
              <Select
                label="Year of report"
                required
                options={Array.from({ length: 10 }, (_, i) => {
                  const currentYear = new Date().getFullYear();
                  const year = currentYear - i;
                  return { value: year.toString(), label: year.toString() };
                })}
                value={formData.year}
                onChange={e => handleInputChange('year', e.target.value)}
              />

              <Select
                label="Category"
                required
                options={options.categories}
                value={formData.category}
                onChange={e => handleInputChange('category', e.target.value)}
                error={errors.category}
              />
            </div>

            {/* Link or DOI */}
            <Input
              label="Link or DOI"
              required
              placeholder="https://doi.org/10.1000/xyz123 or https://cgspace.cgiar.org/... or 10.1000/xyz123"
              value={formData.doi}
              onChange={e => handleInputChange('doi', e.target.value)}
              error={errors.doi}
            />

            {/* Period start and Period end Row */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Period start
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-[#F3F3F5] ${
                    errors.periodStart ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="YYYY"
                  value={formData.periodStart}
                  onChange={e =>
                    handleInputChange('periodStart', e.target.value)
                  }
                />
                {errors.periodStart && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.periodStart}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Period end
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-[#F3F3F5] ${
                    errors.periodEnd ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="YYYY"
                  value={formData.periodEnd}
                  onChange={e => handleInputChange('periodEnd', e.target.value)}
                />
                {errors.periodEnd && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.periodEnd}
                  </p>
                )}
              </div>
            </div>

            {/* Intervention Information Section */}
            <div className="pt-6 border-t border-[var(--ic-border-light)]">
              <h3 className="text-lg font-semibold text-[var(--ic-color-text)] mb-4">
                Intervention information
              </h3>

              <div className="space-y-4">
                <SearchableSelect
                  label="Intervention type"
                  required
                  options={options.interventionTypes}
                  value={formData.interventionType}
                  onChange={value => {
                    setFormData((prev: any) => ({
                      ...prev,
                      interventionType: value,
                    }));
                  }}
                  placeholder="Search intervention types..."
                />
                {errors.interventionType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.interventionType}
                  </p>
                )}

                <Textarea
                  label="Intervention Details"
                  placeholder="Enter value"
                  value={formData.interventionDetails}
                  onChange={e =>
                    handleInputChange('interventionDetails', e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </Card>
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
