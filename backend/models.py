from datetime import datetime
from bson import ObjectId

# MongoDB document schemas and helper functions
class StudentSchema:
    @staticmethod
    def create_student(data):
        return {
            'name': data['name'],
            'email': data['email'],
            'phone': data.get('phone'),
            'cf_handle': data['cf_handle'],
            'current_rating': data.get('current_rating'),
            'max_rating': data.get('max_rating'),
            'last_updated': datetime.utcnow(),
            'email_opt_out': bool(data.get('email_opt_out', False)),
            'reminder_count': 0
        }
    
    @staticmethod
    def to_dict(student_doc):
        return {
            'id': str(student_doc['_id']),
            'name': student_doc['name'],
            'email': student_doc['email'],
            'phone': student_doc.get('phone'),
            'cf_handle': student_doc['cf_handle'],
            'current_rating': student_doc.get('current_rating'),
            'max_rating': student_doc.get('max_rating'),
            'last_updated': student_doc['last_updated'].isoformat() if student_doc.get('last_updated') else None,
            'email_opt_out': student_doc.get('email_opt_out', False),
            'reminder_count': student_doc.get('reminder_count', 0)
        }

class ContestHistorySchema:
    @staticmethod
    def create_contest(student_id, contest_data):
        return {
            'student_id': ObjectId(student_id),
            'contest_id': contest_data['contest_id'],
            'contest_name': contest_data['contest_name'],
            'rank': contest_data['rank'],
            'rating_change': contest_data['rating_change'],
            'solved_count': contest_data['solved_count'],
            'date': contest_data['date'],
            'new_rating': contest_data.get('new_rating')
        }
    
    @staticmethod
    def to_dict(contest_doc):
        return {
            'contest_id': contest_doc['contest_id'],
            'contest_name': contest_doc['contest_name'],
            'rank': contest_doc['rank'],
            'rating_change': contest_doc['rating_change'],
            'solved_count': contest_doc['solved_count'],
            'date': contest_doc['date'].isoformat() if contest_doc.get('date') else None,
            'new_rating': contest_doc.get('new_rating')
        }

class ProblemSolvingSchema:
    @staticmethod
    def create_problem(student_id, problem_data):
        return {
            'student_id': ObjectId(student_id),
            'problem_id': problem_data['problem_id'],
            'problem_name': problem_data['problem_name'],
            'rating': problem_data['rating'],
            'date_solved': problem_data['date_solved']
        }
    
    @staticmethod
    def to_dict(problem_doc):
        return {
            'problem_id': problem_doc['problem_id'],
            'problem_name': problem_doc['problem_name'],
            'rating': problem_doc['rating'],
            'date_solved': problem_doc['date_solved'].isoformat() if problem_doc.get('date_solved') else None
        } 