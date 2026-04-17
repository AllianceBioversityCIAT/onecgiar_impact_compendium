"""
Reports router with simplified responses
"""

import logging
from datetime import datetime
from io import BytesIO
from typing import Any, Dict

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.connection import get_db

logger = logging.getLogger(__name__)
router = APIRouter()
XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _auto_width(worksheet) -> None:
    for column in worksheet.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                max_length = max(max_length, len(str(cell.value)))
            except Exception:
                continue
        worksheet.column_dimensions[column_letter].width = min(max_length + 2, 50)


@router.get("/summary", response_model=Dict[str, Any])
async def get_reports_summary(db: Session = Depends(get_db)):
    """
    Get reports summary with key metrics
    """
    try:
        # Studies by year
        year_query = text(
            """
            SELECT year, COUNT(*) as count
            FROM studies
            WHERE is_active = 1 AND year IS NOT NULL
            GROUP BY year
            ORDER BY year DESC
            LIMIT 10
        """
        )
        year_result = db.execute(year_query)
        studies_by_year = [
            {"year": row[0], "count": row[1]} for row in year_result.fetchall()
        ]

        # Studies by category
        category_query = text(
            """
            SELECT sc.name, COUNT(s.study_id) as count
            FROM studies s
            LEFT JOIN categories sc ON s.category_id = sc.study_category_id
            WHERE s.is_active = 1
            GROUP BY sc.name
            ORDER BY count DESC
            LIMIT 10
        """
        )
        category_result = db.execute(category_query)
        studies_by_category = [
            {"category": row[0] or "Uncategorized", "count": row[1]}
            for row in category_result.fetchall()
        ]

        return {
            "success": True,
            "data": {
                "studies_by_year": studies_by_year,
                "studies_by_category": studies_by_category,
            },
        }

    except Exception as e:
        logger.error(f"Error getting reports summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reports summary: {str(e)}",
        )


@router.get("/export")
async def export_studies_excel(
    format: str = Query("excel", regex="^excel$", description="Export format: excel"),
    limit: int = Query(1000, ge=1, le=5000, description="Number of records to export"),
    db: Session = Depends(get_db),
):
    """
    Export comprehensive studies data to Excel format
    """
    try:
        logger.info(f"Starting export of {limit} studies in {format} format")

        query = text(
            """
            SELECT
                s.study_id,
                s.title,
                s.summary,
                s.year,
                s.doi,
                s.period_start,
                s.period_end,
                s.intervention_details,
                s.is_active,
                s.category_id,
                c.name AS category_name,
                s.created_at,
                s.last_updated_date,
                s.created_by
            FROM studies s
            LEFT JOIN categories c
                   ON s.category_id = c.study_category_id
                  AND c.is_active = 1
            WHERE s.is_active = 1
            ORDER BY s.study_id DESC
            LIMIT :limit
        """
        )

        result = db.execute(query, {"limit": limit})
        studies = result.fetchall()

        if not studies:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "No studies found for export"},
            )

        df = pd.DataFrame(
            [
                {
                    "Study ID": row[0],
                    "Title": row[1],
                    "Summary": row[2],
                    "Year": row[3],
                    "DOI": row[4],
                    "Period Start": row[5],
                    "Period End": row[6],
                    "Intervention Details": row[7],
                    "Active": "Yes" if row[8] else "No",
                    "Category ID": row[9],
                    "Category": row[10],
                    "Created At": row[11],
                    "Last Updated": row[12],
                    "Created By": row[13],
                }
                for row in studies
            ]
        )

        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Studies", index=False)
            _auto_width(writer.sheets["Studies"])

        output.seek(0)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"impact_compendium_full_report_{timestamp}.xlsx"

        logger.info(f"Successfully exported {len(studies)} studies to Excel")

        return StreamingResponse(
            output,
            media_type=XLSX_MIME_TYPE,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting studies to Excel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export studies: {str(e)}",
        )
