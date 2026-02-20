import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from repository.models import Resource
from django.conf import settings

resources = Resource.objects(resource_type='file')
print(f"Total file resources: {resources.count()}")
for r in resources[:5]:
    print(f"ID: {r.id} | Title: {r.title} | Path: {r.file_path}")
print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
