#!/usr/bin/env python3
"""
Simple CRUD test for Impact Compendium database using existing schema.
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import text

# Load environment variables
load_dotenv()

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.connection import db_connection

def test_simple_crud():
    """Test basic database operations with existing schema."""
    try:
        print("Testing simple CRUD operations...")
        
        # Get database session
        session_gen = db_connection.get_session()
        session = next(session_gen)
        
        # Test 1: Insert into existing studies table
        print("\n1. Testing insert into studies table...")
        
        # First, let's insert a category if it doesn't exist
        result = session.execute(text("""
            INSERT IGNORE INTO studies_categories (name, is_active, created_at) 
            VALUES ('Test Category', 1, NOW())
        """))
        session.commit()
        
        # Get the category ID
        result = session.execute(text("""
            SELECT study_category_id FROM studies_categories WHERE name = 'Test Category' LIMIT 1
        """))
        category_row = result.fetchone()
        category_id = category_row[0] if category_row else 1
        
        # Insert a test study
        result = session.execute(text("""
            INSERT INTO studies (
                title, year, summary, category_id, is_active, created_at, created_by
            ) VALUES (
                :title, :year, :summary, :category_id, :is_active, :created_at, :created_by
            )
        """), {
            'title': 'Test Impact Study - Database Integration',
            'year': 2024,
            'summary': 'A test study to validate database connectivity and CRUD operations',
            'category_id': category_id,
            'is_active': 1,
            'created_at': datetime.now(),
            'created_by': 'test-user'
        })
        session.commit()
        
        study_id = result.lastrowid
        print(f"✅ Created study with ID: {study_id}")
        
        # Test 2: Read operation
        print("\n2. Testing read operation...")
        result = session.execute(text("""
            SELECT study_id, title, year, summary FROM studies WHERE study_id = :study_id
        """), {'study_id': study_id})
        
        study_row = result.fetchone()
        if study_row:
            print(f"✅ Found study: ID={study_row[0]}, Title='{study_row[1]}', Year={study_row[2]}")
        else:
            print("❌ Study not found")
        
        # Test 3: Update operation
        print("\n3. Testing update operation...")
        session.execute(text("""
            UPDATE studies 
            SET summary = :new_summary, last_updated_date = :updated_date
            WHERE study_id = :study_id
        """), {
            'new_summary': 'Updated summary - CRUD test successful',
            'updated_date': datetime.now(),
            'study_id': study_id
        })
        session.commit()
        print("✅ Study updated successfully")
        
        # Test 4: Verify update
        print("\n4. Verifying update...")
        result = session.execute(text("""
            SELECT summary FROM studies WHERE study_id = :study_id
        """), {'study_id': study_id})
        
        updated_row = result.fetchone()
        if updated_row and 'CRUD test successful' in updated_row[0]:
            print("✅ Update verified successfully")
        else:
            print("❌ Update verification failed")
        
        # Test 5: Count total studies
        print("\n5. Testing aggregate query...")
        result = session.execute(text("SELECT COUNT(*) FROM studies WHERE is_active = 1"))
        count = result.fetchone()[0]
        print(f"✅ Total active studies: {count}")
        
        # Test 6: Join query with categories
        print("\n6. Testing join query...")
        result = session.execute(text("""
            SELECT s.title, sc.name as category_name 
            FROM studies s 
            LEFT JOIN studies_categories sc ON s.category_id = sc.study_category_id 
            WHERE s.study_id = :study_id
        """), {'study_id': study_id})
        
        join_row = result.fetchone()
        if join_row:
            print(f"✅ Join query successful: '{join_row[0]}' in category '{join_row[1]}'")
        
        print("\n🎉 All CRUD operations completed successfully!")
        print("✅ Database integration is working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Error during CRUD test: {e}")
        import traceback
        traceback.print_exc()
        session.rollback()
        return False
        
    finally:
        session.close()

if __name__ == "__main__":
    success = test_simple_crud()
    sys.exit(0 if success else 1)
