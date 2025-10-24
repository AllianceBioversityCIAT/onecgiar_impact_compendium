#!/usr/bin/env python3
"""
Quick script to check countries table and fix the mapping issue
"""

import os
import sys
sys.path.append('/Users/jcadavid/Desktop/DEV/Desarrollos/onecgiar_impact_compendium/impact-compendium-app/Backend')

from dotenv import load_dotenv
import pymysql

# Load environment variables
load_dotenv('/Users/jcadavid/Desktop/DEV/Desarrollos/onecgiar_impact_compendium/impact-compendium-app/Backend/.env')

def check_countries_tables():
    """Check what countries tables exist and their data"""
    
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST'),
            port=int(os.getenv('DB_PORT', 3306)),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database='impact_compendium',
            charset='utf8mb4'
        )
        
        with connection.cursor() as cursor:
            print("🔍 Checking for countries tables...")
            
            # Check for different possible table names
            possible_tables = [
                'clarisa_countries',
                'clarissa_countries', 
                'countries',
                'clarisa_country',
                'clarissa_country'
            ]
            
            existing_tables = []
            for table in possible_tables:
                cursor.execute(f"SHOW TABLES LIKE '{table}'")
                if cursor.fetchone():
                    existing_tables.append(table)
                    
            print(f"✅ Found {len(existing_tables)} countries tables: {existing_tables}")
            
            # Check data in each existing table
            for table in existing_tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"📊 {table}: {count} records")
                
                if count > 0:
                    cursor.execute(f"SELECT * FROM {table} LIMIT 5")
                    columns = [desc[0] for desc in cursor.description]
                    rows = cursor.fetchall()
                    
                    print(f"   Columns: {columns}")
                    print("   Sample data:")
                    for row in rows:
                        print(f"     {row}")
                    print()
            
            # If no countries tables exist, create one with sample data
            if not existing_tables:
                print("❌ No countries tables found. Creating clarisa_countries with sample data...")
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS clarisa_countries (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        is_active TINYINT(1) DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Insert sample countries
                sample_countries = [
                    "Kenya", "Ethiopia", "Nigeria", "Ghana", "Tanzania",
                    "India", "Bangladesh", "Philippines", "Vietnam", "Indonesia",
                    "Mexico", "Brazil", "Peru", "Colombia", "Guatemala",
                    "Burkina Faso", "Mali", "Senegal", "Niger", "Chad"
                ]
                
                for country in sample_countries:
                    cursor.execute(
                        "INSERT INTO clarisa_countries (name) VALUES (%s)",
                        (country,)
                    )
                
                connection.commit()
                print(f"✅ Created clarisa_countries table with {len(sample_countries)} countries")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'connection' in locals():
            connection.close()
    
    return True

if __name__ == "__main__":
    check_countries_tables()
