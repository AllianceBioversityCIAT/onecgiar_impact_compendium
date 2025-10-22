import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X } from 'lucide-react';
import ApiService from '@/services/api';

interface StudyFormData {
  title: string;
  description: string;
  methodology: string;
  is_published: boolean;
  category_id?: number;
}

interface StudyFormProps {
  study?: any;
  onSave?: (study: any) => void;
  onCancel?: () => void;
}

const StudyForm: React.FC<StudyFormProps> = ({ study, onSave, onCancel }) => {
  const [formData, setFormData] = useState<StudyFormData>({
    title: study?.title || '',
    description: study?.description || '',
    methodology: study?.methodology || '',
    is_published: study?.is_published || false,
    category_id: study?.category_id || undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof StudyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (study?.id) {
        // Update existing study
        result = await ApiService.updateStudy(study.id, formData);
      } else {
        // Create new study
        result = await ApiService.createStudy(formData);
      }

      onSave?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to save study');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{study?.id ? 'Edit Study' : 'Create New Study'}</CardTitle>
        <CardDescription>
          {study?.id ? 'Update study information' : 'Add a new research impact study'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter study title"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the study objectives and scope"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="methodology">Methodology</Label>
            <Textarea
              id="methodology"
              value={formData.methodology}
              onChange={(e) => handleInputChange('methodology', e.target.value)}
              placeholder="Describe the research methodology used"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Category ID</Label>
            <Input
              id="category_id"
              type="number"
              value={formData.category_id || ''}
              onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter category ID"
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) => handleInputChange('is_published', checked)}
              disabled={loading}
            />
            <Label htmlFor="is_published">Publish study</Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {study?.id ? 'Update Study' : 'Create Study'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudyForm;
