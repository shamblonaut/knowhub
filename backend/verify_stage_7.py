import os
import django

# Setup Django first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Then import everything else
from rest_framework.test import APIClient
from bson import ObjectId
from accounts.models import User
from repository.models import Resource, Subject
from accounts.authentication import get_tokens_for_user

def verify_analytics():
    client = APIClient()
    
    # 1. Get or create HOD user
    hod = User.objects(role='hod').first()
    if not hod:
        from accounts.utils import hash_password
        hod = User(
            name="Test HOD",
            email="hod_admin@test.com",
            password_hash=hash_password("Password@123"),
            role='hod'
        ).save()
        print(f"Created temporary HOD: {hod.email}")
    else:
        print(f"Using existing HOD: {hod.email}")

    # 2. Get or create Student user
    student = User.objects(role='student').first()
    if not student:
        from accounts.utils import hash_password
        student = User(
            name="Test Student",
            email="student_user@test.com",
            password_hash=hash_password("Password@123"),
            role='student',
            usn="TEST001",
            semester=1
        ).save()
        print(f"Created temporary Student: {student.email}")
    else:
        print(f"Using existing Student: {student.email}")

    # 3. Get tokens
    hod_tokens = get_tokens_for_user(hod)
    student_tokens = get_tokens_for_user(student)

    endpoints = [
        '/api/v1/summary/',
        '/api/v1/uploads/semester/',
        '/api/v1/resources/top/',
        '/api/v1/faculty/activity/',
        '/api/v1/uploads/format/',
    ]

    print("\n--- Testing HOD Access (Should be 200 OK) ---")
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {hod_tokens["access"]}')
    for url in endpoints:
        response = client.get(url)
        print(f"GET {url} -> {response.status_code}")
        if response.status_code != 200:
            print(f"FAILED: {response.data}")
        else:
            print(f"SUCCESS: {list(response.data.keys()) if isinstance(response.data, dict) else len(response.data)}")

    print("\n--- Testing Student Access (Should be 403 Forbidden) ---")
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_tokens["access"]}')
    for url in endpoints:
        response = client.get(url)
        print(f"GET {url} -> {response.status_code}")
        if response.status_code != 403:
            print(f"FAILED: Expected 403, got {response.status_code}")

    print("\nVerification Complete.")

if __name__ == "__main__":
    verify_analytics()
