#!/usr/bin/env python3
"""
Migration script to transfer data from SQLite to MongoDB
Run this script after setting up MongoDB to migrate existing data
"""

import sqlite3
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient

def migrate_data():
    # Connect to SQLite database
    sqlite_conn = sqlite3.connect('students.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to MongoDB
    mongo_client = MongoClient('mongodb://localhost:27017/')
    db = mongo_client['codeforces_tracker']
    
    print("Starting migration from SQLite to MongoDB...")
    
    # Migrate students
    print("Migrating students...")
    sqlite_cursor.execute("SELECT * FROM student")
    students = sqlite_cursor.fetchall()
    
    for student in students:
        student_doc = {
            'name': student[1],
            'email': student[2],
            'phone': student[3],
            'cf_handle': student[4],
            'current_rating': student[5],
            'max_rating': student[6],
            'last_updated': datetime.fromisoformat(student[7]) if student[7] else datetime.utcnow(),
            'email_opt_out': bool(student[8]),
            'reminder_count': student[9] or 0
        }
        
        # Check if student already exists
        existing = db.students.find_one({'email': student_doc['email']})
        if not existing:
            result = db.students.insert_one(student_doc)
            print(f"Migrated student: {student_doc['name']} (ID: {result.inserted_id})")
        else:
            print(f"Student already exists: {student_doc['name']}")
    
    # Migrate contest history
    print("Migrating contest history...")
    sqlite_cursor.execute("SELECT * FROM contest_history")
    contests = sqlite_cursor.fetchall()
    
    for contest in contests:
        # Find the corresponding student in MongoDB
        student = db.students.find_one({'id': contest[1]})
        if not student:
            print(f"Student not found for contest history ID {contest[0]}, skipping...")
            continue
        
        contest_doc = {
            'student_id': student['_id'],
            'contest_id': contest[2],
            'contest_name': contest[3],
            'rank': contest[4],
            'rating_change': contest[5],
            'solved_count': contest[6],
            'date': datetime.fromisoformat(contest[7]) if contest[7] else datetime.utcnow(),
            'new_rating': contest[8]
        }
        
        # Check if contest already exists
        existing = db.contest_history.find_one({
            'student_id': contest_doc['student_id'],
            'contest_id': contest_doc['contest_id']
        })
        if not existing:
            db.contest_history.insert_one(contest_doc)
            print(f"Migrated contest: {contest_doc['contest_name']}")
        else:
            print(f"Contest already exists: {contest_doc['contest_name']}")
    
    # Migrate problem solving
    print("Migrating problem solving data...")
    sqlite_cursor.execute("SELECT * FROM problem_solving")
    problems = sqlite_cursor.fetchall()
    
    for problem in problems:
        # Find the corresponding student in MongoDB
        student = db.students.find_one({'id': problem[1]})
        if not student:
            print(f"Student not found for problem solving ID {problem[0]}, skipping...")
            continue
        
        problem_doc = {
            'student_id': student['_id'],
            'problem_id': problem[2],
            'problem_name': problem[3],
            'rating': problem[4],
            'date_solved': datetime.fromisoformat(problem[5]) if problem[5] else datetime.utcnow()
        }
        
        # Check if problem already exists
        existing = db.problem_solving.find_one({
            'student_id': problem_doc['student_id'],
            'problem_id': problem_doc['problem_id']
        })
        if not existing:
            db.problem_solving.insert_one(problem_doc)
            print(f"Migrated problem: {problem_doc['problem_name']}")
        else:
            print(f"Problem already exists: {problem_doc['problem_name']}")
    
    # Close connections
    sqlite_conn.close()
    mongo_client.close()
    
    print("Migration completed successfully!")
    print(f"Migrated {len(students)} students")
    print(f"Migrated {len(contests)} contest records")
    print(f"Migrated {len(problems)} problem records")

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        print(f"Migration failed: {e}")
        print("Make sure MongoDB is running and accessible at mongodb://localhost:27017/") 