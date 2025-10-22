import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getReferenceData } from '../../services/api';

const steps = [
  { id: 1, label: 'Step 1' },
  { id: 2, label: 'Step 2' },
  { id: 3, label: 'Step 3' }
];

export const CreateStudyStep1: React.FC = () => {
  const [formData, setFormData] = useState({
    studyId: '',
    title: '',
    summary: '',
    yearOfReport: '2025',
    linkOrDoi: '',
    category: '',
    periodStart: '',
    periodEnd: '',
    interventionType: '',
    interventionDetails: ''
  });

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
    if (!formData.linkOrDoi) newErrors.linkOrDoi = 'This field is required.';
    if (!formData.periodStart) newErrors.periodStart = 'This field is required.';
    if (!formData.periodEnd) newErrors.periodEnd = 'This field is required.';
    if (!formData.interventionType) newErrors.interventionType = 'This field is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Store form data and navigate to Step 2
      localStorage.setItem('studyFormStep1', JSON.stringify(formData));
      console.log('Navigate to Step 2');
    }
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
          <Button variant="ghost" className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Go Back</span>
          </Button>
          <h1 className="text-2xl font-bold text-[var(--ic-color-text)]">Create new study form</h1>
        </div>

        <ProgressStepper steps={steps} currentStep={1} />

        <Card>
          <div className="space-y-6">
            {/* Study ID - with dropdown arrow (controlled list) */}
            <div className="relative">
              <Input
                label="Study ID"
                required
                placeholder="Enter value"
                value={formData.studyId}
                onChange={(e) => handleInputChange('studyId', e.target.value)}
                error={errors.studyId}
              />
              <svg className="absolute right-3 top-8 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

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
                value={formData.yearOfReport}
                onChange={(e) => handleInputChange('yearOfReport', e.target.value)}
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
              placeholder="Enter value"
              value={formData.linkOrDoi}
              onChange={(e) => handleInputChange('linkOrDoi', e.target.value)}
              error={errors.linkOrDoi}
            />

            {/* Period start and Period end Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <Input
                  label="Period start"
                  required
                  type="text"
                  placeholder="YYYY"
                  value={formData.periodStart}
                  onChange={(e) => handleInputChange('periodStart', e.target.value)}
                  error={errors.periodStart}
                />
                <svg className="absolute right-3 top-8 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="relative">
                <Input
                  label="Period end"
                  required
                  type="text"
                  placeholder="YYYY"
                  value={formData.periodEnd}
                  onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                  error={errors.periodEnd}
                />
                <svg className="absolute right-3 top-8 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Intervention Information Section */}
            <div className="pt-6 border-t border-[var(--ic-border-light)]">
              <h3 className="text-lg font-semibold text-[var(--ic-color-text)] mb-4">
                Intervention information
              </h3>
              
              <div className="space-y-4">
                <Select
                  label="Intervention type"
                  required
                  options={options.interventionTypes}
                  value={formData.interventionType}
                  onChange={(e) => handleInputChange('interventionType', e.target.value)}
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

            {/* Next Button */}
            <div className="flex justify-end pt-6">
              <Button onClick={handleNext} className="flex items-center space-x-2">
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
