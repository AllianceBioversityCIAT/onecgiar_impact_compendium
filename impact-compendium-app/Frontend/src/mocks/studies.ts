import { Study } from '../types/study';

const mockStudies: Study[] = [
  {
    id: '1',
    title: 'Climate-Smart Agriculture in Sub-Saharan Africa',
    description: 'Impact assessment of climate-smart agricultural practices on smallholder farmers',
    category: 'Agriculture',
    status: 'Published',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
    authors: ['Dr. Jane Smith', 'Prof. John Doe'],
    tags: ['climate', 'agriculture', 'africa']
  },
  {
    id: '2',
    title: 'Water Management Systems in Rice Production',
    description: 'Evaluation of water-efficient irrigation systems in Asian rice fields',
    category: 'Water Management',
    status: 'Draft',
    createdAt: '2024-02-10',
    updatedAt: '2024-03-15',
    authors: ['Dr. Maria Garcia'],
    tags: ['water', 'rice', 'irrigation']
  },
  {
    id: '3',
    title: 'Nutrition Security Through Crop Diversification',
    description: 'Analysis of nutritional outcomes from diversified cropping systems',
    category: 'Nutrition',
    status: 'Published',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-25',
    authors: ['Dr. Ahmed Hassan', 'Dr. Lisa Chen'],
    tags: ['nutrition', 'crops', 'diversity']
  }
];

export interface StudiesResponse {
  items: Study[];
  total: number;
}

export function getMockStudies(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  category?: string;
}): StudiesResponse {
  let filtered = [...mockStudies];

  // Filter by search query
  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(study =>
      study.title.toLowerCase().includes(query) ||
      study.description.toLowerCase().includes(query) ||
      study.category.toLowerCase().includes(query) ||
      study.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by category
  if (params.category) {
    filtered = filtered.filter(study => study.category === params.category);
  }

  // Sort
  if (params.sort) {
    const [field, direction] = params.sort.split(':');
    filtered.sort((a, b) => {
      const aVal = a[field as keyof Study] as string;
      const bVal = b[field as keyof Study] as string;
      const comparison = aVal.localeCompare(bVal);
      return direction === 'desc' ? -comparison : comparison;
    });
  }

  // Paginate
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total: filtered.length
  };
}
