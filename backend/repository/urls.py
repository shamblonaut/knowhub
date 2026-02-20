from django.urls import path
from .views import (
    SubjectListCreateView,
    SubjectDetailView,
    SemesterListView,
    ResourceUploadView,
    ResourceListView,
    ResourceDetailView,
    ResourceDownloadView,
    ResourcePendingView,
    ResourceApproveView,
    ResourceRejectView,
)

urlpatterns = [
    path("subjects/", SubjectListCreateView.as_view()),
    path("subjects/<str:subject_id>/", SubjectDetailView.as_view()),
    path("semesters/", SemesterListView.as_view()),
    # Resource endpoints
    path("resources/", ResourceListView.as_view()),
    path("resources/pending/", ResourcePendingView.as_view()),
    path("resources/upload/", ResourceUploadView.as_view()),
    path("resources/<str:resource_id>/", ResourceDetailView.as_view()),
    path("resources/<str:resource_id>/download/", ResourceDownloadView.as_view()),
    path("resources/<str:resource_id>/approve/", ResourceApproveView.as_view()),
    path("resources/<str:resource_id>/reject/", ResourceRejectView.as_view()),
]
