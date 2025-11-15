import { Study } from '../types/study';

const mockStudies: Study[] = [
  {
    id: '1',
    title: 'Climate-Smart Agriculture in Sub-Saharan Africa',
    description:
      'Impact assessment of climate-smart agricultural practices on smallholder farmers',
    category: 'Agriculture',
    status: 'Published',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
    authors: ['Dr. Jane Smith', 'Prof. John Doe'],
    tags: ['climate', 'agriculture', 'africa'],
    year: 2024,
    impact_areas: 'Climate adaptation and mitigation',
    regions: 'Africa',
    countries: 'Kenya, Ethiopia, Ghana',
    center: 'CIMMYT',
  },
  {
    id: '2',
    title: 'Water Management Systems in Rice Production',
    description:
      'Evaluation of water-efficient irrigation systems in Asian rice fields',
    category: 'Water Management',
    status: 'Published',
    createdAt: '2024-02-10',
    updatedAt: '2024-03-15',
    authors: ['Dr. Maria Garcia'],
    tags: ['water', 'rice', 'irrigation'],
    year: 2024,
    impact_areas: 'Environmental health and biodiversity',
    regions: 'Asia',
    countries: 'Bangladesh, Vietnam, Philippines',
    center: 'IRRI',
  },
  {
    id: '3',
    title: 'Nutrition Security Through Crop Diversification',
    description:
      'Analysis of nutritional outcomes from diversified cropping systems',
    category: 'Nutrition',
    status: 'Published',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-25',
    authors: ['Dr. Ahmed Hassan', 'Dr. Lisa Chen'],
    tags: ['nutrition', 'crops', 'diversity'],
    year: 2024,
    impact_areas: 'Nutrition, health and food security',
    regions: 'Global',
    countries: 'Multiple Countries',
    center: 'ICRISAT',
  },
  {
    id: '4',
    title: 'Sustainable Livestock Management',
    description:
      'Comprehensive study on sustainable livestock practices and their impact on rural livelihoods',
    category: 'Livestock',
    status: 'Published',
    createdAt: '2023-05-15',
    updatedAt: '2023-06-20',
    authors: ['Dr. Test Researcher'],
    tags: ['livestock', 'sustainability'],
    year: 2023,
    impact_areas: 'Poverty reduction, livelihoods and jobs',
    regions: 'Africa',
    countries: 'Kenya, Tanzania, Uganda',
    center: 'ILRI',
  },
  {
    id: '5',
    title: 'Gender Inclusion in Agricultural Value Chains',
    description:
      "Assessment of women's participation in agricultural value chains and economic empowerment",
    category: 'Gender',
    status: 'Published',
    createdAt: '2024-03-10',
    updatedAt: '2024-04-15',
    authors: ['Dr. Sarah Johnson'],
    tags: ['gender', 'value chains', 'empowerment'],
    year: 2024,
    impact_areas: 'Gender equality, youth and social inclusion',
    regions: 'Latin America',
    countries: 'Colombia, Peru, Ecuador',
    center: 'CIAT',
  },
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
        study.tags.join(' '),
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
    total: filtered.length,
  };
}
