from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
from datetime import datetime, timedelta
from .models import Notice
from accounts.permissions import IsFacultyOrHOD


def serialize_notice(notice):
    """
    Helper function to serialize a Notice document.
    'is_new' is computed dynamically based on the 'created_at' timestamp.
    """
    return {
        "id": str(notice.id),
        "title": notice.title,
        "body": notice.body,
        "posted_by": str(notice.posted_by),
        "posted_by_name": notice.posted_by_name,
        "is_pinned": notice.is_pinned,
        "is_new": (datetime.utcnow() - notice.created_at) < timedelta(hours=24),
        "created_at": notice.created_at.isoformat() + "Z",
        "expires_at": notice.expires_at.isoformat() + "Z" if notice.expires_at else None,
    }


class NoticeListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsFacultyOrHOD()]
        return [IsAuthenticated()]

    def get(self, request):
        # List notices: Pinned first, then newest
        pinned = list(Notice.objects(is_pinned=True).order_by('-created_at'))
        unpinned = list(Notice.objects(is_pinned=False).order_by('-created_at'))
        all_notices = pinned + unpinned
        return Response({
            "count": len(all_notices),
            "results": [serialize_notice(n) for n in all_notices]
        })

    def post(self, request):
        data = request.data
        for field in ['title', 'body']:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        notice = Notice(
            title=data['title'],
            body=data['body'],
            posted_by=request.user.id,
            posted_by_name=request.user.name,
            is_pinned=bool(data.get('is_pinned', False)),
        )
        if data.get('expires_at'):
            try:
                # Handle potential 'Z' in ISO format
                expires_at_str = data['expires_at'].replace('Z', '')
                notice.expires_at = datetime.fromisoformat(expires_at_str)
            except ValueError:
                return Response({"error": "Invalid date format for 'expires_at'."}, status=400)

        notice.save()
        return Response(serialize_notice(notice), status=201)


class NoticeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_notice(self, notice_id):
        try:
            return Notice.objects.get(id=ObjectId(notice_id))
        except Exception:
            return None

    def patch(self, request, notice_id):
        notice = self.get_notice(notice_id)
        if not notice:
            return Response({"error": "Notice not found."}, status=404)

        # HOD can edit any, others can only edit their own
        if (request.user.role != 'hod'
                and str(notice.posted_by) != str(request.user.id)):
            return Response({"error": "Permission denied."}, status=403)

        data = request.data
        if 'title' in data:
            notice.title = data['title']
        if 'body' in data:
            notice.body = data['body']
        if 'is_pinned' in data:
            if request.user.role != 'hod':
                return Response({"error": "Only HOD can pin notices."}, status=403)
            notice.is_pinned = bool(data['is_pinned'])
        
        if 'expires_at' in data:
            if data['expires_at'] is None:
                notice.expires_at = None
            else:
                try:
                    expires_at_str = data['expires_at'].replace('Z', '')
                    notice.expires_at = datetime.fromisoformat(expires_at_str)
                except ValueError:
                    return Response({"error": "Invalid date format for 'expires_at'."}, status=400)

        notice.save()
        return Response(serialize_notice(notice))

    def delete(self, request, notice_id):
        # Only HOD can delete notices as per PLAN.md rule
        if request.user.role != 'hod':
            return Response({"error": "Only HOD can delete notices."}, status=403)

        notice = self.get_notice(notice_id)
        if not notice:
            return Response({"error": "Notice not found."}, status=404)

        notice.delete()
        return Response({"message": "Notice deleted."})
