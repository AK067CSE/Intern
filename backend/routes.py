from flask import Blueprint, request, jsonify, send_file
from db import db
from models import Student, ContestHistory, ProblemSolving
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import pandas as pd
import io
from sync_service import fetch_user_rating, fetch_contest_history, fetch_submissions

bp = Blueprint('students', __name__)

@bp.route('/students', methods=['POST'])
def create_student():
    data = request.json
    required_fields = ['name', 'email', 'cf_handle']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400
    student = Student(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone'),
        cf_handle=data['cf_handle'],
        current_rating=data.get('current_rating'),
        max_rating=data.get('max_rating'),
        last_updated=datetime.utcnow(),
        email_opt_out=bool(data.get('email_opt_out', False))
    )
    db.session.add(student)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Email or Codeforces handle already exists'}), 400
    return jsonify({'id': student.id}), 201

@bp.route('/students', methods=['GET'])
def list_students():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    students = Student.query.paginate(page=page, per_page=per_page, error_out=False)
    result = []
    for s in students.items:
        result.append({
            'id': s.id,
            'name': s.name,
            'email': s.email,
            'phone': s.phone,
            'cf_handle': s.cf_handle,
            'current_rating': s.current_rating,
            'max_rating': s.max_rating,
            'last_updated': s.last_updated,
            'email_opt_out': s.email_opt_out
        })
    return jsonify({
        'students': result,
        'total': students.total,
        'pages': students.pages,
        'current_page': students.page
    })

@bp.route('/students/<int:id>', methods=['GET'])
def get_student(id):
    student = Student.query.get_or_404(id)
    return jsonify({
        'id': student.id,
        'name': student.name,
        'email': student.email,
        'phone': student.phone,
        'cf_handle': student.cf_handle,
        'current_rating': student.current_rating,
        'max_rating': student.max_rating,
        'last_updated': student.last_updated,
        'email_opt_out': student.email_opt_out
    })

@bp.route('/students/<int:id>', methods=['PUT'])
def update_student(id):
    student = Student.query.get_or_404(id)
    data = request.json
    if 'cf_handle' in data:
        student.cf_handle = data['cf_handle']
    if 'name' in data:
        student.name = data['name']
    if 'email' in data:
        student.email = data['email']
    if 'phone' in data:
        student.phone = data['phone']
    if 'current_rating' in data:
        student.current_rating = data['current_rating']
    if 'max_rating' in data:
        student.max_rating = data['max_rating']
    if 'email_opt_out' in data:
        student.email_opt_out = bool(data['email_opt_out'])
    student.last_updated = datetime.utcnow()
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Email or Codeforces handle already exists'}), 400
    return jsonify({'message': 'Student updated'})

@bp.route('/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    student = Student.query.get_or_404(id)
    db.session.delete(student)
    db.session.commit()
    return jsonify({'message': 'Student deleted'})

@bp.route('/students/csv', methods=['GET'])
def export_students_csv():
    students = Student.query.all()
    data = [{
        'id': s.id,
        'name': s.name,
        'email': s.email,
        'phone': s.phone,
        'cf_handle': s.cf_handle,
        'current_rating': s.current_rating,
        'max_rating': s.max_rating,
        'last_updated': s.last_updated,
        'email_opt_out': s.email_opt_out
    } for s in students]
    df = pd.DataFrame(data)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='students.csv'
    )

@bp.route('/sync/<cf_handle>', methods=['POST'])
def sync_cf_handle(cf_handle):
    student = Student.query.filter_by(cf_handle=cf_handle).first()
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    rating = fetch_user_rating(cf_handle)
    if rating:
        student.current_rating = rating['current_rating']
        student.max_rating = rating['max_rating']
        student.last_updated = datetime.utcnow()
    contests = fetch_contest_history(cf_handle)
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
                date=c['date'],
                new_rating=c['new_rating']
            )
            db.session.add(ch)
    problems = fetch_submissions(cf_handle)
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
    db.session.commit()
    return jsonify({'message': 'Sync complete'})

@bp.route('/students/<int:id>/contest-history')
def get_contest_history(id):
    days = int(request.args.get('days', 30))
    student = Student.query.get_or_404(id)
    since = datetime.utcnow() - timedelta(days=days)
    contests = ContestHistory.query.filter(
        ContestHistory.student_id == id,
        ContestHistory.date >= since
    ).order_by(ContestHistory.date.desc()).all()
    return jsonify([
        {
            'contest_id': c.contest_id,
            'contest_name': c.contest_name,
            'rank': c.rank,
            'rating_change': c.rating_change,
            'solved_count': c.solved_count,
            'date': c.date,
            'new_rating': c.new_rating
        }
        for c in contests
    ])

@bp.route('/students/<int:id>/problem-stats')
def get_problem_stats(id):
    days = int(request.args.get('days', 7))
    student = Student.query.get_or_404(id)
    since = datetime.utcnow() - timedelta(days=days)
    problems = ProblemSolving.query.filter(
        ProblemSolving.student_id == id,
        ProblemSolving.date_solved >= since
    ).all()
    hardest = max(problems, key=lambda p: p.rating or 0, default=None)
    total = len(problems)
    avg_rating = sum(p.rating or 0 for p in problems) / total if total else 0
    problems_per_day = total / days if days else 0
    solved_by_rating = {}
    for p in problems:
        if p.rating:
            solved_by_rating[p.rating] = solved_by_rating.get(p.rating, 0) + 1
    submissions = {}
    for p in problems:
        date_str = p.date_solved.strftime('%Y-%m-%d')
        submissions[date_str] = submissions.get(date_str, 0) + 1
    return jsonify({
        'hardest_solved': hardest.problem_name if hardest else None,
        'hardest_solved_rating': hardest.rating if hardest else None,
        'total_solved': total,
        'average_rating': avg_rating,
        'problems_per_day': problems_per_day,
        'solved_by_rating': solved_by_rating,
        'submissions': [{'date': d, 'count': c} for d, c in submissions.items()]
    }) 