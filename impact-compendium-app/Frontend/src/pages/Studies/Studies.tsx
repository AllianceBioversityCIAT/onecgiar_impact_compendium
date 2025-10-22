import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ApiService from '@/services/api';

interface Study {
  id: number;
  title: string;
  description?: string;
  category_id?: number;
  methodology?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const Studies: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudies, setExpandedStudies] = useState<Set<number>>(new Set());
  const [selectedStudies, setSelectedStudies] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getStudies({ limit: 50 });
      setStudies(data);
    } catch (error) {
      console.error('Error loading studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudy = async (studyId: number) => {
    if (!window.confirm('Are you sure you want to delete this study?')) {
      return;
    }

    try {
      await ApiService.deleteStudy(studyId);
      setStudies(studies.filter(s => s.id !== studyId));
    } catch (error) {
      console.error('Error deleting study:', error);
      alert('Failed to delete study. Please try again.');
    }
  };

  const toggleStudyExpansion = (studyId: number) => {
    const newExpanded = new Set(expandedStudies);
    if (newExpanded.has(studyId)) {
      newExpanded.delete(studyId);
    } else {
      newExpanded.add(studyId);
    }
    setExpandedStudies(newExpanded);
  };

  const toggleStudySelection = (studyId: number) => {
    const newSelected = new Set(selectedStudies);
    if (newSelected.has(studyId)) {
      newSelected.delete(studyId);
    } else {
      newSelected.add(studyId);
    }
    setSelectedStudies(newSelected);
  };

  const filteredStudies = studies.filter(study =>
    study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (study.description && study.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const canEditStudy = (study: Study) => {
    return hasRole('Admin') || (hasRole('Researcher') && study.created_by === user?.sub);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading studies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Studies</h1>
          <p className="text-gray-600 mt-1">
            Research impact studies and assessments
          </p>
        </div>
        
        {hasRole('Researcher') && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Study
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search studies by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              
              {selectedStudies.size > 0 && hasRole('Researcher') && (
                <Button variant="destructive" size="sm">
                  Delete Selected ({selectedStudies.size})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Studies List */}
      <div className="space-y-4">
        {filteredStudies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No studies found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first study.'}
              </p>
              {hasRole('Researcher') && !searchTerm && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Study
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredStudies.map((study) => (
            <Card key={study.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {hasRole('Researcher') && (
                      <input
                        type="checkbox"
                        checked={selectedStudies.has(study.id)}
                        onChange={() => toggleStudySelection(study.id)}
                        className="mt-1"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{study.title}</h3>
                        <Badge variant={study.is_published ? "default" : "secondary"}>
                          {study.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {new Date(study.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>ID: {study.created_by}</span>
                        </div>
                      </div>
                      
                      {study.description && (
                        <p className="text-gray-700 mb-3 line-clamp-2">{study.description}</p>
                      )}
                      
                      {expandedStudies.has(study.id) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                              <p className="text-sm text-gray-600">
                                <strong>Category ID:</strong> {study.category_id || 'Not specified'}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Last Updated:</strong> {new Date(study.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            {study.methodology && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Methodology</h4>
                                <p className="text-sm text-gray-600">{study.methodology}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStudyExpansion(study.id)}
                    >
                      {expandedStudies.has(study.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {canEditStudy(study) && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteStudy(study.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredStudies.length > 0 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button variant="outline" disabled>Previous</Button>
            <Button variant="outline" className="bg-blue-600 text-white">1</Button>
            <Button variant="outline" disabled>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studies;
