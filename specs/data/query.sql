SELECT 
    -- Main study data
    s.study_id,
    s.title,
    s.summary,
    s.year,
    s.doi,
    s.period_start,
    s.period_end,
    s.intervention_details,
    s.is_active,    
    -- Category information
    s.category_id,
    c.name as category_name,
    
    -- Intervention type information
    sit.intervention_type_id,
    it.name as intervention_type_name,
    
    -- Impact areas (concatenated)
    GROUP_CONCAT(DISTINCT CONCAT(sia.clarisa_impacts_areas_impact_area_id, ':', cia.name) SEPARATOR '|') as impact_areas,
    
    -- Countries (concatenated)
    GROUP_CONCAT(DISTINCT CONCAT(sc.country_id, ':', cc.country_name) SEPARATOR '|') as countries,
    
    -- Regions (concatenated)
    GROUP_CONCAT(DISTINCT CONCAT(sr.region_id, ':', cr.region_name) SEPARATOR '|') as regions,
    
    -- Contributing initiatives (concatenated)
    GROUP_CONCAT(DISTINCT CONCAT(sc_init.clarisa_initiatives_initiative_id, ':', ci.name) SEPARATOR '|') as initiatives,
    
    -- Contributing centers (concatenated)
    GROUP_CONCAT(DISTINCT CONCAT(sc_center.clarisa_centers_center_id, ':', cc_center.acronym, ':', cc_center.name) SEPARATOR '|') as centers,
    
    -- Keywords (concatenated)
    GROUP_CONCAT(DISTINCT CONCAT(sk.keyword_id, ':', k.keyword) SEPARATOR '|') as keywords,
    
    -- Crop types (concatenated)
    GROUP_CONCAT(DISTINCT CONCAT(sct.crop_type_id, ':', ct.name) SEPARATOR '|') as crop_types,
    
    -- Indicators (concatenated)
    GROUP_CONCAT(DISTINCT CONCAT(si.indicator_measure, ':', si.unit_measure, ':', si.result_reported) SEPARATOR '|') as indicators,
    s.created_at,
    s.last_updated_date,
    s.created_by

FROM studies s
-- All the same LEFT JOINs as above...
LEFT JOIN categories c ON s.category_id = c.study_category_id AND c.is_active = 1
LEFT JOIN studies_intervention_types sit ON s.study_id = sit.study_id
LEFT JOIN intervention_types it ON sit.intervention_type_id = it.intervention_type_id AND it.is_active = 1
LEFT JOIN studies_impact_areas sia ON s.study_id = sia.studies_study_id
LEFT JOIN clarisa_impacts_areas cia ON sia.clarisa_impacts_areas_impact_area_id = cia.impact_area_id AND cia.is_active = 1
LEFT JOIN studies_countries sc ON s.study_id = sc.study_id
LEFT JOIN clarisa_countries cc ON sc.country_id = cc.country_id AND cc.is_active = 1
LEFT JOIN studies_regions sr ON s.study_id = sr.study_id
LEFT JOIN clarisa_cgiar_regions cr ON sr.region_id = cr.region_id AND cr.is_active = 1
LEFT JOIN studies_contributors sc_init ON s.study_id = sc_init.study_id AND sc_init.clarisa_initiatives_initiative_id IS NOT NULL
LEFT JOIN clarisa_initiatives ci ON sc_init.clarisa_initiatives_initiative_id = ci.initiative_id AND ci.is_active = 1
LEFT JOIN studies_contributors sc_center ON s.study_id = sc_center.study_id AND sc_center.clarisa_centers_center_id IS NOT NULL
LEFT JOIN clarisa_centers cc_center ON sc_center.clarisa_centers_center_id = cc_center.center_id AND cc_center.is_active = 1
LEFT JOIN studies_keywords sk ON s.study_id = sk.study_id
LEFT JOIN keywords k ON sk.keyword_id = k.keyword_id AND k.is_active = 1
LEFT JOIN studies_crop_types sct ON s.study_id = sct.study_id AND sct.is_active = 1
LEFT JOIN crop_types ct ON sct.crop_type_id = ct.crop_type_id
LEFT JOIN studies_indicators si ON s.study_id = si.study_id AND si.is_active = 1
WHERE s.is_active = 1
GROUP BY 
    s.study_id, s.title, s.summary, s.year, s.doi, s.period_start, s.period_end,
    s.intervention_details, s.is_active, s.created_at, s.last_updated_date, s.created_by,
    s.category_id, c.name, sit.intervention_type_id, it.name;
