"""
Models package initialization - imports all ERD-based models
"""

# Import all models to ensure they are registered with SQLAlchemy
from app.models.study import (
    Study, StudyCategory, StudyContributor, StudyKeyword, 
    StudyIndicator, StudyRegion, StudyCountry, StudyImpactArea, 
    StudyCropType, StudyInterventionType, StudyType, StudyStatus
)

from app.models.clarisa import (
    ClarisaCenter, ClarisaInitiative, ClarisaCGIARRegion, 
    ClarisaCountry, ClarisaImpactArea
)

from app.models.reference import (
    Keyword, InterventionType, CropType, Narrative
)

from app.models.indicator import Indicator

__all__ = [
    # Study models
    "Study", "StudyCategory", "StudyContributor", "StudyKeyword",
    "StudyIndicator", "StudyRegion", "StudyCountry", "StudyImpactArea",
    "StudyCropType", "StudyInterventionType", "StudyType", "StudyStatus",
    
    # CLARISA models
    "ClarisaCenter", "ClarisaInitiative", "ClarisaCGIARRegion",
    "ClarisaCountry", "ClarisaImpactArea",
    
    # Reference models
    "Keyword", "InterventionType", "CropType", "Narrative",
    
    # Legacy models
    "Indicator"
]
