# MongoDB Migration Setup Guide

This guide will help you migrate from SQLite to MongoDB for the Codeforces Tracker application.

## Prerequisites

1. **Install MongoDB**
   - Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Migration Steps

### 1. Start MongoDB
Make sure MongoDB is running on `localhost:27017`

### 2. Install New Dependencies
```bash
pip install flask-pymongo pymongo
```

### 3. Run Migration Script (if you have existing data)
```bash
python migrate_to_mongodb.py
```

### 4. Start the Application
```bash
python app.py
```

## Database Structure

The MongoDB database `codeforces_tracker` contains three collections:

### 1. `students`
```json
{
  "_id": ObjectId,
  "name": "string",
  "email": "string",
  "phone": "string",
  "cf_handle": "string",
  "current_rating": number,
  "max_rating": number,
  "last_updated": datetime,
  "email_opt_out": boolean,
  "reminder_count": number
}
```

### 2. `contest_history`
```json
{
  "_id": ObjectId,
  "student_id": ObjectId,
  "contest_id": "string",
  "contest_name": "string",
  "rank": number,
  "rating_change": number,
  "solved_count": number,
  "date": datetime,
  "new_rating": number
}
```

### 3. `problem_solving`
```json
{
  "_id": ObjectId,
  "student_id": ObjectId,
  "problem_id": "string",
  "problem_name": "string",
  "rating": number,
  "date_solved": datetime
}
```

## Key Changes Made

1. **Database Layer**: Replaced SQLAlchemy with PyMongo
2. **Models**: Converted SQLAlchemy models to MongoDB document schemas
3. **Queries**: Updated all database queries to use MongoDB operations
4. **ID Handling**: Changed from integer IDs to MongoDB ObjectIds
5. **Relationships**: Replaced SQL foreign keys with ObjectId references

## Benefits of MongoDB

1. **Flexible Schema**: Easy to add new fields without migrations
2. **Better Performance**: Optimized for read-heavy operations
3. **JSON Native**: Natural fit for API responses
4. **Scalability**: Better horizontal scaling capabilities
5. **Aggregation Pipeline**: Powerful analytics capabilities

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `app.py`
- Verify MongoDB is accessible on port 27017

### Migration Issues
- Backup your SQLite database before migration
- Check MongoDB logs for errors
- Ensure all required fields are present in existing data

### Application Issues
- Check that all dependencies are installed
- Verify MongoDB collections exist
- Review application logs for specific error messages

## API Compatibility

The frontend API endpoints remain unchanged:
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/<id>` - Get student details
- `PUT /api/students/<id>` - Update student
- `DELETE /api/students/<id>` - Delete student
- `GET /api/students/<id>/contest-history` - Get contest history
- `GET /api/students/<id>/problem-stats` - Get problem statistics
- `POST /api/sync/<cf_handle>` - Sync Codeforces data

All responses maintain the same JSON structure for seamless frontend integration. 