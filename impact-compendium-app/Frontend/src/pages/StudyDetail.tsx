import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Details</h1>
        <p className="text-muted-foreground">
          Viewing study #{id}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Study detail view will be implemented in Sprint 6.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyDetail;
