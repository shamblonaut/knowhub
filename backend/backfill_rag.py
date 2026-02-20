import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from repository.models import Resource
from rag.pipeline import process

def backfill():
    resources = Resource.objects(status='approved', resource_type='file')
    total = resources.count()
    print(f"Found {total} approved file resources. Starting backfill...")
    
    for i, r in enumerate(resources, 1):
        print(f"[{i}/{total}] Processing resource: {r.title} ({r.id})")
        process(str(r.id))
    
    print("Backfill complete.")

if __name__ == "__main__":
    backfill()
