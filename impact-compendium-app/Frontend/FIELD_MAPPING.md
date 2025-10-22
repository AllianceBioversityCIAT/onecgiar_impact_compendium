# Impact Compendium - Complete Field Mapping

This document maps every field from the form images to backend endpoints and database fields.

## 📋 Step 1 Fields

### Form Fields → Backend API Mapping

| **Field Label** | **Field Type** | **Required** | **Backend Endpoint** | **Database Field** | **Notes** |
|----------------|----------------|--------------|---------------------|-------------------|-----------|
| Study ID | Input (with dropdown) | ✅ | Auto-generated or controlled list | `study_id` | Has dropdown arrow - may be controlled |
| Title | Input | ✅ | - | `title` | Free text |
| Summary | Textarea | ❌ | - | `summary` | Free text |
| Year of report | Select | ✅ | - | `year_of_report` | Dropdown 2015-2025 |
| Category | Select | ✅ | `/api/reference/study-categories` | `category` | **CONTROLLED LIST** |
| Link or DOI | Input | ✅ | - | `link_or_doi` | Free text |
| Period start | Input (Date) | ✅ | - | `period_start` | YYYY format with calendar icon |
| Period end | Input (Date) | ✅ | - | `period_end` | YYYY format with calendar icon |
| Intervention type | Select | ✅ | `/api/reference/intervention-types` | `intervention_type` | **CONTROLLED LIST** |
| Intervention Details | Textarea | ❌ | - | `intervention_details` | Free text |

## 📋 Step 2 Fields

### Form Fields → Backend API Mapping

| **Field Label** | **Field Type** | **Required** | **Backend Endpoint** | **Database Field** | **Notes** |
|----------------|----------------|--------------|---------------------|-------------------|-----------|
| Crop/Product Type | Multi-Select | ❌ | `/api/reference/crop-types` | `crop_product_type` | **CONTROLLED LIST** |
| Keywords | Multi-Select | ❌ | `/api/reference/keywords` | `keywords` | **CONTROLLED LIST** |
| Contributing Initiatives | Multi-Select | ❌ | `/api/clarisa/initiatives` | `contributing_initiatives` | **CLARISA API** |
| Contributing Centers | Multi-Select | ❌ | `/api/clarisa/centers` | `contributing_centers` | **CLARISA API** |
| Primary CGIAR Impact Area | Select | ✅ | `/api/clarisa/impact-areas` | `primary_cgiar_impact_area` | **CLARISA API** |
| Secondary CGIAR Impact Area | Multi-Select | ✅ | `/api/clarisa/impact-areas` | `secondary_cgiar_impact_area` | **CLARISA API** |
| Country of study | Multi-Select | ❌ | `/api/clarisa/countries` | `country_of_study` | **CLARISA API** |
| CGIAR Regions | Multi-Select | ❌ | `/api/clarisa/regions` | `cgiar_regions` | **CLARISA API** (auto from countries) |

## 📋 Step 3 Fields (Dynamic Indicators)

### Form Fields → Backend API Mapping

| **Field Label** | **Field Type** | **Required** | **Backend Endpoint** | **Database Field** | **Notes** |
|----------------|----------------|--------------|---------------------|-------------------|-----------|
| Indicator measured | Input | ❌ | - | `indicator_measured` | Free text per indicator |
| Unit of measure | Input | ❌ | `/api/reference/indicator-units` (optional) | `unit_of_measure` | May have controlled list |
| Result reported | Input | ❌ | - | `result_reported` | Free text per indicator |

## 🔗 Backend API Endpoints Required

### Reference Data APIs (Controlled Lists)
```typescript
// Step 1 Controlled Lists
GET /api/reference/study-categories        // Impact Study, Outcome Study, etc.
GET /api/reference/intervention-types      // Technology, Policy, etc.

// Step 2 Controlled Lists
GET /api/reference/crop-types             // Maize, Rice, Wheat, etc.
GET /api/reference/keywords               // Sustainability, Climate Change, etc.

// Step 3 Optional Controlled Lists  
GET /api/reference/indicator-units        // %, kg/ha, USD, etc.
```

### CLARISA Integration APIs
```typescript
// CGIAR Reference Data
GET /api/clarisa/initiatives              // Accelerated Breeding, etc.
GET /api/clarisa/centers                  // CIMMYT, IRRI, ICRISAT, etc.
GET /api/clarisa/impact-areas            // Nutrition, Poverty reduction, etc.
GET /api/clarisa/countries               // Nigeria, Kenya, Ethiopia, etc.
GET /api/clarisa/regions                 // West Africa, East Africa, etc.
```

### Study CRUD APIs
```typescript
// Study Management
GET    /api/studies                       // List all studies
POST   /api/studies                       // Create new study
GET    /api/studies/:id                   // Get study details
PUT    /api/studies/:id                   // Update study
DELETE /api/studies/:id                   // Delete study
```

## 📊 Complete Study Data Structure

```typescript
interface StudyFormData {
  // Step 1 - Basic Information
  study_id: string;
  title: string;
  summary?: string;
  year_of_report: number;
  category: string;                        // From controlled list
  link_or_doi: string;
  period_start: string;                    // YYYY format
  period_end: string;                      // YYYY format
  intervention_type: string;               // From controlled list
  intervention_details?: string;
  
  // Step 2 - Contributors & Geography
  crop_product_type?: string[];            // Multi-select from controlled list
  keywords?: string[];                     // Multi-select from controlled list
  contributing_initiatives?: string[];     // Multi-select from CLARISA
  contributing_centers?: string[];         // Multi-select from CLARISA
  primary_cgiar_impact_area: string;       // Single select from CLARISA
  secondary_cgiar_impact_area?: string[];  // Multi-select from CLARISA
  country_of_study?: string[];            // Multi-select from CLARISA
  cgiar_regions?: string[];               // Auto-populated from countries
  
  // Step 3 - Indicators (Dynamic Array)
  indicators: Array<{
    indicator_measured?: string;
    unit_of_measure?: string;             // May be from controlled list
    result_reported?: string;
  }>;
}
```

## 🎯 Implementation Notes

### Multi-Select Fields
Several fields are multi-select (can choose multiple options):
- Crop/Product Type
- Keywords  
- Contributing Initiatives
- Contributing Centers
- Secondary CGIAR Impact Area
- Country of study
- CGIAR Regions

### Auto-Population
- **CGIAR Regions** should auto-populate based on selected countries
- **Study ID** may be auto-generated or from controlled list (has dropdown arrow)

### Validation Rules
- **Required fields** marked with red asterisk (*)
- **Error states** show red border + error icon + message
- **Step progression** requires valid completion of previous steps

### Data Relationships
- Countries → Regions (auto-mapping)
- Impact Areas → Both primary (single) and secondary (multi)
- Initiatives/Centers → From CLARISA system
- Categories/Intervention Types → Internal reference data

## 🔄 Form Flow & Data Persistence

1. **Step 1**: Store in `localStorage` as `studyFormStep1`
2. **Step 2**: Store in `localStorage` as `studyFormStep2`  
3. **Step 3**: Combine all data + indicators → POST to `/api/studies`
4. **Success**: Clear localStorage, redirect to dashboard

This mapping ensures every field from the images is properly connected to backend endpoints and database storage.
