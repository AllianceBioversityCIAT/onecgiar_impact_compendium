"""
Models package initialization - imports all ERD-based models
"""

# Import Base first
from app.db.connection import Base

# Import models individually to avoid circular imports
try:
    from app.models.clarisa_centers import Center
    from app.models.clarisa_cgiar_regions import Region
    from app.models.clarisa_countries import Country
    from app.models.clarisa_impacts_areas import ImpactArea
    from app.models.clarisa_initiatives import Initiative
    from app.models.crop_types import CropType
    from app.models.intervention_types import InterventionType
    from app.models.narratives import Narrative
    from app.models.studies import Study
    from app.models.studies_indicators import StudyIndicator
    from app.models.studies_keywords import StudyKeyword
    from app.models.study_categories import StudyCategory
except ImportError:
    # Fallback for missing models
    pass

__all__ = ["Base"]
