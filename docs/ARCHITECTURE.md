# Corpus — Architecture Reference

> Machine-readable reference for AI coding agents. Last updated: 2026-02-22.

---

## Project Overview

**Name:** Departmental Digital Resource & Corpus  
**Purpose:** Centralized web portal for academic resource sharing between HOD, Faculty, and Students.  
**Stack:** React (Vite) + Django REST Framework + MongoDB (MongoEngine) + Local File Storage  
**Demo:** Localhost only. Backend on :8000, Frontend on :5173.

---

## Repository Structure

```
Corpus/
├── backend/                        # Django project
│   ├── accounts/                   # Auth, user management
│   ├── analytics/                  # HOD dashboard stats
│   ├── core/                       # Project config (settings, urls, wsgi)
│   ├── media/uploads/              # MEDIA_ROOT — uploaded files on disk
│   ├── manage.py                   # Django management script
│   ├── notices/                    # Notice board
│   ├── rag/                        # RAG-based AI study assistant
│   ├── repository/                 # File uploads, approval, download
│   ├── search/                     # AI-powered search
└── frontend/                       # React + Vite app
    └── src/
        ├── api/                    # Axios instance + endpoint functions
        ├── components/             # Reusable UI components
        ├── context/                # AuthContext (JWT, role)
        ├── hooks/                  # Custom hooks
        └── pages/                  # Route-level page components
```

---

## User Roles

| Role    | Value     | Description                                                                                              |
| ------- | --------- | -------------------------------------------------------------------------------------------------------- |
| HOD     | `hod`     | Super admin. Creates faculty accounts and subjects. Full permissions.                                    |
| Faculty | `faculty` | Created by HOD. Uploads resources (auto-approved). Approves student uploads for their own subjects only. |
| Student | `student` | Self-registers with USN. Uploads resources (pending approval). Consumes content.                         |

---

## Authentication

- **Method:** JWT via `djangorestframework-simplejwt`
- **Header:** `Authorization: Bearer <access_token>`
- **Token lifetime:** Access = 1 day, Refresh = 7 days (hackathon settings)
- **Storage (frontend):** `localStorage` keys: `access_token`, `refresh_token`, `user`
- **Student registration:** requires `usn` (unique), `name`, `email`, `password`, `semester`
- **Faculty creation:** HOD-only POST to `/api/v1/auth/faculty/create/`
- **Custom auth backend:** MongoEngine users are not Django ORM users. JWT payload carries `user_id` (MongoDB ObjectId as string) and `role`.

---

## MongoDB Collections

### `users`

```python
class User(me.Document):
    name          = StringField(required=True)
    email         = StringField(required=True, unique=True)
    password_hash = StringField(required=True)          # bcrypt via passlib
    role          = StringField(choices=['hod','faculty','student'])
    usn           = StringField(unique=True, sparse=True)  # students only
    semester      = IntField(min_value=1, max_value=6)     # students only
    subject_ids   = ListField(ObjectIdField())              # faculty only
    is_active     = BooleanField(default=True)
    created_at    = DateTimeField(default=datetime.utcnow)
    meta = { 'collection': 'users', 'indexes': ['email','usn','role'] }
```

### `subjects`

```python
class Subject(me.Document):
    code        = StringField(required=True, unique=True)  # e.g. "BCA401"
    name        = StringField(required=True)
    semester    = IntField(required=True, min_value=1, max_value=6)
    faculty_id  = ObjectIdField()
    created_by  = ObjectIdField()                          # HOD's user _id
    created_at  = DateTimeField(default=datetime.utcnow)
    meta = { 'collection': 'subjects', 'indexes': ['code','semester','faculty_id'] }
```

### `resources`

```python
class Resource(me.Document):
    title             = StringField(required=True)
    description       = StringField(default='')
    resource_type     = StringField(choices=['file','url'])
    file_path         = StringField()                      # relative to MEDIA_ROOT
    file_format       = StringField(choices=['pdf','ppt','doc','image'])
    original_filename = StringField()
    url               = StringField()                      # for url type
    semester          = IntField(required=True)
    subject_id        = ObjectIdField(required=True)
    unit              = StringField(default='')
    tags              = ListField(StringField())
    uploaded_by       = ObjectIdField(required=True)
    uploader_role     = StringField(choices=['faculty','student'])
    status            = StringField(default='pending', choices=['pending','approved','rejected'])
    reviewed_by       = ObjectIdField()
    reviewed_at       = DateTimeField()
    download_count    = IntField(default=0)
    embedding         = ListField(FloatField())             # sentence-transformers vector
    upload_date       = DateTimeField(default=datetime.utcnow)
    meta = { 'collection': 'resources', 'indexes': ['status','semester','subject_id','uploaded_by'] }
```

### `notices`

```python
class Notice(me.Document):
    title          = StringField(required=True)
    body           = StringField(required=True)
    posted_by      = ObjectIdField(required=True)
    posted_by_name = StringField()
    is_pinned      = BooleanField(default=False)
    expires_at     = DateTimeField()
    created_at     = DateTimeField(default=datetime.utcnow)

    @property
    def is_new(self):
        return (datetime.utcnow() - self.created_at) < timedelta(hours=24)

    meta = { 'collection': 'notices', 'indexes': ['created_at','is_pinned'] }
```

---

## API Endpoints

**Base URL:** `http://localhost:8000/api/v1/`  
**Auth:** All endpoints require `Authorization: Bearer <token>` unless marked `[PUBLIC]`

### Auth — `accounts/urls.py`

| Method | Path                         | Role   | Description                         |
| ------ | ---------------------------- | ------ | ----------------------------------- |
| POST   | `/auth/register/`            | PUBLIC | Student self-registration           |
| POST   | `/auth/login/`               | PUBLIC | Returns `access` + `refresh` tokens |
| POST   | `/auth/token/refresh/`       | PUBLIC | Refresh access token                |
| GET    | `/auth/me/`                  | ALL    | Current user profile                |
| POST   | `/auth/faculty/create/`      | HOD    | Create faculty account              |
| PATCH  | `/auth/users/<id>/activate/` | HOD    | Toggle user `is_active`             |

### Subjects — `repository/urls.py`

| Method | Path              | Role | Description                         |
| ------ | ----------------- | ---- | ----------------------------------- |
| GET    | `/subjects/`      | ALL  | List subjects. Filter: `?semester=` |
| POST   | `/subjects/`      | HOD  | Create subject                      |
| PATCH  | `/subjects/<id>/` | HOD  | Edit / reassign subject             |
| DELETE | `/subjects/<id>/` | HOD  | Delete subject                      |
| GET    | `/semesters/`     | ALL  | List active semester numbers        |

### Resources — `repository/urls.py`

| Method | Path                        | Role                        | Description                                                              |
| ------ | --------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| GET    | `/resources/`               | ALL                         | List approved resources. Filters: `?semester=&subject=&faculty=&format=` |
| POST   | `/resources/upload/`        | Faculty, Student            | Upload file or URL. Faculty→approved, Student→pending                    |
| GET    | `/resources/<id>/`          | ALL                         | Single resource metadata                                                 |
| GET    | `/resources/<id>/download/` | ALL                         | Stream file. Increments `download_count`.                                |
| DELETE | `/resources/<id>/`          | HOD, Uploader               | Delete resource + file from disk                                         |
| GET    | `/resources/pending/`       | Faculty, HOD                | Pending student uploads queue                                            |
| POST   | `/resources/<id>/approve/`  | Faculty (own subjects), HOD | Set status→approved                                                      |
| POST   | `/resources/<id>/reject/`   | Faculty (own subjects), HOD | Set status→rejected, delete file                                         |

### Notices — `notices/urls.py`

| Method | Path             | Role                 | Description                                                    |
| ------ | ---------------- | -------------------- | -------------------------------------------------------------- |
| GET    | `/notices/`      | ALL                  | All notices, pinned first then newest. Includes `is_new` bool. |
| POST   | `/notices/`      | HOD, Faculty         | Create notice                                                  |
| PATCH  | `/notices/<id>/` | HOD, Original Poster | Edit or toggle `is_pinned`                                     |
| DELETE | `/notices/<id>/` | HOD                  | Delete notice                                                  |

### Analytics — `analytics/urls.py`

| Method | Path                              | Role | Description                                |
| ------ | --------------------------------- | ---- | ------------------------------------------ |
| GET    | `/analytics/summary/`             | HOD  | Total users, resources, pending, downloads |
| GET    | `/analytics/uploads-by-semester/` | HOD  | Upload counts grouped by semester          |
| GET    | `/analytics/top-resources/`       | HOD  | Top 10 by download_count                   |
| GET    | `/analytics/faculty-activity/`    | HOD  | Uploads + approvals per faculty            |

| Method | Path                                     | Role | Description                                            |
| ------ | ---------------------------------------- | ---- | ------------------------------------------------------ |
| GET    | `/search/?q=&semester=&subject=&format=` | ALL  | Hybrid keyword + semantic search with relevance scores |
| GET    | `/search/recommend/<resource_id>/`       | ALL  | 5 similar resources by embedding cosine similarity     |
| POST   | `/rag/ask/`                              | ALL  | RAG-based AI assistant (SSE streaming)                 |

---

## Permission Rules

| Action                   | HOD              | Faculty              | Student    |
| ------------------------ | ---------------- | -------------------- | ---------- |
| Self-register            | —                | —                    | ✅         |
| Create faculty account   | ✅               | —                    | —          |
| Create/edit subjects     | ✅               | —                    | —          |
| Upload resources         | ✅ auto-approved | ✅ auto-approved     | ✅ pending |
| View approved resources  | ✅               | ✅                   | ✅         |
| Approve/reject uploads   | ✅ any           | ✅ own subjects only | —          |
| Post notices             | ✅               | ✅                   | —          |
| Pin/delete any notice    | ✅               | —                    | —          |
| View analytics dashboard | ✅               | —                    | —          |
| Delete any resource      | ✅               | —                    | —          |
| Delete own resource      | ✅               | ✅                   | ✅         |

---

## File Upload Rules

- **Accepted formats:** `.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`
- **Rejected formats:** Everything else → return HTTP 400
- **Max size:** 50MB (`MAX_UPLOAD_SIZE = 52428800` in settings)
- **Storage path:** `media/uploads/<semester>/<subject_code>/<filename>`
- **Serving:** Django serves media files in development via `static()` in `core/urls.py`
- **Faculty uploads:** `status = 'approved'` immediately on save
- **Student uploads:** `status = 'pending'` — must be approved by faculty who owns the subject

### Format Detection

```python
ALLOWED_EXTENSIONS = {
    'pdf': 'pdf',
    'ppt': 'ppt', 'pptx': 'ppt',
    'doc': 'doc', 'docx': 'doc',
    'jpg': 'image', 'jpeg': 'image', 'png': 'image',
}
```

---

## AI Search Implementation

- **Model:** `sentence-transformers/all-MiniLM-L6-v2` (~80MB, CPU-only, auto-cached)
- **Install:** `pip install sentence-transformers scikit-learn`
- **Trigger:** Django signal `post_save` on Resource — generates embedding when `status = 'approved'`
- **Storage:** `Resource.embedding` field (list of floats)
- **Search flow:** MongoDB `$text` search → embed query → cosine similarity re-rank
- **Recommendations:** Cosine similarity between target resource embedding and all approved resources

```python
# Embedding generation (repository/signals.py)
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(resource):
    text = f"{resource.title} {resource.description} {' '.join(resource.tags)}"
    resource.embedding = model.encode(text).tolist()
    resource.save(update_fields=['embedding'])
```

---

## Frontend Architecture

### Tech

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (`primary: #1E3A5F`, `accent: #2E86AB`)
- **Routing:** React Router v6
- **Server state:** TanStack Query (React Query) — handles caching, loading, refetch
- **HTTP client:** Axios with JWT interceptor (auto-attaches Bearer token, redirects on 401)

### Key Files

| File                                | Purpose                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/api/axios.js`                  | Central Axios instance. JWT attached via request interceptor. 401 → redirect to /login.            |
| `src/context/AuthContext.jsx`       | Global auth state. Exposes `user`, `login()`, `logout()`. Reads from localStorage on mount.        |
| `src/components/ProtectedRoute.jsx` | Wraps routes. Redirects unauthenticated users to /login. Redirects wrong-role users to /dashboard. |
| `src/App.jsx`                       | Root component. Wraps everything in QueryClientProvider + AuthProvider + BrowserRouter.            |

### Routes

| Path          | Page           | Access           |
| ------------- | -------------- | ---------------- |
| `/login`      | Login.jsx      | Public           |
| `/register`   | Register.jsx   | Public           |
| `/dashboard`  | Dashboard.jsx  | All (role-aware) |
| `/repository` | Repository.jsx | All              |
| `/upload`     | Upload.jsx     | All logged-in    |
| `/review`     | Review.jsx     | Faculty, HOD     |
| `/notices`    | Notices.jsx    | All              |
| `/analytics`  | Analytics.jsx  | HOD only         |
| `/admin`      | AdminPanel.jsx | HOD only         |

## Demo Accounts (seed these before demo)

| Role    | Email           | Password |
| ------- | --------------- | -------- |
| HOD     | hod@bca.edu     | Demo@123 |
| Faculty | faculty@bca.edu | Demo@123 |
| Student | student@bca.edu | Demo@123 |

---

## Dev Commands

```bash
# Backend
cd backend && source venv/bin/activate
python manage.py runserver 8000

# Frontend
cd frontend
npm run dev                          # starts on http://localhost:5173

# MongoDB
sudo systemctl start mongod
sudo systemctl status mongod

# Pre-download AI model (run once)
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```
