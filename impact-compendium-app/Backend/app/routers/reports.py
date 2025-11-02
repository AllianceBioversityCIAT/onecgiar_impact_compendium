"""
Reports router with simplified responses
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
import io
from io import BytesIO
from datetime import datetime
import uuid
import os

from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory job storage (use Redis/DynamoDB in production)
export_jobs = {}

@router.post("/export/test")
async def test_immediate_response():
    """Test endpoint that returns immediately"""
    return {"status": "ok", "message": "Immediate response test", "timestamp": datetime.now().isoformat()}

@router.post("/export/start")
async def start_async_export(
    background_tasks: BackgroundTasks,
    format: str = Query("excel", description="Export format: excel"),
    limit: int = Query(1000, ge=1, le=5000, description="Number of records to export")
):
    """Start async export job - returns immediately"""
    job_id = str(uuid.uuid4())
    export_jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "created_at": datetime.now().isoformat(),
        "format": format,
        "limit": limit
    }
    
    # Start background task without waiting
    background_tasks.add_task(process_full_export, job_id, format, limit)
    
    # Return immediately
    return {"job_id": job_id, "status": "started", "message": "Export job started"}

@router.get("/export/status/{job_id}")
async def get_export_status(job_id: str):
    """Get export job status"""
    if job_id not in export_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return export_jobs[job_id]

@router.get("/export/download/{job_id}")
async def download_export(job_id: str):
    """Download completed export file"""
    if job_id not in export_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = export_jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Export not ready")
    
    file_path = job.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Export file not found")
    
    # Verify file is a valid Excel file
    try:
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise HTTPException(status_code=500, detail="Export file is empty")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File validation failed: {str(e)}")
    
    # Read file content as binary
    with open(file_path, "rb") as f:
        file_content = f.read()
    
    # Clean up file immediately after reading
    try:
        os.remove(file_path)
        del export_jobs[job_id]
    except:
        pass
    
    from fastapi.responses import Response
    return Response(
        content=file_content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={job['filename']}"
        }
    )

def process_full_export(job_id: str, format: str, limit: int):
    """Background task to process full export with all related data"""
    try:
        logger.info(f"Starting background export job {job_id}")
        export_jobs[job_id]["progress"] = 5
        
        # Get fresh database session for background task
        from app.db.connection import get_db_session
        
        try:
            db = next(get_db_session())
            logger.info(f"Database connection established for job {job_id}")
        except Exception as db_error:
            logger.error(f"Database connection failed for job {job_id}: {db_error}")
            export_jobs[job_id] = {
                **export_jobs[job_id],
                "status": "failed",
                "error": f"Database connection failed: {str(db_error)}"
            }
            return
        
        export_jobs[job_id]["progress"] = 10
        
        # Use simplified query first, then comprehensive if time allows
        try:
            # Try comprehensive query with timeout
            db.execute(text("SET SESSION wait_timeout = 300"))
            db.execute(text("SET SESSION interactive_timeout = 300"))
            
            # Use optimized query - get basic study data only
            query = text("""
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
                c.name as category_name,
                s.created_at,
                s.last_updated_date,
                s.created_by
            FROM studies s
            LEFT JOIN categories c ON s.category_id = c.study_category_id AND c.is_active = 1
            WHERE s.is_active = 1
            ORDER BY s.study_id DESC
            LIMIT :limit
            """)
            
            export_jobs[job_id]["progress"] = 60
            
            result = db.execute(query, {"limit": limit})
            studies = result.fetchall()
        except Exception as query_error:
            logger.error(f"Query failed for job {job_id}: {query_error}")
            export_jobs[job_id] = {
                **export_jobs[job_id],
                "status": "failed",
                "error": f"Query execution failed: {str(query_error)}"
            }
            return
        
        if not studies:
            export_jobs[job_id] = {
                **export_jobs[job_id],
                "status": "failed",
                "error": "No studies found for export"
            }
            return
        
        export_jobs[job_id]["progress"] = 70
        
        # Convert to DataFrame with optimized structure
        df = pd.DataFrame([
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
                "Created By": row[13]
            }
            for row in studies
        ])
        
        export_jobs[job_id]["progress"] = 80
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"impact_compendium_full_report_{timestamp}.xlsx"
        
        # Create temp file
        temp_dir = "/tmp"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, filename)
        
        # Create Excel file
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Studies', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['Studies']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        # Ensure file is written and verify it exists
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            raise Exception("Failed to create Excel file")
        
        export_jobs[job_id] = {
            **export_jobs[job_id],
            "status": "completed",
            "progress": 100,
            "file_path": file_path,
            "filename": filename,
            "record_count": len(studies),
            "completed_at": datetime.now().isoformat()
        }
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error in background export job {job_id}: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {str(e)}")
        export_jobs[job_id] = {
            **export_jobs[job_id],
            "status": "failed",
            "error": f"{type(e).__name__}: {str(e)}"
        }

@router.get("/summary", response_model=Dict[str, Any])
async def get_reports_summary(db: Session = Depends(get_db)):
    """
    Get reports summary with key metrics
    """
    try:
        # Studies by year
        year_query = text("""
            SELECT year, COUNT(*) as count
            FROM studies 
            WHERE is_active = 1 AND year IS NOT NULL
            GROUP BY year 
            ORDER BY year DESC
            LIMIT 10
        """)
        year_result = db.execute(year_query)
        studies_by_year = [{"year": row[0], "count": row[1]} for row in year_result.fetchall()]
        
        # Studies by category
        category_query = text("""
            SELECT sc.name, COUNT(s.study_id) as count
            FROM studies s
            LEFT JOIN categories sc ON s.category_id = sc.study_category_id
            WHERE s.is_active = 1
            GROUP BY sc.name
            ORDER BY count DESC
            LIMIT 10
        """)
        category_result = db.execute(category_query)
        studies_by_category = [{"category": row[0] or "Uncategorized", "count": row[1]} for row in category_result.fetchall()]
        
        return {
            "success": True,
            "data": {
                "studies_by_year": studies_by_year,
                "studies_by_category": studies_by_category
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting reports summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reports summary: {str(e)}"
        )

@router.get("/export")
async def export_studies_excel(
    format: str = Query("excel", description="Export format: excel"),
    limit: int = Query(1000, ge=1, le=5000, description="Number of records to export"),
    db: Session = Depends(get_db)
):
    """
    Export comprehensive studies data to Excel format
    """
    try:
        logger.info(f"Starting export of {limit} studies in {format} format")
        
        # Simple fast query without JOINs
        query = text("""
            SELECT 
                study_id,
                title,
                summary,
                year,
                doi,
                period_start,
                period_end,
                intervention_details,
                is_active,
                category_id,
                created_at,
                last_updated_date
            FROM studies 
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {"limit": limit})
        studies = result.fetchall()
        
        if not studies:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No studies found for export"
            )
        
        # Convert to DataFrame for Excel export
        df = pd.DataFrame([dict(row._mapping) for row in studies])
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Studies', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['Studies']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"impact_compendium_studies_{timestamp}.xlsx"
        
        logger.info(f"Successfully exported {len(studies)} studies to Excel")
        
        return StreamingResponse(
            BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting studies to Excel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export studies: {str(e)}"
        )
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Studies Report', index=False)
            
            # Get the workbook and worksheet for formatting
            workbook = writer.book
            worksheet = writer.sheets['Studies Report']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)  # Cap at 50 characters
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"impact_compendium_studies_{timestamp}.xlsx"
        
        logger.info(f"Successfully generated Excel export with {len(studies)} studies")
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting studies to Excel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export studies: {str(e)}"
        )
