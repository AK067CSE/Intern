from flask import Flask
from flask_cors import CORS
from db import mongo
import os
from apscheduler.schedulers.background import BackgroundScheduler
from sync_service import fetch_user_rating, fetch_contest_history, fetch_submissions
from datetime import datetime
from email_service import send_inactivity_email
from bson import ObjectId

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# MongoDB connection string - works with both local and Docker MongoDB
app.config['MONGO_URI'] = 'mongodb://admin:password@localhost:27017/codeforces_tracker?authSource=admin'
mongo.init_app(app)

from routes import bp as students_bp
app.register_blueprint(students_bp, url_prefix='/api')

def sync_all_students():
    students = mongo.db.students.find()
    for student in students:
        rating = fetch_user_rating(student['cf_handle'])
        if rating:
            mongo.db.students.update_one(
                {'_id': student['_id']},
                {
                    '$set': {
                        'current_rating': rating['current_rating'],
                        'max_rating': rating['max_rating'],
                        'last_updated': datetime.utcnow()
                    }
                }
            )
        
        # Contest history
        contests = fetch_contest_history(student['cf_handle'])
        if contests:
            # Delete existing contest history
            mongo.db.contest_history.delete_many({'student_id': student['_id']})
            # Insert new contest history
            contest_docs = []
            for c in contests:
                contest_doc = {
                    'student_id': student['_id'],
                    'contest_id': c['contest_id'],
                    'contest_name': c['contest_name'],
                    'rank': c['rank'],
                    'rating_change': c['rating_change'],
                    'solved_count': c['solved_count'],
                    'date': c['date'],
                    'new_rating': c.get('new_rating')
                }
                contest_docs.append(contest_doc)
            if contest_docs:
                mongo.db.contest_history.insert_many(contest_docs)
        
        # Problem solving
        problems = fetch_submissions(student['cf_handle'])
        if problems:
            # Delete existing problem solving data
            mongo.db.problem_solving.delete_many({'student_id': student['_id']})
            # Insert new problem solving data
            problem_docs = []
            for p in problems:
                problem_doc = {
                    'student_id': student['_id'],
                    'problem_id': p['problem_id'],
                    'problem_name': p['problem_name'],
                    'rating': p['rating'],
                    'date_solved': p['date_solved']
                }
                problem_docs.append(problem_doc)
            if problem_docs:
                mongo.db.problem_solving.insert_many(problem_docs)
        
        # Inactivity detection
        if not student.get('email_opt_out', False):
            last_ps = mongo.db.problem_solving.find_one(
                {'student_id': student['_id']},
                sort=[('date_solved', -1)]
            )
            last_date = last_ps['date_solved'] if last_ps else None
            if not last_date or (datetime.utcnow() - last_date).days > 7:
                if send_inactivity_email(student['name'], student['email']):
                    mongo.db.students.update_one(
                        {'_id': student['_id']},
                        {'$inc': {'reminder_count': 1}}
                    )

scheduler = BackgroundScheduler()
scheduler.add_job(sync_all_students, 'cron', hour=2, minute=0)
scheduler.start()

if __name__ == '__main__':
    app.run(debug=True) 