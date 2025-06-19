from flask import Flask
from flask_cors import CORS
from db import db
import os
from apscheduler.schedulers.background import BackgroundScheduler
from sync_service import fetch_user_rating, fetch_contest_history, fetch_submissions
from datetime import datetime
from email_service import send_inactivity_email
from sqlalchemy import desc

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///students.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

from routes import bp as students_bp
app.register_blueprint(students_bp, url_prefix='/api')

with app.app_context():
    from models import Student, ContestHistory, ProblemSolving
    db.drop_all()
    db.create_all()

def sync_all_students():
    students = Student.query.all()
    for student in students:
        rating = fetch_user_rating(student.cf_handle)
        if rating:
            student.current_rating = rating['current_rating']
            student.max_rating = rating['max_rating']
            student.last_updated = datetime.utcnow()
        # Contest history
        contests = fetch_contest_history(student.cf_handle)
        if contests:
            ContestHistory.query.filter_by(student_id=student.id).delete()
            for c in contests:
                ch = ContestHistory(
                    student_id=student.id,
                    contest_id=c['contest_id'],
                    contest_name=c['contest_name'],
                    rank=c['rank'],
                    rating_change=c['rating_change'],
                    solved_count=c['solved_count'],
                    date=c['date']
                )
                db.session.add(ch)
        # Problem solving
        problems = fetch_submissions(student.cf_handle)
        if problems:
            ProblemSolving.query.filter_by(student_id=student.id).delete()
            for p in problems:
                ps = ProblemSolving(
                    student_id=student.id,
                    problem_id=p['problem_id'],
                    problem_name=p['problem_name'],
                    rating=p['rating'],
                    date_solved=p['date_solved']
                )
                db.session.add(ps)
        # Inactivity detection
        if not student.email_opt_out:
            last_ps = ProblemSolving.query.filter_by(student_id=student.id).order_by(desc(ProblemSolving.date_solved)).first()
            last_date = last_ps.date_solved if last_ps else None
            if not last_date or (datetime.utcnow() - last_date).days > 7:
                if send_inactivity_email(student.name, student.email):
                    student.reminder_count = (student.reminder_count or 0) + 1
    db.session.commit()

scheduler = BackgroundScheduler()
scheduler.add_job(sync_all_students, 'cron', hour=2, minute=0)
scheduler.start()

if __name__ == '__main__':
    app.run(debug=True) 