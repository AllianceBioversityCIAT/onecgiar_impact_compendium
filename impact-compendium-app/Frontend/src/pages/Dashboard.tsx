import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, BarChart3, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Studies',
      value: '24',
      change: '+12%',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Published Studies',
      value: '18',
      change: '+8%',
      icon: BarChart3,
      color: 'text-green-600',
    },
    {
      title: 'Active Researchers',
      value: '12',
      change: '+3%',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Impact Indicators',
      value: '156',
      change: '+24%',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  const recentStudies = [
    {
      id: 1,
      title: 'Climate-Smart Agriculture Impact Assessment',
      status: 'published',
      type: 'impact',
      updatedAt: '2 hours ago',
    },
    {
      id: 2,
      title: 'Nutrition Intervention Outcomes',
      status: 'draft',
      type: 'outcome',
      updatedAt: '1 day ago',
    },
    {
      id: 3,
      title: 'Sustainable Farming Practices Study',
      status: 'review',
      type: 'impact_outcome_story',
      updatedAt: '3 days ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your impact studies.
          </p>
        </div>
        <Button asChild>
          <Link to="/studies/create">
            <Plus className="h-4 w-4 mr-2" />
            New Study
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Studies */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Studies</CardTitle>
            <CardDescription>
              Your latest impact studies and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudies.map((study) => (
                <div key={study.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {study.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {study.updatedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{study.type}</Badge>
                    <Badge 
                      variant={
                        study.status === 'published' ? 'default' :
                        study.status === 'draft' ? 'secondary' : 'outline'
                      }
                    >
                      {study.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" asChild className="w-full">
                <Link to="/studies">View All Studies</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link to="/studies/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New Study
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link to="/reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link to="/studies">
                <FileText className="h-4 w-4 mr-2" />
                Browse Studies
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
