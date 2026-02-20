from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
from accounts.models import User
from accounts.permissions import IsHOD
from .models import Subject


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
        from repository.models import Resource

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
