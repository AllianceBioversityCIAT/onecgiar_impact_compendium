import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  BookOpen, 
  Users, 
  TrendingUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ApiService from '@/services/api';

interface Study {
  id: number;
  title: string;
  description?: string;
  category_id?: number;
  is_published: boolean;
  created_at: string;
  created_by: string;
}

interface DashboardStats {
  totalStudies: number;
  publishedStudies: number;
  myStudies: number;
  recentActivity: number;
}

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [studies, setStudies] = useState<Study[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudies: 0,
    publishedStudies: 0,
    myStudies: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudy, setExpandedStudy] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load studies
      const studiesData = await ApiService.getStudies({ limit: 10 });
      setStudies(studiesData);

      // Calculate stats
      const totalStudies = studiesData.length;
      const publishedStudies = studiesData.filter(s => s.is_published).length;
      const myStudies = user ? studiesData.filter(s => s.created_by === user.sub).length : 0;

      setStats({
        totalStudies,
        publishedStudies,
        myStudies,
        recentActivity: totalStudies
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudies = studies.filter(study =>
    study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (study.description && study.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleStudyExpansion = (studyId: number) => {
    setExpandedStudy(expandedStudy === studyId ? null : studyId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name || user?.email}
          </p>
        </div>
        
        {hasRole('Researcher') && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Study
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudies}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedStudies}</div>
            <p className="text-xs text-muted-foreground">
              Available to public
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Studies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myStudies}</div>
            <p className="text-xs text-muted-foreground">
              Created by you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Studies */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Studies</CardTitle>
              <CardDescription>
                Latest research impact studies
              </CardDescription>
            </div>
            
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search studies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {filteredStudies.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No studies found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first study.'}
                </p>
              </div>
            ) : (
              filteredStudies.map((study) => (
                <div key={study.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleStudyExpansion(study.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedStudy === study.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        
                        <div>
                          <h4 className="font-medium text-gray-900">{study.title}</h4>
                          <p className="text-sm text-gray-600">
                            Created {new Date(study.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {expandedStudy === study.id && study.description && (
                        <div className="mt-3 ml-7">
                          <p className="text-sm text-gray-700">{study.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={study.is_published ? "default" : "secondary"}>
                        {study.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      
                      {hasRole('Researcher') && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
