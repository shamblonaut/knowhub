from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsHOD
from accounts.models import User
from repository.models import Resource, Subject
from notices.models import Notice

class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        total_downloads = sum(
            r.download_count for r in Resource.objects(status='approved').only('download_count')
        )

        return Response({
            "total_users": User.objects.count(),
            "total_students": User.objects(role='student').count(),
            "total_faculty": User.objects(role='faculty').count(),
            "total_resources": Resource.objects(status='approved').count(),
            "pending_approvals": Resource.objects(status='pending').count(),
            "total_notices": Notice.objects.count(),
            "total_downloads": total_downloads,
        })

class UploadsBySemesterView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        data = []
        for sem in range(1, 7):
            count = Resource.objects(status='approved', semester=sem).count()
            data.append({"semester": sem, "count": count})
        return Response({"data": data})

class TopResourcesView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        resources = list(
            Resource.objects(status='approved').order_by('-download_count')[:10]
        )
        data = []
        for r in resources:
            subject_code = None
            try:
                subject_code = Subject.objects.get(id=r.subject_id).code
            except Exception:
                pass
            data.append({
                "id": str(r.id),
                "title": r.title,
                "subject_code": subject_code,
                "download_count": r.download_count,
            })
        return Response({"data": data})

class FacultyActivityView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        faculty_users = User.objects(role='faculty')
        data = []
        for faculty in faculty_users:
            uploads = Resource.objects(uploaded_by=faculty.id).count()
            approvals = Resource.objects(reviewed_by=faculty.id, status='approved').count()
            rejections = Resource.objects(reviewed_by=faculty.id, status='rejected').count()
            data.append({
                "faculty_id": str(faculty.id),
                "faculty_name": faculty.name,
                "uploads": uploads,
                "approvals": approvals,
                "rejections": rejections,
            })
        return Response({"data": data})

class UploadsByFormatView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        data = []
        for fmt in ['pdf', 'ppt', 'doc', 'image']:
            count = Resource.objects(status='approved', file_format=fmt).count()
            data.append({"format": fmt, "count": count})
            
        url_count = Resource.objects(status='approved', resource_type='url').count()
        data.append({"format": "url", "count": url_count})
        
        return Response({"data": data})
