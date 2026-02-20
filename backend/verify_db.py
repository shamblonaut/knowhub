import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rag.models import ResourceChunk
from repository.models import Resource

chunk_count = ResourceChunk.objects.count()
print(f"Total ResourceChunks: {chunk_count}")

if chunk_count > 0:
    sample = ResourceChunk.objects.first()
    print(f"Sample Chunk:")
    print(f"  Resource Title: {sample.resource_title}")
    print(f"  Text Snippet: {sample.chunk_text[:100]}...")
    print(f"  Embedding size: {len(sample.embedding) if sample.embedding else 'None'}")

resources_with_chunks = ResourceChunk.objects.distinct('resource_id')
print(f"Number of unique resources indexed: {len(resources_with_chunks)}")
