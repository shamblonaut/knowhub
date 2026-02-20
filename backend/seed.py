import os
import sys
import django
import random
from datetime import datetime, timedelta
from passlib.hash import bcrypt

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from repository.models import Subject, Resource
from notices.models import Notice

def clear_db():
    print("Clearing existing demo data...")
    User.objects().delete()
    Subject.objects().delete()
    Resource.objects().delete()
    Notice.objects().delete()
    print("Database cleared.\n")

def seed():
    print("Starting database seeding process...")
    
    # 1. Accounts
    print("Seeding Users...")
    password_hash = bcrypt.hash("Demo@123")
    
    users_data = [
        {"name": "Dr. Mehta (HOD)", "email": "hod@bca.edu", "password_hash": password_hash, "role": "hod", "is_active": True},
        {"name": "Prof. Sharma", "email": "sharma@bca.edu", "password_hash": password_hash, "role": "faculty", "is_active": True},
        {"name": "Prof. Kulkarni", "email": "kulkarni@bca.edu", "password_hash": password_hash, "role": "faculty", "is_active": True},
        {"name": "Prof. Desai", "email": "desai@bca.edu", "password_hash": password_hash, "role": "faculty", "is_active": True},
    ]

    for i in range(1, 11):
        sem = random.randint(1, 6)
        users_data.append({
            "name": f"Student {i}", "email": f"student{i}@bca.edu", 
            "password_hash": password_hash, "role": "student", 
            "usn": f"1BCA2{random.randint(0,4)}CS{i:03d}", 
            "semester": sem, "is_active": True
        })

    saved_users = {}
    for data in users_data:
        user = User(**data).save()
        saved_users[user.role] = saved_users.get(user.role, []) + [user]
    
    hod = saved_users["hod"][0]
    faculty_list = saved_users["faculty"]
    students = saved_users["student"]
    print(f"Created {len(users_data)} users.\n")

    # 2. Subjects
    print("Seeding Subjects...")
    subjects_data = [
        {"code": "BCA101", "name": "Programming in C", "semester": 1},
        {"code": "BCA102", "name": "Mathematical Foundation", "semester": 1},
        {"code": "BCA201", "name": "Data Structures", "semester": 2},
        {"code": "BCA202", "name": "Object Oriented Programming", "semester": 2},
        {"code": "BCA301", "name": "Database Management Systems", "semester": 3},
        {"code": "BCA302", "name": "Operating Systems", "semester": 3},
        {"code": "BCA401", "name": "Computer Networks", "semester": 4},
        {"code": "BCA402", "name": "Software Engineering", "semester": 4},
        {"code": "BCA501", "name": "Web Technologies", "semester": 5},
        {"code": "BCA502", "name": "Java Programming", "semester": 5},
        {"code": "BCA601", "name": "Cloud Computing", "semester": 6},
    ]

    saved_subjects = []
    for data in subjects_data:
        assigned_faculty = random.choice(faculty_list)
        subject = Subject(
            **data, 
            faculty_id=assigned_faculty.id, 
            created_by=hod.id
        ).save()
        saved_subjects.append(subject)
        
        # Update faculty subject_ids
        assigned_faculty.update(push__subject_ids=subject.id)

    print(f"Created {len(subjects_data)} subjects.\n")

    # 3. Resources
    print("Seeding Resources...")
    resource_types = ["file", "url"]
    file_formats = ["pdf", "ppt", "doc", "image"]
    statuses = ["approved", "pending", "rejected"]

    # Generate embeddings arbitrarily (mock data)
    mock_embedding = [random.uniform(-1, 1) for _ in range(1536)] if hasattr(Resource, 'embedding') else []

    resource_count = 0
    for subject in saved_subjects:
        # Create 3-5 resources per subject
        for i in range(random.randint(3, 5)):
            r_type = random.choice(resource_types)
            status = random.choices(statuses, weights=[70, 20, 10])[0]
            uploader = random.choice(faculty_list + students)

            resource = Resource(
                title=f"{subject.name} - Study Material {i+1}",
                description=f"Comprehensive material for {subject.name}, Unit {random.randint(1,4)}.",
                resource_type=r_type,
                semester=subject.semester,
                subject_id=subject.id,
                unit=f"Unit {random.randint(1, 4)}",
                tags=[subject.name.split()[0].lower(), "notes", "important"],
                uploaded_by=uploader.id,
                uploader_role=uploader.role,
                status=status,
                download_count=random.randint(0, 150) if status == 'approved' else 0,
                embedding=mock_embedding,
                upload_date=datetime.utcnow() - timedelta(days=random.randint(0, 30))
            )

            if r_type == "file":
                resource.file_format = random.choice(file_formats)
                resource.original_filename = f"document_{i+1}.{resource.file_format}"
                resource.file_path = f"uploads/dummy_{i}.{resource.file_format}"
            else:
                resource.url = "https://example.com/study-material"

            if status != "pending":
                reviewer = random.choice(faculty_list) if uploader.role == 'student' else hod
                resource.reviewed_by = reviewer.id
                resource.reviewed_at = datetime.utcnow() - timedelta(days=random.randint(0, 5))

            resource.save()
            resource_count += 1

    print(f"Created {resource_count} resources.\n")

    # 4. Notices
    print("Seeding Notices...")
    notices_data = [
        {"title": "Welcome to the New Academic Year", "body": "Classes will commence from Monday. Please check your timetables.", "is_pinned": True},
        {"title": "Internal Exams Schedule", "body": "First internal exams are scheduled starting next week. Syllabus is available in the repository.", "is_pinned": False},
        {"title": "Hackathon Registration", "body": "Annual college hackathon registrations are open. Form a team of 3-4 members.", "is_pinned": True},
        {"title": "Library Books Return", "body": "Please return all overdue library books by Friday to avoid fines.", "is_pinned": False},
        {"title": "Guest Lecture on AI", "body": "There will be a mandatory guest lecture on Artificial Intelligence on Wednesday at 2 PM in the main auditorium.", "is_pinned": False},
    ]

    for data in notices_data:
        Notice(
            **data,
            posted_by=hod.id,
            posted_by_name=hod.name,
            expires_at=datetime.utcnow() + timedelta(days=random.randint(7, 30)),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 5))
        ).save()
    
    print(f"Created {len(notices_data)} notices.\n")
    print("Seeding completed successfully! You can now log in using:")
    print("HOD: hod@bca.edu | Password: Demo@123")
    print("Faculty: sharma@bca.edu | Password: Demo@123")
    print("Student: student1@bca.edu | Password: Demo@123")

if __name__ == "__main__":
    clear_db()
    seed()
