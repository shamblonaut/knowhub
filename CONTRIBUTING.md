# Contributing to Corpus

This is a 24-hour hackathon project. This guide exists to keep 4 people from stepping on each other's code.

---

## Team & Ownership

| Person | Role          | Primary Ownership                                  |
| ------ | ------------- | -------------------------------------------------- |
| P1     | Backend Lead  | `accounts/`, `core/`, auth, JWT, permissions       |
| P2     | Backend Dev   | `repository/`, `notices/`, `analytics/`, `search/` |
| P3     | Frontend Lead | Routing, `AuthContext`, `pages/`, layout           |
| P4     | Frontend Dev  | `components/`, Tailwind styling, charts            |

If you need to touch someone else's area, **tell them first**.

---

## Git Workflow

### Branch naming

```
feat/accounts-auth
feat/repository-upload
feat/notices-board
feat/analytics-dashboard
feat/search-ai
feat/frontend-login
feat/frontend-repository
feat/frontend-review
```

One feature = one branch. Never work directly on `main`.

### Daily flow

```bash
# Start of session — always pull main first
git checkout main
git pull origin main

# Create your branch
git checkout -b feat/your-feature

# Work, then commit often
git add .
git commit -m "feat: add file upload validation"

# Before merging, pull latest main into your branch
git fetch origin
git merge origin/main

# Push and open PR / merge
git push origin feat/your-feature
```

### Merge to main only at checkpoints

- H4 — Auth working end-to-end
- H10 — Upload + approval flow working
- H16 — Notice board + search working
- H20 — Analytics + AI search working
- H24 — Final polish merged

Do not merge broken code to `main`. If it doesn't run, it doesn't merge.

---

## Commit Message Format

Keep it simple. Use a prefix:

| Prefix      | When                             |
| ----------- | -------------------------------- |
| `feat:`     | New feature or endpoint          |
| `fix:`      | Bug fix                          |
| `style:`    | CSS / Tailwind changes only      |
| `refactor:` | Code cleanup, no behavior change |
| `chore:`    | Config, deps, tooling            |

**Examples:**

```
feat: add student registration endpoint
fix: correct faculty subject scope check on approve
style: update FileCard badge colors
chore: add sentence-transformers to requirements.txt
```

Keep messages under 72 characters. No need for long descriptions during a hackathon.

---

## File Ownership Map

If you're touching these files, you own them. Ask before editing someone else's.

```
backend/
├── core/settings.py          → P1
├── core/urls.py              → P1
├── accounts/
│   ├── models.py             → P1
│   ├── views.py              → P1
│   ├── serializers.py        → P1
│   ├── authentication.py     → P1
│   ├── permissions.py        → P1
│   └── urls.py               → P1
├── repository/
│   ├── models.py             → P2
│   ├── views.py              → P2
│   ├── serializers.py        → P2
│   └── urls.py               → P2
├── notices/                  → P2
├── analytics/                → P2
└── search/                   → P2

frontend/src/
├── api/axios.js              → P3
├── context/AuthContext.jsx   → P3
├── App.jsx                   → P3
├── pages/
│   ├── Login.jsx             → P3
│   ├── Register.jsx          → P3
│   ├── Dashboard.jsx         → P3
│   ├── Repository.jsx        → P3
│   ├── Upload.jsx            → P3
│   ├── Review.jsx            → P3
│   ├── Notices.jsx           → P4
│   ├── Analytics.jsx         → P4
│   └── AdminPanel.jsx        → P4
└── components/
    ├── Sidebar.jsx           → P4
    ├── FileCard.jsx          → P4
    ├── PendingCard.jsx       → P4
    ├── NoticeCard.jsx        → P4
    ├── FilterBar.jsx         → P4
    ├── SearchBar.jsx         → P4
    ├── StatCard.jsx          → P4
    ├── UploadForm.jsx        → P3
    └── ProtectedRoute.jsx    → P3
```

---

## Backend Standards

### Every view must have a permission class

```python
# WRONG — no permission check
class UploadView(APIView):
    def post(self, request):
        ...

# CORRECT
class UploadView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        ...
```

### Never return raw exceptions to the client

```python
# WRONG
except Exception as e:
    return Response(str(e), status=500)

# CORRECT
except User.DoesNotExist:
    return Response({"error": "User not found."}, status=404)
```

### Always validate file uploads

```python
ext = file.name.rsplit('.', 1)[-1].lower()
if ext not in ALLOWED_EXTENSIONS:
    return Response({"error": f"File type '.{ext}' is not allowed."}, status=400)
```

### Use `str()` when comparing ObjectIds

```python
# WRONG — ObjectId vs str comparison silently fails
if resource.uploaded_by == request.user.id:

# CORRECT
if str(resource.uploaded_by) == str(request.user.id):
```

### Faculty scope check — always do this before approve/reject

```python
from bson import ObjectId

if request.user.role == 'faculty':
    if ObjectId(resource.subject_id) not in request.user.subject_ids:
        return Response(
            {"error": "You do not have permission to review this resource."},
            status=403
        )
```

---

## Frontend Standards

### Always use the central Axios instance

```js
// WRONG — never create ad-hoc axios calls
import axios from "axios";
axios.get("http://localhost:8000/api/v1/resources/");

// CORRECT — always import from api/
import api from "../api/axios";
api.get("/resources/");
```

### Always handle loading and error states

```jsx
// WRONG
const { data } = useQuery({ queryKey: ['resources'], queryFn: fetchResources })
return <div>{data.map(...)}</div>

// CORRECT
const { data, isLoading, isError } = useQuery({
  queryKey: ['resources'],
  queryFn: fetchResources
})
if (isLoading) return <Spinner />
if (isError) return <ErrorMessage />
return <div>{data.map(...)}</div>
```

### Invalidate queries after mutations

```jsx
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (id) => api.post(`/resources/${id}/approve/`),
  onSuccess: () => {
    queryClient.invalidateQueries(["resources", "pending"]);
  },
});
```

### Use Tailwind utility classes only — no inline styles

```jsx
// WRONG
<div style={{ color: '#1E3A5F', marginTop: '16px' }}>

// CORRECT
<div className="text-primary mt-4">
```

### Role checks in JSX use `user.role`

```jsx
const { user } = useAuth();

// Show only for HOD
{
  user.role === "hod" && <Link to="/analytics">Analytics</Link>;
}

// Show for faculty and HOD
{
  ["faculty", "hod"].includes(user.role) && <Link to="/review">Review</Link>;
}
```

---

## Environment & Config

### Never hardcode URLs or secrets

```js
// WRONG
const api = axios.create({ baseURL: "http://localhost:8000/api/v1" });

// CORRECT — use .env
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
```

Create a `frontend/.env` file (already gitignored):

```
VITE_API_URL=http://localhost:8000/api/v1
```

### Never commit these

Already in `.gitignore` — double-check before every commit:

```
backend/venv/
backend/media/
backend/**/__pycache__/
frontend/node_modules/
frontend/dist/
.env
*.env
```

---

## Resolving Conflicts

If you hit a merge conflict:

1. Don't panic — tell the person who owns that file
2. Resolve it together, not alone
3. When in doubt, keep both changes and remove the duplicate
4. Always run `python manage.py check` and `npm run dev` after resolving

The two files most likely to conflict are `core/urls.py` (P1 owns) and `App.jsx` (P3 owns). Coordinate before both adding new routes at the same time.

---

## Pre-Merge Checklist

Run through this before merging anything to `main`:

- [ ] `python manage.py check` returns 0 issues
- [ ] `npm run dev` starts without errors
- [ ] Feature works end-to-end (not just backend or just frontend)
- [ ] No `console.log` or `print()` debug statements left in
- [ ] No hardcoded credentials or tokens
- [ ] Tested with at least two different role accounts

---

## Communication Rules

- Announce out loud (or in the group chat) before merging to `main`
- Tell the frontend person when a new API endpoint is ready so they can start integrating
- If you're blocked for more than 20 minutes, ask — don't stay stuck silently
- Check the sprint checkpoints every 4 hours — if behind, redistribute tasks immediately
