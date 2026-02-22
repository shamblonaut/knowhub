# Corpus — API Design Reference

> Complete request/response contracts for every endpoint. For AI coding agents and developers.  
> Base URL: `http://localhost:8000/api/v1`  
> Auth: `Authorization: Bearer <access_token>` on all endpoints unless marked `[PUBLIC]`

---

## Conventions

- All request bodies are `application/json` unless uploading files (`multipart/form-data`)
- All responses are `application/json`
- Timestamps are ISO 8601 UTC strings: `"2026-02-20T10:30:00Z"`
- MongoDB `_id` fields are returned as strings (str of ObjectId)
- HTTP status codes follow REST conventions (200, 201, 400, 401, 403, 404, 500)
- Errors always return `{ "error": "<message>" }` or `{ "field": ["error"] }` for validation

---

## Error Response Format

```json
// Single error
{ "error": "USN already registered." }

// Validation errors (field-level)
{
  "email": ["This field is required."],
  "usn": ["USN already registered."]
}

// Permission error
{ "error": "You do not have permission to perform this action." }

// Not found
{ "error": "Resource not found." }
```

---

## 1. Authentication

### POST `/auth/register/` `[PUBLIC]`

Student self-registration.

**Request**

```json
{
  "name": "Rahul Sharma",
  "email": "rahul@student.bca.edu",
  "password": "SecurePass@123",
  "usn": "1BCA21CS001",
  "semester": 4
}
```

**Response `201`**

```json
{
  "message": "Registration successful.",
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Rahul Sharma",
    "email": "rahul@student.bca.edu",
    "role": "student",
    "usn": "1BCA21CS001",
    "semester": 4
  }
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | Missing required fields |
| 400 | `"USN already registered."` |
| 400 | `"Email already in use."` |
| 400 | Semester not between 1-6 |

---

### POST `/auth/login/` `[PUBLIC]`

**Request**

```json
{
  "email": "hod@bca.edu",
  "password": "Demo@123"
}
```

**Response `200`**

```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Dr. Mehta",
    "email": "hod@bca.edu",
    "role": "hod"
  }
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | Missing email or password |
| 401 | `"Invalid email or password."` |
| 403 | `"Account is deactivated."` |

---

### POST `/auth/token/refresh/` `[PUBLIC]`

**Request**

```json
{ "refresh": "<jwt_refresh_token>" }
```

**Response `200`**

```json
{ "access": "<new_jwt_access_token>" }
```

**Errors**
| Status | Condition |
|--------|-----------|
| 401 | Token invalid or expired |

---

### GET `/auth/me/`

Returns the current authenticated user's profile.

**Response `200`**

```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "name": "Rahul Sharma",
  "email": "rahul@student.bca.edu",
  "role": "student",
  "usn": "1BCA21CS001",
  "semester": 4,
  "is_active": true,
  "created_at": "2026-02-20T08:00:00Z"
}
```

> Faculty response also includes `"subject_ids": ["..."]`

---

### POST `/auth/faculty/create/`

HOD creates a faculty account.

**Role:** HOD only

**Request**

```json
{
  "name": "Prof. Sharma",
  "email": "sharma@bca.edu",
  "password": "Faculty@123"
}
```

**Response `201`**

```json
{
  "message": "Faculty account created.",
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d3",
    "name": "Prof. Sharma",
    "email": "sharma@bca.edu",
    "role": "faculty"
  }
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | `"Email already in use."` |
| 403 | Caller is not HOD |

---

### PATCH `/auth/users/<id>/activate/`

Toggle a user's `is_active` status.

**Role:** HOD only

**Request**

```json
{ "is_active": false }
```

**Response `200`**

```json
{
  "message": "User deactivated.",
  "user_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "is_active": false
}
```

---

## 2. Subjects

### GET `/subjects/`

List all subjects. Optional semester filter.

**Query params:** `?semester=4`

**Response `200`**

```json
{
  "count": 2,
  "results": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d4",
      "code": "BCA401",
      "name": "Data Structures",
      "semester": 4,
      "faculty_id": "65f1a2b3c4d5e6f7a8b9c0d3",
      "faculty_name": "Prof. Sharma"
    },
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d5",
      "code": "BCA402",
      "name": "Operating Systems",
      "semester": 4,
      "faculty_id": "65f1a2b3c4d5e6f7a8b9c0d6",
      "faculty_name": "Prof. Verma"
    }
  ]
}
```

---

### POST `/subjects/`

Create a new subject.

**Role:** HOD only

**Request**

```json
{
  "code": "BCA401",
  "name": "Data Structures",
  "semester": 4,
  "faculty_id": "65f1a2b3c4d5e6f7a8b9c0d3"
}
```

**Response `201`**

```json
{
  "id": "65f1a2b3c4d5e6f7a8b9c0d4",
  "code": "BCA401",
  "name": "Data Structures",
  "semester": 4,
  "faculty_id": "65f1a2b3c4d5e6f7a8b9c0d3",
  "faculty_name": "Prof. Sharma",
  "created_at": "2026-02-20T08:00:00Z"
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | `"Subject code already exists."` |
| 400 | `faculty_id` does not point to a faculty user |
| 403 | Caller is not HOD |

---

### PATCH `/subjects/<id>/`

Edit subject name, code, or reassign faculty.

**Role:** HOD only

**Request** (all fields optional)

```json
{
  "name": "Data Structures & Algorithms",
  "faculty_id": "65f1a2b3c4d5e6f7a8b9c0d6"
}
```

**Response `200`** — updated subject object (same shape as POST response)

---

### DELETE `/subjects/<id>/`

Delete a subject. Fails if resources still reference it.

**Role:** HOD only

**Response `200`**

```json
{ "message": "Subject deleted." }
```

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | `"Cannot delete subject with existing resources."` |
| 404 | Subject not found |

---

### GET `/semesters/`

Returns all semester numbers that have at least one subject.

**Response `200`**

```json
{ "semesters": [1, 2, 3, 4, 5, 6] }
```

---

## 3. Resources

### GET `/resources/`

List all approved resources with optional filters.

**Query params:**
| Param | Type | Example |
|-------|------|---------|
| `semester` | int | `?semester=4` |
| `subject` | string (subject id) | `?subject=65f1...` |
| `faculty` | string (user id) | `?faculty=65f1...` |
| `format` | string | `?format=pdf` |
| `page` | int | `?page=2` |

**Response `200`**

```json
{
  "count": 42,
  "page": 1,
  "page_size": 20,
  "results": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d7",
      "title": "Unit 3 - Trees & Graphs",
      "description": "Comprehensive notes on tree traversal",
      "resource_type": "file",
      "file_format": "pdf",
      "original_filename": "trees_graphs.pdf",
      "file_url": "http://localhost:8000/media/uploads/4/BCA401/trees_graphs.pdf",
      "semester": 4,
      "subject_id": "65f1a2b3c4d5e6f7a8b9c0d4",
      "subject_code": "BCA401",
      "subject_name": "Data Structures",
      "unit": "Unit 3",
      "tags": ["trees", "graphs", "BFS", "DFS"],
      "uploaded_by": "65f1a2b3c4d5e6f7a8b9c0d3",
      "uploader_name": "Prof. Sharma",
      "uploader_role": "faculty",
      "status": "approved",
      "download_count": 34,
      "upload_date": "2026-02-18T10:00:00Z"
    }
  ]
}
```

> URL resources have `"url": "https://..."` instead of `file_url` and `file_format`.

---

### POST `/resources/upload/`

Upload a file or URL resource.

**Role:** Faculty, Student, HOD  
**Content-Type:** `multipart/form-data` for files, `application/json` for URLs

**Request (file upload - multipart/form-data)**

```
title:         "Unit 3 Notes"
description:   "My handwritten notes on trees"    (optional)
resource_type: "file"
file:          <binary file>
semester:      4
subject_id:    "65f1a2b3c4d5e6f7a8b9c0d4"
unit:          "Unit 3"                            (optional)
tags:          "trees,graphs,bfs"                  (comma-separated string)
```

**Request (URL resource - application/json)**

```json
{
  "title": "GeeksForGeeks - Tree Traversal",
  "description": "Reference article",
  "resource_type": "url",
  "url": "https://www.geeksforgeeks.org/tree-traversals/",
  "semester": 4,
  "subject_id": "65f1a2b3c4d5e6f7a8b9c0d4",
  "unit": "Unit 3",
  "tags": ["trees", "reference"]
}
```

**Response `201`** — full resource object (same shape as GET /resources/ result item)

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | File format not in allowed list |
| 400 | File exceeds 50MB |
| 400 | `subject_id` not found |
| 403 | User not authenticated |

> **Status logic:** Faculty/HOD uploads set `status: approved` immediately.  
> Student uploads set `status: pending` and are NOT visible in GET /resources/.

---

### GET `/resources/<id>/`

Get full metadata for a single resource.

**Response `200`** — single resource object (same shape as list item above)

**Errors**
| Status | Condition |
|--------|-----------|
| 404 | Not found |
| 403 | Resource is pending/rejected and caller is not the reviewer or uploader |

---

### GET `/resources/<id>/download/`

Stream the file to the client. Increments `download_count` by 1.

**Response `200`**  
`Content-Type: application/octet-stream`  
`Content-Disposition: attachment; filename="trees_graphs.pdf"`

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | Resource is a URL type (no file to download) |
| 404 | Resource not found or file missing from disk |

---

### DELETE `/resources/<id>/`

Delete resource document and file from disk.

**Role:** HOD (any resource), or the original uploader

**Response `200`**

```json
{ "message": "Resource deleted." }
```

**Errors**
| Status | Condition |
|--------|-----------|
| 403 | Caller is not HOD or original uploader |
| 404 | Resource not found |

---

### GET `/resources/pending/`

List student uploads awaiting review.

**Role:** Faculty (own subjects only), HOD (all)

**Response `200`**

```json
{
  "count": 3,
  "results": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d8",
      "title": "My DS Notes",
      "resource_type": "file",
      "file_format": "pdf",
      "file_url": "http://localhost:8000/media/uploads/4/BCA401/my_ds_notes.pdf",
      "semester": 4,
      "subject_id": "65f1a2b3c4d5e6f7a8b9c0d4",
      "subject_code": "BCA401",
      "subject_name": "Data Structures",
      "uploaded_by": "65f1a2b3c4d5e6f7a8b9c0d1",
      "uploader_name": "Rahul Sharma",
      "uploader_role": "student",
      "status": "pending",
      "upload_date": "2026-02-20T09:00:00Z"
    }
  ]
}
```

> Faculty only sees resources where `subject_id` is in their `subject_ids` list.

---

### POST `/resources/<id>/approve/`

Approve a pending student upload.

**Role:** Faculty (own subjects only), HOD

**Request body:** empty

**Response `200`**

```json
{
  "message": "Resource approved.",
  "resource_id": "65f1a2b3c4d5e6f7a8b9c0d8",
  "status": "approved"
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 403 | Faculty does not own the resource's subject |
| 404 | Resource not found |
| 400 | Resource is not in pending state |

---

### POST `/resources/<id>/reject/`

Reject and delete a pending student upload.

**Role:** Faculty (own subjects only), HOD

**Request** (optional)

```json
{ "reason": "Incorrect subject material." }
```

**Response `200`**

```json
{
  "message": "Resource rejected and deleted.",
  "resource_id": "65f1a2b3c4d5e6f7a8b9c0d8",
  "status": "rejected"
}
```

> Physical file is deleted from disk on rejection. Document `status` is set to `rejected` (kept in DB for audit trail).

**Errors**
| Status | Condition |
|--------|-----------|
| 403 | Faculty does not own the resource's subject |
| 404 | Resource not found |
| 400 | Resource is not in pending state |

---

## 4. Notices

### GET `/notices/`

List all notices. Pinned notices appear first, then sorted newest first.

**Response `200`**

```json
{
  "count": 5,
  "results": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d9",
      "title": "Mid-Term Exam Schedule",
      "body": "Mid-term exams will be held from March 10-14. Check the timetable.",
      "posted_by": "65f1a2b3c4d5e6f7a8b9c0d2",
      "posted_by_name": "Dr. Mehta",
      "is_pinned": true,
      "is_new": false,
      "created_at": "2026-02-15T08:00:00Z",
      "expires_at": null
    },
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0da",
      "title": "Assignment 2 Deadline Extended",
      "body": "The deadline for Assignment 2 has been extended to Feb 25.",
      "posted_by": "65f1a2b3c4d5e6f7a8b9c0d3",
      "posted_by_name": "Prof. Sharma",
      "is_pinned": false,
      "is_new": true,
      "created_at": "2026-02-20T07:00:00Z",
      "expires_at": "2026-02-25T00:00:00Z"
    }
  ]
}
```

> `is_new` is `true` when `(now - created_at) < 24 hours`. Always computed at serialization time, never stored in DB.

---

### POST `/notices/`

Post a new notice.

**Role:** HOD, Faculty

**Request**

```json
{
  "title": "Lab Cancelled Today",
  "body": "The computer lab is under maintenance. Lab session is cancelled for Feb 20.",
  "is_pinned": false,
  "expires_at": "2026-02-21T00:00:00Z"
}
```

**Response `201`** — full notice object (same shape as list item)

---

### PATCH `/notices/<id>/`

Edit a notice or toggle `is_pinned`.

**Role:** HOD (any notice), original poster (own notices only)

**Request** (all fields optional)

```json
{
  "title": "Updated Title",
  "body": "Updated body text.",
  "is_pinned": true
}
```

**Response `200`** — updated notice object

**Errors**
| Status | Condition |
|--------|-----------|
| 403 | Faculty trying to edit another faculty's notice |

---

### DELETE `/notices/<id>/`

Delete a notice.

**Role:** HOD only

**Response `200`**

```json
{ "message": "Notice deleted." }
```

---

## 5. Analytics

> All analytics endpoints are HOD-only. Return 403 for any other role.

### GET `/analytics/summary/`

**Response `200`**

```json
{
  "total_users": 87,
  "total_students": 80,
  "total_faculty": 6,
  "total_resources": 142,
  "pending_approvals": 5,
  "total_notices": 12,
  "total_downloads": 1834
}
```

---

### GET `/analytics/uploads-by-semester/`

**Response `200`**

```json
{
  "data": [
    { "semester": 1, "count": 12 },
    { "semester": 2, "count": 18 },
    { "semester": 3, "count": 24 },
    { "semester": 4, "count": 41 },
    { "semester": 5, "count": 30 },
    { "semester": 6, "count": 17 }
  ]
}
```

---

### GET `/analytics/top-resources/`

**Response `200`**

```json
{
  "data": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d7",
      "title": "Unit 3 - Trees & Graphs",
      "subject_code": "BCA401",
      "download_count": 134
    }
  ]
}
```

---

### GET `/analytics/faculty-activity/`

**Response `200`**

```json
{
  "data": [
    {
      "faculty_id": "65f1a2b3c4d5e6f7a8b9c0d3",
      "faculty_name": "Prof. Sharma",
      "uploads": 18,
      "approvals": 12,
      "rejections": 3
    }
  ]
}
```

---

### GET `/analytics/uploads-by-format/`

**Response `200`**

```json
{
  "data": [
    { "format": "pdf", "count": 78 },
    { "format": "ppt", "count": 31 },
    { "format": "doc", "count": 14 },
    { "format": "image", "count": 19 }
  ]
}
```

---

## 6. Search

### GET `/search/`

Hybrid keyword + semantic search over approved resources.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (required) |
| `semester` | int | Optional filter |
| `subject` | string | Optional subject id filter |
| `format` | string | Optional: `pdf`, `ppt`, `doc`, `image` |

**Example:** `GET /search/?q=tree+traversal&semester=4`

**Response `200`**

```json
{
  "query": "tree traversal",
  "count": 4,
  "results": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d7",
      "title": "Unit 3 - Trees & Graphs",
      "description": "Comprehensive notes on tree traversal",
      "resource_type": "file",
      "file_format": "pdf",
      "file_url": "http://localhost:8000/media/uploads/4/BCA401/trees_graphs.pdf",
      "subject_code": "BCA401",
      "subject_name": "Data Structures",
      "semester": 4,
      "uploader_name": "Prof. Sharma",
      "similarity_score": 0.92,
      "download_count": 34,
      "upload_date": "2026-02-18T10:00:00Z"
    }
  ]
}
```

> Results are ranked by `similarity_score` (cosine similarity, 0-1). Higher = more relevant.

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | `q` param missing or empty |

### POST `/rag/ask/`

Questions are answered using course materials via RAG + local LLM.

**Request**

```json
{
  "question": "What is the complexity of BFS?",
  "semester": 4,
  "subject_id": "65f1a2b3c4d5e6f7a8b9c0d4"
}
```

**Response (Server-Sent Events)**

Tokens are streamed as they are generated.

```
data: {"type": "token", "content": "BFS "}
data: {"type": "token", "content": "complexity "}
data: {"type": "token", "content": "is O(V+E) [1]."}
data: {"type": "sources", "sources": [{"resource_id": "...", "title": "Unit 3", "code": "BCA401", "score": 0.95}]}
data: {"type": "done"}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 400 | `"question required"` |
| 401 | Not authenticated |

---
