from django.urls import path
from .views import SearchView, RecommendView

urlpatterns = [
    path('search/', SearchView.as_view()),
    path('search/recommend/<str:resource_id>/', RecommendView.as_view()),
]
