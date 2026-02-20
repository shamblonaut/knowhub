import os
import django
import time

# Setup Django first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Then import everything else
from rest_framework.test import APIClient
from bson import ObjectId
from accounts.models import User
from repository.models import Resource, Subject
from accounts.authentication import get_tokens_for_user

def verify_search_and_recommendations():
    client = APIClient()
    
    # 1. Get or create HOD user
    hod = User.objects(role='hod').first()
    if not hod:
        from accounts.utils import hash_password
        hod = User(
            name="Test HOD",
            email="search_hod@test.com",
            password_hash=hash_password("Password@123"),
            role='hod'
        ).save()
        print(f"Created temporary HOD: {hod.email}")
    else:
        print(f"Using existing HOD: {hod.email}")

    # 2. Get or create Subject
    subject = Subject.objects.first()
    if not subject:
        subject = Subject(
            code="CS101",
            name="Computer Science 101",
            semester=1,
            faculty_id=hod.id,
            created_by=hod.id
        ).save()
        print(f"Created temporary Subject: {subject.code}")
    else:
        print(f"Using existing Subject: {subject.code}")

    # 3. Create a resource with embedding
    # In a real scenario, the background thread would do this.
    # Here we simulate it for the test.
    resource = Resource.objects(title="Introduction to Python").first()
    if not resource:
        resource = Resource(
            title="Introduction to Python",
            description="A comprehensive guide to Python programming for beginners.",
            resource_type="file",
            semester=1,
            subject_id=subject.id,
            uploaded_by=hod.id,
            uploader_role="faculty",
            status="approved",
            tags=["python", "programming", "beginner"]
        ).save()
        print(f"Created temporary Resource: {resource.title}")
        
        # Manually trigger embedding generation (synchronously for the test)
        from repository.views import generate_embedding
        generate_embedding(str(resource.id))
        resource.reload()
        print("Generated embedding for resource.")
    else:
        print(f"Using existing Resource: {resource.title}")

    # 4. Get tokens
    hod_tokens = get_tokens_for_user(hod)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {hod_tokens["access"]}')

    # 5. Test Search
    print("\n--- Testing Search ---")
    search_url = f'/api/v1/search/?q=python programming'
    response = client.get(search_url)
    print(f"GET {search_url} -> {response.status_code}")
    if response.status_code == 200:
        print(f"SUCCESS: Found {response.data['count']} results.")
        if response.data['count'] > 0:
            print(f"Top result: {response.data['results'][0]['title']} (Score: {response.data['results'][0]['similarity_score']})")
    else:
        print(f"FAILED: {response.data}")

    # 6. Test Recommendation
    print("\n--- Testing Recommendations ---")
    recommend_url = f'/api/v1/search/recommend/{str(resource.id)}/'
    response = client.get(recommend_url)
    print(f"GET {recommend_url} -> {response.status_code}")
    if response.status_code == 200:
        print(f"SUCCESS: Got {len(response.data['recommendations'])} recommendations.")
    else:
        print(f"FAILED: {response.data}")

    print("\nVerification Complete.")

if __name__ == "__main__":
    verify_search_and_recommendations()
