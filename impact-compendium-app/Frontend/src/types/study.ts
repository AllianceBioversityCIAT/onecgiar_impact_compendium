export interface Study {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  authors: string[];
  tags: string[];
  year?: number;
  impact_areas?: string;
  regions?: string;
  countries?: string;
  center?: string;
}
