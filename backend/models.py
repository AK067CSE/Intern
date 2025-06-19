from db import db
from datetime import datetime

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    cf_handle = db.Column(db.String(50), unique=True, nullable=False)
    current_rating = db.Column(db.Integer, nullable=True)
    max_rating = db.Column(db.Integer, nullable=True)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    email_opt_out = db.Column(db.Boolean, default=False)
    reminder_count = db.Column(db.Integer, default=0)
    contest_histories = db.relationship('ContestHistory', backref='student', lazy=True)
    problem_solving = db.relationship('ProblemSolving', backref='student', lazy=True)

class ContestHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    contest_id = db.Column(db.String(50), nullable=False)
    contest_name = db.Column(db.String(100), nullable=False)
    rank = db.Column(db.Integer, nullable=True)
    rating_change = db.Column(db.Integer, nullable=True)
    solved_count = db.Column(db.Integer, nullable=True)
    date = db.Column(db.DateTime, nullable=False)
    new_rating = db.Column(db.Integer, nullable=True)

class ProblemSolving(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    problem_id = db.Column(db.String(50), nullable=False)
    problem_name = db.Column(db.String(200), nullable=False)
    rating = db.Column(db.Integer, nullable=True)
    date_solved = db.Column(db.DateTime, nullable=False) 