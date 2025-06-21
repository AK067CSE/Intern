#!/usr/bin/env python3
"""
Test script to verify MongoDB connection and basic operations
"""

from pymongo import MongoClient
from datetime import datetime

def test_mongodb_connection():
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://admin:password@localhost:27017/codeforces_tracker?authSource=admin')
        db = client['codeforces_tracker']
        
        print("✅ MongoDB connection successful!")
        
        # Test basic operations
        print("\n📊 Testing basic operations...")
        
        # Test insert
        test_student = {
            'name': 'Test Student',
            'email': 'test@example.com',
            'cf_handle': 'test_handle',
            'current_rating': 1500,
            'max_rating': 1600,
            'last_updated': datetime.utcnow(),
            'email_opt_out': False,
            'reminder_count': 0
        }
        
        result = db.students.insert_one(test_student)
        print(f"✅ Inserted test student with ID: {result.inserted_id}")
        
        # Test find
        student = db.students.find_one({'email': 'test@example.com'})
        if student:
            print(f"✅ Found student: {student['name']}")
        
        # Test update
        db.students.update_one(
            {'email': 'test@example.com'},
            {'$set': {'current_rating': 1550}}
        )
        print("✅ Updated student rating")
        
        # Test delete
        db.students.delete_one({'email': 'test@example.com'})
        print("✅ Deleted test student")
        
        # Check collections
        collections = db.list_collection_names()
        print(f"✅ Available collections: {collections}")
        
        client.close()
        print("\n🎉 All MongoDB tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB test failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Make sure MongoDB is running: docker-compose up -d")
        print("2. Check if MongoDB is accessible on localhost:27017")
        print("3. Verify credentials: admin/password")
        return False

if __name__ == "__main__":
    test_mongodb_connection() 