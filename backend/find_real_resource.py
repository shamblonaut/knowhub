import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from repository.models import Resource
from django.conf import settings

resources = Resource.objects(resource_type='file')
for r in resources:
    path = os.path.join(settings.MEDIA_ROOT, r.file_path or '')
    if os.path.exists(path):
        print(f"FOUND: {r.id} | {r.title} | {r.file_path}")
