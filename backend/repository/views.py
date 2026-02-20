import os
import threading
import mimetypes
from datetime import datetime
from rag.pipeline import process
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.http import FileResponse
from bson import ObjectId

from accounts.models import User
from accounts.permissions import IsHOD, IsFacultyOrHOD
from .models import Subject, Resource
from .utils import (
    validate_and_get_format,
    get_upload_path,
    get_full_path,
    delete_file_if_exists,
)


def generate_embedding(resource_id):
    """
    Called in a background thread after a resource is approved.
    Loads the sentence-transformer model (cached after first load)
    and saves the embedding to the resource document.
    """
    try:
        from sentence_transformers import SentenceTransformer
        from .models import Resource
        from bson import ObjectId

        model = SentenceTransformer("all-MiniLM-L6-v2")
        resource = Resource.objects.get(id=ObjectId(resource_id))
        text = f"{resource.title} {resource.description} {' '.join(resource.tags)}"
        resource.embedding = model.encode(text).tolist()
        resource.save()
    except Exception as e:
        print(f"[Embedding] Failed for {resource_id}: {e}")


def serialize_subject(subject):
    """
    Helper to convert a Subject document to a JSON-serializable dict.
    Includes faculty name by looking up the User document.
    """
    faculty_name = None
    if subject.faculty_id:
        try:
            faculty = User.objects.get(id=subject.faculty_id)
            faculty_name = faculty.name
        except Exception:
            pass

    return {
        "id": str(subject.id),
        "code": subject.code,
        "name": subject.name,
        "semester": subject.semester,
        "faculty_id": str(subject.faculty_id) if subject.faculty_id else None,
        "faculty_name": faculty_name,
        "created_at": subject.created_at.isoformat() + "Z",
    }


def serialize_resource(resource, request=None):
    from accounts.models import User
    from repository.models import Subject

    uploader_name = None
    try:
        uploader = User.objects.get(id=resource.uploaded_by)
        uploader_name = uploader.name
    except Exception:
        pass

    subject_code = subject_name = None
    try:
        subject = Subject.objects.get(id=resource.subject_id)
        subject_code = subject.code
        subject_name = subject.name
    except Exception:
        pass

    base = {
        "id": str(resource.id),
        "title": resource.title,
        "description": resource.description,
        "resource_type": resource.resource_type,
        "semester": resource.semester,
        "subject_id": str(resource.subject_id),
        "subject_code": subject_code,
        "subject_name": subject_name,
        "unit": resource.unit,
        "tags": resource.tags,
        "uploaded_by": str(resource.uploaded_by),
        "uploader_name": uploader_name,
        "uploader_role": resource.uploader_role,
        "status": resource.status,
        "download_count": resource.download_count,
        "upload_date": resource.upload_date.isoformat() + "Z",
    }

    if resource.resource_type == "file":
        base["file_format"] = resource.file_format
        base["original_filename"] = resource.original_filename
        if resource.file_path:
            base["file_url"] = f"http://localhost:8000/media/{resource.file_path}"
    else:
        base["url"] = resource.url

    return base


class SubjectListCreateView(APIView):
    """
    GET: List all subjects, optionally filtered by semester.
    POST: Create a new subject (HOD only).
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsHOD()]
        return [IsAuthenticated()]

    def get(self, request):
        semester = request.query_params.get("semester")
        qs = Subject.objects.all()
        if semester:
            try:
                qs = qs.filter(semester=int(semester))
            except ValueError:
                return Response({"error": "Invalid semester parameter."}, status=400)
        return Response(
            {"count": qs.count(), "results": [serialize_subject(s) for s in qs]}
        )

    def post(self, request):
        data = request.data
        required_fields = ["code", "name", "semester", "faculty_id"]
        for field in required_fields:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        if Subject.objects(code=data["code"]).first():
            return Response({"error": "Subject code already exists."}, status=400)

        # Validate faculty_id points to a real faculty user
        try:
            faculty = User.objects.get(id=ObjectId(data["faculty_id"]))
            if faculty.role != "faculty":
                raise Exception("User is not a faculty member")
        except Exception:
            return Response({"error": "Invalid faculty_id."}, status=400)

        subject = Subject(
            code=data["code"],
            name=data["name"],
            semester=int(data["semester"]),
            faculty_id=ObjectId(data["faculty_id"]),
            created_by=request.user.id,
        )
        subject.save()

        # Add subject to faculty's subject_ids list
        if subject.id not in faculty.subject_ids:
            faculty.subject_ids.append(subject.id)
            faculty.save()

        return Response(serialize_subject(subject), status=201)


class SubjectDetailView(APIView):
    """
    PATCH: Edit a subject (HOD only).
    DELETE: Delete a subject (HOD only).
    """

    permission_classes = [IsAuthenticated, IsHOD]

    def get_subject(self, subject_id):
        try:
            return Subject.objects.get(id=ObjectId(subject_id))
        except Exception:
            return None

    def patch(self, request, subject_id):
        subject = self.get_subject(subject_id)
        if not subject:
            return Response({"error": "Subject not found."}, status=404)

        data = request.data
        if "name" in data:
            subject.name = data["name"]
        if "code" in data:
            # Check if new code already exists
            if (
                Subject.objects(code=data["code"]).first()
                and data["code"] != subject.code
            ):
                return Response({"error": "Subject code already exists."}, status=400)
            subject.code = data["code"]
        if "semester" in data:
            subject.semester = int(data["semester"])
        if "faculty_id" in data:
            try:
                new_faculty = User.objects.get(id=ObjectId(data["faculty_id"]))
                if new_faculty.role != "faculty":
                    raise Exception("User is not a faculty member")

                # Remove from old faculty, add to new faculty
                if subject.faculty_id:
                    old_faculty = User.objects(id=subject.faculty_id).first()
                    if old_faculty and subject.id in old_faculty.subject_ids:
                        old_faculty.subject_ids.remove(subject.id)
                        old_faculty.save()

                if subject.id not in new_faculty.subject_ids:
                    new_faculty.subject_ids.append(subject.id)
                    new_faculty.save()

                subject.faculty_id = ObjectId(data["faculty_id"])
            except Exception:
                return Response({"error": "Invalid faculty_id."}, status=400)

        subject.save()
        return Response(serialize_subject(subject))

    def delete(self, request, subject_id):
        subject = self.get_subject(subject_id)
        if not subject:
            return Response({"error": "Subject not found."}, status=404)

        # Prevent deletion if resources reference this subject
        if Resource.objects(subject_id=subject.id).count() > 0:
            return Response(
                {"error": "Cannot delete subject with existing resources."}, status=400
            )

        # Remove from faculty's subject_ids before deletion
        if subject.faculty_id:
            faculty = User.objects(id=subject.faculty_id).first()
            if faculty and subject.id in faculty.subject_ids:
                faculty.subject_ids.remove(subject.id)
                faculty.save()

        subject.delete()
        return Response({"message": "Subject deleted."})


class SemesterListView(APIView):
    """
    GET: List distinct semesters from available subjects.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        semesters = Subject.objects.distinct("semester")
        return Response({"semesters": sorted(semesters)})


class ResourceUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        resource_type = data.get("resource_type")

        if resource_type not in ["file", "url"]:
            return Response(
                {"error": "resource_type must be 'file' or 'url'."}, status=400
            )

        for field in ["title", "semester", "subject_id"]:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        # Validate subject exists
        try:
            subject = Subject.objects.get(id=ObjectId(data["subject_id"]))
        except Exception:
            return Response({"error": "Subject not found."}, status=404)

        # Determine status
        status = "approved" if request.user.role in ["faculty", "hod"] else "pending"

        # Parse tags
        raw_tags = data.get("tags", "")
        if isinstance(raw_tags, str):
            tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
        elif isinstance(raw_tags, list):
            tags = raw_tags
        else:
            tags = []

        resource = Resource(
            title=data["title"],
            description=data.get("description", ""),
            resource_type=resource_type,
            semester=int(data["semester"]),
            subject_id=subject.id,
            unit=data.get("unit", ""),
            tags=tags,
            uploaded_by=request.user.id,
            uploader_role=request.user.role,
            status=status,
        )

        if resource_type == "file":
            file = request.FILES.get("file")
            if not file:
                return Response({"error": "No file provided."}, status=400)

            try:
                file_format = validate_and_get_format(file)
            except ValueError as e:
                return Response({"error": str(e)}, status=400)

            # Build storage path and save
            relative_path = get_upload_path(data["semester"], subject.code, file.name)
            full_path = get_full_path(relative_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            with open(full_path, "wb+") as dest:
                for chunk in file.chunks():
                    dest.write(chunk)

            resource.file_path = relative_path
            resource.file_format = file_format
            resource.original_filename = file.name

        elif resource_type == "url":
            if not data.get("url"):
                return Response(
                    {"error": "url is required for url resources."}, status=400
                )
            resource.url = data["url"]

        resource.save()

        # Trigger embedding and RAG pipeline generation in background if approved
        if status == "approved":
            threading.Thread(
                target=generate_embedding, args=(str(resource.id),), daemon=True
            ).start()
            threading.Thread(
                target=process, args=(str(resource.id),), daemon=True
            ).start()

        return Response(serialize_resource(resource), status=201)


class ResourceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Resource.objects(status="approved")

        if semester := request.query_params.get("semester"):
            qs = qs.filter(semester=int(semester))
        if subject := request.query_params.get("subject"):
            qs = qs.filter(subject_id=ObjectId(subject))
        if faculty := request.query_params.get("faculty"):
            qs = qs.filter(uploaded_by=ObjectId(faculty))
        if fmt := request.query_params.get("format"):
            qs = qs.filter(file_format=fmt)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = 20
        start = (page - 1) * page_size
        total = qs.count()
        results = list(qs.order_by("-upload_date")[start : start + page_size])

        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": [serialize_resource(r) for r in results],
            }
        )


class ResourceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        # Non-approved resources visible only to uploader or faculty/hod
        if resource.status != "approved":
            if (
                str(resource.uploaded_by) != str(request.user.id)
                and request.user.role not in ["faculty", "hod"]
            ):
                return Response({"error": "Resource not found."}, status=404)

        return Response(serialize_resource(resource))

    def delete(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if (
            request.user.role != "hod"
            and str(resource.uploaded_by) != str(request.user.id)
        ):
            return Response({"error": "Permission denied."}, status=403)

        delete_file_if_exists(resource.file_path)
        resource.delete()
        return Response({"message": "Resource deleted."})


from accounts.authentication import MongoJWTAuthentication

class QueryParamMongoJWTAuthentication(MongoJWTAuthentication):
    def get_header(self, request):
        """
        Extracts the token from the request query parameters.
        """
        token = request.query_params.get('token')
        if token:
            # Fake an authorization header format so parent class can process it
            return f"Bearer {token}".encode('utf-8')
        return super().get_header(request)

class ResourceDownloadView(APIView):
    authentication_classes = [QueryParamMongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if resource.resource_type == "url":
            return Response({"error": "This resource is a URL, not a file."}, status=400)

        full_path = get_full_path(resource.file_path)
        if not full_path or not os.path.exists(full_path):
            return Response({"error": "File not found on disk."}, status=404)

        # Increment download count
        resource.download_count += 1
        resource.save()

        content_type, _ = mimetypes.guess_type(full_path)
        response = FileResponse(
            open(full_path, "rb"),
            content_type=content_type or "application/octet-stream",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{resource.original_filename}"'
        )
        return response


class ResourcePendingView(APIView):
    """
    GET: List all pending resources.
    Faculty sees resources for their subjects.
    HOD sees all.
    """

    permission_classes = [IsAuthenticated, IsFacultyOrHOD]

    def get(self, request):
        qs = Resource.objects(status="pending")

        if request.user.role == "faculty":
            qs = qs.filter(subject_id__in=request.user.subject_ids)

        results = list(qs.order_by("upload_date"))
        return Response(
            {
                "count": len(results),
                "results": [serialize_resource(r) for r in results],
            }
        )


class ResourceMySubmissionsView(APIView):
    """
    GET: List all resources uploaded by the current user (any status).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "student":
            return Response({"error": "Only students can view their submissions."}, status=403)
            
        qs = Resource.objects(uploaded_by=request.user.id)
        
        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = 20
        start = (page - 1) * page_size
        total = qs.count()
        results = list(qs.order_by("-upload_date")[start : start + page_size])

        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": [serialize_resource(r) for r in results],
            }
        )


class ResourceApproveView(APIView):
    """
    POST: Approve a pending resource.
    Triggers embedding generation in the background.
    """

    permission_classes = [IsAuthenticated, IsFacultyOrHOD]

    def post(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if resource.status != "pending":
            return Response({"error": "Resource is not pending."}, status=400)

        # Faculty scope check
        if request.user.role == "faculty":
            if resource.subject_id not in request.user.subject_ids:
                return Response({"error": "You do not own this subject."}, status=403)

        resource.status = "approved"
        resource.reviewed_by = request.user.id
        resource.reviewed_at = datetime.utcnow()
        resource.save()

        # Generate embedding and RAG pipeline now that it's approved
        threading.Thread(
            target=generate_embedding, args=(str(resource.id),), daemon=True
        ).start()
        threading.Thread(
            target=process, args=(str(resource.id),), daemon=True
        ).start()

        return Response(
            {
                "message": "Resource approved.",
                "resource_id": str(resource.id),
                "status": "approved",
            }
        )


class ResourceRejectView(APIView):
    """
    POST: Reject a pending resource and delete its file.
    """

    permission_classes = [IsAuthenticated, IsFacultyOrHOD]

    def post(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if resource.status != "pending":
            return Response({"error": "Resource is not pending."}, status=400)

        # Faculty scope check
        if request.user.role == "faculty":
            if resource.subject_id not in request.user.subject_ids:
                return Response({"error": "You do not own this subject."}, status=403)

        # Delete file from disk
        delete_file_if_exists(resource.file_path)

        resource.status = "rejected"
        resource.reviewed_by = request.user.id
        resource.reviewed_at = datetime.utcnow()
        resource.save()

        return Response(
            {
                "message": "Resource rejected and deleted.",
                "resource_id": str(resource.id),
                "status": "rejected",
            }
        )
