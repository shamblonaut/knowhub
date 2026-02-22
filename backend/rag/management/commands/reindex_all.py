from django.core.management.base import BaseCommand
from repository.models import Resource
from repository.views import generate_embedding
from rag.pipeline import process
import time

class Command(BaseCommand):
    help = 'Reruns all indexing (embeddings and RAG pipeline) for all approved resources'

    def handle(self, *args, **options):
        resources = Resource.objects(status='approved')
        total = resources.count()
        self.stdout.write(self.style.SUCCESS(f'Starting re-indexing for {total} resources...'))

        for i, r in enumerate(resources):
            self.stdout.write(f'[{i+1}/{total}] Re-indexing "{r.title}" ({r.id})...')
            
            # 1. Update status to reflect in frontend
            Resource.objects(id=r.id).update_one(set__indexing_status='processing')
            
            # 2. Rerun semantic search embedding (synchronously here)
            try:
                generate_embedding(str(r.id))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  - Embedding failed: {e}'))

            # 3. Rerun RAG pipeline (synchronously here)
            try:
                process(str(r.id), r.status)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  - RAG pipeline failed: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully re-indexed {total} resources.'))
