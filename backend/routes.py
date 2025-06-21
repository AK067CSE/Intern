from flask import Blueprint, request, jsonify, send_file
from db import mongo
from models import StudentSchema, ContestHistorySchema, ProblemSolvingSchema
from datetime import datetime, timedelta
import pandas as pd
import io
from sync_service import fetch_user_rating, fetch_contest_history, fetch_submissions
from bson import ObjectId

bp = Blueprint('students', __name__)

@bp.route('/students', methods=['POST'])
def create_student():
    data = request.json
    required_fields = ['name', 'email', 'cf_handle']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if email or cf_handle already exists
    existing_student = mongo.db.students.find_one({
        '$or': [
            {'email': data['email']},
            {'cf_handle': data['cf_handle']}
        ]
    })
    if existing_student:
        return jsonify({'error': 'Email or Codeforces handle already exists'}), 400
    
    student_doc = StudentSchema.create_student(data)
    result = mongo.db.students.insert_one(student_doc)
    return jsonify({'id': str(result.inserted_id)}), 201

@bp.route('/students', methods=['GET'])
def list_students():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    skip = (page - 1) * per_page
    
    # Get total count
    total = mongo.db.students.count_documents({})
    
    # Get paginated results
    students_cursor = mongo.db.students.find().skip(skip).limit(per_page)
    result = [StudentSchema.to_dict(student) for student in students_cursor]
    
    return jsonify({
        'students': result,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
        'current_page': page
    })

@bp.route('/students/<id>', methods=['GET'])
def get_student(id):
    try:
        student = mongo.db.students.find_one({'_id': ObjectId(id)})
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        return jsonify(StudentSchema.to_dict(student))
    except:
        return jsonify({'error': 'Invalid student ID'}), 400

@bp.route('/students/<id>', methods=['PUT'])
def update_student(id):
    try:
        student = mongo.db.students.find_one({'_id': ObjectId(id)})
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        data = request.json
        update_data = {'last_updated': datetime.utcnow()}
        
        if 'cf_handle' in data:
            update_data['cf_handle'] = data['cf_handle']
        if 'name' in data:
            update_data['name'] = data['name']
        if 'email' in data:
            update_data['email'] = data['email']
        if 'phone' in data:
            update_data['phone'] = data['phone']
        if 'current_rating' in data:
            update_data['current_rating'] = data['current_rating']
        if 'max_rating' in data:
            update_data['max_rating'] = data['max_rating']
        if 'email_opt_out' in data:
            update_data['email_opt_out'] = bool(data['email_opt_out'])
        
        # Check for duplicate email or cf_handle
        if 'email' in update_data or 'cf_handle' in update_data:
            query = {'_id': {'$ne': ObjectId(id)}}
            if 'email' in update_data and 'cf_handle' in update_data:
                query['$or'] = [
                    {'email': update_data['email']},
                    {'cf_handle': update_data['cf_handle']}
                ]
            elif 'email' in update_data:
                query['email'] = update_data['email']
            elif 'cf_handle' in update_data:
                query['cf_handle'] = update_data['cf_handle']
            
            existing = mongo.db.students.find_one(query)
            if existing:
                return jsonify({'error': 'Email or Codeforces handle already exists'}), 400
        
        mongo.db.students.update_one({'_id': ObjectId(id)}, {'$set': update_data})
        return jsonify({'message': 'Student updated'})
    except:
        return jsonify({'error': 'Invalid student ID'}), 400

@bp.route('/students/<id>', methods=['DELETE'])
def delete_student(id):
    try:
        result = mongo.db.students.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Student not found'}), 404
        
        # Also delete related contest history and problem solving data
        mongo.db.contest_history.delete_many({'student_id': ObjectId(id)})
        mongo.db.problem_solving.delete_many({'student_id': ObjectId(id)})
        
        return jsonify({'message': 'Student deleted'})
    except:
        return jsonify({'error': 'Invalid student ID'}), 400

@bp.route('/students/csv', methods=['GET'])
def export_students_csv():
    students_cursor = mongo.db.students.find()
    data = [StudentSchema.to_dict(student) for student in students_cursor]
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
    student = mongo.db.students.find_one({'cf_handle': cf_handle})
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    rating = fetch_user_rating(cf_handle)
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
    
    contests = fetch_contest_history(cf_handle)
    if contests:
        # Delete existing contest history
        mongo.db.contest_history.delete_many({'student_id': student['_id']})
        # Insert new contest history
        contest_docs = []
        for c in contests:
            contest_doc = ContestHistorySchema.create_contest(str(student['_id']), c)
            contest_docs.append(contest_doc)
        if contest_docs:
            mongo.db.contest_history.insert_many(contest_docs)
    
    problems = fetch_submissions(cf_handle)
    if problems:
        # Delete existing problem solving data
        mongo.db.problem_solving.delete_many({'student_id': student['_id']})
        # Insert new problem solving data
        problem_docs = []
        for p in problems:
            problem_doc = ProblemSolvingSchema.create_problem(str(student['_id']), p)
            problem_docs.append(problem_doc)
        if problem_docs:
            mongo.db.problem_solving.insert_many(problem_docs)
    
    return jsonify({'message': 'Sync complete'})

@bp.route('/students/<id>/contest-history')
def get_contest_history(id):
    try:
        days = int(request.args.get('days', 30))
        student = mongo.db.students.find_one({'_id': ObjectId(id)})
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        since = datetime.utcnow() - timedelta(days=days)
        contests_cursor = mongo.db.contest_history.find({
            'student_id': ObjectId(id),
            'date': {'$gte': since}
        }).sort('date', -1)
        
        contests = [ContestHistorySchema.to_dict(contest) for contest in contests_cursor]
        return jsonify(contests)
    except:
        return jsonify({'error': 'Invalid student ID'}), 400

@bp.route('/students/<id>/problem-stats')
def get_problem_stats(id):
    try:
        days = int(request.args.get('days', 7))
        student = mongo.db.students.find_one({'_id': ObjectId(id)})
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        since = datetime.utcnow() - timedelta(days=days)
        
        # Get problems solved in the time period
        problems_cursor = mongo.db.problem_solving.find({
            'student_id': ObjectId(id),
            'date_solved': {'$gte': since}
        })
        
        problems = list(problems_cursor)
        total_solved = len(problems)
        
        if total_solved == 0:
            return jsonify({
                'total_solved': 0,
                'average_rating': 0,
                'problems_per_day': 0,
                'hardest_solved_rating': 0,
                'solved_by_rating': {},
                'submissions': []
            })
        
        # Calculate statistics
        ratings = [p['rating'] for p in problems if p['rating']]
        average_rating = sum(ratings) / len(ratings) if ratings else 0
        hardest_solved_rating = max(ratings) if ratings else 0
        problems_per_day = total_solved / days
        
        # Group by rating
        solved_by_rating = {}
        for problem in problems:
            rating = problem['rating']
            if rating:
                rating_key = f"{rating}"
                solved_by_rating[rating_key] = solved_by_rating.get(rating_key, 0) + 1
        
        # Generate submission heatmap data (mock data for now)
        submissions = []
        for i in range(371):  # Last year
            date = datetime.utcnow() - timedelta(days=370-i)
            submissions.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': 0  # This would be calculated from actual submission data
            })
        
        return jsonify({
            'total_solved': total_solved,
            'average_rating': round(average_rating, 1),
            'problems_per_day': round(problems_per_day, 1),
            'hardest_solved_rating': hardest_solved_rating,
            'solved_by_rating': solved_by_rating,
            'submissions': submissions
        })
    except:
        return jsonify({'error': 'Invalid student ID'}), 400 