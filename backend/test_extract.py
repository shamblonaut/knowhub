import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from repository.models import Resource
from rag.extractor import extract
from rag.chunker import chunk
from rag.pipeline import process

r = Resource.objects(status='approved', resource_type='file').first()
print(f"Resource: {r.id}, {r.title}, path: {r.file_path}, format: {r.file_format}")
pages = extract(r)
print(f"Pages: {len(pages)}")
if pages:
    print(f"First page length: {len(pages[0][1]) if pages[0][1] else 0}")
chunks = chunk(pages, str(r.id))
print(f"Chunks: {len(chunks)}")
if not chunks:
    print("Why no chunks??")
