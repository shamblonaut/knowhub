from django.urls import path
from .views import (
    AnalyticsSummaryView,
    UploadsBySemesterView,
    TopResourcesView,
    FacultyActivityView,
    UploadsByFormatView
)

urlpatterns = [
    path('analytics/summary/', AnalyticsSummaryView.as_view()),
    path('analytics/uploads-by-semester/', UploadsBySemesterView.as_view()),
    path('analytics/top-resources/', TopResourcesView.as_view()),
    path('analytics/faculty-activity/', FacultyActivityView.as_view()),
    path('analytics/uploads-by-format/', UploadsByFormatView.as_view()),
]
