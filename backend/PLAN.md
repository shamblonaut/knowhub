# Corpus — Backend Implementation Plan

> Stage-by-stage build guide for P1 and P2.  
> Owner: P1 = `accounts/`, `core/` | P2 = `repository/`, `notices/`, `analytics/`, `search/`  
> Read `ARCHITECTURE.md` and `API_DESIGN.md` before writing any code.

---

## Ground Rules Before You Start

- **No Django ORM.** No `migrations`, no `django.contrib.auth`, no `Model.objects.create()`. Everything is MongoEngine.
- **No `django.contrib.admin`.** It is not in `INSTALLED_APPS`.
- **Password hashing** uses `passlib[bcrypt]`, not Django's `make_password`.
- **JWT payload** carries `user_id` (string of ObjectId) and `role`. A custom auth class reads this.
- **Always use `str()` when comparing ObjectIds** to avoid silent mismatches.
- **Never block the HTTP response** with the embedding generation — run it in a background thread.
- **`is_new` on notices is never stored** — always compute it at serialization time.
- **File deletion on reject is mandatory** — delete the physical file from disk via `os.remove()`.

---

## Stage Overview

| Stage | Owner | What Gets Built                                               | Checkpoint |
| ----- | ----- | ------------------------------------------------------------- | ---------- |
| 1     | P1    | Core infra: permissions, auth backend, JWT utils              | H2         |
| 2     | P1    | Auth endpoints: register, login, me, faculty create, activate | H4         |
| 3     | P2    | Subject & semester endpoints                                  | H6         |
| 4     | P2    | Resource upload + listing + download                          | H9         |
| 5     | P2    | Approval system: pending queue, approve, reject               | H11        |
| 6     | P2    | Notice board: CRUD + is_new logic                             | H13        |
| 7     | P2    | Analytics endpoints                                           | H16        |
| 8     | P2    | AI search + recommendations                                   | H19        |
| 9     | P1+P2 | Seed script + integration smoke test                          | H21        |

---

## Stage 1 — Core Infrastructure (P1)

**Target: H0 → H2**  
**Files: `accounts/authentication.py`, `accounts/permissions.py`, `core/settings.py`**

This stage has no endpoints. It builds the foundation everything else depends on. Do this first and do it right — a bug here breaks every other stage.

---

### 1.1 Install dependencies

```bash
cd backend
source venv/bin/activate
pip install passlib[bcrypt] bson
pip freeze > requirements.txt
```

---

### 1.2 Custom JWT Authentication Class

MongoEngine users are not Django ORM users. `JWTAuthentication` normally calls `User.objects.get(id=...)` on the Django ORM — that won't work here. We override `get_user()` to query MongoEngine instead.

Create `accounts/authentication.py`:

```python
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from bson import ObjectId


class MongoJWTAuthentication(JWTAuthentication):
    """
    Overrides the default JWTAuthentication to look up users
    from MongoEngine instead of the Django ORM.
    """
    def get_user(self, validated_token):
        from accounts.models import User
        user_id = validated_token.get("user_id")
        if not user_id:
            return None
        try:
            return User.objects.get(id=ObjectId(user_id))
        except Exception:
            return None


def get_tokens_for_user(user):
    """
    Manually creates a JWT token pair with user_id and role
    embedded in the payload.

    Usage:
        tokens = get_tokens_for_user(user)
        tokens['access']   # access token string
        tokens['refresh']  # refresh token string
    """
    token = RefreshToken()
    token["user_id"] = str(user.id)
    token["role"] = user.role
    return {
        "refresh": str(token),
        "access": str(token.access_token),
    }
```

Then register it in `core/settings.py` under `REST_FRAMEWORK`:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.MongoJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
```

---

### 1.3 Permission Classes

Create `accounts/permissions.py`:

```python
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
```

---

### 1.4 Password Utilities

Create `accounts/utils.py`:

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

---

### 1.5 Checkpoint

At end of Stage 1, nothing is runnable yet — but run:

```bash
python manage.py check
```

Should still show **0 issues**. If it doesn't, fix before proceeding.

---

## Stage 2 — Auth Endpoints (P1)

**Target: H2 → H4**  
**Files: `accounts/views.py`, `accounts/urls.py`**  
**Endpoints: register, login, token/refresh, me, faculty/create, users/<id>/activate**

---

### 2.1 `POST /auth/register/`

Logic:

1. Validate all required fields: `name`, `email`, `password`, `usn`, `semester`
2. Check email uniqueness: `User.objects(email=email).first()` → 400 if exists
3. Check USN uniqueness: `User.objects(usn=usn).first()` → 400 if exists
4. Validate semester is between 1–6
5. Hash password with `hash_password()`
6. Create and save `User` document with `role='student'`
7. Return 201 with user data (no tokens on register — force them to login)

```python
# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User
from .utils import hash_password, verify_password
from .authentication import get_tokens_for_user
from .permissions import IsHOD


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        required = ['name', 'email', 'password', 'usn', 'semester']
        for field in required:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        if User.objects(email=data['email']).first():
            return Response({"error": "Email already in use."}, status=400)

        if User.objects(usn=data['usn']).first():
            return Response({"error": "USN already registered."}, status=400)

        semester = int(data['semester'])
        if not (1 <= semester <= 6):
            return Response({"error": "Semester must be between 1 and 6."}, status=400)

        user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hash_password(data['password']),
            role='student',
            usn=data['usn'],
            semester=semester,
        )
        user.save()

        return Response({
            "message": "Registration successful.",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "usn": user.usn,
                "semester": user.semester,
            }
        }, status=201)
```

---

### 2.2 `POST /auth/login/`

Logic:

1. Validate `email` and `password` present
2. Look up user by email
3. Check `is_active` — return 403 if deactivated
4. Verify password with `verify_password()`
5. Call `get_tokens_for_user(user)` to generate JWT pair
6. Return tokens + user object

```python
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=400)

        user = User.objects(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return Response({"error": "Invalid email or password."}, status=401)

        if not user.is_active:
            return Response({"error": "Account is deactivated."}, status=403)

        tokens = get_tokens_for_user(user)

        return Response({
            **tokens,
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
        })
```

---

### 2.3 `GET /auth/me/`

Logic:

1. `request.user` is already populated by `MongoJWTAuthentication`
2. Return the full user profile
3. Include `subject_ids` only for faculty

```python
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() + "Z",
        }
        if user.role == 'student':
            data['usn'] = user.usn
            data['semester'] = user.semester
        if user.role == 'faculty':
            data['subject_ids'] = [str(sid) for sid in user.subject_ids]
        return Response(data)
```

---

### 2.4 `POST /auth/faculty/create/`

Logic:

1. Require `IsHOD` permission
2. Validate `name`, `email`, `password`
3. Check email uniqueness
4. Create user with `role='faculty'`, empty `subject_ids`
5. Return 201

```python
class CreateFacultyView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def post(self, request):
        data = request.data
        for field in ['name', 'email', 'password']:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        if User.objects(email=data['email']).first():
            return Response({"error": "Email already in use."}, status=400)

        user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hash_password(data['password']),
            role='faculty',
            subject_ids=[],
        )
        user.save()

        return Response({
            "message": "Faculty account created.",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
        }, status=201)
```

---

### 2.5 `PATCH /auth/users/<id>/activate/`

Logic:

1. Require `IsHOD`
2. Look up user by id
3. Set `is_active` from request body
4. Save and return result

```python
from bson import ObjectId

class ActivateUserView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=ObjectId(user_id))
        except Exception:
            return Response({"error": "User not found."}, status=404)

        is_active = request.data.get('is_active')
        if is_active is None:
            return Response({"error": "'is_active' is required."}, status=400)

        user.is_active = bool(is_active)
        user.save()

        action = "activated" if user.is_active else "deactivated"
        return Response({
            "message": f"User {action}.",
            "user_id": str(user.id),
            "is_active": user.is_active,
        })
```

---

### 2.6 Token Refresh

Use simplejwt's built-in view — no custom code needed:

```python
# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, MeView, CreateFacultyView, ActivateUserView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('me/', MeView.as_view()),
    path('faculty/create/', CreateFacultyView.as_view()),
    path('users/<str:user_id>/activate/', ActivateUserView.as_view()),
]
```

---

### 2.7 Stage 2 Checkpoint

Test with curl or Postman:

```bash
# Register a student
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"s@test.com","password":"Test@123","usn":"1BCA001","semester":4}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"s@test.com","password":"Test@123"}'

# Use the access token from login response:
curl http://localhost:8000/api/v1/auth/me/ \
  -H "Authorization: Bearer <access_token>"
```

Expected: 201 on register, 200 on login with tokens, 200 on /me/ with user data.

---

## Stage 3 — Subjects & Semesters (P2)

**Target: H4 → H6**  
**Files: `repository/models.py` (Subject), `repository/views.py`, `repository/urls.py`**

---

### 3.1 Subject Model

Already written in Step 7 of setup. Verify it's in `repository/models.py`.

---

### 3.2 Helper: Serialize Subject

Write this once and reuse in all subject views:

```python
def serialize_subject(subject):
    from accounts.models import User
    from bson import ObjectId

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
```

---

### 3.3 `GET /subjects/` — list, `POST /subjects/` — create

```python
class SubjectListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsHOD()]
        return [IsAuthenticated()]

    def get(self, request):
        semester = request.query_params.get('semester')
        qs = Subject.objects.all()
        if semester:
            qs = qs.filter(semester=int(semester))
        return Response({
            "count": qs.count(),
            "results": [serialize_subject(s) for s in qs]
        })

    def post(self, request):
        data = request.data
        for field in ['code', 'name', 'semester', 'faculty_id']:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        if Subject.objects(code=data['code']).first():
            return Response({"error": "Subject code already exists."}, status=400)

        # Validate faculty_id points to a real faculty user
        try:
            faculty = User.objects.get(id=ObjectId(data['faculty_id']))
            if faculty.role != 'faculty':
                raise Exception()
        except Exception:
            return Response({"error": "Invalid faculty_id."}, status=400)

        subject = Subject(
            code=data['code'],
            name=data['name'],
            semester=int(data['semester']),
            faculty_id=ObjectId(data['faculty_id']),
            created_by=request.user.id,
        )
        subject.save()

        # Add subject to faculty's subject_ids list
        faculty.subject_ids.append(subject.id)
        faculty.save()

        return Response(serialize_subject(subject), status=201)
```

---

### 3.4 `PATCH /subjects/<id>/` — edit, `DELETE /subjects/<id>/` — delete

```python
class SubjectDetailView(APIView):
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
        if 'name' in data:
            subject.name = data['name']
        if 'code' in data:
            subject.code = data['code']
        if 'semester' in data:
            subject.semester = int(data['semester'])
        if 'faculty_id' in data:
            try:
                new_faculty = User.objects.get(id=ObjectId(data['faculty_id']))
                if new_faculty.role != 'faculty':
                    raise Exception()
                # Remove from old faculty, add to new faculty
                if subject.faculty_id:
                    old_faculty = User.objects(id=subject.faculty_id).first()
                    if old_faculty and subject.id in old_faculty.subject_ids:
                        old_faculty.subject_ids.remove(subject.id)
                        old_faculty.save()
                new_faculty.subject_ids.append(subject.id)
                new_faculty.save()
                subject.faculty_id = ObjectId(data['faculty_id'])
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
                {"error": "Cannot delete subject with existing resources."},
                status=400
            )

        subject.delete()
        return Response({"message": "Subject deleted."})
```

---

### 3.5 `GET /semesters/`

```python
class SemesterListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        semesters = Subject.objects.distinct('semester')
        return Response({"semesters": sorted(semesters)})
```

---

### 3.6 URLs

```python
# repository/urls.py (subjects section)
path('subjects/', SubjectListCreateView.as_view()),
path('subjects/<str:subject_id>/', SubjectDetailView.as_view()),
path('semesters/', SemesterListView.as_view()),
```

---

## Stage 4 — Resource Upload, Listing & Download (P2)

**Target: H6 → H9**  
**Files: `repository/views.py` (resource views), `repository/utils.py`**

---

### 4.1 File Validation Utility

Create `repository/utils.py`:

```python
import os
from django.conf import settings

ALLOWED_EXTENSIONS = {
    'pdf':  'pdf',
    'ppt':  'ppt', 'pptx': 'ppt',
    'doc':  'doc', 'docx': 'doc',
    'jpg':  'image', 'jpeg': 'image', 'png': 'image',
}


def validate_and_get_format(file):
    """
    Validates file extension and size.
    Returns the format string ('pdf', 'ppt', 'doc', 'image').
    Raises ValueError on failure.
    """
    ext = file.name.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '.{ext}' is not allowed.")
    if file.size > settings.MAX_UPLOAD_SIZE:
        raise ValueError("File size exceeds 50MB limit.")
    return ALLOWED_EXTENSIONS[ext]


def get_upload_path(semester, subject_code, filename):
    """Returns relative path from MEDIA_ROOT."""
    return os.path.join('uploads', str(semester), subject_code, filename)


def get_full_path(relative_path):
    """Returns absolute path on disk."""
    return os.path.join(settings.MEDIA_ROOT, relative_path)


def delete_file_if_exists(relative_path):
    """Silently deletes a file from disk if it exists."""
    if not relative_path:
        return
    full_path = get_full_path(relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)
```

---

### 4.2 Resource Serializer Helper

```python
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

    if resource.resource_type == 'file':
        base['file_format'] = resource.file_format
        base['original_filename'] = resource.original_filename
        if resource.file_path:
            base['file_url'] = f"http://localhost:8000/media/{resource.file_path}"
    else:
        base['url'] = resource.url

    return base
```

---

### 4.3 `POST /resources/upload/`

Logic:

1. Determine `resource_type` from request (`file` or `url`)
2. For files: validate extension + size, save to `media/uploads/<semester>/<subject_code>/`
3. Determine initial status: faculty/hod → `approved`, student → `pending`
4. Parse tags from comma-separated string (for multipart) or list (for JSON)
5. Save Resource document
6. If approved, trigger embedding in background thread

```python
import os
import threading
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from .models import Resource, Subject
from .utils import validate_and_get_format, get_upload_path, get_full_path
from bson import ObjectId


class ResourceUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        resource_type = data.get('resource_type')

        if resource_type not in ['file', 'url']:
            return Response({"error": "resource_type must be 'file' or 'url'."}, status=400)

        for field in ['title', 'semester', 'subject_id']:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=400)

        # Validate subject exists
        try:
            subject = Subject.objects.get(id=ObjectId(data['subject_id']))
        except Exception:
            return Response({"error": "Subject not found."}, status=404)

        # Determine status
        status = 'approved' if request.user.role in ['faculty', 'hod'] else 'pending'

        # Parse tags
        raw_tags = data.get('tags', '')
        if isinstance(raw_tags, str):
            tags = [t.strip() for t in raw_tags.split(',') if t.strip()]
        elif isinstance(raw_tags, list):
            tags = raw_tags
        else:
            tags = []

        resource = Resource(
            title=data['title'],
            description=data.get('description', ''),
            resource_type=resource_type,
            semester=int(data['semester']),
            subject_id=subject.id,
            unit=data.get('unit', ''),
            tags=tags,
            uploaded_by=request.user.id,
            uploader_role=request.user.role,
            status=status,
        )

        if resource_type == 'file':
            file = request.FILES.get('file')
            if not file:
                return Response({"error": "No file provided."}, status=400)

            try:
                file_format = validate_and_get_format(file)
            except ValueError as e:
                return Response({"error": str(e)}, status=400)

            # Build storage path and save
            relative_path = get_upload_path(data['semester'], subject.code, file.name)
            full_path = get_full_path(relative_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            with open(full_path, 'wb+') as dest:
                for chunk in file.chunks():
                    dest.write(chunk)

            resource.file_path = relative_path
            resource.file_format = file_format
            resource.original_filename = file.name

        elif resource_type == 'url':
            if not data.get('url'):
                return Response({"error": "url is required for url resources."}, status=400)
            resource.url = data['url']

        resource.save()

        # Trigger embedding generation in background if approved
        if status == 'approved':
            threading.Thread(
                target=generate_embedding,
                args=(str(resource.id),),
                daemon=True
            ).start()

        return Response(serialize_resource(resource), status=201)
```

---

### 4.4 Embedding Generation (Background Thread)

```python
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

        model = SentenceTransformer('all-MiniLM-L6-v2')
        resource = Resource.objects.get(id=ObjectId(resource_id))
        text = f"{resource.title} {resource.description} {' '.join(resource.tags)}"
        resource.embedding = model.encode(text).tolist()
        resource.save()
    except Exception as e:
        print(f"[Embedding] Failed for {resource_id}: {e}")
```

> Put `generate_embedding` at the top of `repository/views.py` or in `repository/utils.py`. The model is loaded once and cached in memory by `sentence_transformers` on subsequent calls.

---

### 4.5 `GET /resources/` — list approved resources with filters

```python
class ResourceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Resource.objects(status='approved')

        if semester := request.query_params.get('semester'):
            qs = qs.filter(semester=int(semester))
        if subject := request.query_params.get('subject'):
            qs = qs.filter(subject_id=ObjectId(subject))
        if faculty := request.query_params.get('faculty'):
            qs = qs.filter(uploaded_by=ObjectId(faculty))
        if fmt := request.query_params.get('format'):
            qs = qs.filter(file_format=fmt)

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = 20
        start = (page - 1) * page_size
        total = qs.count()
        results = list(qs.order_by('-upload_date')[start:start + page_size])

        return Response({
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": [serialize_resource(r) for r in results]
        })
```

---

### 4.6 `GET /resources/<id>/` — single resource

```python
class ResourceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        # Non-approved resources visible only to uploader or faculty/hod
        if resource.status != 'approved':
            if (str(resource.uploaded_by) != str(request.user.id)
                    and request.user.role not in ['faculty', 'hod']):
                return Response({"error": "Resource not found."}, status=404)

        return Response(serialize_resource(resource))

    def delete(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if (request.user.role != 'hod'
                and str(resource.uploaded_by) != str(request.user.id)):
            return Response({"error": "Permission denied."}, status=403)

        delete_file_if_exists(resource.file_path)
        resource.delete()
        return Response({"message": "Resource deleted."})
```

---

### 4.7 `GET /resources/<id>/download/`

```python
import mimetypes
from django.http import FileResponse

class ResourceDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if resource.resource_type == 'url':
            return Response({"error": "This resource is a URL, not a file."}, status=400)

        full_path = get_full_path(resource.file_path)
        if not os.path.exists(full_path):
            return Response({"error": "File not found on disk."}, status=404)

        # Increment download count
        resource.download_count += 1
        resource.save()

        content_type, _ = mimetypes.guess_type(full_path)
        response = FileResponse(
            open(full_path, 'rb'),
            content_type=content_type or 'application/octet-stream'
        )
        response['Content-Disposition'] = f'attachment; filename="{resource.original_filename}"'
        return response
```

---

### 4.8 URLs (resources section)

```python
path('resources/', ResourceListView.as_view()),
path('resources/pending/', ResourcePendingView.as_view()),   # defined in Stage 5
path('resources/upload/', ResourceUploadView.as_view()),
path('resources/<str:resource_id>/', ResourceDetailView.as_view()),
path('resources/<str:resource_id>/download/', ResourceDownloadView.as_view()),
path('resources/<str:resource_id>/approve/', ResourceApproveView.as_view()),  # Stage 5
path('resources/<str:resource_id>/reject/', ResourceRejectView.as_view()),    # Stage 5
```

> **Important:** `pending/` and `upload/` must come before `<str:resource_id>/` in `urlpatterns` or Django will try to match "pending" and "upload" as resource IDs.

---

## Stage 5 — Approval System (P2)

**Target: H9 → H11**  
**Files: `repository/views.py`**

---

### 5.1 `GET /resources/pending/`

Faculty sees only resources in their subjects. HOD sees all.

```python
class ResourcePendingView(APIView):
    permission_classes = [IsAuthenticated, IsFacultyOrHOD]

    def get(self, request):
        qs = Resource.objects(status='pending')

        if request.user.role == 'faculty':
            qs = qs.filter(subject_id__in=request.user.subject_ids)

        results = list(qs.order_by('upload_date'))
        return Response({
            "count": len(results),
            "results": [serialize_resource(r) for r in results]
        })
```

---

### 5.2 `POST /resources/<id>/approve/`

```python
from datetime import datetime

class ResourceApproveView(APIView):
    permission_classes = [IsAuthenticated, IsFacultyOrHOD]

    def post(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if resource.status != 'pending':
            return Response({"error": "Resource is not pending."}, status=400)

        # Faculty scope check
        if request.user.role == 'faculty':
            if resource.subject_id not in request.user.subject_ids:
                return Response({"error": "You do not own this subject."}, status=403)

        resource.status = 'approved'
        resource.reviewed_by = request.user.id
        resource.reviewed_at = datetime.utcnow()
        resource.save()

        # Generate embedding now that it's approved
        threading.Thread(
            target=generate_embedding,
            args=(str(resource.id),),
            daemon=True
        ).start()

        return Response({
            "message": "Resource approved.",
            "resource_id": str(resource.id),
            "status": "approved",
        })
```

---

### 5.3 `POST /resources/<id>/reject/`

```python
class ResourceRejectView(APIView):
    permission_classes = [IsAuthenticated, IsFacultyOrHOD]

    def post(self, request, resource_id):
        try:
            resource = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if resource.status != 'pending':
            return Response({"error": "Resource is not pending."}, status=400)

        # Faculty scope check
        if request.user.role == 'faculty':
            if resource.subject_id not in request.user.subject_ids:
                return Response({"error": "You do not own this subject."}, status=403)

        # Delete file from disk
        delete_file_if_exists(resource.file_path)

        resource.status = 'rejected'
        resource.reviewed_by = request.user.id
        resource.reviewed_at = datetime.utcnow()
        resource.save()

        return Response({
            "message": "Resource rejected and deleted.",
            "resource_id": str(resource.id),
            "status": "rejected",
        })
```

---

### 5.4 Stage 5 Checkpoint

Test the full approval flow:

1. Login as student → upload a file → verify it does NOT appear in `GET /resources/`
2. Login as faculty → check `GET /resources/pending/` → resource appears
3. Faculty approves → verify it NOW appears in `GET /resources/`
4. Upload another as student → faculty rejects → verify file is deleted from `media/` folder

---

## Stage 6 — Notice Board (P2)

**Target: H11 → H13**  
**Files: `notices/models.py`, `notices/views.py`, `notices/urls.py`**

---

### 6.1 Notice Serializer

```python
from datetime import datetime, timedelta

def serialize_notice(notice):
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
```

---

### 6.2 `GET /notices/` and `POST /notices/`

```python
class NoticeListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsFacultyOrHOD()]
        return [IsAuthenticated()]

    def get(self, request):
        # Pinned first, then newest
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
            from datetime import datetime
            notice.expires_at = datetime.fromisoformat(data['expires_at'].replace('Z', ''))

        notice.save()
        return Response(serialize_notice(notice), status=201)
```

---

### 6.3 `PATCH /notices/<id>/` and `DELETE /notices/<id>/`

```python
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

        notice.save()
        return Response(serialize_notice(notice))

    def delete(self, request, notice_id):
        if request.user.role != 'hod':
            return Response({"error": "Only HOD can delete notices."}, status=403)

        notice = self.get_notice(notice_id)
        if not notice:
            return Response({"error": "Notice not found."}, status=404)

        notice.delete()
        return Response({"message": "Notice deleted."})
```

---

## Stage 7 — Analytics (P2)

**Target: H13 → H16**  
**Files: `analytics/views.py`, `analytics/urls.py`**

All analytics views require `IsHOD`.

---

### 7.1 Summary

```python
class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        from accounts.models import User
        from repository.models import Resource
        from notices.models import Notice

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
```

---

### 7.2 Uploads by Semester

```python
class UploadsBySemesterView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        from repository.models import Resource
        data = []
        for sem in range(1, 7):
            count = Resource.objects(status='approved', semester=sem).count()
            data.append({"semester": sem, "count": count})
        return Response({"data": data})
```

---

### 7.3 Top Resources

```python
class TopResourcesView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        from repository.models import Resource, Subject
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
```

---

### 7.4 Faculty Activity

```python
class FacultyActivityView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        from accounts.models import User
        from repository.models import Resource

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
```

---

### 7.5 Uploads by Format

```python
class UploadsByFormatView(APIView):
    permission_classes = [IsAuthenticated, IsHOD]

    def get(self, request):
        from repository.models import Resource
        data = []
        for fmt in ['pdf', 'ppt', 'doc', 'image']:
            count = Resource.objects(status='approved', file_format=fmt).count()
            data.append({"format": fmt, "count": count})
        return Response({"data": data})
```

---

## Stage 8 — AI Search & Recommendations (P2)

**Target: H16 → H19**  
**Files: `search/views.py`, `search/urls.py`**

---

### 8.1 `GET /search/`

Hybrid flow: load all approved resources with embeddings → embed query → cosine similarity → sort.

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from repository.models import Resource, Subject
        from accounts.models import User

        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({"error": "Search query 'q' is required."}, status=400)

        # Base queryset — approved only
        qs = Resource.objects(status='approved')

        # Apply filters
        if semester := request.query_params.get('semester'):
            qs = qs.filter(semester=int(semester))
        if subject := request.query_params.get('subject'):
            from bson import ObjectId
            qs = qs.filter(subject_id=ObjectId(subject))
        if fmt := request.query_params.get('format'):
            qs = qs.filter(file_format=fmt)

        resources = list(qs)
        if not resources:
            return Response({"query": q, "count": 0, "results": []})

        # Embed the query
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')
        query_embedding = model.encode(q)

        # Score resources with embeddings
        scored = []
        for r in resources:
            if r.embedding:
                sim = cosine_similarity(
                    [query_embedding],
                    [np.array(r.embedding)]
                )[0][0]
            else:
                # Fallback: score by title keyword match
                sim = 0.1 if q.lower() in r.title.lower() else 0.0

            scored.append((r, float(sim)))

        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)

        results = []
        for resource, score in scored:
            data = serialize_resource(resource)
            data['similarity_score'] = round(score, 4)
            results.append(data)

        return Response({
            "query": q,
            "count": len(results),
            "results": results,
        })
```

---

### 8.2 `GET /search/recommend/<resource_id>/`

```python
class RecommendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, resource_id):
        from repository.models import Resource
        from bson import ObjectId

        try:
            target = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if not target.embedding:
            return Response({"error": "Resource has no embedding yet."}, status=400)

        # All other approved resources with embeddings
        candidates = Resource.objects(
            status='approved',
            id__ne=target.id
        ).filter(embedding__exists=True)

        target_vec = np.array(target.embedding)
        scored = []
        for r in candidates:
            sim = cosine_similarity([target_vec], [np.array(r.embedding)])[0][0]
            scored.append((r, float(sim)))

        scored.sort(key=lambda x: x[1], reverse=True)
        top5 = scored[:5]

        recommendations = []
        for resource, score in top5:
            from repository.models import Subject
            subject_code = None
            try:
                subject_code = Subject.objects.get(id=resource.subject_id).code
            except Exception:
                pass

            rec = {
                "id": str(resource.id),
                "title": resource.title,
                "subject_code": subject_code,
                "similarity_score": round(score, 4),
            }
            if resource.resource_type == 'file':
                rec['file_format'] = resource.file_format
                rec['file_url'] = f"http://localhost:8000/media/{resource.file_path}"
            else:
                rec['url'] = resource.url
            recommendations.append(rec)

        return Response({
            "resource_id": str(target.id),
            "recommendations": recommendations,
        })
```

---

### 8.3 Search URLs

```python
# search/urls.py
from django.urls import path
from .views import SearchView, RecommendView

urlpatterns = [
    path('search/', SearchView.as_view()),
    path('search/recommend/<str:resource_id>/', RecommendView.as_view()),
]
```

---

## Stage 9 — Seed Script & Smoke Test (P1 + P2)

**Target: H19 → H21**  
**File: `seed.py` in backend root**

Run this once before the demo to populate realistic test data.

```python
# backend/seed.py
import mongoengine
mongoengine.connect(db='corpus', host='localhost', port=27017)

from accounts.models import User
from accounts.utils import hash_password
from repository.models import Subject, Resource
from notices.models import Notice
from datetime import datetime

print("Clearing existing data...")
User.drop_collection()
Subject.drop_collection()
Resource.drop_collection()
Notice.drop_collection()

print("Creating users...")
hod = User(name="Dr. Mehta", email="hod@bca.edu",
           password_hash=hash_password("Demo@123"), role="hod").save()

faculty1 = User(name="Prof. Sharma", email="faculty@bca.edu",
                password_hash=hash_password("Demo@123"), role="faculty").save()

student = User(name="Rahul Sharma", email="student@bca.edu",
               password_hash=hash_password("Demo@123"), role="student",
               usn="1BCA21CS001", semester=4).save()

print("Creating subjects...")
s1 = Subject(code="BCA401", name="Data Structures", semester=4,
             faculty_id=faculty1.id, created_by=hod.id).save()
s2 = Subject(code="BCA402", name="Operating Systems", semester=4,
             faculty_id=faculty1.id, created_by=hod.id).save()
s3 = Subject(code="BCA301", name="DBMS", semester=3,
             faculty_id=faculty1.id, created_by=hod.id).save()

# Assign subjects to faculty
faculty1.subject_ids = [s1.id, s2.id, s3.id]
faculty1.save()

print("Creating notices...")
Notice(title="Welcome to Corpus",
       body="All study materials are now available centrally. Upload your notes!",
       posted_by=hod.id, posted_by_name="Dr. Mehta", is_pinned=True).save()

Notice(title="Mid-Term Schedule Released",
       body="Mid-term exams are scheduled for March 10-14. Timetable posted on the board.",
       posted_by=hod.id, posted_by_name="Dr. Mehta").save()

Notice(title="Assignment 2 Extended",
       body="Deadline for Assignment 2 (BCA401) has been extended to Feb 28.",
       posted_by=faculty1.id, posted_by_name="Prof. Sharma").save()

print("Done! Seed complete.")
print("\nDemo accounts:")
print("  HOD     → hod@bca.edu / Demo@123")
print("  Faculty → faculty@bca.edu / Demo@123")
print("  Student → student@bca.edu / Demo@123")
```

Run it:

```bash
cd backend
source venv/bin/activate
python seed.py
```

---

## Final Smoke Test Checklist

Run through all of these before calling the backend done:

```
AUTH
[ ] POST /auth/register/ → 201 with student data
[ ] POST /auth/register/ same USN → 400 "USN already registered."
[ ] POST /auth/login/ valid creds → 200 with access + refresh tokens
[ ] POST /auth/login/ wrong password → 401
[ ] GET /auth/me/ with token → 200 with user profile
[ ] GET /auth/me/ without token → 401
[ ] POST /auth/faculty/create/ as HOD → 201
[ ] POST /auth/faculty/create/ as student → 403

SUBJECTS
[ ] GET /subjects/ → 200 list
[ ] POST /subjects/ as HOD → 201
[ ] POST /subjects/ as student → 403
[ ] DELETE /subjects/<id>/ with resources → 400 "Cannot delete..."

RESOURCES
[ ] POST /resources/upload/ as faculty (file) → 201, status=approved
[ ] POST /resources/upload/ as student (file) → 201, status=pending
[ ] POST /resources/upload/ with .exe file → 400
[ ] GET /resources/ → only approved resources returned
[ ] GET /resources/pending/ as faculty → only their subject's pending resources
[ ] POST /resources/<id>/approve/ as faculty (wrong subject) → 403
[ ] POST /resources/<id>/approve/ as faculty (correct subject) → 200
[ ] POST /resources/<id>/reject/ → 200, file deleted from disk
[ ] GET /resources/<id>/download/ → file streams correctly

NOTICES
[ ] GET /notices/ → pinned notices first, is_new=true for new ones
[ ] POST /notices/ as student → 403
[ ] POST /notices/ as faculty → 201
[ ] PATCH /notices/<id>/ is_pinned=true as faculty → 403
[ ] PATCH /notices/<id>/ is_pinned=true as HOD → 200
[ ] DELETE /notices/<id>/ as faculty → 403
[ ] DELETE /notices/<id>/ as HOD → 200

ANALYTICS
[ ] GET /analytics/summary/ as student → 403
[ ] GET /analytics/summary/ as HOD → 200 with counts
[ ] GET /analytics/uploads-by-semester/ → 200
[ ] GET /analytics/top-resources/ → 200
[ ] GET /analytics/faculty-activity/ → 200

SEARCH
[ ] GET /search/?q=data → 200 with results
[ ] GET /search/ (no q) → 400
[ ] GET /search/recommend/<id>/ → 200 with 5 recommendations
```

---

## Common Pitfalls & Fixes

| Symptom                             | Cause                                      | Fix                                                       |
| ----------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| `ObjectId is not JSON serializable` | Returning raw ObjectId in response         | Always wrap with `str(obj.id)`                            |
| Faculty sees all pending resources  | Missing subject scope filter               | Check `subject_id__in=request.user.subject_ids`           |
| `401` on every request after login  | `MongoJWTAuthentication` not registered    | Check `DEFAULT_AUTHENTICATION_CLASSES` in settings        |
| File not deleted after reject       | `delete_file_if_exists()` not called       | Call it before `resource.save()` in reject view           |
| `is_new` always False               | Comparing timezone-aware vs naive datetime | Use `datetime.utcnow()` consistently, no `timezone.now()` |
| Embedding blocks response           | Model load in request thread               | Always run `generate_embedding()` in `threading.Thread`   |
| `500` on search with no embeddings  | Calling cosine_similarity on empty list    | Check `if r.embedding:` before scoring                    |
