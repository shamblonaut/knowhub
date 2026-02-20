from django.urls import path
from .views import SubjectListCreateView, SubjectDetailView, SemesterListView

urlpatterns = [
    path("subjects/", SubjectListCreateView.as_view()),
    path("subjects/<str:subject_id>/", SubjectDetailView.as_view()),
    path("semesters/", SemesterListView.as_view()),
]
