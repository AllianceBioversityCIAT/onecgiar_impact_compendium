import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreateStudy: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Study</h1>
        <p className="text-muted-foreground">
          Multi-step form wizard for creating impact studies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Creation Wizard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Multi-step study creation form will be implemented in Sprint 6.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateStudy;
