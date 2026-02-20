import sys
import os

sys.path.append('/Users/safu/Documents/knowhub/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from repository.models import Resource

resources = Resource.objects(embedding__exists=True)
count_1536 = 0
count_384 = 0

for r in resources:
    if r.embedding:
        if len(r.embedding) == 1536:
            count_1536 += 1
        elif len(r.embedding) == 384:
            count_384 += 1
        else:
            print(f"Unknown size: {len(r.embedding)}")

print(f"1536 (OpenAI?): {count_1536}")
print(f"384 (MiniLM): {count_384}")
