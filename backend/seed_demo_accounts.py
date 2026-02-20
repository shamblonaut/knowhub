import os
import sys
import django
from accounts.utils import hash_password

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User

def seed_users():
    print("Seeding demo accounts...")
    
    users_data = [
        {
            "name": "Dr. Mehta",
            "email": "hod@bca.edu",
            "password": "Demo@123",
            "role": "hod",
            "is_active": True
        },
        {
            "name": "Prof. Sharma",
            "email": "faculty@bca.edu",
            "password": "Demo@123",
            "role": "faculty",
            "is_active": True
        },
        {
            "name": "Rahul Student",
            "email": "student@bca.edu",
            "password": "Demo@123",
            "role": "student",
            "usn": "1BCA21CS001",
            "semester": 4,
            "is_active": True
        }
    ]

    for data in users_data:
        try:
            if User.objects(email=data['email']).first():
                print(f"User {data['email']} already exists. Skipping.")
                continue

            # Hash password
            raw_password = data.pop('password')
            data['password_hash'] = hash_password(raw_password)

            user = User(**data)
            user.save()
            print(f"Created user: {user.email} (Role: {user.role})")
        except Exception as e:
            print(f"Error creating user {data.get('email', 'unknown')}: {e}")

    print("Seeding complete.")

if __name__ == "__main__":
    seed_users()
