import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Admin: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">
          Manage users, settings, and system configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Console</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin functionality will be implemented in Sprint 6.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
