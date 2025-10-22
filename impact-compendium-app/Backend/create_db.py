#!/usr/bin/env python3
"""
Script to create the impact_compendium database and basic tables
"""

import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_database():
    """Create the impact_compendium database and basic tables"""
    
    # Connection parameters
    host = os.getenv("DB_HOST")
    port = int(os.getenv("DB_PORT", 3306))
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    
    print(f"Connecting to {host}:{port} as {user}")
    
    try:
        # Connect to MySQL server (without specifying database)
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            # Create database
            cursor.execute("CREATE DATABASE IF NOT EXISTS impact_compendium")
            print("✅ Database 'impact_compendium' created successfully")
            
            # Use the database
            cursor.execute("USE impact_compendium")
            
            # Create basic tables
            tables = [
                """
                CREATE TABLE IF NOT EXISTS studies_categories (
                    study_category_id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS studies (
                    study_id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(500) NOT NULL,
                    year INT,
                    summary TEXT,
                    period_start DATE,
                    period_end DATE,
                    intervention_details TEXT,
                    doi VARCHAR(255),
                    pdf_filename VARCHAR(255),
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    category_id INT,
                    FOREIGN KEY (category_id) REFERENCES studies_categories(study_category_id)
                )
                """
            ]
            
            for table_sql in tables:
                cursor.execute(table_sql)
                print(f"✅ Table created successfully")
            
            # Insert sample categories
            categories = [
                "Impact Study",
                "Outcome Study", 
                "Impact Outcome Story",
                "Water Management",
                "Agriculture",
                "Nutrition"
            ]
            
            for category in categories:
                cursor.execute(
                    "INSERT IGNORE INTO studies_categories (name) VALUES (%s)",
                    (category,)
                )
            
            # Insert sample studies
            sample_studies = [
                ("Climate-Smart Agriculture in Sub-Saharan Africa", 2024, "Impact assessment of climate-smart agricultural practices on smallholder farmers", 1),
                ("Water Management Systems in Rice Production", 2024, "Evaluation of water-efficient irrigation systems in Asian rice fields", 4),
                ("Nutrition Security Through Crop Diversification", 2024, "Analysis of nutritional outcomes from diversified cropping systems", 6)
            ]
            
            for title, year, summary, category_id in sample_studies:
                cursor.execute(
                    "INSERT IGNORE INTO studies (title, year, summary, category_id) VALUES (%s, %s, %s, %s)",
                    (title, year, summary, category_id)
                )
            
            connection.commit()
            print("✅ Sample data inserted successfully")
            
            # Verify data
            cursor.execute("SELECT COUNT(*) FROM studies")
            study_count = cursor.fetchone()[0]
            print(f"✅ Database setup complete. {study_count} studies in database.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'connection' in locals():
            connection.close()
    
    return True

if __name__ == "__main__":
    success = create_database()
    if success:
        print("\n🎉 Database setup completed successfully!")
    else:
        print("\n💥 Database setup failed!")
