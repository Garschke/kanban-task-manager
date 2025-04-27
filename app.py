# app.py (updated)
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


def current_year():
    date = f"{datetime.now().strftime('%Y')}"
    print(date)
    return date

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='todo')  # Default status
    position = db.Column(db.Integer, default=0)  # Default position
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'position': self.position,
            'created_at': self.created_at.isoformat()
        }


# Create database tables before first request
def initialize_database():
    with app.app_context():
        db.create_all()


@app.route('/')
def landing_page():
    return render_template('landing_page.html', year=current_year())

@app.route('/kanban')
def index():
    return render_template('index.html',
                           year=current_year())


@app.route('/api/tasks', methods=['GET', 'POST'])
def handle_tasks():
    if request.method == 'GET':
        # Get all tasks ordered by position
        tasks = Task.query.order_by(Task.position).all()
        return jsonify([task.to_dict() for task in tasks])

    elif request.method == 'POST':
        # Create a new task
        data = request.get_json()

        # DEBUGGING
        print("Recieved data for create:")
        print(data)

        # Validate required fields
        if not data or not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400

        # Create the task
        new_task = Task(
            title=data['title'],
            description=data.get('description', ''),
            status=data.get('status', 'todo'),
            position=data.get('position', 0)
        )

        db.session.add(new_task)
        db.session.commit()

        return jsonify(new_task.to_dict()), 201


@app.route('/api/tasks/<int:task_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_task(task_id):
    task = Task.query.get_or_404(task_id)

    if request.method == 'GET':
        return jsonify(task.to_dict())

    if request.method == 'PUT':
        # Update existing task
        data = request.get_json()

        # DEBUGGING
        print("Recieved data for update:")
        print(data)

        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'status' in data:
            task.status = data['status']
        if 'position' in data:
            task.position = data['position']

        db.session.commit()
        return jsonify(task.to_dict())

    elif request.method == 'DELETE':
        # Delete the task
        db.session.delete(task)
        db.session.commit()
        return '', 204


if __name__ == '__main__':
    initialize_database()
    app.run(debug=True)
