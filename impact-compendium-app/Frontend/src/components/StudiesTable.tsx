import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Edit, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

interface StudiesTableProps {
  searchQuery: string;
  filters: string[];
}

const StudiesTable: React.FC<StudiesTableProps> = ({ searchQuery, filters }) => {
  // Mock data - will be replaced with API call
  const studies = [
    {
      id: 1,
      title: 'Climate-Smart Agriculture Impact Assessment',
      type: 'impact',
      status: 'published',
      initiative: 'Climate Change',
      region: 'Sub-Saharan Africa',
      indicators: 12,
      lastUpdated: '2025-10-20',
      author: 'Dr. Sarah Johnson',
    },
    {
      id: 2,
      title: 'Nutrition Intervention Outcomes',
      type: 'outcome',
      status: 'draft',
      initiative: 'Nutrition & Health',
      region: 'South Asia',
      indicators: 8,
      lastUpdated: '2025-10-19',
      author: 'Prof. Michael Chen',
    },
    {
      id: 3,
      title: 'Sustainable Farming Practices Study',
      type: 'impact_outcome_story',
      status: 'review',
      initiative: 'Sustainable Intensification',
      region: 'Latin America',
      indicators: 15,
      lastUpdated: '2025-10-18',
      author: 'Dr. Maria Rodriguez',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'review':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'impact':
        return 'bg-blue-100 text-blue-800';
      case 'outcome':
        return 'bg-green-100 text-green-800';
      case 'impact_outcome_story':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Study</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Initiative</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Indicators</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studies.map((study) => (
              <TableRow key={study.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{study.title}</p>
                    <p className="text-sm text-muted-foreground">
                      by {study.author}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(study.type)}>
                    {study.type.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(study.status)}>
                    {study.status}
                  </Badge>
                </TableCell>
                <TableCell>{study.initiative}</TableCell>
                <TableCell>{study.region}</TableCell>
                <TableCell>{study.indicators}</TableCell>
                <TableCell>{study.lastUpdated}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/studies/${study.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/studies/${study.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StudiesTable;
