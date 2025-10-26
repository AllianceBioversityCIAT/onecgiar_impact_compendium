import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../layouts/FormLayout';
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { Select } from '../../components/ui/Select';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getReferenceData } from '../../services/api';

const steps = [
  { id: 1, label: 'Step 1', completed: true },
  { id: 2, label: 'Step 2' },
  { id: 3, label: 'Step 3' }
];

export const CreateStudyStep2: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
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

  const [loading, setLoading] = useState(true);
  const [mappingData, setMappingData] = useState(false);
  const [formData, setFormData] = useState(getSavedData);

  const [options, setOptions] = useState({
    cropTypes: [],
    keywords: [],
    initiatives: [],
    centers: [],
    impactAreas: [],
    countries: [],
    regions: []
  });

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [cropTypes, keywords, initiatives, centers, impactAreas, countries, regions] = await Promise.all([
          getReferenceData.cropTypes(),
          getReferenceData.keywords(),
          getReferenceData.initiatives(),
          getReferenceData.centers(),
          getReferenceData.impactAreas(),
          getReferenceData.countries(),
          getReferenceData.regions()
        ]);
        
        setOptions({
          cropTypes: cropTypes.map((item: any) => ({ value: item.id, label: item.name })),
          keywords: keywords.map((item: any) => ({ value: item.id, label: item.name })),
          initiatives: initiatives.map((item: any) => ({ value: item.id, label: item.name })),
          centers: centers.map((item: any) => ({ value: item.id, label: item.name })),
          impactAreas: impactAreas.map((item: any) => ({ value: item.id, label: item.name })),
          countries: countries.map((item: any) => ({ value: item.id, label: item.name })),
          regions: regions.map((item: any) => ({ value: item.id, label: item.name }))
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to load reference data:', error);
        // Fallback options
        setOptions({
          cropTypes: [
            { value: 1, label: 'Maize' },
            { value: 2, label: 'Rice' },
            { value: 3, label: 'Wheat' },
            { value: 4, label: 'Cassava' }
          ],
          keywords: [
            { value: 1, label: 'Sustainability' },
            { value: 2, label: 'Climate Change' },
            { value: 3, label: 'Food Security' }
          ],
          initiatives: [
            { value: 1, label: 'Accelerated Breeding' },
            { value: '39', label: 'Accelerating Crop Improvement Through Genome Editing' },
            { value: '7', label: 'ActioNs for Innovative climate change Mitigation & Adaptation of Livestock' }
          ],
          centers: [
            { value: '1', label: 'CIMMYT' },
            { value: '2', label: 'IRRI' },
            { value: '3', label: 'ICRISAT' }
          ],
          impactAreas: [
            { value: '1', label: 'Food Security' },
            { value: '2', label: 'Climate Adaptation' },
            { value: '3', label: 'Nutrition Security' }
          ],
          countries: [
            { value: '1', label: 'Kenya' },
            { value: '2', label: 'India' },
            { value: '3', label: 'Philippines' }
          ],
          regions: [
            { value: '1', label: 'East Africa' },
            { value: '2', label: 'South Asia' },
            { value: '3', label: 'Southeast Asia' }
          ]
        });
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Load study data for edit mode - run after options are loaded
  useEffect(() => {
    if (isEditMode && id && !loading && options.cropTypes.length > 0) {
      const loadStudyData = async () => {
        try {
          setMappingData(true);
          const numericId = id.startsWith('ICD-') ? id.replace('ICD-', '') : id;
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/studies/${numericId}`);
          
          if (response.ok) {
            const apiResponse = await response.json();
            const studyData = apiResponse.data || apiResponse;
            
            console.log('Step2: Study data for mapping:', {
              countries: studyData.countries,
              regions: studyData.regions,
              impact_areas: studyData.impact_areas,
              primaryCGIARImpactArea: studyData.primaryCGIARImpactArea,
              secondaryCGIARImpactArea: studyData.secondaryCGIARImpactArea
            });
            console.log('Step2: Countries data type:', typeof studyData.countries, studyData.countries);
            
            console.log('=== CROP DEBUGGING ===');
            console.log('Step2: studyData:', studyData);
            console.log('Step2: studyData.crops:', studyData.crops);
            console.log('Step2: Current options.cropTypes:', options.cropTypes);
            
            // Map crops - handle database field names
            const cropIds = studyData.crops ? 
              studyData.crops.map((crop: any) => {
                console.log('Step2: Processing crop:', crop);
                const id = typeof crop === 'number' ? crop : crop.id;
                console.log('Step2: Extracted crop ID:', id, 'type:', typeof id);
                return id;
              }) : [];
            
            console.log('Step2: Final cropIds array:', cropIds);
            console.log('=== END CROP DEBUGGING ===');

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
              primaryCGIARImpactArea: impactAreaIds[0] || '',
              secondaryCGIARImpactArea: impactAreaIds[1] || '', // Take second item as string, not array
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

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => {
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
  };

  const getSecondaryImpactAreaOptions = () => {
    const filtered = options.impactAreas.filter(option => {
      const isMatch = Number(option.value) === Number(formData.primaryCGIARImpactArea);
      console.log(`Comparing option ${option.value} (${typeof option.value}) with primary ${formData.primaryCGIARImpactArea} (${typeof formData.primaryCGIARImpactArea}) - Match: ${isMatch}`);
      return !isMatch;
    });
    console.log('Secondary options - Primary selected:', formData.primaryCGIARImpactArea);
    console.log('Secondary options - Filtered:', filtered);
    return filtered;
  };

  const getPrimaryImpactAreaOptions = () => {
    return options.impactAreas.filter(option => Number(option.value) !== Number(formData.secondaryCGIARImpactArea));
  };

  const handleMultiSelectChange = (field: string, values: string[]) => {
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const handleNext = () => {
    // Validate required fields
    if (!formData.primaryCGIARImpactArea) {
      alert('Please select a Primary CGIAR Impact Area');
      return;
    }

    // Store form data and navigate to Step 3
    localStorage.setItem('studyFormStep2', JSON.stringify(formData));
    const nextPath = isEditMode ? `/studies/edit/${id}/step-3` : '/studies/new/step-3';
    navigate(nextPath);
  };

  const handleGoBack = () => {
    // Save current form data before going back
    localStorage.setItem('studyFormStep2', JSON.stringify(formData));
    const backPath = isEditMode ? `/studies/edit/${id}/step-1` : '/studies/new/step-1';
    navigate(backPath);
  };

  const pageTitle = isEditMode ? "Edit study form" : "Create new study form";

  return (
    <FormLayout 
      title={pageTitle}
      onBack={handleGoBack}
      onNext={handleNext}
      onSaveDraft={() => console.log('Save draft')}
      steps={steps}
      currentStep={2}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>

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
                  options={options.keywords.length === 0 ? [{ value: '', label: 'Loading...' }] : options.keywords}
                  placeholder="Select options"
                  value={formData.keywords}
                  onChange={(values) => handleMultiSelectChange('keywords', values)}
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
                  options={options.initiatives.length === 0 ? [{ value: '', label: 'Loading...' }] : options.initiatives}
                  placeholder="Select options"
                  value={formData.contributingInitiatives}
                  onChange={(values) => handleInputChange('contributingInitiatives', values)}
                />
                <MultiSelect
                  label="Contributing Centers"
                  options={options.centers.length === 0 ? [{ value: '', label: 'Loading...' }] : options.centers}
                  placeholder="Select options"
                  value={formData.contributingCenters}
                  onChange={(values) => handleInputChange('contributingCenters', values)}
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
                  options={options.countries.length === 0 ? [{ value: '', label: 'Loading...' }] : options.countries}
                  placeholder="Select options"
                  value={formData.countryOfStudy}
                  onChange={(values) => handleInputChange('countryOfStudy', values)}
                />
                <MultiSelect
                  label="CGIAR Regions"
                  options={options.regions.length === 0 ? [{ value: '', label: 'Loading...' }] : options.regions}
                  placeholder="Select options"
                  value={formData.cgiarRegions}
                  onChange={(values) => handleInputChange('cgiarRegions', values)}
                />
              </div>
            </div>
          </div>
        </Card>
        )}
      </div>
    </FormLayout>
  );
};
