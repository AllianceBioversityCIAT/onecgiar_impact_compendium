"""Studies service with detail and summary functionality."""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import os
import json
import time

# Simple in-memory cache for development
_cache = {}
_cache_ttl = {}

class StudiesService:
    def __init__(self, db: Session):
        self.db = db
        self.cache_enabled = bool(os.getenv("REDIS_URL")) or True  # Enable for local dev
        self.cache_ttl = 300  # 5 minutes

    def _get_cache_key(self, prefix: str, key: str) -> str:
        return f"{prefix}:{key}"

    def _get_from_cache(self, cache_key: str) -> Optional[Any]:
        if not self.cache_enabled:
            return None
        
        if cache_key in _cache:
            if time.time() < _cache_ttl.get(cache_key, 0):
                return _cache[cache_key]
            else:
                # Expired
                _cache.pop(cache_key, None)
                _cache_ttl.pop(cache_key, None)
        return None

    def _set_cache(self, cache_key: str, data: Any) -> None:
        if not self.cache_enabled:
            return
        
        _cache[cache_key] = data
        _cache_ttl[cache_key] = time.time() + self.cache_ttl

    def get_study_detail(self, study_id: str) -> Dict[str, Any]:
        """Get detailed study information with caching."""
        
        cache_key = self._get_cache_key("study_detail", study_id)
        cached_result = self._get_from_cache(cache_key)
        if cached_result:
            return cached_result

        # Extract numeric ID
        try:
            if study_id.startswith("ICD-"):
                numeric_id = int(study_id.replace("ICD-", ""))
            else:
                numeric_id = int(study_id)
        except ValueError:
            raise ValueError("Invalid study ID format")

        # Mock detailed study data
        result = {
            "study_id": numeric_id,
            "title": f"Detailed Study {numeric_id}",
            "summary": "Comprehensive study with full metadata and detailed information for slide-over display.",
            "year": 2024,
            "period": {"start": 2023, "end": 2024},
            "category": {"id": 1, "name": "Impact Study"},
            "doi": f"https://doi.org/10.1000/study{numeric_id}",
            "intervention_details": "Detailed intervention methodology and implementation approach for this comprehensive study.",
            "pdf_filename": f"study_{numeric_id}.pdf",
            "indicators": [
                {
                    "id": 1,
                    "indicator_name": "Primary Impact Measure",
                    "indicator_value": "142%",
                    "measure": "Primary Impact Measure",
                    "unit": "%",
                    "baseline": "100%",
                    "target": "130%",
                    "result_reported": "142%"
                },
                {
                    "id": 2,
                    "indicator_name": "Secondary Outcome",
                    "indicator_value": "67%",
                    "measure": "Secondary Outcome",
                    "unit": "%",
                    "baseline": "45%",
                    "target": "60%",
                    "result_reported": "67%"
                }
            ],
            "crops": [{"id": 1, "name": "Maize"}, {"id": 2, "name": "Rice"}],
            "impact_areas": [{"id": 1, "name": "Food Security"}, {"id": 2, "name": "Climate Adaptation"}],
            "initiatives": [{"id": 1, "name": "Accelerated Breeding"}, {"id": 2, "name": "Climate Resilience"}],
            "centers": [{"id": 1, "name": "CIMMYT"}, {"id": 2, "name": "IRRI"}],
            "regions": [{"id": 1, "name": "East Africa"}, {"id": 2, "name": "Southeast Asia"}],
            "countries": [{"id": 1, "name": "Kenya"}, {"id": 2, "name": "Philippines"}],
            "keywords": ["impact", "agriculture", "sustainability"],
            "narratives": [
                {"section_key": "background", "content": "This comprehensive study examines the long-term impacts of sustainable agricultural practices on smallholder farmer livelihoods and food security outcomes."},
                {"section_key": "methodology", "content": "We employed a mixed-methods approach combining quantitative surveys with qualitative interviews across multiple sites."},
                {"section_key": "results", "content": "Results demonstrate significant positive impacts on both productivity and sustainability metrics."}
            ],
            "created_at": "2024-01-15T10:30:00Z",
            "last_updated_date": "2024-06-20T14:45:00Z"
        }

        self._set_cache(cache_key, result)
        return result

    def get_studies_summary(self) -> Dict[str, Any]:
        """Get studies summary with caching."""
        
        cache_key = self._get_cache_key("studies", "summary")
        cached_result = self._get_from_cache(cache_key)
        if cached_result:
            return cached_result

        # Mock summary data
        result = {
            "total": 247,
            "by_category": [
                {"name": "Impact Study", "count": 98},
                {"name": "Research Analysis", "count": 76},
                {"name": "Outcome Assessment", "count": 45},
                {"name": "Policy Brief", "count": 28}
            ],
            "recent_years": [2024, 2023, 2022, 2021, 2020],
            "top_initiatives": [
                {"name": "Accelerated Breeding", "count": 67},
                {"name": "Climate Resilience", "count": 54},
                {"name": "Sustainable Intensification", "count": 43},
                {"name": "Nutrition Security", "count": 38}
            ]
        }

        self._set_cache(cache_key, result)
        return result

    def list_studies(self, **kwargs) -> Dict[str, Any]:
        """Existing list method with basic functionality."""
        page = kwargs.get('page', 1)
        pageSize = kwargs.get('pageSize', 25)
        
        items = [{
            "id": f"ICD-{i+1:03d}",
            "title": f"Study {i+1}",
            "summary": f"Summary for study {i+1}",
            "year": 2024 - (i % 3),
            "period": {"start": 2023, "end": 2024},
            "category": {"id": 1, "name": "Research"},
            "intervention": {"type": "Research Study", "detailsShort": "Sample intervention"},
            "contributors": {
                "initiatives": [{"id": 1, "name": "Sample Initiative"}],
                "centers": [{"id": 1, "acronym": "SAMPLE"}]
            },
            "impact_areas": [{"id": 1, "name": "General"}],
            "regions": [{"id": 1, "name": "Global"}],
            "countries": [{"id": 1, "name": "Multiple"}],
            "indicators_highlight": [
                {"indicator_measure": "Sample Metric", "unit": "%", "result_reported": f"{85+i}%"}
            ],
            "doi": None
        } for i in range(min(pageSize, 10))]
        
        return type('Result', (), {
            'items': items,
            'total': 50,
            'page': page,
            'pageSize': pageSize
        })()
