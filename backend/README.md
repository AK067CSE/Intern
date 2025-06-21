# Codeforces Tracker Backend

## 🚀 Quick Start Commands

### 1. Start MongoDB
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Test MongoDB Connection
```bash
python test_mongodb.py
```

### 4. Start Flask App
```bash
python app.py
```

## 🐳 Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

## 📊 Access Points

- **API**: http://localhost:5000
- **MongoDB Web UI**: http://localhost:8081 (admin/password)

## 🔄 Migration (if needed)
```bash
python migrate_to_mongodb.py
```

## 🗄️ Database Structure

### Collections

#### `students`
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

#### `contest_history`
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

#### `problem_solving`
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

## 🔌 API Endpoints

### Students
- `GET /api/students` - List all students (with pagination)
- `POST /api/students` - Create new student
- `GET /api/students/<id>` - Get student details
- `PUT /api/students/<id>` - Update student
- `DELETE /api/students/<id>` - Delete student
- `GET /api/students/csv` - Export students to CSV

### Contest History
- `GET /api/students/<id>/contest-history?days=30` - Get contest history

### Problem Statistics
- `GET /api/students/<id>/problem-stats?days=7` - Get problem solving stats

### Sync
- `POST /api/sync/<cf_handle>` - Sync Codeforces data for student

## 🛠️ Development

### Project Structure
```
backend/
├── app.py                 # Main Flask application
├── routes.py              # API route definitions
├── models.py              # MongoDB document schemas
├── db.py                  # Database configuration
├── sync_service.py        # Codeforces API integration
├── email_service.py       # Email notification service
├── requirements.txt       # Python dependencies
├── docker-compose.yml     # Docker services configuration
├── test_mongodb.py        # MongoDB connection test
├── migrate_to_mongodb.py  # SQLite to MongoDB migration
└── README.md             # This file
```

### Environment Variables
The application uses these default configurations:
- `MONGO_URI`: mongodb://admin:password@localhost:27017/codeforces_tracker?authSource=admin
- `FLASK_ENV`: development
- `CORS_ORIGINS`: http://localhost:3000

### Adding New Features
1. Update `models.py` for new document schemas
2. Add routes in `routes.py`
3. Update `sync_service.py` for new Codeforces data
4. Test with `test_mongodb.py`

## 🧪 Testing

### Test MongoDB Connection
```bash
python test_mongodb.py
```

### Test API Endpoints
```bash
# Test student creation
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@example.com","cf_handle":"test_handle"}'

# Test student listing
curl http://localhost:5000/api/students
```

## 🔧 Troubleshooting

### Docker Issues
```bash
# Check if Docker is running
docker version

# Check container status
docker ps -a

# View container logs
docker logs codeforces_mongodb
docker logs codeforces_mongo_express
```

### MongoDB Connection Issues
```bash
# Test connection manually
python test_mongodb.py

# Check if MongoDB is accessible
telnet localhost 27017
```

### Common Problems

1. **Port 27017 already in use**
   ```bash
   # Find process using port
   netstat -ano | findstr :27017
   # Kill process or change port in docker-compose.yml
   ```

2. **Permission denied**
   ```bash
   # Run Docker commands with sudo (Linux/Mac)
   sudo docker-compose up -d
   ```

3. **MongoDB authentication failed**
   - Verify credentials in `app.py`
   - Check if MongoDB container is fully started

## 📈 Performance

### MongoDB Optimizations
- Indexes on frequently queried fields
- Aggregation pipelines for complex queries
- Connection pooling for high concurrency

### Monitoring
- Use Mongo Express for database monitoring
- Check container resource usage: `docker stats`
- Monitor API response times

## 🔒 Security

### Production Considerations
- Change default MongoDB credentials
- Use environment variables for sensitive data
- Enable MongoDB authentication
- Set up proper CORS configuration
- Use HTTPS in production

### Current Security Features
- MongoDB authentication enabled
- CORS configured for frontend
- Input validation on all endpoints
- SQL injection protection (MongoDB)

## 📝 License

This project is part of the Codeforces Tracker application.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review MongoDB logs
3. Test with `test_mongodb.py`
4. Check Docker container status 