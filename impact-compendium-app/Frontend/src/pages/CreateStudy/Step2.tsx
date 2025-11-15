import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../layouts/FormLayout';
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { StudyContextHeader } from '../../components/ui/StudyContextHeader';
import { Select } from '../../components/ui/Select';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { getReferenceData } from '../../services/api';
import { authService } from '../../services/auth';

const steps = [
  { id: 1, label: 'Step 1', completed: true },
  { id: 2, label: 'Step 2' },
  { id: 3, label: 'Step 3' }
];

export const CreateStudyStep2: React.FC = () => {
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
    const savedData = localStorage.getItem('studyFormStep2');
    return savedData ? JSON.parse(savedData) : {
      cropProductType: [] as string[],
      keywords: [] as string[],
      contributingInitiatives: [] as string[],
      contributingCenters: [] as string[],
      primaryCGIARImpactArea: '',
      secondaryCGIARImpactArea: '',
      countryOfStudy: [] as string[],
      cgiarRegions: [] as string[]
    };
  };

  // Get Step 1 data for context header
  const getStep1Data = () => {
    const savedData = localStorage.getItem('studyFormStep1');
    return savedData ? JSON.parse(savedData) : { studyId: '', title: '' };
  };

  const step1Data = getStep1Data();

  const [loading, setLoading] = useState(true);
  const [mappingData, setMappingData] = useState(false);
  const [formData, setFormData] = useState(getSavedData);
  const [loadingStates, setLoadingStates] = useState({
    cropTypes: false,
    keywords: false,
    initiatives: false,
    centers: false,
    impactAreas: false,
    countries: false,
    regions: false
  });

  const [options, setOptions] = useState<{
    cropTypes: Array<{ value: string; label: string }>;
    keywords: Array<{ value: string; label: string }>;
    initiatives: Array<{ value: string; label: string }>;
    centers: Array<{ value: string; label: string }>;
    impactAreas: Array<{ value: string; label: string }>;
    countries: Array<{ value: string; label: string }>;
    regions: Array<{ value: string; label: string }>;
  }>({
    cropTypes: [],
    keywords: [],
    initiatives: [],
    centers: [],
    impactAreas: [],
    countries: [],
    regions: []
  });

  // Cache for reference data
  const referenceDataCache = useMemo(() => new Map(), []);

  const loadReferenceDataItem = useCallback(async (key: string, apiCall: () => Promise<any>) => {
    if (referenceDataCache.has(key)) {
      return referenceDataCache.get(key);
    }

    setLoadingStates(prev => ({ ...prev, [key]: true }));
    const startTime = Date.now();
    
    try {
      const data = await apiCall();
      const formattedData = data.map((item: any) => ({ 
        value: item.id, 
        label: item.name 
      }));
      referenceDataCache.set(key, formattedData);
      
      // Ensure minimum 300ms display time for spinner visibility
      const elapsedTime = Date.now() - startTime;
      const minDisplayTime = 300;
      
      if (elapsedTime < minDisplayTime) {
        await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
      }
      
      setOptions(prev => ({ ...prev, [key]: formattedData }));
      return formattedData;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, [referenceDataCache]);

  useEffect(() => {
    const loadInitialData = async () => {
      const savedData = getSavedData();
      const hasFormData = Object.values(savedData).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== ''
      );

      if (isEditMode || hasFormData) {
        // Load all data immediately for edit mode or when form data exists
        await Promise.all([
          loadReferenceDataItem('cropTypes', getReferenceData.cropTypes),
          loadReferenceDataItem('keywords', getReferenceData.keywords),
          loadReferenceDataItem('initiatives', getReferenceData.initiatives),
          loadReferenceDataItem('centers', getReferenceData.centers),
          loadReferenceDataItem('impactAreas', getReferenceData.impactAreas),
          loadReferenceDataItem('countries', getReferenceData.countries),
          loadReferenceDataItem('regions', getReferenceData.regions)
        ]);
      } else {
        // Load only essential data first for new studies
        await Promise.all([
          loadReferenceDataItem('impactAreas', getReferenceData.impactAreas),
          loadReferenceDataItem('cropTypes', getReferenceData.cropTypes)
        ]);
      }
      setLoading(false);
    };

    loadInitialData();
  }, [loadReferenceDataItem, isEditMode]);

  // Load study data for edit mode - run after options are loaded
  useEffect(() => {
    if (isEditMode && id && !loading && options.cropTypes.length > 0) {
      const loadStudyData = async () => {
        try {
          setMappingData(true);
          const numericId = id.startsWith('ICD-') ? id.replace('ICD-', '') : id;
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/studies/${numericId}`);
          
          if (response.ok) {
            const apiResponse = await response.json();
            const studyData = apiResponse.data || apiResponse;
            
            // Map crops - handle database field names
            const cropIds = studyData.crops ? 
              studyData.crops.map((crop: any) => {
                const id = typeof crop === 'number' ? crop : crop.id;
                return id;
              }) : [];
            
            // Map all data - access directly from studyData (not studyData.data)
            const keywordIds = studyData.keywords?.map((keyword: any) => keyword.id) || [];
            const initiativeIds = studyData.initiatives?.map((initiative: any) => initiative.id) || [];
            const centerIds = studyData.centers?.map((center: any) => center.id) || [];
            const countryIds = studyData.countries?.map((country: any) => country.id) || [];
            const regionIds = studyData.regions?.map((region: any) => region.id) || [];
            const impactAreaIds = studyData.impact_areas?.map((area: any) => area.id) || [];

            setFormData({
              cropProductType: cropIds,
              keywords: keywordIds,
              contributingInitiatives: initiativeIds,
              contributingCenters: centerIds,
              primaryCGIARImpactArea: impactAreaIds[0]?.toString() || '',
              secondaryCGIARImpactArea: impactAreaIds[1]?.toString() || '',
              countryOfStudy: countryIds,
              cgiarRegions: regionIds
            });
          }
        } catch (error) {
          console.error('Step2: Failed to load study data:', error);
        } finally {
          setMappingData(false);
        }
      };
      loadStudyData();
    }
  }, [isEditMode, id, loading, options.cropTypes]);

  // Remove the separate useEffect for loading saved data since it's now loaded immediately

  // Lazy load data when dropdown is opened
  const handleDropdownOpen = useCallback((key: string) => {
    if (options[key as keyof typeof options].length === 0 && !loadingStates[key as keyof typeof loadingStates]) {
      switch (key) {
        case 'keywords':
          loadReferenceDataItem('keywords', getReferenceData.keywords);
          break;
        case 'initiatives':
          loadReferenceDataItem('initiatives', getReferenceData.initiatives);
          break;
        case 'centers':
          loadReferenceDataItem('centers', getReferenceData.centers);
          break;
        case 'countries':
          loadReferenceDataItem('countries', getReferenceData.countries);
          break;
        case 'regions':
          loadReferenceDataItem('regions', getReferenceData.regions);
          break;
      }
    }
  }, [options, loadingStates, loadReferenceDataItem]);

  const handleInputChange = useCallback((field: string, value: string | string[]) => {
    setFormData((prev: any) => {
      const newData = { ...prev, [field]: value };
      
      // If primary impact area changed, clear secondary if it matches
      if (field === 'primaryCGIARImpactArea' && typeof value === 'string') {
        if (Number(prev.secondaryCGIARImpactArea) === Number(value)) {
          newData.secondaryCGIARImpactArea = '';
        }
      }
      
      // If secondary impact area changed, clear primary if it matches
      if (field === 'secondaryCGIARImpactArea' && typeof value === 'string') {
        if (Number(prev.primaryCGIARImpactArea) === Number(value)) {
          newData.primaryCGIARImpactArea = '';
        }
      }
      
      return newData;
    });
  }, []);

  const getSecondaryImpactAreaOptions = () => {
    const filtered = options.impactAreas.filter(option => {
      const isMatch = Number(option.value) === Number(formData.primaryCGIARImpactArea);
      return !isMatch;
    });
    return filtered;
  };

  const getPrimaryImpactAreaOptions = () => {
    return options.impactAreas.filter(option => Number(option.value) !== Number(formData.secondaryCGIARImpactArea));
  };

  const handleMultiSelectChange = (field: string, values: string[]) => {
    setFormData((prev: any) => ({ ...prev, [field]: values }));
  };

  const handleNext = () => {
    // Validate required fields
    if (!formData.primaryCGIARImpactArea) {
      showNotification('error', 'Please select a Primary CGIAR Impact Area to continue');
      return;
    }

    // Store form data and navigate to Step 3
    localStorage.setItem('studyFormStep2', JSON.stringify(formData));
    const nextPath = isEditMode ? `/studies/edit/${id}/step-3` : '/studies/new/step-3';
    navigate(nextPath);
  };

  const handleSaveDraft = async () => {
    if (!formData.primaryCGIARImpactArea) {
      showNotification('error', 'Please select a Primary CGIAR Impact Area before saving draft');
      return;
    }

    try {
      showNotification('info', 'Saving draft...');
      
      // Save to localStorage for now (simple approach)
      localStorage.setItem('studyFormStep2', JSON.stringify(formData));
      
      // Show success notification
      showNotification('success', 'Draft saved locally!');
      
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      showNotification('error', 'Failed to save draft. Please try again.');
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleGoBack = () => {
    // Save current form data before going back
    localStorage.setItem('studyFormStep2', JSON.stringify(formData));
    const backPath = isEditMode ? `/studies/edit/${id}/step-1` : '/studies/new/step-1';
    navigate(backPath);
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

  const pageTitle = isEditMode ? "Edit study form" : "Create new study form";

  return (
    <FormLayout 
      title={pageTitle}
      onBack={handleGoBack}
      onNext={handleNext}
      onSaveDraft={handleSaveDraft}
      steps={steps}
      currentStep={2}
      onClose={handleClose}
    >
      {/* Professional Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-2xl transition-all duration-500 transform ${
          notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
          notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-400' :
          notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-400' :
          'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {notification.type === 'error' && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {notification.type === 'info' && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-relaxed">{notification.message}</p>
              {notification.type === 'error' && (
                <p className="text-xs mt-1 opacity-90">Please correct this issue to continue</p>
              )}
            </div>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="flex-shrink-0 w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>

        {/* Study Context Header */}
        <StudyContextHeader 
          studyId={step1Data.studyId}
          title={step1Data.title}
          currentStep={2}
          isEditMode={isEditMode}
        />

        {loading || mappingData ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {mappingData ? 'Loading study data...' : 
                 isEditMode ? 'Loading form options...' : 'Loading form...'}
              </span>
            </div>
          </Card>
        ) : (
        <Card>
          <div className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--ic-color-text)]">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <MultiSelect
                  label="Crop/Product Type"
                  options={options.cropTypes.length === 0 ? [{ value: '', label: 'Loading...' }] : options.cropTypes}
                  placeholder="Select options"
                  value={formData.cropProductType}
                  onChange={(values) => handleMultiSelectChange('cropProductType', values)}
                />
                <MultiSelect
                  label="Keywords"
                  options={loadingStates.keywords ? [{ value: '', label: 'Loading...' }] : options.keywords}
                  placeholder="Select options"
                  value={formData.keywords}
                  onChange={(values) => handleMultiSelectChange('keywords', values)}
                  onFocus={() => handleDropdownOpen('keywords')}
                />
              </div>
            </div>

            {/* Contributors Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--ic-color-text)]">
                Contributors Section
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <MultiSelect
                  label="Contributing Initiatives"
                  options={loadingStates.initiatives ? [{ value: '', label: 'Loading...' }] : options.initiatives}
                  placeholder="Select options"
                  value={formData.contributingInitiatives}
                  onChange={(values) => handleInputChange('contributingInitiatives', values)}
                  onFocus={() => handleDropdownOpen('initiatives')}
                />
                <MultiSelect
                  label="Contributing Centers"
                  options={loadingStates.centers ? [{ value: '', label: 'Loading...' }] : options.centers}
                  placeholder="Select options"
                  value={formData.contributingCenters}
                  onChange={(values) => handleInputChange('contributingCenters', values)}
                  onFocus={() => handleDropdownOpen('centers')}
                />
              </div>
            </div>

            {/* CGIAR Impact Areas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--ic-color-text)]">
                CGIAR Impact Areas
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Primary CGIAR Impact Area"
                  required
                  options={options.impactAreas.length === 0 ? [{ value: '', label: 'Loading...' }] : getPrimaryImpactAreaOptions()}
                  value={formData.primaryCGIARImpactArea}
                  onChange={(e) => handleInputChange('primaryCGIARImpactArea', e.target.value)}
                />
                <Select
                  label="Secondary CGIAR Impact Area"
                  disabled={!formData.primaryCGIARImpactArea}
                  className={!formData.primaryCGIARImpactArea ? 'opacity-50 cursor-not-allowed' : ''}
                  options={options.impactAreas.length === 0 ? [{ value: '', label: 'Loading...' }] : getSecondaryImpactAreaOptions()}
                  value={formData.secondaryCGIARImpactArea}
                  onChange={(e) => handleInputChange('secondaryCGIARImpactArea', e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--ic-color-text)]">
                Location
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <MultiSelect
                  label="Country of study"
                  options={loadingStates.countries ? [{ value: '', label: 'Loading...' }] : options.countries}
                  placeholder="Select options"
                  value={formData.countryOfStudy}
                  onChange={(values) => handleInputChange('countryOfStudy', values)}
                  onFocus={() => handleDropdownOpen('countries')}
                />
                <MultiSelect
                  label="CGIAR Regions"
                  options={loadingStates.regions ? [{ value: '', label: 'Loading...' }] : options.regions}
                  placeholder="Select options"
                  value={formData.cgiarRegions}
                  onChange={(values) => handleInputChange('cgiarRegions', values)}
                  onFocus={() => handleDropdownOpen('regions')}
                />
              </div>
            </div>
          </div>
        </Card>
        )}
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
