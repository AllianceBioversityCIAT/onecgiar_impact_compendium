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
  },
  // Add study with ID 578 for testing
  {
    id: '578',
    title: 'Advanced Research Study 578',
    description: 'This is the study with ID 578 that should be found when searching',
    category: 'Research',
    status: 'Published',
    createdAt: '2024-05-15',
    updatedAt: '2024-06-20',
    authors: ['Dr. Test Researcher'],
    tags: ['test', 'search', '578']
  },
  // Add more studies to simulate a larger dataset
  ...Array.from({ length: 600 }, (_, i) => ({
    id: (i + 4).toString(),
    title: `Research Study ${i + 4}`,
    description: `Detailed analysis and research findings for study number ${i + 4}`,
    category: ['Agriculture', 'Water Management', 'Nutrition', 'Climate Change'][i % 4],
    status: i % 3 === 0 ? 'Draft' : 'Published',
    createdAt: `2024-${String(Math.floor(i / 50) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
    updatedAt: `2024-${String(Math.floor(i / 50) + 2).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
    authors: [`Researcher ${i + 4}`],
    tags: ['research', 'study', `tag${i + 4}`]
  }))
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

  // Filter by search query across all fields
  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(study => {
      const searchableFields = [
        study.id.toString(),
        study.title,
        study.description,
        study.category,
        study.status,
        study.createdAt,
        study.updatedAt,
        study.authors.join(' '),
        study.tags.join(' ')
      ];
      
      return searchableFields.some(field => 
        field.toLowerCase().includes(query)
      );
    });
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
