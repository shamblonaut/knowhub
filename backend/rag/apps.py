from django.apps import AppConfig


class RagConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rag'

    def ready(self):
        # Pre-load the model when the server starts in a background thread to avoid blocking startup
        import threading
        def load_model():
            from .embedder import get_model
            get_model()
        
        # Don't run this during management commands or reloader checks
        import sys
        if 'runserver' in sys.argv and '--noreload' not in sys.argv:
            # In runserver, ready() is called twice (once for the reloader, once for the actual process)
            # We only want to load in the child process
            import os
            if os.environ.get('RUN_MAIN') == 'true':
                threading.Thread(target=load_model, daemon=True).start()
        elif 'runserver' in sys.argv and '--noreload' in sys.argv:
             threading.Thread(target=load_model, daemon=True).start()

