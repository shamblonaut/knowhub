import sys
import os

sys.path.append('/Users/safu/Documents/knowhub/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from repository.models import Resource
from repository.views import generate_embedding

resources = list(Resource.objects(embedding__exists=True))
count_1536 = 0
count_384 = 0

for r in resources:
    if r.embedding:
        if len(r.embedding) == 1536:
            count_1536 += 1
            print(f"Re-generating for {r.id}")
            generate_embedding(str(r.id))
        elif len(r.embedding) == 384:
            count_384 += 1
        else:
            print(f"Unknown size: {len(r.embedding)}")
            generate_embedding(str(r.id))

print(f"Fixed: {count_1536}")
print(f"Already correct (384): {count_384}")
