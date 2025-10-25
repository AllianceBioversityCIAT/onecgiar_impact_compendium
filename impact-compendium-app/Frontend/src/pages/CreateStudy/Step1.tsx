import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormLayout } from '../../layouts/FormLayout';
import { AppLayout } from '../../layouts/AppLayout';
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { getReferenceData } from '../../services/api';

const steps = [
  { id: 1, label: 'Step 1' },
  { id: 2, label: 'Step 2' },
  { id: 3, label: 'Step 3' }
];

export const CreateStudyStep1: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  // Load saved data immediately and synchronously
  const getSavedData = () => {
    const savedData = localStorage.getItem('studyFormStep1');
    return savedData ? JSON.parse(savedData) : {
      studyId: '',
      title: '',
      summary: '',
      year: '2025',
      doi: '',
      category: '',
      periodStart: '',
      periodEnd: '',
      interventionType: '',
      interventionDetails: ''
    };
  };

  const [formData, setFormData] = useState(getSavedData);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    categories: [],
    interventionTypes: []
  });

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [categories, interventionTypes] = await Promise.all([
          getReferenceData.categories(),
          getReferenceData.interventionTypes()
        ]);
        
        setOptions({
          categories: categories.map((cat: any) => ({ value: cat.id, label: cat.name })),
          interventionTypes: interventionTypes.map((type: any) => ({ value: type.id, label: type.name }))
        });
      } catch (error) {
        console.error('Failed to load reference data:', error);
        // Fallback options
        setOptions({
          categories: [
            { value: 'impact-study', label: 'Impact Study' },
            { value: 'outcome-study', label: 'Outcome Study' },
            { value: 'impact-outcome-story', label: 'Impact Outcome Story' },
            { value: 'other', label: 'Other' }
          ],
          interventionTypes: [
            { value: 'technology', label: 'Technology' },
            { value: 'policy', label: 'Policy' },
            { value: 'capacity-building', label: 'Capacity Building' },
            { value: 'other', label: 'Other' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Load study data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadStudyData = async () => {
        try {
          console.log('Loading study with ID:', id); // Debug log
          
          // Extract numeric ID if it's in ICD-XXX format
          const numericId = id.startsWith('ICD-') ? id.replace('ICD-', '') : id;
          
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/studies/${numericId}`);
          console.log('API response status:', response.status); // Debug log
          
          if (response.ok) {
            const apiResponse = await response.json();
            console.log('Study data received:', apiResponse); // Debug log
            
            // Extract the actual study data from the nested response
            const studyData = apiResponse.data || apiResponse;
            
            setFormData({
              studyId: studyData.id || studyData.study_id || '',
              title: studyData.title || '',
              summary: studyData.summary || '',
              year: studyData.year?.toString() || '2025',
              doi: studyData.doi || studyData.link_or_doi || '',
              category: studyData.category?.id?.toString() || '',
              periodStart: studyData.period?.start?.toString() || '',
              periodEnd: studyData.period?.end?.toString() || '',
              interventionType: studyData.intervention?.type || '',
              interventionDetails: studyData.intervention?.detailsShort || ''
            });
          } else {
            console.error('API response not OK:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Failed to load study data:', error);
        }
      };
      loadStudyData();
    }
  }, [isEditMode, id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
      // Validate URL format
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const doiPattern = /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/;
      
      if (!urlPattern.test(formData.doi) && !doiPattern.test(formData.doi)) {
        newErrors.doi = 'Please enter a valid URL or DOI format.';
      }
    }
    if (!formData.periodStart) newErrors.periodStart = 'This field is required.';
    if (!formData.periodEnd) newErrors.periodEnd = 'This field is required.';
    if (!formData.interventionType) newErrors.interventionType = 'This field is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleNext = async () => {
    if (validateForm()) {
      // Store form data locally
      localStorage.setItem('studyFormStep1', JSON.stringify(formData));
      
      // Save to backend if not in edit mode
      if (!isEditMode) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/studies/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studyId: formData.studyId,
              title: formData.title,
              summary: formData.summary,
              year: parseInt(formData.year),
              doi: formData.doi,
              category: formData.category,
              periodStart: formData.periodStart,
              periodEnd: formData.periodEnd,
              interventionType: formData.interventionType,
              interventionDetails: formData.interventionDetails
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save study');
          }
          
          const result = await response.json();
          console.log('Study saved:', result);
        } catch (error) {
          console.error('Error saving study:', error);
          // Continue to next step even if save fails (for development)
        }
      } else {
        // Update existing study
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/studies/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studyId: formData.studyId,
              title: formData.title,
              summary: formData.summary,
              year: parseInt(formData.year),
              doi: formData.doi,
              category: formData.category,
              periodStart: formData.periodStart,
              periodEnd: formData.periodEnd,
              interventionType: formData.interventionType,
              interventionDetails: formData.interventionDetails
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update study');
          }
          
          const result = await response.json();
          console.log('Study updated:', result);
        } catch (error) {
          console.error('Error updating study:', error);
          // Continue to next step even if update fails (for development)
        }
      }
      
      const nextPath = isEditMode ? `/studies/edit/${id}/step-2` : '/studies/new/step-2';
      navigate(nextPath);
    }
  };

  const pageTitle = isEditMode ? "Edit study form" : "Create new study form";

  if (loading) {
    return (
      <AppLayout title={pageTitle} showAddButton={false}>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>
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
      onSaveDraft={() => console.log('Save draft')}
      steps={steps}
      currentStep={1}
    >
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-[var(--ic-color-text)]">{pageTitle}</h1>

        <Card>
          <div className="space-y-4">
            {/* Study ID */}
            <Input
              label="Study ID"
              required
              placeholder="Enter unique study identifier"
              value={formData.studyId}
              onChange={(e) => handleInputChange('studyId', e.target.value)}
              error={errors.studyId}
            />

            {/* Title */}
            <Input
              label="Title"
              required
              placeholder="Enter value"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
            />

            {/* Summary */}
            <Textarea
              label="Summary"
              placeholder="Enter value"
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
            />

            {/* Year of report and Category Row */}
            <div className="grid grid-cols-2 gap-6">
              <Select
                label="Year of report"
                required
                options={Array.from({length: 10}, (_, i) => {
                  const year = 2025 - i;
                  return { value: year.toString(), label: year.toString() };
                })}
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
              />

              <Select
                label="Category"
                required
                options={options.categories}
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                error={errors.category}
              />
            </div>

            {/* Link or DOI */}
            <Input
              label="Link or DOI"
              required
              placeholder="https://example.com or 10.1000/xyz123"
              value={formData.doi}
              onChange={(e) => handleInputChange('doi', e.target.value)}
              error={errors.doi}
            />

            {/* Period start and Period end Row */}
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Period start"
                required
                value={formData.periodStart}
                onChange={(e) => handleInputChange('periodStart', e.target.value)}
                error={errors.periodStart}
                placeholder="YYYY"
              />

              <Input
                label="Period end"
                required
                value={formData.periodEnd}
                onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                error={errors.periodEnd}
                placeholder="YYYY"
              />
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
                  onChange={(value) => handleInputChange('interventionType', value)}
                  error={errors.interventionType}
                />

                <Textarea
                  label="Intervention Details"
                  placeholder="Enter value"
                  value={formData.interventionDetails}
                  onChange={(e) => handleInputChange('interventionDetails', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </FormLayout>
  );
};
