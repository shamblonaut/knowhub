from rest_framework.permissions import BasePermission


class IsHOD(BasePermission):
    """Allows access only to users with role='hod'."""
    def has_permission(self, request, view):
        return (
            request.user is not None
            and hasattr(request.user, 'role')
            and request.user.role == 'hod'
        )


class IsFacultyOrHOD(BasePermission):
    """Allows access to faculty and hod roles."""
    def has_permission(self, request, view):
        return (
            request.user is not None
            and hasattr(request.user, 'role')
            and request.user.role in ['faculty', 'hod']
        )


class IsOwnerOrHOD(BasePermission):
    """
    Object-level permission.
    HOD can act on any object.
    Others can only act on objects they uploaded.

    The object must have an `uploaded_by` field (ObjectId).
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'hod':
            return True
        return str(obj.uploaded_by) == str(request.user.id)
