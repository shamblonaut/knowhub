from django.core.management.base import BaseCommand
from repository.models import Resource
from rag.pipeline import process

class Command(BaseCommand):
    help = 'Indexes all approved resources by running them through the RAG pipeline.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting document indexing...'))
        
        resources = Resource.objects(status='approved', resource_type='file')
        count = resources.count()
        
        if count == 0:
            self.stdout.write(self.style.WARNING('No approved file resources found to index.'))
            return
            
        self.stdout.write(f'Found {count} resources to index.')
        
        success_count = 0
        for i, resource in enumerate(resources, 1):
            self.stdout.write(f'[{i}/{count}] Indexing "{resource.title}"...')
            try:
                process(str(resource.id))
                success_count += 1
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Failed to index "{resource.title}": {e}'))
                
        self.stdout.write(self.style.SUCCESS(f'Successfully indexed {success_count} out of {count} resources.'))
