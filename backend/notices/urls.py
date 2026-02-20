from django.urls import path
from .views import NoticeListCreateView, NoticeDetailView

urlpatterns = [
    path('notices/', NoticeListCreateView.as_view(), name='notice-list-create'),
    path('notices/<str:notice_id>/', NoticeDetailView.as_view(), name='notice-detail'),
]
