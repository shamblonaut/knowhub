from django.urls import path
from .views import RAGAskView

urlpatterns = [
    path('rag/ask/', RAGAskView.as_view()),
]
