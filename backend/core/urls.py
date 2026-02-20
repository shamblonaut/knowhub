from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/', include('analytics.urls')),
    path('api/v1/', include('repository.urls')),
    path('api/v1/', include('notices.urls')),
    path('api/v1/', include('search.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
