from sqlalchemy import Column, ForeignKey, Integer, Table

from app.db.connection import Base

# Separate association tables for initiatives and centers
studies_initiatives = Table(
    "studies_initiatives",
    Base.metadata,
    Column("study_id", Integer, ForeignKey("studies.id"), primary_key=True),
    Column(
        "initiative_id", Integer, ForeignKey("clarisa_initiatives.id"), primary_key=True
    ),
)

studies_centers = Table(
    "studies_centers",
    Base.metadata,
    Column("study_id", Integer, ForeignKey("studies.id"), primary_key=True),
    Column("center_id", Integer, ForeignKey("clarisa_centers.id"), primary_key=True),
)
