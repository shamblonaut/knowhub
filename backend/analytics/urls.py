from django.urls import path
from .views import (
    AnalyticsSummaryView,
    UploadsBySemesterView,
    TopResourcesView,
    FacultyActivityView,
    UploadsByFormatView
)

urlpatterns = [
    path('summary/', AnalyticsSummaryView.as_view()),
    path('uploads/semester/', UploadsBySemesterView.as_view()),
    path('resources/top/', TopResourcesView.as_view()),
    path('faculty/activity/', FacultyActivityView.as_view()),
    path('uploads/format/', UploadsByFormatView.as_view()),
]
