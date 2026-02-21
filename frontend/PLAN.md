# Corpus — Frontend Implementation Plan

> Stage-by-stage build guide for P3 and P4.  
> Owner: P3 = `pages/`, `context/`, routing, `UploadForm`, `ProtectedRoute` | P4 = `components/`, charts, `Sidebar`  
> Read `ARCHITECTURE.md` and `API_DESIGN.md` before writing any code.

---

## The Golden Rule: Never Wait for Backend

The backend team works in parallel. You must **never block on them**. Every stage uses a mock data layer that mirrors the exact API response shapes from `API_DESIGN.md`. When the backend is ready, you flip one switch and mocks are replaced with real calls — zero component changes needed.

---

## Mock Strategy

Create `src/api/mock.js` in Stage 1. All hooks use this until the backend is live. The shapes are **identical** to what the real API returns, so no component needs to change when you switch.

```
src/api/
├── axios.js          ← Real Axios instance (already created)
├── mock.js           ← Static mock data (all collections)
└── endpoints/
    ├── auth.js       ← login(), register(), getMe()
    ├── resources.js  ← getResources(), upload(), approve(), reject()
    ├── subjects.js   ← getSubjects(), getSemesters()
    ├── notices.js    ← getNotices(), postNotice()
    ├── analytics.js  ← getSummary(), getChartData()
    └── search.js     ← search(), getRecommendations()
```

Each endpoint file exports functions that **either call mock.js or the real API** based on a single flag:

```js
// src/api/config.js
export const USE_MOCK = true; // ← flip to false when backend is ready
```

---

## Color & Design Tokens

```js
// Always use these — never hardcode hex values in components
primary: "#1E3A5F"; // dark navy — headings, sidebar bg, primary buttons
accent: "#2E86AB"; // blue — links, badges, active states
success: "#1B5E20"; // dark green — approved badges
warning: "#E65100"; // orange — pending badges
danger: "#B71C1C"; // red — rejected, delete actions
neutral: "#F5F5F5"; // light gray — card backgrounds, table rows
```

Tailwind classes to use:

```
text-primary     bg-primary     border-primary
text-accent      bg-accent      border-accent
bg-green-800     bg-orange-700  bg-red-800
```

---

## Stage Overview

| Stage | Owner | What Gets Built                                        | Can Start |
| ----- | ----- | ------------------------------------------------------ | --------- |
| 1     | P3    | Mock data layer + API endpoint functions               | H0        |
| 2     | P4    | Shared components: Spinner, ErrorMessage, Badge, Toast | H0        |
| 3     | P3    | Login + Register pages                                 | H2        |
| 4     | P4    | Sidebar + Layout shell                                 | H2        |
| 5     | P3    | Dashboard (role-aware landing page)                    | H4        |
| 6     | P4    | FileCard + FilterBar + Repository page                 | H4        |
| 7     | P3    | Upload page + UploadForm component                     | H6        |
| 8     | P4    | Review page + PendingCard component                    | H6        |
| 9     | P4    | Notices page + NoticeCard component                    | H8        |
| 10    | P3    | AdminPanel page (HOD: subjects + faculty)              | H8        |
| 11    | P4    | Analytics dashboard + charts                           | H10       |
| 12    | P3    | Search integration + SearchBar                         | H12       |
| 13    | P3+P4 | Switch mocks → real API, smoke test, polish            | H14+      |

Stages 1 and 2 run in parallel from Hour 0. All other stages can overlap.

---

## Stage 1 — Mock Data Layer (P3)

**Target: H0 → H2**  
**Files: `src/api/config.js`, `src/api/mock.js`, `src/api/endpoints/*.js`**

This is the most important stage. Get this right and both P3 and P4 can build everything independently.

---

### 1.1 `src/api/config.js`

```js
export const USE_MOCK = true;
export const API_BASE = "http://localhost:8000/api/v1";
```

---

### 1.2 `src/api/mock.js`

Exact shapes from `API_DESIGN.md`:

```js
export const MOCK_USER_STUDENT = {
  id: "stu001",
  name: "Rahul Sharma",
  email: "student@bca.edu",
  role: "student",
  usn: "1BCA21CS001",
  semester: 4,
  is_active: true,
  created_at: "2026-02-18T08:00:00Z",
};

export const MOCK_USER_FACULTY = {
  id: "fac001",
  name: "Prof. Sharma",
  email: "faculty@bca.edu",
  role: "faculty",
  subject_ids: ["sub001", "sub002"],
  is_active: true,
  created_at: "2026-01-10T08:00:00Z",
};

export const MOCK_USER_HOD = {
  id: "hod001",
  name: "Dr. Mehta",
  email: "hod@bca.edu",
  role: "hod",
  is_active: true,
  created_at: "2025-06-01T08:00:00Z",
};

export const MOCK_SUBJECTS = [
  {
    id: "sub001",
    code: "BCA401",
    name: "Data Structures",
    semester: 4,
    faculty_id: "fac001",
    faculty_name: "Prof. Sharma",
  },
  {
    id: "sub002",
    code: "BCA402",
    name: "Operating Systems",
    semester: 4,
    faculty_id: "fac001",
    faculty_name: "Prof. Sharma",
  },
  {
    id: "sub003",
    code: "BCA301",
    name: "DBMS",
    semester: 3,
    faculty_id: "fac002",
    faculty_name: "Prof. Verma",
  },
  {
    id: "sub004",
    code: "BCA201",
    name: "Programming in C",
    semester: 2,
    faculty_id: "fac003",
    faculty_name: "Prof. Rao",
  },
];

export const MOCK_RESOURCES = [
  {
    id: "res001",
    title: "Unit 3 - Trees & Graphs",
    description: "Comprehensive notes on tree traversal and graph algorithms",
    resource_type: "file",
    file_format: "pdf",
    original_filename: "trees_graphs.pdf",
    file_url: "http://localhost:8000/media/uploads/4/BCA401/trees_graphs.pdf",
    semester: 4,
    subject_id: "sub001",
    subject_code: "BCA401",
    subject_name: "Data Structures",
    unit: "Unit 3",
    tags: ["trees", "graphs", "BFS", "DFS"],
    uploaded_by: "fac001",
    uploader_name: "Prof. Sharma",
    uploader_role: "faculty",
    status: "approved",
    download_count: 134,
    upload_date: "2026-02-18T10:00:00Z",
  },
  {
    id: "res002",
    title: "OS Process Scheduling Notes",
    description: "FCFS, SJF, Round Robin explained with examples",
    resource_type: "file",
    file_format: "ppt",
    original_filename: "process_scheduling.pptx",
    file_url:
      "http://localhost:8000/media/uploads/4/BCA402/process_scheduling.pptx",
    semester: 4,
    subject_id: "sub002",
    subject_code: "BCA402",
    subject_name: "Operating Systems",
    unit: "Unit 2",
    tags: ["scheduling", "FCFS", "round robin"],
    uploaded_by: "fac001",
    uploader_name: "Prof. Sharma",
    uploader_role: "faculty",
    status: "approved",
    download_count: 89,
    upload_date: "2026-02-17T14:00:00Z",
  },
  {
    id: "res003",
    title: "GeeksForGeeks - Tree Traversal Reference",
    description: "Useful external reference for tree algorithms",
    resource_type: "url",
    url: "https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/",
    semester: 4,
    subject_id: "sub001",
    subject_code: "BCA401",
    subject_name: "Data Structures",
    unit: "Unit 3",
    tags: ["trees", "reference", "geeksforgeeks"],
    uploaded_by: "fac001",
    uploader_name: "Prof. Sharma",
    uploader_role: "faculty",
    status: "approved",
    download_count: 0,
    upload_date: "2026-02-16T09:00:00Z",
  },
  {
    id: "res004",
    title: "My Handwritten DS Notes - Unit 1",
    description: "Notes from class on arrays and linked lists",
    resource_type: "file",
    file_format: "image",
    original_filename: "ds_notes_unit1.jpg",
    file_url: "http://localhost:8000/media/uploads/4/BCA401/ds_notes_unit1.jpg",
    semester: 4,
    subject_id: "sub001",
    subject_code: "BCA401",
    subject_name: "Data Structures",
    unit: "Unit 1",
    tags: ["arrays", "linked lists", "handwritten"],
    uploaded_by: "stu001",
    uploader_name: "Rahul Sharma",
    uploader_role: "student",
    status: "approved",
    download_count: 22,
    upload_date: "2026-02-15T11:00:00Z",
  },
];

export const MOCK_PENDING_RESOURCES = [
  {
    id: "res005",
    title: "Stack and Queue Summary",
    description: "",
    resource_type: "file",
    file_format: "doc",
    original_filename: "stack_queue.docx",
    file_url: "http://localhost:8000/media/uploads/4/BCA401/stack_queue.docx",
    semester: 4,
    subject_id: "sub001",
    subject_code: "BCA401",
    subject_name: "Data Structures",
    unit: "Unit 2",
    tags: ["stack", "queue"],
    uploaded_by: "stu001",
    uploader_name: "Rahul Sharma",
    uploader_role: "student",
    status: "pending",
    download_count: 0,
    upload_date: "2026-02-20T09:30:00Z",
  },
];

export const MOCK_NOTICES = [
  {
    id: "not001",
    title: "Mid-Term Exam Schedule Released",
    body: "Mid-term exams are scheduled from March 10–14. Detailed timetable is posted on the department board.",
    posted_by: "hod001",
    posted_by_name: "Dr. Mehta",
    is_pinned: true,
    is_new: false,
    created_at: "2026-02-15T08:00:00Z",
    expires_at: null,
  },
  {
    id: "not002",
    title: "Assignment 2 Deadline Extended",
    body: "The deadline for BCA401 Assignment 2 has been extended to February 28th due to the lab maintenance.",
    posted_by: "fac001",
    posted_by_name: "Prof. Sharma",
    is_pinned: false,
    is_new: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    expires_at: "2026-02-28T00:00:00Z",
  },
  {
    id: "not003",
    title: "Corpus is Now Live",
    body: "The department's centralized resource portal is now operational. Upload your notes and access study materials here.",
    posted_by: "hod001",
    posted_by_name: "Dr. Mehta",
    is_pinned: false,
    is_new: false,
    created_at: "2026-02-10T10:00:00Z",
    expires_at: null,
  },
];

export const MOCK_ANALYTICS = {
  summary: {
    total_users: 87,
    total_students: 80,
    total_faculty: 6,
    total_resources: 142,
    pending_approvals: 5,
    total_notices: 12,
    total_downloads: 1834,
  },
  uploadsBySemester: [
    { semester: 1, count: 12 },
    { semester: 2, count: 18 },
    { semester: 3, count: 24 },
    { semester: 4, count: 41 },
    { semester: 5, count: 30 },
    { semester: 6, count: 17 },
  ],
  topResources: [
    {
      id: "res001",
      title: "Unit 3 - Trees & Graphs",
      subject_code: "BCA401",
      download_count: 134,
    },
    {
      id: "res002",
      title: "OS Process Scheduling",
      subject_code: "BCA402",
      download_count: 89,
    },
    {
      id: "res004",
      title: "My Handwritten DS Notes",
      subject_code: "BCA401",
      download_count: 22,
    },
  ],
  facultyActivity: [
    {
      faculty_id: "fac001",
      faculty_name: "Prof. Sharma",
      uploads: 18,
      approvals: 12,
      rejections: 3,
    },
    {
      faculty_id: "fac002",
      faculty_name: "Prof. Verma",
      uploads: 11,
      approvals: 8,
      rejections: 1,
    },
  ],
  uploadsByFormat: [
    { format: "pdf", count: 78 },
    { format: "ppt", count: 31 },
    { format: "doc", count: 14 },
    { format: "image", count: 19 },
  ],
};

export const MOCK_SEARCH_RESULTS = (query) => ({
  query,
  count: 2,
  results: MOCK_RESOURCES.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
  ).map((r) => ({ ...r, similarity_score: 0.92 })),
});

export const MOCK_FACULTY_USERS = [
  {
    id: "fac001",
    name: "Prof. Sharma",
    email: "faculty@bca.edu",
    role: "faculty",
    is_active: true,
  },
  {
    id: "fac002",
    name: "Prof. Verma",
    email: "verma@bca.edu",
    role: "faculty",
    is_active: true,
  },
  {
    id: "fac003",
    name: "Prof. Rao",
    email: "rao@bca.edu",
    role: "faculty",
    is_active: false,
  },
];
```

---

### 1.3 Endpoint Functions

Create one file per domain. Each function checks `USE_MOCK` and either returns mock data or calls the real API.

**`src/api/endpoints/auth.js`**

```js
import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_USER_HOD } from "../mock";

// Change this to test different roles during development:
// MOCK_USER_HOD | MOCK_USER_FACULTY | MOCK_USER_STUDENT
let ACTIVE_MOCK_USER = MOCK_USER_HOD;

export const login = async ({ email, password }) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400)); // simulate network delay
    return {
      access: "mock_access_token",
      refresh: "mock_refresh_token",
      user: ACTIVE_MOCK_USER,
    };
  }
  return api.post("/auth/login/", { email, password }).then((r) => r.data);
};

export const register = async (data) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      message: "Registration successful.",
      user: { ...data, id: "new001", role: "student" },
    };
  }
  return api.post("/auth/register/", data).then((r) => r.data);
};

export const getMe = async () => {
  if (USE_MOCK) return ACTIVE_MOCK_USER;
  return api.get("/auth/me/").then((r) => r.data);
};

export const createFaculty = async (data) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      message: "Faculty account created.",
      user: { ...data, id: "fac_new", role: "faculty" },
    };
  }
  return api.post("/auth/faculty/create/", data).then((r) => r.data);
};

export const setUserActive = async (userId, isActive) => {
  if (USE_MOCK)
    return {
      message: isActive ? "User activated." : "User deactivated.",
      user_id: userId,
      is_active: isActive,
    };
  return api
    .patch(`/auth/users/${userId}/activate/`, { is_active: isActive })
    .then((r) => r.data);
};

// DEV HELPER: Switch mock role without reloading
export const _setMockRole = (role) => {
  const map = {
    hod: MOCK_USER_HOD,
    faculty: MOCK_USER_FACULTY,
    student: MOCK_USER_STUDENT,
  };
  // import these from mock.js as needed
  ACTIVE_MOCK_USER = map[role];
};
```

**`src/api/endpoints/resources.js`**

```js
import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_RESOURCES, MOCK_PENDING_RESOURCES } from "../mock";

export const getResources = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    let results = [...MOCK_RESOURCES];
    if (filters.semester)
      results = results.filter((r) => r.semester === Number(filters.semester));
    if (filters.subject)
      results = results.filter((r) => r.subject_id === filters.subject);
    if (filters.format)
      results = results.filter((r) => r.file_format === filters.format);
    return { count: results.length, page: 1, page_size: 20, results };
  }
  return api.get("/resources/", { params: filters }).then((r) => r.data);
};

export const getResource = async (id) => {
  if (USE_MOCK) return MOCK_RESOURCES.find((r) => r.id === id) || null;
  return api.get(`/resources/${id}/`).then((r) => r.data);
};

export const uploadResource = async (formData) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      ...MOCK_RESOURCES[0],
      id: "res_new_" + Date.now(),
      title: formData.get?.("title") || formData.title,
    };
  }
  const isFile = formData instanceof FormData;
  return api
    .post("/resources/upload/", formData, {
      headers: isFile ? { "Content-Type": "multipart/form-data" } : {},
    })
    .then((r) => r.data);
};

export const getPendingResources = async () => {
  if (USE_MOCK)
    return {
      count: MOCK_PENDING_RESOURCES.length,
      results: MOCK_PENDING_RESOURCES,
    };
  return api.get("/resources/pending/").then((r) => r.data);
};

export const approveResource = async (id) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return {
      message: "Resource approved.",
      resource_id: id,
      status: "approved",
    };
  }
  return api.post(`/resources/${id}/approve/`).then((r) => r.data);
};

export const rejectResource = async (id, reason = "") => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return {
      message: "Resource rejected and deleted.",
      resource_id: id,
      status: "rejected",
    };
  }
  return api.post(`/resources/${id}/reject/`, { reason }).then((r) => r.data);
};

export const deleteResource = async (id) => {
  if (USE_MOCK) return { message: "Resource deleted." };
  return api.delete(`/resources/${id}/`).then((r) => r.data);
};

export const downloadResource = (id, filename) => {
  if (USE_MOCK) {
    alert(`[MOCK] Would download file: ${filename}`);
    return;
  }
  // Direct browser download
  const token = localStorage.getItem("access_token");
  const a = document.createElement("a");
  a.href = `http://localhost:8000/api/v1/resources/${id}/download/`;
  a.download = filename;
  a.click();
};
```

**`src/api/endpoints/subjects.js`**

```js
import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_SUBJECTS } from "../mock";

export const getSubjects = async (semester = null) => {
  if (USE_MOCK) {
    const results = semester
      ? MOCK_SUBJECTS.filter((s) => s.semester === Number(semester))
      : MOCK_SUBJECTS;
    return { count: results.length, results };
  }
  return api
    .get("/subjects/", { params: semester ? { semester } : {} })
    .then((r) => r.data);
};

export const getSemesters = async () => {
  if (USE_MOCK) return { semesters: [1, 2, 3, 4, 5, 6] };
  return api.get("/semesters/").then((r) => r.data);
};

export const createSubject = async (data) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      ...data,
      id: "sub_new_" + Date.now(),
      created_at: new Date().toISOString(),
    };
  }
  return api.post("/subjects/", data).then((r) => r.data);
};

export const updateSubject = async (id, data) => {
  if (USE_MOCK) return { ...MOCK_SUBJECTS[0], ...data, id };
  return api.patch(`/subjects/${id}/`, data).then((r) => r.data);
};

export const deleteSubject = async (id) => {
  if (USE_MOCK) return { message: "Subject deleted." };
  return api.delete(`/subjects/${id}/`).then((r) => r.data);
};
```

**`src/api/endpoints/notices.js`**

```js
import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_NOTICES } from "../mock";

export const getNotices = async () => {
  if (USE_MOCK) return { count: MOCK_NOTICES.length, results: MOCK_NOTICES };
  return api.get("/notices/").then((r) => r.data);
};

export const createNotice = async (data) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      ...data,
      id: "not_new",
      posted_by: "hod001",
      posted_by_name: "Dr. Mehta",
      is_new: true,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };
  }
  return api.post("/notices/", data).then((r) => r.data);
};

export const updateNotice = async (id, data) => {
  if (USE_MOCK) return { ...MOCK_NOTICES[0], ...data, id };
  return api.patch(`/notices/${id}/`, data).then((r) => r.data);
};

export const deleteNotice = async (id) => {
  if (USE_MOCK) return { message: "Notice deleted." };
  return api.delete(`/notices/${id}/`).then((r) => r.data);
};
```

**`src/api/endpoints/analytics.js`**

```js
import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_ANALYTICS } from "../mock";

export const getSummary = async () => {
  if (USE_MOCK) return MOCK_ANALYTICS.summary;
  return api.get("/analytics/summary/").then((r) => r.data);
};

export const getUploadsBySemester = async () => {
  if (USE_MOCK) return { data: MOCK_ANALYTICS.uploadsBySemester };
  return api.get("/analytics/uploads-by-semester/").then((r) => r.data);
};

export const getTopResources = async () => {
  if (USE_MOCK) return { data: MOCK_ANALYTICS.topResources };
  return api.get("/analytics/top-resources/").then((r) => r.data);
};

export const getFacultyActivity = async () => {
  if (USE_MOCK) return { data: MOCK_ANALYTICS.facultyActivity };
  return api.get("/analytics/faculty-activity/").then((r) => r.data);
};

export const getUploadsByFormat = async () => {
  if (USE_MOCK) return { data: MOCK_ANALYTICS.uploadsByFormat };
  return api.get("/analytics/uploads-by-format/").then((r) => r.data);
};
```

**`src/api/endpoints/search.js`**

```js
import api from "../axios";
import { USE_MOCK } from "../config";
import { MOCK_SEARCH_RESULTS, MOCK_RESOURCES } from "../mock";

export const search = async (params) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return MOCK_SEARCH_RESULTS(params.q || "");
  }
  return api.get("/search/", { params }).then((r) => r.data);
};

export const getRecommendations = async (resourceId) => {
  if (USE_MOCK) {
    return {
      resource_id: resourceId,
      recommendations: MOCK_RESOURCES.slice(0, 3).map((r) => ({
        ...r,
        similarity_score: 0.87,
      })),
    };
  }
  return api.get(`/search/recommend/${resourceId}/`).then((r) => r.data);
};
```

---

## Stage 2 — Shared Base Components (P4)

**Target: H0 → H2 (parallel with Stage 1)**  
**Files: `src/components/Spinner.jsx`, `ErrorMessage.jsx`, `Badge.jsx`, `Toast.jsx`, `EmptyState.jsx`**

Build these first — every other component depends on them.

---

### `src/components/Spinner.jsx`

```jsx
export default function Spinner({ size = "md" }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex justify-center items-center py-8">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-200 border-t-accent`}
      />
    </div>
  );
}
```

### `src/components/ErrorMessage.jsx`

```jsx
export default function ErrorMessage({
  message = "Something went wrong. Please try again.",
}) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
      ⚠ {message}
    </div>
  );
}
```

### `src/components/Badge.jsx`

```jsx
const variants = {
  pdf: "bg-red-100 text-red-800",
  ppt: "bg-orange-100 text-orange-800",
  doc: "bg-blue-100 text-blue-800",
  image: "bg-purple-100 text-purple-800",
  url: "bg-gray-100 text-gray-700",
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
  new: "bg-accent text-white",
  hod: "bg-primary text-white",
  faculty: "bg-blue-100 text-blue-800",
  student: "bg-gray-100 text-gray-700",
};

export default function Badge({ type, label }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${variants[type] || "bg-gray-100 text-gray-700"}`}
    >
      {label || type}
    </span>
  );
}
```

### `src/components/EmptyState.jsx`

```jsx
export default function EmptyState({
  icon = "📂",
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
```

### `src/components/Toast.jsx`

Use a simple context-based toast. Install `react-hot-toast` to save time:

```bash
npm install react-hot-toast
```

Then in `src/App.jsx` add `<Toaster position="top-right" />` inside the return.

Usage in any component:

```js
import toast from "react-hot-toast";
toast.success("Resource approved!");
toast.error("Upload failed.");
```

---

## Stage 3 — Login & Register Pages (P3)

**Target: H2 → H4**  
**Files: `src/pages/Login.jsx`, `src/pages/Register.jsx`**

---

### `src/pages/Login.jsx`

```jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/endpoints/auth";
import Spinner from "../components/Spinner";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login({ email, password });
      authLogin(data.user, data.access, data.refresh);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-bold text-primary">Corpus</h1>
          <p className="text-gray-500 text-sm mt-1">
            BCA Department Resource Portal
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@bca.edu"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
            >
              {loading ? <Spinner size="sm" /> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New student?{" "}
            <Link
              to="/register"
              className="text-accent font-medium hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Dev hint — remove before demo */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <strong>Dev accounts:</strong> hod@bca.edu | faculty@bca.edu |
          student@bca.edu — all pw: Demo@123
        </div>
      </div>
    </div>
  );
}
```

---

### `src/pages/Register.jsx`

```jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/endpoints/auth";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    usn: "",
    semester: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, semester: Number(form.semester) });
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-bold text-primary">Corpus</h1>
          <p className="text-gray-500 text-sm mt-1">Student Registration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              {
                label: "Full Name",
                name: "name",
                type: "text",
                placeholder: "Rahul Sharma",
              },
              {
                label: "Email",
                name: "email",
                type: "email",
                placeholder: "rahul@student.bca.edu",
              },
              {
                label: "Password",
                name: "password",
                type: "password",
                placeholder: "••••••••",
              },
              {
                label: "USN",
                name: "usn",
                type: "text",
                placeholder: "1BCA21CS001",
              },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                name="semester"
                value={form.semester}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select semester</option>
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## Stage 4 — Sidebar + Layout Shell (P4)

**Target: H2 → H4 (parallel with Stage 3)**  
**Files: `src/components/Sidebar.jsx`, `src/components/Layout.jsx`**

---

### `src/components/Sidebar.jsx`

```jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: "🏠",
    roles: ["hod", "faculty", "student"],
  },
  {
    to: "/repository",
    label: "Repository",
    icon: "📁",
    roles: ["hod", "faculty", "student"],
  },
  {
    to: "/upload",
    label: "Upload",
    icon: "⬆",
    roles: ["hod", "faculty", "student"],
  },
  { to: "/review", label: "Review", icon: "✅", roles: ["hod", "faculty"] },
  {
    to: "/notices",
    label: "Notices",
    icon: "📢",
    roles: ["hod", "faculty", "student"],
  },
  { to: "/analytics", label: "Analytics", icon: "📊", roles: ["hod"] },
  { to: "/admin", label: "Admin Panel", icon: "⚙", roles: ["hod"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const visibleNav = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <aside className="w-60 min-h-screen bg-primary text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white border-opacity-10">
        <div className="text-xl font-bold">📚 Corpus</div>
        <div className="text-xs text-blue-200 mt-0.5">BCA Department</div>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-white border-opacity-10">
        <div className="text-sm font-semibold">{user.name}</div>
        <div className="text-xs text-blue-200 capitalize">{user.role}</div>
        {user.role === "student" && (
          <div className="text-xs text-blue-200 mt-0.5">
            Sem {user.semester} · {user.usn}
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3">
        {visibleNav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition ${
                isActive
                  ? "bg-white bg-opacity-15 font-semibold"
                  : "text-blue-100 hover:bg-white hover:bg-opacity-10"
              }`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white border-opacity-10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-white hover:bg-opacity-10 transition"
        >
          <span>🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
```

### `src/components/Layout.jsx`

```jsx
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
```

Update all protected pages to use `<Layout>`:

```jsx
// In every protected page:
import Layout from "../components/Layout";
export default function Dashboard() {
  return (
    <Layout>
      <div>...</div>
    </Layout>
  );
}
```

---

## Stage 5 — Dashboard Page (P3)

**Target: H4 → H6**  
**File: `src/pages/Dashboard.jsx`**

Role-aware landing page. Each role sees different content.

```jsx
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getResources, getPendingResources } from "../api/endpoints/resources";
import { getNotices } from "../api/endpoints/notices";
import { getSummary } from "../api/endpoints/analytics";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import Badge from "../components/Badge";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-primary mb-1">
        Welcome back, {user.name} 👋
      </h1>
      <p className="text-gray-500 text-sm mb-8 capitalize">
        {user.role} · Corpus
      </p>

      {user.role === "hod" && <HODDashboard />}
      {user.role === "faculty" && <FacultyDashboard />}
      {user.role === "student" && <StudentDashboard />}
    </Layout>
  );
}

function HODDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getSummary,
  });

  if (isLoading) return <Spinner />;

  const stats = [
    { label: "Total Students", value: summary?.total_students, icon: "🎓" },
    { label: "Total Faculty", value: summary?.total_faculty, icon: "👨‍🏫" },
    { label: "Resources", value: summary?.total_resources, icon: "📁" },
    {
      label: "Pending Approvals",
      value: summary?.pending_approvals,
      icon: "⏳",
      alert: summary?.pending_approvals > 0,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl p-5 border ${s.alert ? "border-orange-300" : "border-gray-100"} shadow-sm`}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div
              className={`text-2xl font-bold ${s.alert ? "text-orange-600" : "text-primary"}`}
            >
              {s.value ?? "—"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Link
          to="/analytics"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          View Analytics →
        </Link>
        <Link
          to="/admin"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
        >
          Manage Subjects →
        </Link>
      </div>
    </div>
  );
}

function FacultyDashboard() {
  const { data: pending } = useQuery({
    queryKey: ["pending"],
    queryFn: getPendingResources,
  });
  const count = pending?.count || 0;

  return (
    <div className="space-y-4">
      <div
        className={`bg-white rounded-xl p-5 border shadow-sm flex items-center gap-4 ${count > 0 ? "border-orange-300" : "border-gray-100"}`}
      >
        <div className="text-3xl">⏳</div>
        <div>
          <div
            className={`text-2xl font-bold ${count > 0 ? "text-orange-600" : "text-gray-800"}`}
          >
            {count}
          </div>
          <div className="text-sm text-gray-500">
            Student uploads awaiting your review
          </div>
        </div>
        {count > 0 && (
          <Link
            to="/review"
            className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
          >
            Review Now →
          </Link>
        )}
      </div>
      <div className="flex gap-3">
        <Link
          to="/upload"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          Upload Resource →
        </Link>
        <Link
          to="/repository"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
        >
          Browse Repository →
        </Link>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["resources", {}],
    queryFn: () => getResources(),
  });
  const recent = data?.results?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Link
          to="/repository"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          Browse Resources →
        </Link>
        <Link
          to="/upload"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
        >
          Upload Notes →
        </Link>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recently Added
        </h2>
        {isLoading ? (
          <Spinner />
        ) : (
          recent.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-lg border border-gray-100 px-4 py-3 mb-2 flex items-center gap-3"
            >
              <Badge
                type={r.resource_type === "url" ? "url" : r.file_format}
                label={
                  r.resource_type === "url"
                    ? "URL"
                    : r.file_format?.toUpperCase()
                }
              />
              <span className="text-sm font-medium text-gray-800">
                {r.title}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {r.subject_code}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## Stage 6 — Repository Page + FileCard + FilterBar (P4)

**Target: H4 → H6 (parallel with Stage 5)**  
**Files: `src/pages/Repository.jsx`, `src/components/FileCard.jsx`, `src/components/FilterBar.jsx`, `src/components/SearchBar.jsx`**

---

### `src/components/FilterBar.jsx`

```jsx
import { useQuery } from "@tanstack/react-query";
import { getSubjects, getSemesters } from "../api/endpoints/subjects";

export default function FilterBar({ filters, onFilter }) {
  const { data: semData } = useQuery({
    queryKey: ["semesters"],
    queryFn: getSemesters,
  });
  const { data: subData } = useQuery({
    queryKey: ["subjects", filters.semester],
    queryFn: () => getSubjects(filters.semester || null),
  });

  const semesters = semData?.semesters || [];
  const subjects = subData?.results || [];

  const handle = (key, val) =>
    onFilter({ ...filters, [key]: val || undefined });

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={filters.semester || ""}
        onChange={(e) => handle("semester", e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
      >
        <option value="">All Semesters</option>
        {semesters.map((s) => (
          <option key={s} value={s}>
            Semester {s}
          </option>
        ))}
      </select>

      <select
        value={filters.subject || ""}
        onChange={(e) => handle("subject", e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
      >
        <option value="">All Subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.code} — {s.name}
          </option>
        ))}
      </select>

      <select
        value={filters.format || ""}
        onChange={(e) => handle("format", e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
      >
        <option value="">All Formats</option>
        {["pdf", "ppt", "doc", "image"].map((f) => (
          <option key={f} value={f}>
            {f.toUpperCase()}
          </option>
        ))}
      </select>

      {Object.values(filters).some(Boolean) && (
        <button
          onClick={() => onFilter({})}
          className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg bg-white"
        >
          Clear filters ✕
        </button>
      )}
    </div>
  );
}
```

### `src/components/SearchBar.jsx`

```jsx
import { useState, useEffect } from "react";

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative mb-4">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search resources by title, subject, or keyword..."
        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

### `src/components/FileCard.jsx`

```jsx
import Badge from "./Badge";
import { downloadResource } from "../api/endpoints/resources";

export default function FileCard({ resource }) {
  const isUrl = resource.resource_type === "url";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            type={isUrl ? "url" : resource.file_format}
            label={isUrl ? "URL" : resource.file_format?.toUpperCase()}
          />
          <span className="text-xs text-gray-400">{resource.subject_code}</span>
          {resource.unit && (
            <span className="text-xs text-gray-400">{resource.unit}</span>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          ↓ {resource.download_count}
        </span>
      </div>

      <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
        {resource.title}
      </h3>
      {resource.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {resource.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">
          by {resource.uploader_name}
          {resource.uploader_role === "student" && " (student)"}
        </span>

        {isUrl ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent font-medium hover:underline"
          >
            Open link →
          </a>
        ) : (
          <button
            onClick={() =>
              downloadResource(resource.id, resource.original_filename)
            }
            className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition"
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
}
```

### `src/pages/Repository.jsx`

```jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getResources } from "../api/endpoints/resources";
import { search } from "../api/endpoints/search";
import Layout from "../components/Layout";
import FileCard from "../components/FileCard";
import FilterBar from "../components/FilterBar";
import SearchBar from "../components/SearchBar";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { Link } from "react-router-dom";

export default function Repository() {
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const isSearching = searchQuery.trim().length > 0;

  const { data: browseData, isLoading: browseLoading } = useQuery({
    queryKey: ["resources", filters],
    queryFn: () => getResources(filters),
    enabled: !isSearching,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["search", searchQuery, filters],
    queryFn: () => search({ q: searchQuery, ...filters }),
    enabled: isSearching,
  });

  const isLoading = isSearching ? searchLoading : browseLoading;
  const resources = isSearching
    ? searchData?.results || []
    : browseData?.results || [];
  const total = isSearching ? searchData?.count || 0 : browseData?.count || 0;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Resource Repository
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading
              ? "Loading..."
              : `${total} resource${total !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <Link
          to="/upload"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          + Upload
        </Link>
      </div>

      <SearchBar onSearch={setSearchQuery} />
      <FilterBar filters={filters} onFilter={setFilters} />

      {isLoading ? (
        <Spinner />
      ) : resources.length === 0 ? (
        <EmptyState
          icon="📂"
          title="No resources found"
          description={
            isSearching
              ? `No results for "${searchQuery}"`
              : "No resources match your filters."
          }
          action={
            <Link
              to="/upload"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
            >
              Upload the first one →
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <FileCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </Layout>
  );
}
```

---

## Stage 7 — Upload Page (P3)

**Target: H6 → H8**  
**Files: `src/pages/Upload.jsx`, `src/components/UploadForm.jsx`**

Key rules: validate file extension client-side before sending, toggle between File and URL mode, show progress feedback.

```jsx
// src/pages/Upload.jsx
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { uploadResource } from "../api/endpoints/resources";
import { getSubjects, getSemesters } from "../api/endpoints/subjects";
import Layout from "../components/Layout";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ALLOWED = ["pdf", "ppt", "pptx", "doc", "docx", "jpg", "jpeg", "png"];

export default function Upload() {
  const [mode, setMode] = useState("file"); // 'file' | 'url'
  const [form, setForm] = useState({
    title: "",
    description: "",
    semester: "",
    subject_id: "",
    unit: "",
    tags: "",
    url: "",
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: semData } = useQuery({
    queryKey: ["semesters"],
    queryFn: getSemesters,
  });
  const { data: subData } = useQuery({
    queryKey: ["subjects", form.semester],
    queryFn: () => getSubjects(form.semester || null),
    enabled: !!form.semester,
  });

  const mutation = useMutation({
    mutationFn: uploadResource,
    onSuccess: () => {
      toast.success("Upload successful!");
      queryClient.invalidateQueries(["resources"]);
      navigate("/repository");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.error || "Upload failed."),
  });

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setFileError(
        `File type .${ext} is not allowed. Use: ${ALLOWED.join(", ")}`,
      );
      setFile(null);
      return;
    }
    if (f.size > 52428800) {
      setFileError("File is too large. Maximum size is 50MB.");
      setFile(null);
      return;
    }
    setFileError("");
    setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "file") {
      if (!file) return toast.error("Please select a file.");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("resource_type", "file");
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      mutation.mutate(fd);
    } else {
      mutation.mutate({
        ...form,
        resource_type: "url",
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    }
  };

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-primary mb-6">Upload Resource</h1>

      <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
          {["file", "url"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${mode === m ? "bg-white text-primary shadow-sm" : "text-gray-500"}`}
            >
              {m === "file" ? "📄 File" : "🔗 URL"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handle}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handle}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester *
              </label>
              <select
                name="semester"
                value={form.semester}
                onChange={handle}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
              >
                <option value="">Select</option>
                {(semData?.semesters || []).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                name="subject_id"
                value={form.subject_id}
                onChange={handle}
                required
                disabled={!form.semester}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none disabled:opacity-50"
              >
                <option value="">Select semester first</option>
                {(subData?.results || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                name="unit"
                value={form.unit}
                onChange={handle}
                placeholder="e.g. Unit 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                name="tags"
                value={form.tags}
                onChange={handle}
                placeholder="trees, graphs, BFS"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
          </div>

          {mode === "file" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File *
              </label>
              <input
                type="file"
                onChange={handleFile}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm"
              />
              {fileError && (
                <p className="text-red-600 text-xs mt-1">{fileError}</p>
              )}
              {file && (
                <p className="text-green-600 text-xs mt-1">
                  ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Accepted: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG — max 50MB
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                name="url"
                value={form.url}
                onChange={handle}
                type="url"
                placeholder="https://..."
                required={mode === "url"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-opacity-90 transition disabled:opacity-60"
          >
            {mutation.isPending ? "Uploading..." : "Upload Resource"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
```

---

## Stage 8 — Review Page + PendingCard (P4)

**Target: H6 → H8 (parallel with Stage 7)**  
**Files: `src/pages/Review.jsx`, `src/components/PendingCard.jsx`**

```jsx
// src/components/PendingCard.jsx
import Badge from "./Badge";

export default function PendingCard({ resource, onApprove, onReject }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge
          type={resource.file_format || "url"}
          label={(resource.file_format || "URL").toUpperCase()}
        />
        <span className="text-xs text-gray-400">
          {resource.subject_code} · {resource.unit}
        </span>
        <Badge type="pending" label="Pending" />
      </div>

      <h3 className="font-semibold text-gray-800 text-sm mb-1">
        {resource.title}
      </h3>
      <p className="text-xs text-gray-500 mb-1">
        Uploaded by <strong>{resource.uploader_name}</strong>
      </p>
      <p className="text-xs text-gray-400 mb-4">
        {new Date(resource.upload_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>

      {resource.resource_type === "file" && resource.file_url && (
        <a
          href={resource.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent underline block mb-4"
        >
          Preview file →
        </a>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onApprove(resource.id)}
          className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onReject(resource.id)}
          className="flex-1 py-2 bg-red-100 text-red-700 text-sm rounded-lg font-medium hover:bg-red-200 transition"
        >
          ✕ Reject
        </button>
      </div>
    </div>
  );
}
```

```jsx
// src/pages/Review.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingResources,
  approveResource,
  rejectResource,
} from "../api/endpoints/resources";
import Layout from "../components/Layout";
import PendingCard from "../components/PendingCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import toast from "react-hot-toast";

export default function Review() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pending"],
    queryFn: getPendingResources,
  });

  const approveMutation = useMutation({
    mutationFn: approveResource,
    onSuccess: () => {
      toast.success("Resource approved!");
      queryClient.invalidateQueries(["pending"]);
    },
    onError: () => toast.error("Approval failed."),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectResource,
    onSuccess: () => {
      toast.success("Resource rejected.");
      queryClient.invalidateQueries(["pending"]);
    },
    onError: () => toast.error("Rejection failed."),
  });

  const pending = data?.results || [];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Review Uploads</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isLoading
            ? "Loading..."
            : `${pending.length} pending upload${pending.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : pending.length === 0 ? (
        <EmptyState
          icon="✅"
          title="All caught up!"
          description="No student uploads pending review."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pending.map((r) => (
            <PendingCard
              key={r.id}
              resource={r}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
```

---

## Stage 9 — Notices Page + NoticeCard (P4)

**Target: H8 → H10**  
**Files: `src/pages/Notices.jsx`, `src/components/NoticeCard.jsx`**

```jsx
// src/components/NoticeCard.jsx
export default function NoticeCard({ notice, canDelete, onDelete }) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-5 ${notice.is_pinned ? "border-accent" : "border-gray-100"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {notice.is_pinned && (
            <span className="text-xs bg-accent text-white px-2 py-0.5 rounded font-semibold">
              📌 PINNED
            </span>
          )}
          {notice.is_new && (
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-semibold animate-pulse">
              NEW
            </span>
          )}
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(notice.id)}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>

      <h3 className="font-semibold text-gray-800 mb-1">{notice.title}</h3>
      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
        {notice.body}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Posted by {notice.posted_by_name}</span>
        <span>
          {new Date(notice.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );
}
```

---

## Stage 10 — Admin Panel (P3)

**Target: H8 → H10 (parallel with Stage 9)**  
**File: `src/pages/AdminPanel.jsx`**

Two tabs: Subjects management + Faculty management.

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubjects,
  createSubject,
  deleteSubject,
} from "../api/endpoints/subjects";
import { createFaculty, setUserActive } from "../api/endpoints/auth";
import { MOCK_FACULTY_USERS } from "../api/mock";
import Layout from "../components/Layout";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const [tab, setTab] = useState("subjects");

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-primary mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {["subjects", "faculty"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "subjects" && <SubjectsTab />}
      {tab === "faculty" && <FacultyTab />}
    </Layout>
  );
}
```

Build `SubjectsTab` (list + create form + delete) and `FacultyTab` (list + create form + activate/deactivate) as sub-components in the same file. Keep them focused — full implementation follows the same pattern as other pages.

---

## Stage 11 — Analytics Dashboard (P4)

**Target: H10 → H12**  
**File: `src/pages/Analytics.jsx`**

```bash
npm install recharts
```

```jsx
import { useQuery } from "@tanstack/react-query";
import {
  getSummary,
  getUploadsBySemester,
  getTopResources,
  getUploadsByFormat,
  getFacultyActivity,
} from "../api/endpoints/analytics";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#2E86AB",
  "#1E3A5F",
  "#1B5E20",
  "#E65100",
  "#4A148C",
  "#B71C1C",
];

function StatCard({ label, value, icon, highlight }) {
  return (
    <div
      className={`bg-white rounded-xl p-5 border shadow-sm ${highlight ? "border-orange-300" : "border-gray-100"}`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div
        className={`text-3xl font-bold ${highlight ? "text-orange-600" : "text-primary"}`}
      >
        {value ?? "—"}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function Analytics() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getSummary,
  });
  const { data: bySem } = useQuery({
    queryKey: ["uploads-by-semester"],
    queryFn: getUploadsBySemester,
  });
  const { data: topRes } = useQuery({
    queryKey: ["top-resources"],
    queryFn: getTopResources,
  });
  const { data: byFormat } = useQuery({
    queryKey: ["uploads-by-format"],
    queryFn: getUploadsByFormat,
  });

  if (isLoading)
    return (
      <Layout>
        <Spinner />
      </Layout>
    );

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-primary mb-6">
        Analytics Dashboard
      </h1>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Resources"
          value={summary?.total_resources}
          icon="📁"
        />
        <StatCard
          label="Total Downloads"
          value={summary?.total_downloads}
          icon="⬇"
        />
        <StatCard
          label="Total Students"
          value={summary?.total_students}
          icon="🎓"
        />
        <StatCard
          label="Pending Approvals"
          value={summary?.pending_approvals}
          icon="⏳"
          highlight={summary?.pending_approvals > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Uploads by Semester */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Uploads by Semester
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={bySem?.data || []}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="semester"
                tickFormatter={(s) => `Sem ${s}`}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, "Uploads"]} />
              <Bar dataKey="count" fill="#2E86AB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Uploads by Format */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Uploads by Format
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byFormat?.data || []}
                dataKey="count"
                nameKey="format"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ format, percent }) =>
                  `${format} ${(percent * 100).toFixed(0)}%`
                }
              >
                {(byFormat?.data || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Resources */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Top 10 Most Downloaded
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={topRes?.data || []}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="title"
                tick={{ fontSize: 10 }}
                width={180}
              />
              <Tooltip formatter={(v) => [v, "Downloads"]} />
              <Bar
                dataKey="download_count"
                fill="#1E3A5F"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
```

---

## Stage 12 — Search Integration (P3)

**Target: H12 → H14**

Search is already wired into `Repository.jsx` via `SearchBar`. This stage adds the **recommendations panel** to resource detail.

Add a click handler on `FileCard` to open a detail drawer/modal showing similar resources:

```jsx
// In Repository.jsx, track selected resource:
const [selected, setSelected] = useState(null)

// In the resource grid:
<FileCard key={r.id} resource={r} onSelect={() => setSelected(r)} />

// Show recommendations panel when selected is not null
{selected && <RecommendPanel resource={selected} onClose={() => setSelected(null)} />}
```

```jsx
// src/components/RecommendPanel.jsx
import { useQuery } from "@tanstack/react-query";
import { getRecommendations } from "../api/endpoints/search";
import Spinner from "./Spinner";
import Badge from "./Badge";

export default function RecommendPanel({ resource, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["recommend", resource.id],
    queryFn: () => getRecommendations(resource.id),
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-primary text-lg">Similar Resources</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              type={resource.file_format || "url"}
              label={(resource.file_format || "URL").toUpperCase()}
            />
            <span className="text-xs text-gray-500">
              {resource.subject_code}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800">
            {resource.title}
          </p>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-3">
            {(data?.recommendations || []).map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    type={r.file_format || "url"}
                    label={(r.file_format || "URL").toUpperCase()}
                  />
                  <span className="text-xs text-gray-400">
                    {r.subject_code}
                  </span>
                  <span className="ml-auto text-xs text-accent font-medium">
                    {(r.similarity_score * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800">{r.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Stage 13 — Switch to Real API (P3 + P4)

**Target: H14+ (after backend confirms endpoints are up)**

Only one line changes in the entire codebase:

```js
// src/api/config.js
export const USE_MOCK = false; // ← flip this
```

Then test each page against the real backend and fix any response shape mismatches.

### Switching Checklist

```
[ ] Set USE_MOCK = false in src/api/config.js
[ ] Login with real accounts (hod@bca.edu / Demo@123)
[ ] Verify JWT is stored in localStorage and sent on all requests
[ ] Repository loads real resources from backend
[ ] Upload a PDF — confirm it appears in Repository after page refresh
[ ] Review page shows pending uploads for faculty role
[ ] Approve a resource — confirm it moves to Repository
[ ] Notices page loads and "NEW" badge shows on recent notices
[ ] Analytics charts render with real data
[ ] Search returns relevant results
[ ] 401 on any request → redirects to /login automatically
[ ] Switch role in mock (USE_MOCK = true) to re-test role restrictions if backend is down
```

---

## Common Pitfalls & Fixes

| Symptom                                       | Cause                                        | Fix                                                      |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `Cannot read properties of undefined` on data | `useQuery` data is undefined on first render | Always use `data?.results ?? []`                         |
| Form doesn't reset after submit               | No state reset on `onSuccess`                | Call `setForm(initialState)` inside `onSuccess`          |
| Download button does nothing in mock          | Expected — `alert()` is shown instead        | Normal mock behavior, will work with real API            |
| Filters don't update when semester changes    | Subject dropdown not tied to semester filter | Pass `filters.semester` as dep to subject query          |
| `is_new` badge always shows                   | Mock data has `is_new: true` hardcoded       | Fine for mocks — real API computes it server-side        |
| Charts show empty                             | `recharts` data prop receives `undefined`    | Use `bySem?.data ?? []` as fallback                      |
| Sidebar renders on login/register             | `<Layout>` used on public pages              | Public pages don't use `<Layout>` — just plain div       |
| Role-based nav shows wrong links              | `user.role` not updated after login          | Ensure `AuthContext.login()` sets user from API response |
| File input clears on re-render                | Uncontrolled input                           | Keep file in state via `useState(null)`, not form state  |
| `405 Method Not Allowed` from backend         | Wrong HTTP method or URL                     | Double-check endpoint paths from `API_DESIGN.md`         |
