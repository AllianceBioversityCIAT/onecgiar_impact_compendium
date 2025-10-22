import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getReferenceData } from '../../services/api';

const steps = [
  { id: 1, label: 'Step 1', completed: true },
  { id: 2, label: 'Step 2' },
  { id: 3, label: 'Step 3' }
];

export const CreateStudyStep2: React.FC = () => {
  const [formData, setFormData] = useState({
    cropProductType: '',
    keywords: '',
    contributingInitiatives: '',
    contributingCenters: '',
    primaryCGIARImpactArea: '',
    secondaryCGIARImpactArea: '',
    countryOfStudy: '',
    cgiarRegions: ''
  });

  const [loading, setLoading] = useState(true);
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
            { value: 'accelerated-breeding', label: 'Accelerated Breeding' },
            { value: 'breeding-resources', label: 'Breeding Resources' },
            { value: 'climate-adaptation', label: 'Climate Adaptation' }
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
            { value: 'west-africa', label: 'West Africa' },
            { value: 'east-africa', label: 'East Africa' },
            { value: 'southern-africa', label: 'Southern Africa' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Store form data and navigate to Step 3
    localStorage.setItem('studyFormStep2', JSON.stringify(formData));
    console.log('Navigate to Step 3');
  };

  const handleGoBack = () => {
    console.log('Navigate back to Step 1');
  };

  if (loading) {
    return (
      <AppLayout title="Create new study form" showAddButton={false}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading...</div>
        </div>
      </AppLayout>
    );
  }

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

        <ProgressStepper steps={steps} currentStep={2} />

        <Card>
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Crop/Product Type */}
              <Select
                label="Crop/Product Type"
                options={options.cropTypes}
                placeholder="Select options"
                value={formData.cropProductType}
                onChange={(e) => handleInputChange('cropProductType', e.target.value)}
              />

              {/* Contributors Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--ic-color-text)]">
                  Contributors section
                </h3>
                
                <Select
                  label="Contributing Initiatives"
                  options={options.initiatives}
                  placeholder="Select options"
                  value={formData.contributingInitiatives}
                  onChange={(e) => handleInputChange('contributingInitiatives', e.target.value)}
                />
              </div>

              {/* CGIAR Impact Areas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--ic-color-text)]">
                  CGIAR Impact Areas
                </h3>
                
                <Select
                  label="Primary CGIAR Impact Area"
                  required
                  options={options.impactAreas}
                  value={formData.primaryCGIARImpactArea}
                  onChange={(e) => handleInputChange('primaryCGIARImpactArea', e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--ic-color-text)]">
                  Location
                </h3>
                
                <Select
                  label="Country of study"
                  options={options.countries}
                  placeholder="Select options"
                  value={formData.countryOfStudy}
                  onChange={(e) => handleInputChange('countryOfStudy', e.target.value)}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Keywords */}
              <Select
                label="Keywords"
                options={options.keywords}
                placeholder="Select options"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
              />

              {/* Contributing Centers */}
              <Select
                label="Contributing Centers"
                options={options.centers}
                placeholder="Select options"
                value={formData.contributingCenters}
                onChange={(e) => handleInputChange('contributingCenters', e.target.value)}
              />

              {/* Secondary CGIAR Impact Area */}
              <Select
                label="Secondary CGIAR Impact Area"
                required
                options={options.impactAreas}
                value={formData.secondaryCGIARImpactArea}
                onChange={(e) => handleInputChange('secondaryCGIARImpactArea', e.target.value)}
              />

              {/* CGIAR Regions */}
              <Select
                label="CGIAR Regions"
                options={options.regions}
                placeholder="Select options"
                value={formData.cgiarRegions}
                onChange={(e) => handleInputChange('cgiarRegions', e.target.value)}
              />
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-8 border-t border-[var(--ic-border-light)] mt-8">
            <Button onClick={handleNext} className="flex items-center space-x-2">
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
