import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
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
          initiatives: initiatives.data ? initiatives.data.map((item: any) => ({ value: item.initiative_id, label: `${item.code} - ${item.name}` })) : [],
          centers: centers.data ? centers.data.map((item: any) => ({ value: item.center_id, label: `${item.acronym} - ${item.name}` })) : [],
          impactAreas: impactAreas.data ? impactAreas.data.map((item: any) => ({ value: item.impact_area_id, label: item.name })) : [],
          countries: countries.data ? countries.data.filter((item: any) => 
            item.country_name !== 'All' && 
            !item.country_name.toLowerCase().includes('all')
          ).map((item: any) => ({ value: item.country_id, label: item.country_name })) : [],
          regions: regions.data ? regions.data.filter((item: any) => 
            item.region_name !== 'All' && 
            item.region_name !== 'no specific' && 
            !item.region_name.toLowerCase().includes('all') &&
            !item.region_name.toLowerCase().includes('no specific')
          ).map((item: any) => ({ value: item.region_id, label: `${item.acronym} - ${item.region_name}` })) : []
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to load reference data:', error);
        // Fallback options
        setOptions({
          cropTypes: [
            { value: 'maize', label: 'Maize' },
            { value: 'rice', label: 'Rice' },
            { value: 'wheat', label: 'Wheat' },
            { value: 'cassava', label: 'Cassava' }
          ],
          keywords: [
            { value: 'sustainability', label: 'Sustainability' },
            { value: 'climate-change', label: 'Climate Change' },
            { value: 'food-security', label: 'Food Security' }
          ],
          initiatives: [
            { value: 'INIT-01', label: 'INIT-01 - Accelerated Breeding' },
            { value: 'INIT-02', label: 'INIT-02 - Breeding Resources' },
            { value: 'INIT-03', label: 'INIT-03 - Climate Adaptation' }
          ],
          centers: [
            { value: 'cimmyt', label: 'CIMMYT' },
            { value: 'irri', label: 'IRRI' },
            { value: 'icrisat', label: 'ICRISAT' }
          ],
          impactAreas: [
            { value: 'nutrition', label: 'Nutrition, health and food security' },
            { value: 'poverty', label: 'Poverty reduction, livelihoods and jobs' },
            { value: 'gender', label: 'Gender equality, youth and social inclusion' },
            { value: 'climate', label: 'Climate adaptation and mitigation' },
            { value: 'environment', label: 'Environmental health and biodiversity' }
          ],
          countries: [
            { value: 'nigeria', label: 'Nigeria' },
            { value: 'kenya', label: 'Kenya' },
            { value: 'ethiopia', label: 'Ethiopia' },
            { value: 'tanzania', label: 'Tanzania' }
          ],
          regions: [
            { value: 'WA', label: 'WA - West Africa' },
            { value: 'EA', label: 'EA - East Africa' },
            { value: 'SA', label: 'SA - Southern Africa' }
          ]
        });
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Load study data for edit mode - run after options are loaded
  useEffect(() => {
    if (isEditMode && id && options.keywords.length > 0) {
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
            
            // Map crops - use new format from database
            const cropIds = studyData.crops ? 
              studyData.crops.map((crop: any) => 
                typeof crop === 'number' ? crop : crop.id
              ) : [];

            // Map keywords - use new format from database
            const keywordIds = studyData.keywords ? 
              studyData.keywords.map((keyword: any) => 
                typeof keyword === 'number' ? keyword : keyword.id
              ) : [];

            // Map initiatives - use new format from database
            const initiativeIds = studyData.initiatives ? 
              studyData.initiatives.map((initiative: any) => 
                typeof initiative === 'number' ? initiative : initiative.id
              ) : [];

            // Map centers - use new format from database  
            const centerIds = studyData.centers ? 
              studyData.centers.map((center: any) => 
                typeof center === 'number' ? center : center.id
              ) : [];

            // Map countries - handle both formats: direct IDs or objects with id/name
            const countryIds = studyData.countries ? 
              studyData.countries.map((country: any) => 
                typeof country === 'number' ? country : country.id
              ) : [];

            // Map regions - handle both formats: direct IDs or objects with id/region_id
            const regionIds = studyData.regions ? 
              studyData.regions.map((region: any) => 
                typeof region === 'number' ? region : region.id
              ) : [];

            // Map impact areas for primary and secondary fields
            const impactAreaIds = studyData.impact_areas ? 
              studyData.impact_areas.map((area: any) => 
                typeof area === 'number' ? area : area.id
              ) : [];

            setFormData({
              cropProductType: cropIds,
              keywords: keywordIds,
              contributingInitiatives: initiativeIds,
              contributingCenters: centerIds,
              primaryCGIARImpactArea: impactAreaIds[0] || '',
              secondaryCGIARImpactArea: impactAreaIds.slice(1) || [],
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
  }, [isEditMode, id, options.keywords]);

  // Remove the separate useEffect for loading saved data since it's now loaded immediately

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // If primary impact area changed, clear secondary if it matches
      if (field === 'primaryCGIARImpactArea' && typeof value === 'string') {
        if (prev.secondaryCGIARImpactArea === value) {
          newData.secondaryCGIARImpactArea = '';
        }
      }
      
      return newData;
    });
  };

  const getSecondaryImpactAreaOptions = () => {
    return options.impactAreas.filter(option => option.value !== formData.primaryCGIARImpactArea);
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
    <AppLayout title={pageTitle} showAddButton={false}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>

        <ProgressStepper steps={steps} currentStep={2} />

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
                  options={options.impactAreas.length === 0 ? [{ value: '', label: 'Loading...' }] : options.impactAreas}
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

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 border-t border-[var(--ic-border-light)] mt-8">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Go Back</span>
            </Button>
            <Button onClick={handleNext} className="flex items-center space-x-2">
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </Card>
        )}
      </div>
    </AppLayout>
  );
};
