#!/usr/bin/env python3
"""
Test CRUD operations for Impact Compendium database.
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.connection import db_connection
from app.models.study import Study
from app.models.user import User, UserRole
from app.models.clarisa import StudyCategory

def test_crud_operations():
    """Test basic CRUD operations."""
    try:
        print("Testing CRUD operations...")
        
        # Get database session
        session_gen = db_connection.get_session()
        session = next(session_gen)
        
        # Test 1: Create a user
        print("\n1. Creating test user...")
        user = User(
            email="test@cgiar.org",
            name="Test User",
            role=UserRole.RESEARCHER,
            organization="CGIAR",
            is_active=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"Created user: {user.id} - {user.name}")
        
        # Test 2: Create a study category
        print("\n2. Creating study category...")
        category = StudyCategory(
            name="Impact Assessment",
            description="Studies focused on measuring impact"
        )
        session.add(category)
        session.commit()
        session.refresh(category)
        print(f"Created category: {category.id} - {category.name}")
        
        # Test 3: Create a study
        print("\n3. Creating test study...")
        study = Study(
            title="Test Impact Study",
            description="A test study for database validation",
            category_id=category.id,
            methodology="Mixed methods approach",
            created_by=user.id,
            is_published=False
        )
        session.add(study)
        session.commit()
        session.refresh(study)
        print(f"Created study: {study.id} - {study.title}")
        
        # Test 4: Read operations
        print("\n4. Testing read operations...")
        studies = session.query(Study).all()
        print(f"Found {len(studies)} studies")
        
        users = session.query(User).all()
        print(f"Found {len(users)} users")
        
        # Test 5: Update operation
        print("\n5. Testing update operation...")
        study.description = "Updated description for test study"
        session.commit()
        print(f"Updated study description")
        
        # Test 6: Relationship test
        print("\n6. Testing relationships...")
        study_with_creator = session.query(Study).filter(Study.id == study.id).first()
        if study_with_creator.creator:
            print(f"Study creator: {study_with_creator.creator.name}")
        else:
            print("No creator relationship found")
        
        print("\n✅ All CRUD operations completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during CRUD test: {e}")
        session.rollback()
        return False
        
    finally:
        session.close()

if __name__ == "__main__":
    success = test_crud_operations()
    sys.exit(0 if success else 1)
