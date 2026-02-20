from django.urls import path
from .views import RegisterView, LoginView, MeView, CreateFacultyView, ActivateUserView, CustomTokenRefreshView, UsersListView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('token/refresh/', CustomTokenRefreshView.as_view()),
    path('me/', MeView.as_view()),
    path('users/', UsersListView.as_view()),
    path('faculty/create/', CreateFacultyView.as_view()),
    path('users/<str:user_id>/activate/', ActivateUserView.as_view()),
]
